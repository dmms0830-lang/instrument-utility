#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
server.py — instrument-utility AI 프록시 백엔드 (맥미니용)
=========================================================
프론트엔드(Vercel)는 API 키 없이 이 서버로만 요청을 보낸다.
이 서버가 Anthropic API 키를 보관하고 대신 호출해서 답만 돌려준다.
→ 키가 브라우저/깃허브/Vercel 어디에도 노출되지 않는다.

  [Vercel 프론트] --HTTPS--> [이 서버(키 보관)] --> [Anthropic API]

실행:
    1) 같은 폴더에 .env 만들기 ( .env.example 참고, 특히 ANTHROPIC_API_KEY )
    2) pip install -r requirements.txt
    3) python3 server.py
"""

import os
import anthropic
from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS

# ── .env 로드 (있으면) ─────────────────────────────────────
# override=True: 셸 환경(.zshrc 등)에 낡은 ANTHROPIC_API_KEY 가 export 돼 있어도
# 항상 .env 값이 우선하도록 강제한다. (이게 없으면 환경변수의 죽은 키를 써서 401 발생)
try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"), override=True)
except ImportError:
    pass

# ── 설정 (전부 환경변수에서) ────────────────────────────────
API_KEY    = os.environ.get("ANTHROPIC_API_KEY", "").strip()
MODEL      = os.environ.get("CLAUDE_MODEL", "claude-haiku-4-5-20251001")
MAX_TOKENS = int(os.environ.get("MAX_TOKENS", "1024"))
PORT       = int(os.environ.get("PORT", "8787"))

# 허용할 프론트엔드 출처(Origin). 쉼표로 여러 개. 예) https://my-app.vercel.app,http://localhost:5173
# "*" 는 누구나 호출 가능 → API 크레딧 도용 위험. 배포 시 본인 Vercel 주소로 제한 권장.
ALLOWED_ORIGINS = [o.strip() for o in os.environ.get("ALLOWED_ORIGINS", "*").split(",") if o.strip()]

# AI 역할(시스템 프롬프트) — 키처럼 백엔드에서만 관리하면 재배포 없이 수정 가능.
SYSTEM_PROMPT = os.environ.get("SYSTEM_PROMPT", """당신은 HD현대오일뱅크 계장(Instrumentation) 엔지니어를 돕는 현장 AI 어시스턴트입니다.

