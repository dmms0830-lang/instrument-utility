import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, X, Send, Loader2, Trash2, Wrench, RotateCw, Copy, Check, ClipboardList } from 'lucide-react';
import { AI_BACKEND_URL, MODEL_LABEL, MAX_HISTORY } from '../aiConfig';

// "계장설비팀 전달" 버튼이 보내는 지시문
const HANDOFF_PROMPT =
  '지금까지의 상황을 계장설비팀에게 전달할 수 있도록, 상황설명 축약 메시지를 작성하시오. ' +
  '핵심만 간결하게 한국어로: ① 계기 태그/위치 ② 증상 ③ 의심 원인 ④ 현재 조치/상태 ⑤ 계장팀 요청사항. ' +
  '복사해서 바로 보낼 수 있게 군더더기 없이 작성.';

/**
 * AIChatWidget — 우측 하단에 동동 떠다니는 AI 채팅 위젯
 * ====================================================
 * - 아이콘 클릭 → 채팅창 열림 / 다시 클릭 → 닫힘(쏙 들어감)
 * - Macro_Project 의 Claude API 호출 방식을 브라우저(fetch)로 옮겨와 답변 생성
 *   (Python anthropic.messages.create  →  POST https://api.anthropic.com/v1/messages)
 *
 * App.jsx 어디든 <AIChatWidget /> 한 줄만 넣으면 동작한다.
 */

const INITIAL_MESSAGE = {
  role: 'assistant',
  content: '안녕하세요! 계장·계측 관련이든 뭐든 필요한 걸 물어보세요. 🤖',
};

/**
 * 가벼운 마크다운 렌더러 (외부 라이브러리 없이)
 * - **굵게**, `코드`, 제목(#/##/###), 불릿(- *), 번호목록(1. 2.),
 *   표(| a | b |), 구분선(---), 빈 줄/문단 처리
 * - Claude 가 흔히 쓰는 마크다운 대부분 커버 (이미지 제외)
 */
function renderInline(text, keyPrefix) {
  const parts = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let m;
  let i = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith('**')) {
      parts.push(
        <strong key={`${keyPrefix}-b${i}`} className="font-bold text-ink">
          {tok.slice(2, -2)}
        </strong>
      );
    } else {
      parts.push(
        <code
          key={`${keyPrefix}-c${i}`}
          className="px-1 py-0.5 mx-0.5 rounded bg-elev2/70 text-cyan-ink font-mono text-[12px]"
        >
          {tok.slice(1, -1)}
        </code>
      );
    }
    last = m.index + tok.length;
    i++;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

// 표 한 줄을 셀 배열로 분리 ( | a | b | → ['a','b'] )
function splitTableRow(line) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim());
}

// 구분선 행인지 ( |---|:--:|---:| )
function isTableSeparator(line) {
  return line.includes('|') && line.includes('-') && /^[\s|:-]+$/.test(line.trim());
}

