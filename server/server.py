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
from flask import Flask, request, jsonify
from flask_cors import CORS

# ── .env 로드 (있으면) ─────────────────────────────────────
try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))
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


@app.get("/health")
def health():
    return jsonify({"ok": True, "model": MODEL})


@app.post("/api/chat")
def chat():
    data = request.get_json(force=True, silent=True) or {}
    raw = data.get("messages", [])

    # 안전하게 정제: user/assistant 역할 + 비어있지 않은 content 만 통과
    messages = []
    for m in raw:
        role = m.get("role")
        content = m.get("content")
        if role in ("user", "assistant") and isinstance(content, str) and content.strip():
            messages.append({"role": role, "content": content})

    if not messages:
        return jsonify({"error": "messages 가 비어있습니다."}), 400

    try:
        resp = client.messages.create(
            model=MODEL,
            max_tokens=MAX_TOKENS,
            system=SYSTEM_BLOCKS,
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
