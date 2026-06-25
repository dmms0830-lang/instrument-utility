import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, X, Send, Loader2, Trash2, Wrench, RotateCw } from 'lucide-react';
import { AI_BACKEND_URL, MODEL_LABEL, MAX_HISTORY } from '../aiConfig';

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
        <strong key={`${keyPrefix}-b${i}`} className="font-bold text-white">
          {tok.slice(2, -2)}
        </strong>
      );
    } else {
      parts.push(
        <code
          key={`${keyPrefix}-c${i}`}
          className="px-1 py-0.5 mx-0.5 rounded bg-slate-700/70 text-cyan-300 font-mono text-[12px]"
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
                    className="border border-slate-600 bg-slate-700/60 px-2 py-1 text-left font-bold text-slate-100 whitespace-nowrap"
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
                      className="border border-slate-700 px-2 py-1 align-top text-slate-200"
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
      blocks.push(<hr key={`hr-${i}`} className="my-2.5 border-slate-700" />);
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
          ? 'text-[15px] font-black mt-2 mb-1 text-white'
          : lv === 2
          ? 'text-[14px] font-bold mt-2 mb-0.5 text-cyan-300'
          : 'text-[13px] font-bold mt-1.5 text-cyan-200';
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

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setError(null);
    const nextMessages = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    setInput('');
    setIsLoading(true);

    try {
      // 맥미니 프록시 백엔드(server/server.py)로만 요청한다. API 키는 백엔드가 보관.
      const apiMessages = nextMessages
        .slice(-MAX_HISTORY)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch(`${AI_BACKEND_URL}/api/chat`, {
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

      const data = await res.json();
      const reply = (data?.reply || '').trim() || '(빈 응답이 돌아왔습니다)';

      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      setServerStatus('online');
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
  }, [input, isLoading, messages]);

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
          className="aichat-pop fixed z-[1000] left-2 right-2 top-3 bottom-24 sm:left-auto sm:right-6 sm:top-4 sm:bottom-24 sm:w-[460px] sm:max-w-[calc(100vw-3rem)] flex flex-col rounded-2xl overflow-hidden bg-slate-900/95 backdrop-blur-xl border border-slate-700 shadow-2xl shadow-black/50"
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between px-4 h-14 flex-shrink-0 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border-b border-slate-700">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="aichat-float w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg flex-shrink-0">
                <Bot className="w-[18px] h-[18px] text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-white leading-tight">AI 어시스턴트</div>
                <div className="text-[10px] font-mono truncate flex items-center gap-1.5">
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      serverStatus === 'online'
                        ? 'bg-lime-400'
                        : serverStatus === 'offline'
                        ? 'bg-amber-400'
                        : 'bg-slate-500 animate-pulse'
                    }`}
                  />
                  <span className={serverStatus === 'offline' ? 'text-amber-400/90' : 'text-cyan-400/80'}>
                    {serverStatus === 'offline' ? '점검 중' : serverStatus === 'checking' ? '연결 확인 중…' : MODEL_LABEL}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={resetChat}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="대화 초기화"
                title="대화 초기화"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
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
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-[13.5px] leading-relaxed break-words ${
                    m.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-md whitespace-pre-wrap'
                      : 'bg-slate-800 text-slate-100 border border-slate-700 rounded-bl-md'
                  }`}
                >
                  {m.role === 'user' ? m.content : <MarkdownLite text={m.content} />}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 border border-slate-700 text-slate-400 px-3.5 py-2.5 rounded-2xl rounded-bl-md flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                  <span className="text-[13px]">생각 중...</span>
                </div>
              </div>
            )}

            {error && serverStatus !== 'offline' && (
              <div className="flex justify-start">
                <div className="bg-red-950/60 border border-red-500/40 text-red-300 px-3.5 py-2.5 rounded-2xl text-[12.5px] max-w-[90%] break-words">
                  ⚠️ {error}
                </div>
              </div>
            )}

            {/* 서버 꺼짐 → 수리 중 안내 */}
            {serverStatus === 'offline' && (
              <div className="flex justify-center pt-3">
                <div className="text-center bg-slate-800/80 border border-amber-500/30 rounded-2xl px-5 py-5 max-w-[92%]">
                  <Wrench className="w-8 h-8 text-amber-400 mx-auto mb-2.5" />
                  <div className="text-[14px] font-bold text-amber-300 mb-1.5">AI 점검 중입니다</div>
                  <div className="text-[12.5px] text-slate-400 leading-relaxed">
                    서버가 잠시 꺼져 있어요.
                    <br />
                    곧 다시 찾아뵙겠습니다 🙏
                  </div>
                  <button
                    onClick={checkHealth}
                    className="mt-3.5 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    <RotateCw className="w-3.5 h-3.5" /> 다시 확인
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 입력 영역 */}
          <div className="flex-shrink-0 p-2.5 border-t border-slate-700 bg-slate-900/80">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={serverStatus === 'offline'}
                placeholder={serverStatus === 'offline' ? '점검 중입니다…' : '질문을 입력하세요…'}
                className="flex-1 resize-none max-h-28 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-[14px] text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors disabled:opacity-50"
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !input.trim() || serverStatus === 'offline'}
                className="w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-40 disabled:hover:translate-y-0 touch-manipulation"
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

      {/* ── 떠다니는 토글 버튼 ── */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className={`aichat-float fixed z-[1001] bottom-5 right-4 sm:right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl shadow-cyan-900/40 transition-colors touch-manipulation ${
          isOpen
            ? 'bg-slate-700 hover:bg-slate-600'
            : 'bg-gradient-to-br from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500'
        }`}
        aria-label={isOpen ? 'AI 채팅 닫기' : 'AI 채팅 열기'}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Bot className="w-7 h-7 text-white" />
        )}
      </button>
    </>
  );
}
