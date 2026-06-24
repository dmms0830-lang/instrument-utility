# 상시 운영 셋업 (맥미니 집에 두고 회사 등 외부에서 사용)

맥미니를 집에 두고, 고정 주소로 외부 어디서나 접속. 서버 켜면 AI 작동, 끄면 "AI 점검 중" 표시.

- 터널: **Tailscale Funnel** (무료, 고정 HTTPS 주소, 도메인 불필요 — 맥미니에 이미 설치/로그인됨)
- 고정 주소: **https://han-macmini.tailb0cbc0.ts.net**

---

## A. 한 번만 하는 설정

### 1) Tailscale Funnel 기능 켜기 (관리자 콘솔)
아래 링크 접속 → 로그인 → Funnel 활성화:
```
https://login.tailscale.com/f/funnel?node=n8fHoZVS8H11CNTRL
```

### 2) 고정 주소를 백엔드(8787)에 연결 (맥미니에서 1회)
```bash
/Applications/Tailscale.app/Contents/MacOS/Tailscale funnel --bg 8787
```
→ 이 설정은 영구 저장됨(재부팅해도 유지). 이후로는 백엔드만 켜고 끄면 됨.
확인:
```bash
/Applications/Tailscale.app/Contents/MacOS/Tailscale funnel status
# https://han-macmini.tailb0cbc0.ts.net  →  http://127.0.0.1:8787  이렇게 나오면 성공
```

### 3) Vercel 에 고정 주소 주입 (1회)
- 수정된 프론트 코드(aiConfig.js / AIChatWidget.jsx / App.jsx) GitHub 에 push
- Vercel → Settings → Environment Variables
  - `VITE_AI_BACKEND_URL` = `https://han-macmini.tailb0cbc0.ts.net`
  - Production 체크
- Deployments → Redeploy

### 4) (권장) 도용 방지
- `server/.env` 의 `ALLOWED_ORIGINS` 를 본인 Vercel 주소로 제한
  예: `ALLOWED_ORIGINS=https://내앱.vercel.app`
- Anthropic 콘솔에서 **월 사용 한도(Spending limit)** 설정 → 혹시 모를 과금 폭주 방지

---

## B. 매일 쓰는 법 — 서버 켜고 끄기

데스크탑의 더블클릭 프로그램:
- **AI서버-켜기.command** → AI 작동 시작
- **AI서버-끄기.command** → 앱에 "AI 점검 중" 표시

> 처음 더블클릭 시 "확인되지 않은 개발자" 경고가 뜨면:
> 파일 우클릭 → **열기** → **열기** 한 번만 허용하면 됨.

켜짐/꺼짐 동작:
- 켜기 = 백엔드 시작 + 맥 절전 방지(서버 켜 있는 동안)
- 끄기 = 백엔드 종료 (고정주소 설정은 유지되므로 다음에 켜면 바로 작동)
- 서버 꺼지면 → 앱 AI 창에 "AI 점검 중입니다, 곧 다시 찾아뵙겠습니다" 자동 표시

---

## C. 비용 — 무엇이 무료이고 무엇이 돈이 드나

| 항목 | 비용 |
|---|---|
| Tailscale Funnel (고정 주소·터널) | **무료** (개인용) |
| Vercel (프론트 호스팅) | **무료** (Hobby) |
| 맥미니 전기 | 미미 (이미 켜둠) |
| **Anthropic API (= AI 답변 자체)** | **유료 — 유일한 실비용** |

**왜 돈이 드나?** AI 모델(Claude)을 만든 Anthropic이 사용량(토큰)만큼 과금한다. 나머지(터널·호스팅)는 전부 무료.

**얼마나?** Haiku 기준 입력 $1 / 출력 $5 (100만 토큰당).
- 질문 1회 ≈ **약 5원** (입력 2천 + 출력 4백 토큰 가정)
- 1,000번 질문 ≈ **약 5,000원**
- 한 달에 수천 번 써도 **1만원 안팎**

구독료 없음. Anthropic 콘솔에서 **선불 크레딧**(예: $5)을 넣어두면 오래 쓴다. 위 4)의 월 한도까지 걸어두면 안전.
