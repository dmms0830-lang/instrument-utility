# 발표용 임시 셋업 (Cloudflare 임시 터널)

> 일회성 데모용. cloudflared 를 켜 둔 동안만 주소가 유지되고, 끄면 주소가 바뀐다.
> 발표 끝나면 두 터미널 다 Ctrl+C 로 끄면 끝.

> ✅ 이미 끝나있는 것 (Claude 가 해둠):
>  - cloudflared 설치 완료
>  - server/venv 가상환경 + 의존성(anthropic·flask·flask-cors·waitress·dotenv) 설치 완료
>  - server/.env 파일 생성 완료 (키 칸만 비어있음)
>  - 서버 부팅/health 점검 통과
>
> 👉 너가 할 일은 ① 키 넣기 ② 터널 켜기 ③ Vercel 설정 뿐.

## 0. 새 API 키 준비
- https://console.anthropic.com/ → API Keys → Create Key → `` 복사

---

## 1. 키 넣기 (한 줄만)
`server/.env` 파일을 열어서 `ANTHROPIC_API_KEY=` 뒤에 새 키를 붙여넣고 저장.
(나머지 값은 그대로 둬도 됨)

## 2. 백엔드 실행 — 터미널 ①
```bash
cd /Users/han/Desktop/Code/instrument-utility/server
./run.sh
# [AI proxy] model=... port=8787  이라고 뜨면 성공. 이 창은 켜둔다.
```

빠른 자체 점검(다른 창에서):
```bash
curl -s -X POST http://localhost:8787/api/chat \
  -H "content-type: application/json" \
  -d '{"messages":[{"role":"user","content":"안녕"}]}'
# {"reply":"..."} 가 나오면 백엔드 OK
```

## 3. 터널 실행 — 터미널 ② (cloudflared 는 이미 설치됨)
```bash
cloudflared tunnel --url http://localhost:8787
```
출력에서 이런 줄을 찾는다:
```
https://xxxx-xxxx-xxxx.trycloudflare.com
```
👉 이 HTTPS 주소를 복사. 이 창도 켜둔다.

## 4. Vercel 에 백엔드 주소 주입 + 재배포
1. 먼저 **수정된 프론트 코드**(aiConfig.js / AIChatWidget.jsx / App.jsx)를 GitHub 에 push
   → Vercel 자동 빌드
2. Vercel 프로젝트 → **Settings → Environment Variables**
   - `VITE_AI_BACKEND_URL` = `https://xxxx.trycloudflare.com` (3단계 주소, 끝 슬래시 없이)
   - Environment: Production 체크
3. **Deployments → 최신 빌드 → ⋯ → Redeploy** (환경변수는 빌드 시점에 박히므로 재배포 필수)

## 5. 확인
- 폰/PC 에서 Vercel 주소 접속 → 우측 하단 AI 아이콘 → 질문
- 답이 나오면 성공 🎉

---

## 발표 중 주의
- **맥 + 터미널 ① + 터미널 ② 셋 다 켜둔 상태 유지.** 하나라도 끄면 AI 멈춤.
- 맥 절전(sleep) 들어가면 끊김 → 시스템 설정에서 절전 잠시 꺼두기 권장.
- cloudflared 를 재시작하면 주소가 바뀌므로 4단계를 다시 해야 함. (발표 전에 한 번 켜고 그대로 두기)

## 끝나고
- 두 터미널 Ctrl+C. 임시 터널 주소는 자동 소멸.
- 키는 `server/.env` 에만 있고 깃에 안 올라가므로 안전. (절대 커밋 금지)
