/**
 * aiConfig.js — AI 챗봇 설정
 * ===========================
 * Macro_Project(config.py / core/claude_translate.py)에서 쓰던 Anthropic 설정을
 * 프론트엔드용으로 옮겨온 파일.
 *
 * ⚠️ 보안 주의
 *  - 이 앱은 브라우저(프론트엔드)에서 직접 Anthropic API를 호출한다.
 *  - 따라서 아래 API_KEY 는 빌드 결과물(번들)에 그대로 포함되어 사용자에게 노출된다.
 *  - 사내/개인용 도구라면 감수할 수 있으나, 외부 공개 배포 시에는 반드시
 *    별도 백엔드(프록시 서버)를 두고 거기서 키를 보관해야 한다.
 *  - 키 노출이 부담되면 .env 에 VITE_ANTHROPIC_API_KEY 를 넣고 아래 fallback 으로 둔다.
 */

// Macro_Project/config.py 의 ANTHROPIC_API_KEY 와 동일.
// .env(VITE_ANTHROPIC_API_KEY)가 있으면 그쪽을 우선 사용한다.
export const ANTHROPIC_API_KEY =
  import.meta.env?.VITE_ANTHROPIC_API_KEY ||
  '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';

// Macro_Project/config.py 의 CLAUDE_MODEL 과 동일 (빠르고 저렴한 Haiku).
// 더 똑똑한 답변이 필요하면 'claude-sonnet-4-6' 으로 바꾸면 된다.
export const CLAUDE_MODEL = 'claude-haiku-4-5-20251001';

// 한 응답당 최대 토큰
export const MAX_TOKENS = 1024;

// 대화 맥락 유지를 위해 직전 메시지를 몇 개까지 API 로 보낼지 (비용/토큰 절약)
export const MAX_HISTORY = 20;

// AI 의 역할(시스템 프롬프트). 이 앱이 계장설비 유틸리티이므로 그쪽에 특화시켰다.
export const SYSTEM_PROMPT = `당신은 HD현대오일뱅크 계장(Instrumentation) 엔지니어를 돕는 현장 AI 어시스턴트입니다.

- 트랜스미터 교정(LRV/URV), 유량·레벨·온도 계측, 4-20mA 루프, 밸브 포지셔너(Valtek 등), RTD/열전대, 단위 변환, 배관·가스켓·볼트 등 계장·제어 전반에 정통합니다.
- 그 외 일반적인 질문에도 자유롭게 답합니다.
- 항상 한국어로, 현장에서 바로 쓸 수 있게 간결하고 정확하게 답하세요.
- 계산이 필요하면 식과 과정을 단계적으로 보여주고, 단위를 명확히 표기하세요.
- 모르거나 불확실하면 추측하지 말고 솔직히 말하세요.`;