function MarkdownLite({ text }) {
  const lines = (text || '').split('\n');
  const blocks = [];
  let list = null;
  let listOrdered = false;

  const flush = (key) => {
    if (list) {
      const Tag = listOrdered ? 'ol' : 'ul';
      blocks.push(
        <Tag
          key={`list-${key}`}
          className={`${listOrdered ? 'list-decimal' : 'list-disc'} pl-5 space-y-0.5 my-1`}
        >
          {list}
        </Tag>
      );
      list = null;
    }
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // 코드펜스 마커(```)는 무시 — AI가 답변을 코드블록으로 감싸도 표·목록이 깨지지 않게
    if (/^\s*```/.test(line)) {
      i += 1;
      continue;
    }

    // 표: 현재 줄에 | 가 있고 다음 줄이 구분선이면 표로 처리
    if (line.includes('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      flush(i);
      const header = splitTableRow(line);
      i += 2; // 헤더 + 구분선 건너뜀
      const rows = [];
      while (i < lines.length && lines[i].includes('|') && lines[i].trim() !== '') {
        rows.push(splitTableRow(lines[i]));
        i += 1;
      }
      blocks.push(
        <div key={`tb-${i}`} className="my-2 overflow-x-auto">
          <table className="text-[12px] border-collapse">
            <thead>
              <tr>
                {header.map((c, ci) => (
                  <th
                    key={ci}
                    className="border border-line bg-elev2/60 px-2 py-1 text-left font-bold text-ink whitespace-nowrap"
                  >
                    {renderInline(c, `th-${i}-${ci}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri}>
                  {r.map((c, ci) => (
                    <td
                      key={ci}
                      className="border border-line px-2 py-1 align-top text-ink"
                    >
                      {renderInline(c, `td-${i}-${ri}-${ci}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // 구분선 (--- *** ___)
    if (/^\s*([-*_])\1{2,}\s*$/.test(line)) {
      flush(i);
      blocks.push(<hr key={`hr-${i}`} className="my-2.5 border-line" />);
      i += 1;
      continue;
    }

    const h = line.match(/^(#{1,3})\s+(.*)$/);
    const ol = line.match(/^\s*(\d+)\.\s+(.*)$/);
    const ul = line.match(/^\s*[-*]\s+(.*)$/);

    if (h) {
      flush(i);
      const lv = h[1].length;
      const cls =
        lv === 1
          ? 'text-[15px] font-black mt-2 mb-1 text-ink'
          : lv === 2
          ? 'text-[14px] font-bold mt-2 mb-0.5 text-cyan-ink'
          : 'text-[13px] font-bold mt-1.5 text-cyan-ink';
      blocks.push(
        <div key={`h-${i}`} className={cls}>
          {renderInline(h[2], `h${i}`)}
        </div>
      );
    } else if (ol || ul) {
      const ordered = Boolean(ol);
      // 목록 종류가 바뀌면 기존 목록을 먼저 닫는다
      if (list && listOrdered !== ordered) flush(i);
      if (!list) {
        list = [];
        listOrdered = ordered;
      }
      const content = ordered ? ol[2] : ul[1];
      list.push(<li key={`li-${i}`}>{renderInline(content, `li${i}`)}</li>);
    } else if (line.trim() === '') {
      flush(i);
      blocks.push(<div key={`sp-${i}`} className="h-2" />);
    } else {
      flush(i);
      blocks.push(<div key={`p-${i}`}>{renderInline(line, `p${i}`)}</div>);
    }
    i += 1;
  }
  flush('end');
  return <>{blocks}</>;
}

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  // 서버(맥미니) 상태: checking(확인중) | online(켜짐) | offline(꺼짐=수리중)
  const [serverStatus, setServerStatus] = useState('checking');
  // 복사 완료 표시할 메시지 인덱스
  const [copiedIndex, setCopiedIndex] = useState(null);

  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // 새 메시지가 오면 맨 아래로 스크롤
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // 창이 열리면 입력창에 포커스
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [isOpen]);

  // 서버(맥미니) 살아있는지 확인 — /health 에 짧게 핑
  const checkHealth = useCallback(async () => {
    setServerStatus('checking');
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 6000);
      const res = await fetch(`${AI_BACKEND_URL}/health`, { signal: ctrl.signal });
      clearTimeout(timer);
      setServerStatus(res.ok ? 'online' : 'offline');
    } catch {
      setServerStatus('offline');
    }
  }, []);

  // 채팅창을 열 때마다 서버 상태 확인
  useEffect(() => {
    if (isOpen) checkHealth();
  }, [isOpen, checkHealth]);

  // 클립보드 복사 (계장팀 전달용 등)
  const handleCopy = useCallback(async (text, idx) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
      } catch {
        /* ignore */
      }
      document.body.removeChild(ta);
    }
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 1500);
  }, []);

  const sendMessage = useCallback(async (overrideText) => {
    // 버튼 클릭 등으로 텍스트를 직접 넘기면 그걸, 아니면 입력창 값을 사용
    const fromInput = typeof overrideText !== 'string';
    const text = (fromInput ? input : overrideText).trim();
    if (!text || isLoading || serverStatus === 'offline') return;

    setError(null);
    const nextMessages = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    if (fromInput) setInput('');
    setIsLoading(true);

    try {
      // 맥미니 프록시 백엔드(server/server.py)로만 요청한다. API 키는 백엔드가 보관.
      const apiMessages = nextMessages
        .slice(-MAX_HISTORY)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch(`${AI_BACKEND_URL}/api/chat/stream`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      });

      // 터널은 살아있지만 백엔드가 꺼진 경우(502/503/504) → 수리 중으로 처리
      if ([502, 503, 504].includes(res.status)) {
        setServerStatus('offline');
        return;
      }

      if (!res.ok) {
        let detail = `HTTP ${res.status}`;
        try {
          const errJson = await res.json();
          detail = errJson?.error || detail;
        } catch {
          /* ignore */
        }
        throw new Error(detail);
      }

      setServerStatus('online');

      // ── 스트리밍 수신: 토큰이 오는 대로 마지막 assistant 메시지에 실시간으로 이어붙인다 ──
      const setLastAssistant = (text) =>
        setMessages((prev) => {
          const copy = prev.slice();
          for (let i = copy.length - 1; i >= 0; i--) {
            if (copy[i].role === 'assistant') {
              copy[i] = { ...copy[i], content: text };
              break;
            }
          }
          return copy;
        });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = '';
      let started = false;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (!chunk) continue;
        acc += chunk;
        if (!started) {
          started = true;
          setIsLoading(false); // 첫 토큰 도착 → '생각 중' 종료, 타이핑 시작
          setMessages((prev) => [...prev, { role: 'assistant', content: acc }]);
        } else {
          setLastAssistant(acc);
        }
      }
      // 멀티바이트(한글) 잔여 바이트 flush
      const tail = decoder.decode();
      if (tail) {
        acc += tail;
        if (started) setLastAssistant(acc);
      }
      if (!started) {
        setMessages((prev) => [...prev, { role: 'assistant', content: '(빈 응답이 돌아왔습니다)' }]);
      }
    } catch (err) {
      console.error('[AIChat] error:', err);
      // 연결 자체가 안 되면(서버 꺼짐) 빨간 에러 대신 "수리 중" 화면
      const isOffline =
        err.name === 'TypeError' ||
        err.name === 'AbortError' ||
        /Failed to fetch|NetworkError|Load failed/i.test(err.message || '');
      if (isOffline) {
        setServerStatus('offline');
      } else {
        setError(err.message || '요청 중 오류가 발생했습니다');
      }
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, serverStatus]);

  const handleKeyDown = (e) => {
    // Enter 전송, Shift+Enter 줄바꿈
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const resetChat = () => {
    setMessages([INITIAL_MESSAGE]);
    setError(null);
  };

  return (
    <>
      {/* 떠다니는 애니메이션 keyframes (1회 주입) */}
      <style>{`
        @keyframes aichat-float {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-7px); }
        }
        @keyframes aichat-pop {
          0%   { opacity: 0; transform: translateY(16px) scale(0.92); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .aichat-float { animation: aichat-float 3.2s ease-in-out infinite; }
        .aichat-pop   { animation: aichat-pop 0.28s cubic-bezier(0.22, 1, 0.36, 1) both; }
      `}</style>

      {/* ── 채팅창 (열렸을 때) ── */}
      {isOpen && (
        <div
          className="aichat-pop fixed z-[1000] inset-0 sm:inset-4 w-auto flex flex-col rounded-none sm:rounded-2xl overflow-hidden bg-panel/95 backdrop-blur-xl border-0 sm:border border-line shadow-2xl shadow-shade"
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between px-4 h-14 flex-shrink-0 bg-gradient-to-r from-cyan-soft to-blue-soft border-b border-line">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="aichat-float w-8 h-8 rounded-full bg-gradient-to-br from-cyan-fill to-blue-fill flex items-center justify-center shadow-lg flex-shrink-0">
                <Bot className="w-[18px] h-[18px] text-ink" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-ink leading-tight">AI 어시스턴트</div>
                <div className="text-[10px] font-mono truncate flex items-center gap-1.5">
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      serverStatus === 'online'
                        ? 'bg-lime-fill'
                        : serverStatus === 'offline'
                        ? 'bg-amber-fill'
                        : 'bg-elev2 animate-pulse'
                    }`}
                  />
                  <span className={serverStatus === 'offline' ? 'text-amber-ink/90' : 'text-cyan-ink/80'}>
                    {serverStatus === 'offline' ? '점검 중' : serverStatus === 'checking' ? '연결 확인 중…' : MODEL_LABEL}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={resetChat}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-ink2 hover:text-ink hover:bg-hover transition-colors"
                aria-label="대화 초기화"
                title="대화 초기화"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-ink2 hover:text-ink hover:bg-hover transition-colors"
                aria-label="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 메시지 영역 */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] px-3.5 py-2.5 rounded-2xl text-[13.5px] leading-relaxed break-words ${
                    m.role === 'user'
                      ? 'bg-blue-fill text-blue-on rounded-br-md whitespace-pre-wrap'
                      : 'bg-elev text-ink border border-line rounded-bl-md'
                  }`}
                >
                  {m.role === 'user' ? m.content : <MarkdownLite text={m.content} />}
                </div>
                {/* AI 답변엔 복사 버튼 (계장팀 전달 메시지 등을 바로 복붙) */}
                {m.role !== 'user' && i !== 0 && (
                  <button
                    onClick={() => handleCopy(m.content, i)}
                    className="mt-1 ml-1 flex items-center gap-1 text-[11.5px] font-medium text-ink2 hover:text-cyan-ink transition-colors"
                  >
                    {copiedIndex === i ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-lime-ink" /> 복사됨
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> 복사
                      </>
                    )}
                  </button>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-elev border border-line text-ink2 px-3.5 py-2.5 rounded-2xl rounded-bl-md flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-ink" />
                  <span className="text-[13px]">생각 중...</span>
                </div>
              </div>
            )}

            {error && serverStatus !== 'offline' && (
              <div className="flex justify-start">
                <div className="bg-red-soft border border-red-line text-red-ink px-3.5 py-2.5 rounded-2xl text-[12.5px] max-w-[90%] break-words">
                  ⚠️ {error}
                </div>
              </div>
            )}

            {/* 서버 꺼짐 → 수리 중 안내 */}
            {serverStatus === 'offline' && (
              <div className="flex justify-center pt-3">
                <div className="text-center bg-elev/80 border border-amber-line rounded-2xl px-5 py-5 max-w-[92%]">
                  <Wrench className="w-8 h-8 text-amber-ink mx-auto mb-2.5" />
                  <div className="text-[14px] font-bold text-amber-ink mb-1.5">AI 점검 중입니다</div>
                  <div className="text-[12.5px] text-ink2 leading-relaxed">
                    서버가 잠시 꺼져 있어요.
                    <br />
                    곧 다시 찾아뵙겠습니다 🙏
                  </div>
                  <button
                    onClick={checkHealth}
                    className="mt-3.5 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-cyan-ink hover:text-cyan-ink transition-colors"
                  >
                    <RotateCw className="w-3.5 h-3.5" /> 다시 확인
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 입력 영역 */}
          <div className="flex-shrink-0 p-2.5 border-t border-line bg-panel/80">
            {/* 계장설비팀 전달용 메시지 작성 버튼 */}
            <button
              onClick={() => sendMessage(HANDOFF_PROMPT)}
              disabled={isLoading || serverStatus === 'offline'}
              className="w-full mb-2 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-amber-soft border border-amber-line text-amber-ink text-[12.5px] font-bold transition-colors hover:bg-amber-soft active:scale-[0.99] disabled:opacity-40 touch-manipulation"
            >
              <ClipboardList className="w-4 h-4" /> 계장설비팀 전달용 메시지 작성
            </button>
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={serverStatus === 'offline'}
                placeholder={serverStatus === 'offline' ? '점검 중입니다…' : '질문을 입력하세요…'}
                className="flex-1 resize-none max-h-28 bg-elev border border-line rounded-xl px-3 py-2.5 text-[14px] text-ink placeholder:text-ink3 focus:outline-none focus:border-cyan-line transition-colors disabled:opacity-50"
              />
              <button
                onClick={() => sendMessage()}
                disabled={isLoading || !input.trim() || serverStatus === 'offline'}
                className="w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-cyan-fill to-blue-fill text-ink shadow-lg transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-40 disabled:hover:translate-y-0 touch-manipulation"
                aria-label="전송"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 떠다니는 토글 버튼 (열기 전용) ──
          전체화면 채팅에서는 이 버튼이 입력창의 [전송]과 겹치므로,
          채팅이 열려 있을 땐 숨긴다. 닫기는 헤더의 X로 처리. */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="aichat-float fixed z-[1001] bottom-5 right-4 sm:right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl shadow-shade transition-colors touch-manipulation bg-gradient-to-br from-cyan-fill to-blue-fill hover:from-cyan-soft hover:to-blue-fill"
          aria-label="AI 채팅 열기"
        >
          <Bot className="w-7 h-7 text-ink" />
        </button>
      )}
    </>
  );
}