- 트랜스미터 교정(LRV/URV), 유량·레벨·온도 계측, 4-20mA 루프, 밸브 포지셔너(Valtek 등), RTD/열전대, 단위 변환, 배관·가스켓·볼트 등 계장·제어 전반에 정통합니다.
- 그 외 일반적인 질문에도 자유롭게 답합니다.
- 항상 한국어로, 현장에서 바로 쓸 수 있게 간결하고 정확하게 답하세요.
- 계산이 필요하면 식과 과정을 단계적으로 보여주고, 단위를 명확히 표기하세요.
- 모르거나 불확실하면 추측하지 말고 솔직히 말하세요.""")

if not API_KEY:
    raise SystemExit("❌ ANTHROPIC_API_KEY 가 비어있습니다. server/.env 에 키를 넣어주세요.")

# 회사 고유 지식(공정명/줄임말/사내 규칙)을 knowledge.md 에서 읽어 시스템 프롬프트에 덧붙인다.
# 이 파일이 있으면 AI가 항상 그 내용을 알고 답한다. (파일 없으면 무시)
# 수정 후에는 서버를 재시작해야 반영된다.
_KNOWLEDGE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "knowledge.md")


def _build_system_blocks():
    full = SYSTEM_PROMPT
    try:
        with open(_KNOWLEDGE_PATH, "r", encoding="utf-8") as f:
            kb = f.read().strip()
        if kb:
            full = SYSTEM_PROMPT + "\n\n# 회사 고유 참고자료 (질문에 반드시 우선 반영)\n" + kb
            print(f"[AI proxy] knowledge.md 로드됨 ({len(kb)}자)")
    except FileNotFoundError:
        pass
    # 프롬프트 캐싱: 시스템 프롬프트는 매 요청 거의 동일 → 캐시하면 반복 입력 비용이 ~90% 절감.
    # (Haiku 4.5 는 4096토큰 이상부터 캐시 적용. 그보다 짧으면 캐시 미적용이지만 비용 자체가 미미.)
    return [{"type": "text", "text": full, "cache_control": {"type": "ephemeral"}}]


SYSTEM_BLOCKS = _build_system_blocks()

app = Flask(__name__)
CORS(app, origins=ALLOWED_ORIGINS, methods=["POST", "GET", "OPTIONS"])
client = anthropic.Anthropic(api_key=API_KEY)


# ══════════════════════════════════════════════════════════════
#  정비이력 DB (SQLite) — 엑셀 업로드 · 검색 · AI 연동
# ══════════════════════════════════════════════════════════════
import sqlite3
import re
import json
from datetime import datetime, date, timedelta

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "maintenance.db")

# 엑셀 헤더(공백 제거) → DB 컬럼명
HEADER_MAP = {
    "설비번호": "tag_raw", "오더번호": "order_no", "통지요청일": "notif_req_date",
    "오더생성일": "order_date", "오더내역": "order_desc", "오더유형": "order_type",
    "작업유형": "work_type", "통지번호": "notif_no", "통지제목": "notif_title",
    "요청부서": "req_dept", "요청자": "requester", "기능위치": "func_loc",
    "기능위치명": "func_loc_name", "설비명칭": "equip_name", "설비등급": "equip_grade",
    "작업완료일": "complete_date", "기술완료일": "tech_complete_date",
    "협력업체명": "vendor", "작업진행": "progress", "플랜트명": "plant",
}
DB_COLS = ["order_no", "tag_raw", "tag_norm", "notif_req_date", "order_date",
           "order_desc", "order_type", "work_type", "notif_no", "notif_title",
           "req_dept", "requester", "func_loc", "func_loc_name", "equip_name",
           "equip_grade", "complete_date", "tech_complete_date", "vendor",
           "progress", "plant", "raw_json"]


def _db():
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    return con


def init_db():
    con = _db()
    con.execute("CREATE TABLE IF NOT EXISTS orders (" +
                ", ".join(c + " TEXT" for c in DB_COLS) +
                ", PRIMARY KEY(order_no))")
    con.execute("CREATE INDEX IF NOT EXISTS idx_tag_norm ON orders(tag_norm)")
    con.commit()
    con.close()


def _norm_tag(s):
    return re.sub(r"[^A-Z0-9]", "", str(s or "").upper())


def _cell(v):
    if v is None:
        return ""
    if isinstance(v, (datetime, date)):
        return v.strftime("%Y-%m-%d")
    return str(v).strip()


def ingest_excel(path):
    import openpyxl
    # read_only=True 는 일부 시스템(SAP 등) 내보내기 파일의 dimension 정보를 잘못 읽어
    # 데이터를 0행으로 인식하는 문제가 있음 → 일반 모드로 로드한다.
    wb = openpyxl.load_workbook(path, data_only=True)
    ws = wb.active
    it = ws.iter_rows(values_only=True)
    try:
        header = next(it)
    except StopIteration:
        raise ValueError("빈 시트입니다.")
    hdr = [re.sub(r"\s+", "", str(h or "")) for h in header]
    # 컬럼 순서는 파일마다 달라도 되도록 '이름'으로 매핑
    col_idx = {HEADER_MAP[h]: i for i, h in enumerate(hdr) if h in HEADER_MAP}
    if "tag_raw" not in col_idx:
        raise ValueError("'설비번호' 열을 찾을 수 없습니다. 정비오더 엑셀이 맞는지 확인하세요.")
    added = updated = skipped = 0
    con = _db()
    for row in it:
        if not any(c is not None and str(c).strip() for c in row):
            continue
        rec = {c: "" for c in DB_COLS}
        for col, i in col_idx.items():
            rec[col] = _cell(row[i]) if i < len(row) else ""
        if not rec.get("tag_raw"):
            skipped += 1
            continue
        key = rec.get("order_no") or rec.get("notif_no")
        if not key:
            skipped += 1
            continue
        rec["order_no"] = key
        rec["tag_norm"] = _norm_tag(rec["tag_raw"])
        rec["raw_json"] = json.dumps(
            {hdr[i]: _cell(row[i]) for i in range(min(len(hdr), len(row)))},
            ensure_ascii=False)
        exists = con.execute("SELECT 1 FROM orders WHERE order_no=?", (key,)).fetchone()
        con.execute("INSERT OR REPLACE INTO orders (%s) VALUES (%s)" %
                    (",".join(DB_COLS), ",".join(["?"] * len(DB_COLS))),
                    tuple(rec[c] for c in DB_COLS))
        updated += 1 if exists else 0
        added += 0 if exists else 1
    con.commit()
    con.close()
    return added, updated, skipped


_ORDER_BY = "ORDER BY COALESCE(NULLIF(notif_req_date,''), order_date) DESC"


def query_by_tag(tag, limit=500):
    tn = _norm_tag(tag)
    if not tn:
        return []
    con = _db()
    rows = con.execute("SELECT * FROM orders WHERE tag_norm=? " + _ORDER_BY +
                       " LIMIT ?", (tn, limit)).fetchall()
    con.close()
    return [dict(r) for r in rows]


def search_orders(q, limit=500):
    con = _db()
    like = "%" + q + "%"
    tn = "%" + _norm_tag(q) + "%"
    rows = con.execute(
        "SELECT * FROM orders WHERE tag_norm LIKE ? OR order_desc LIKE ? OR "
        "notif_title LIKE ? OR equip_name LIKE ? OR func_loc_name LIKE ? " +
        _ORDER_BY + " LIMIT ?", (tn, like, like, like, like, limit)).fetchall()
    con.close()
    return [dict(r) for r in rows]


def list_orders(limit=3000, offset=0):
    con = _db()
    rows = con.execute("SELECT * FROM orders " + _ORDER_BY + " LIMIT ? OFFSET ?",
                       (limit, offset)).fetchall()
    con.close()
    return [dict(r) for r in rows]


def db_stats():
    con = _db()
    total = con.execute("SELECT COUNT(*) FROM orders").fetchone()[0]
    tags = con.execute("SELECT COUNT(DISTINCT tag_norm) FROM orders").fetchone()[0]
    con.close()
    return {"total": total, "tags": tags}


def distinct_tags():
    con = _db()
    rows = con.execute("SELECT tag_raw, COUNT(*) c FROM orders "
                       "GROUP BY tag_norm ORDER BY c DESC").fetchall()
    con.close()
    return [{"tag": r["tag_raw"], "count": r["c"]} for r in rows]


# ── 고장 유형 자동 분류 (규칙 기반: 오프라인·즉시·일관) ──
FAILURE_RULES = [
    ("파단", ["파단"]),
    ("균열(Crack)", ["crack", "균열"]),
    ("침식(Erosion)", ["침식", "erosion"]),
    ("리밋·신호", ["limit", "리밋", "접점", "신호"]),
    ("패킹누설", ["packing", "패킹", "gland"]),
    ("공급에어", ["air pipe", "air line", "air fitting", "air regulator", "air v/v", "에어"]),
    ("바디·플랜지 누설", ["body leak", "flange leak", "flg", "용접부", "catalyst leak", "leak", "누설"]),
    ("작동불량·고착", ["close 불량", "open 불량", "작동불량", "작동 불량", "not close", "고착",
                 "sticking", "action 불량", "동작불량", "동작 불량", "plugging", "oop"]),
    ("시트누설(Passing)", ["passing"]),
]
DEFAULT_CAT = "점검·기타"


def classify_order(desc, notif, otype):
    text = ((desc or "") + " " + (notif or "")).lower()
    ot = (otype or "").lower()
    if "기성" in text or "자체작업" in ot or "자체작업" in text:
        return "기성·자체작업"
    if "예방점검" in ot or "예방점검" in text:
        return "예방점검"
    for name, kws in FAILURE_RULES:
        for kw in kws:
            if kw in text:
                return name
    return DEFAULT_CAT


def analyze_tag(tag):
    from collections import Counter
    rows = query_by_tag(tag, limit=10000)
    if not rows:
        return {"tag": tag, "total": 0, "failures": 0, "categories": [],
                "years": [], "mtbf_months": None, "next_pred": None,
                "insight": "데이터가 없습니다."}
    head = rows[0]
    events = []
    for r in rows:
        d = (r.get("notif_req_date") or r.get("order_date") or "")[:10]
        try:
            dt = datetime.strptime(d, "%Y-%m-%d")
        except ValueError:
            dt = None
        cat = classify_order(r.get("order_desc", ""), r.get("notif_title", ""),
                             r.get("order_type", ""))
        events.append({"dt": dt, "cat": cat})
    failures = [e for e in events if e["cat"] not in ("기성·자체작업", "예방점검")]
    fdates = sorted(e["dt"] for e in failures if e["dt"])

    mtbf_m = None
    next_pred = None
    if len(fdates) >= 2:
        intervals = [(fdates[i] - fdates[i - 1]).days for i in range(1, len(fdates))]
        avg = sum(intervals) / len(intervals)
        mtbf_m = round(avg / 30.4, 1)
        next_pred = (fdates[-1] + timedelta(days=avg)).strftime("%Y-%m")

    categories = Counter(e["cat"] for e in failures).most_common()
    years = sorted(Counter(e["dt"].year for e in failures if e["dt"]).items())

    shift = None
    if fdates:
        maxy = fdates[-1].year
        recent = [e for e in failures if e["dt"] and e["dt"].year >= maxy - 2]
        if recent and categories:
            rtop = Counter(e["cat"] for e in recent).most_common(1)[0][0]
            if rtop != categories[0][0]:
                shift = rtop

    period = "%d~%d" % (fdates[0].year, fdates[-1].year) if fdates else ""
    parts = ["총 %d건 정비(%s), 실제 고장성 %d건." % (len(rows), period, len(failures))]
    if mtbf_m:
        parts.append("평균 고장주기 약 %s개월(MTBF)." % mtbf_m)
    if categories:
        parts.append("최다 유형: %s." %
                     ", ".join("%s(%d)" % (n, c) for n, c in categories[:3]))
    if shift:
        parts.append("최근 3년엔 '%s'가 두드러져 열화 양상 변화가 의심됨." % shift)
    if next_pred:
        parts.append("통계 추정 다음 고장 시점 ~%s (참고용)." % next_pred)

    return {"tag": head.get("tag_raw", tag), "equip": head.get("equip_name", ""),
            "loc": head.get("func_loc_name", ""), "total": len(rows),
            "failures": len(failures), "period": period, "mtbf_months": mtbf_m,
            "next_pred": next_pred, "categories": categories, "years": years,
            "insight": " ".join(parts)}


def bad_actors(min_failures=5, years=0, category="", loc="", limit=300):
    """조건(최소 고장건수·기간·고장유형·공정)에 맞는 다고장 설비 추출 → 고장건수 순 랭킹."""
    from collections import defaultdict, Counter
    con = _db()
    rows = con.execute(
        "SELECT tag_raw, tag_norm, equip_name, func_loc_name, notif_req_date, "
        "order_date, order_desc, notif_title, order_type FROM orders").fetchall()
    con.close()
    cutoff = datetime.now() - timedelta(days=365 * years) if years else None
    g = defaultdict(list)
    for r in rows:
        cat = classify_order(r["order_desc"], r["notif_title"], r["order_type"])
        if cat in ("기성·자체작업", "예방점검"):
            continue
        if category and cat != category:
            continue
        d = (r["notif_req_date"] or r["order_date"] or "")[:10]
        try:
            dt = datetime.strptime(d, "%Y-%m-%d")
        except ValueError:
            dt = None
        if cutoff and (dt is None or dt < cutoff):
            continue
        if loc:
            hay = ((r["func_loc_name"] or "") + " " + (r["equip_name"] or "") + " " +
                   (r["tag_raw"] or "")).lower()
            if loc.lower() not in hay:
                continue
        g[r["tag_norm"]].append({"dt": dt, "cat": cat, "tag": r["tag_raw"],
                                 "equip": r["equip_name"] or "",
                                 "loc": r["func_loc_name"] or ""})
    out = []
    for evs in g.values():
        if len(evs) < min_failures:
            continue
        dts = sorted(e["dt"] for e in evs if e["dt"])
        mtbf = None
        if len(dts) >= 2:
            iv = [(dts[i] - dts[i - 1]).days for i in range(1, len(dts))]
            mtbf = round(sum(iv) / len(iv) / 30.4, 1)
        out.append({"tag": evs[0]["tag"], "equip": evs[0]["equip"], "loc": evs[0]["loc"],
                    "failures": len(evs), "mtbf_months": mtbf,
                    "last": dts[-1].strftime("%Y-%m-%d") if dts else "",
                    "top_cat": Counter(e["cat"] for e in evs).most_common(1)[0][0]})
    out.sort(key=lambda x: (-x["failures"], x["tag"]))
    return out[:limit]


init_db()


# ── AI 챗봇이 참조할 DB 컨텍스트 (질문 속 태그로 자동 조회) ──
TAG_RE = re.compile(r"[A-Za-z]\d{2}-?[A-Za-z]{2,4}-?\d{2,4}")


def _find_tags_in_text(text):
    """질문에서 설비태그 찾기 — ①표준 패턴(E19-UV-002) ②DB에 실제 등록된 태그(비표준 포함)"""
    found = []
    for t in TAG_RE.findall(text):
        n = _norm_tag(t)
        if n and n not in found:
            found.append(n)
    # DB의 실제 태그가 문장에 들어있으면 매칭 (IRPRE1800 같은 비표준 태그도 인식)
    norm_text = re.sub(r"[\s\-_.]", "", text).upper()
    try:
        con = _db()
        rows = con.execute("SELECT DISTINCT tag_norm FROM orders").fetchall()
        con.close()
        for r in rows:
            tn = r["tag_norm"]
            if tn and len(tn) >= 5 and tn in norm_text and tn not in found:
                found.append(tn)
    except sqlite3.Error:
        pass
    return found[:3]  # 컨텍스트 폭주 방지: 최대 3개 설비


def build_db_context(messages):
    last = ""
    for m in reversed(messages):
        if m.get("role") == "user":
            last = m.get("content", "") or ""
            break
    tags = _find_tags_in_text(last)
    if not tags:
        return None
    blocks = []
    for n in tags:
        rows = query_by_tag(n)
        if not rows:
            continue
        head = rows[0]
        lines = ["### 정비오더 DB 조회 — %s (%s / %s) · 총 %d건" % (
                 head.get("tag_raw", n), head.get("equip_name", ""),
                 head.get("func_loc_name", ""), len(rows)),
                 "| 날짜 | 오더내역(증상) | 유형 | 진행 | 오더번호 | 협력사 |",
                 "|---|---|---|---|---|---|"]
        for r in rows:
            d = r.get("notif_req_date") or r.get("order_date") or ""
            lines.append("| %s | %s | %s | %s | %s | %s |" % (
                d, r.get("order_desc", ""), r.get("order_type", ""),
                r.get("progress", ""), r.get("order_no", ""), r.get("vendor", "")))
        blocks.append("\n".join(lines))
    if not blocks:
        return None
    return ("# 정비이력 DB 실시간 조회 결과\n"
            "아래는 사내 정비이력 DB에서 방금 조회한 실제 데이터다. **이 데이터를 최우선 근거로** "
            "날짜별로 정리해 답하고, 근거로 오더번호를 밝혀라.\n\n" + "\n\n".join(blocks))


def _system_with_db(messages):
    ctx = build_db_context(messages)
    if ctx:
        return SYSTEM_BLOCKS + [{"type": "text", "text": ctx}]
    return SYSTEM_BLOCKS


# ── DB 관리 웹페이지 + API ──
@app.get("/db")
def db_admin():
    p = os.path.join(os.path.dirname(os.path.abspath(__file__)), "db_admin.html")
    try:
        with open(p, encoding="utf-8") as fh:
            return Response(fh.read(), mimetype="text/html; charset=utf-8")
    except FileNotFoundError:
        return Response("<h1>db_admin.html 없음</h1>", mimetype="text/html")


@app.get("/db/stats")
def db_stats_api():
    return jsonify(db_stats())


@app.get("/db/records")
def db_records_api():
    try:
        limit = int(request.args.get("limit", "3000"))
    except ValueError:
        limit = 3000
    return jsonify({"records": list_orders(limit=limit)})


@app.get("/db/search")
def db_search_api():
    q = request.args.get("q", "").strip()
    if not q:
        return jsonify({"records": []})
    return jsonify({"records": search_orders(q)})


@app.get("/db/tags")
def db_tags_api():
    return jsonify({"tags": distinct_tags()})


def list_equipment(q=""):
    con = _db()
    sql = ("SELECT tag_raw, MAX(equip_name) equip_name, MAX(func_loc_name) loc, "
           "COUNT(*) c, MIN(NULLIF(notif_req_date,'')) fd, "
           "MAX(NULLIF(notif_req_date,'')) ld FROM orders")
    params = []
    if q:
        sql += " WHERE tag_norm LIKE ? OR equip_name LIKE ? OR func_loc_name LIKE ?"
        params = ["%" + _norm_tag(q) + "%", "%" + q + "%", "%" + q + "%"]
    sql += " GROUP BY tag_norm ORDER BY c DESC"
    rows = con.execute(sql, params).fetchall()
    con.close()
    return [{"tag": r["tag_raw"], "equip_name": r["equip_name"] or "",
             "loc": r["loc"] or "", "count": r["c"],
             "first": r["fd"] or "", "last": r["ld"] or ""} for r in rows]


@app.get("/db/equipment")
def db_equipment_api():
    return jsonify({"equipment": list_equipment(request.args.get("q", "").strip())})


@app.get("/db/categories")
def db_categories_api():
    return jsonify({"categories": [n for n, _ in FAILURE_RULES] + [DEFAULT_CAT]})


@app.get("/db/badactors")
def db_badactors_api():
    def _int(name, dflt):
        try:
            return int(request.args.get(name, dflt))
        except (TypeError, ValueError):
            return dflt
    return jsonify({"equipment": bad_actors(
        min_failures=_int("min_failures", 5), years=_int("years", 0),
        category=request.args.get("category", "").strip(),
        loc=request.args.get("loc", "").strip(), limit=_int("limit", 300))})


@app.get("/db/analysis")
def db_analysis_api():
    tag = request.args.get("tag", "").strip()
    if not tag:
        tags = distinct_tags()
        tag = tags[0]["tag"] if tags else ""
    return jsonify(analyze_tag(tag))


@app.post("/db/upload")
def db_upload_api():
    f = request.files.get("file")
    if not f or not f.filename:
        return jsonify({"error": "엑셀 파일을 선택하세요."}), 400
    tmp = os.path.join(os.path.dirname(os.path.abspath(__file__)), "_upload_tmp.xlsx")
    f.save(tmp)
    try:
        added, updated, skipped = ingest_excel(tmp)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": "엑셀 처리 오류: %s" % e}), 500
    finally:
        try:
            os.remove(tmp)
        except OSError:
            pass
    return jsonify({"ok": True, "added": added, "updated": updated,
                    "skipped": skipped, "total": db_stats()["total"]})


@app.get("/health")
def health():
    return jsonify({"ok": True, "model": MODEL})


def _sanitize_messages(raw):
    # 안전하게 정제: user/assistant 역할 + 비어있지 않은 content 만 통과
    messages = []
    for m in raw:
        role = m.get("role")
        content = m.get("content")
        if role in ("user", "assistant") and isinstance(content, str) and content.strip():
            messages.append({"role": role, "content": content})
    return messages


@app.post("/api/chat/stream")
def chat_stream():
    """토큰이 생성되는 대로 실시간(텍스트 스트리밍)으로 흘려보낸다 → ChatGPT/Claude식 타이핑 효과."""
    data = request.get_json(force=True, silent=True) or {}
    messages = _sanitize_messages(data.get("messages", []))
    if not messages:
        return jsonify({"error": "messages 가 비어있습니다."}), 400

    sys_blocks = _system_with_db(messages)

    def generate():
        try:
            with client.messages.stream(
                model=MODEL,
                max_tokens=MAX_TOKENS,
                system=sys_blocks,
                messages=messages,
            ) as stream:
                for text in stream.text_stream:
                    if text:
                        yield text
        except anthropic.APIStatusError as e:
            # 스트림 시작 후엔 상태코드를 못 바꾸므로 본문에 에러를 흘려보낸다
            yield f"\n\n⚠️ (오류) Anthropic: {getattr(e, 'message', str(e))}"
        except Exception as e:
            yield f"\n\n⚠️ (오류) 서버: {e}"

    return Response(
        stream_with_context(generate()),
        mimetype="text/plain; charset=utf-8",
        # 프록시/터널이 버퍼링해서 스트리밍이 뭉치지 않도록
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.post("/api/chat")
def chat():
    data = request.get_json(force=True, silent=True) or {}
    messages = _sanitize_messages(data.get("messages", []))

    if not messages:
        return jsonify({"error": "messages 가 비어있습니다."}), 400

    try:
        resp = client.messages.create(
            model=MODEL,
            max_tokens=MAX_TOKENS,
            system=_system_with_db(messages),
            messages=messages,
        )
        text = "".join(b.text for b in resp.content if getattr(b, "type", "") == "text").strip()
        return jsonify({"reply": text or "(빈 응답)"})

    except anthropic.APIStatusError as e:
        # Anthropic 측 에러(키 오류, rate limit 등)는 상태코드 그대로 전달
        msg = getattr(e, "message", str(e))
        return jsonify({"error": f"Anthropic: {msg}"}), getattr(e, "status_code", 502) or 502
    except Exception as e:
        return jsonify({"error": f"서버 오류: {e}"}), 500


if __name__ == "__main__":
    print(f"[AI proxy] model={MODEL}  port={PORT}  origins={ALLOWED_ORIGINS}")
    try:
        # 운영용 WSGI 서버 (dev server 경고 없이 안정적)
        from waitress import serve
        serve(app, host="0.0.0.0", port=PORT)
    except ImportError:
        app.run(host="0.0.0.0", port=PORT)
