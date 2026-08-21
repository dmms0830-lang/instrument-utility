/** @type {import('tailwindcss').Config} */
// Tailwind v4에서는 색·폰트 토큰을 src/index.css 의 @theme 블록에서 정의한다.
// 이 파일은 content 경로 힌트 용도로만 남겨둔다 — 색을 여기에 다시 적지 말 것.
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: { extend: {} },
  plugins: [],
}
