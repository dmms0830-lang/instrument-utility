/**
 * aiConfig.js — AI 챗봇 프론트엔드 설정
 * =====================================
 * ⚠️ 더 이상 프론트엔드에 API 키를 두지 않는다.
 *    키는 맥미니 백엔드(server/server.py)에만 보관되고,
 *    프론트는 그 백엔드 주소로만 요청한다. → 키가 절대 노출되지 않는다.
 *
 *    [Vercel 프론트] --HTTPS--> [맥미니 프록시(키 보관)] --> [Anthropic]
 */

// 맥미니 프록시 백엔드 주소.
//  - 배포(Vercel): 환경변수 VITE_AI_BACKEND_URL 에 터널 HTTPS 주소를 넣는다.
//      예) https://ai.example.com  또는  https://xxx.trycloudflare.com
//  - 로컬 개발: 환경변수가 없으면 localhost:8787 로 붙는다.
export const AI_BACKEND_URL =
  import.meta.env?.VITE_AI_BACKEND_URL || 'http://localhost:8787';

// 헤더에 표시만 하는 모델명(실제 호출 모델은 백엔드가 결정).
export const MODEL_LABEL = 'claude-haiku-4-5';

// 대화 맥락 유지를 위해 직전 메시지를 몇 개까지 백엔드로 보낼지 (토큰 절약).
export const MAX_HISTORY = 20;
