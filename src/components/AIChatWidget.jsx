import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, X, Send, Loader2, Trash2 } from 'lucide-react';
import {
  ANTHROPIC_API_KEY,
  CLAUDE_MODEL,
  MAX_TOKENS,
  MAX_HISTORY,
  SYSTEM_PROMPT,
} from '../aiConfig';

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

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

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

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setError(null);
    const nextMessages = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Macro_Project core/claude_translate.py 와 동일한 Anthropic Messages API.
      // 브라우저 직접 호출이므로 anthropic-dangerous-direct-browser-access 헤더 필요.
      const apiMessages = nextMessages
        .slice(-MAX_HISTORY)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: CLAUDE_MODEL,
          max_tokens: MAX_TOKENS,
          system: SYSTEM_PROMPT,
          messages: apiMessages,
        }),
      });

      if (!res.ok) {
        let detail = `HTTP ${res.status}`;
        try {
          const errJson = await res.json();
          detail = errJson?.error?.message || detail;
        } catch {
          /* ignore */
        }
        throw new Error(detail);
      }

      const data = await res.json();
      const reply =
        data?.content?.map((c) => c.text).filter(Boolean).join('\n').trim() ||
        '(빈 응답이 돌아왔습니다)';

      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      console.error('[AIChat] error:', err);
      setError(err.message || '요청 중 오류가 발생했습니다');
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
          className="aichat-pop fixed z-[1000] bottom-24 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-96 max-w-[420px] h-[70vh] max-h-[560px] flex flex-col rounded-2xl overflow-hidden bg-slate-900/95 backdrop-blur-xl border border-slate-700 shadow-2xl shadow-black/50"
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between px-4 h-14 flex-shrink-0 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border-b border-slate-700">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="aichat-float w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg flex-shrink-0">
                <Bot className="w-[18px] h-[18px] text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-white leading-tight">AI 어시스턴트</div>
                <div className="text-[10px] text-cyan-400/80 font-mono truncate">{CLAUDE_MODEL}</div>
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
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-[13.5px] leading-relaxed whitespace-pre-wrap break-words ${
                    m.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : 'bg-slate-800 text-slate-100 border border-slate-700 rounded-bl-md'
                  }`}
                >
                  {m.content}
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

            {error && (
              <div className="flex justify-start">
                <div className="bg-red-950/60 border border-red-500/40 text-red-300 px-3.5 py-2.5 rounded-2xl text-[12.5px] max-w-[90%] break-words">
                  ⚠️ {error}
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
                placeholder="질문을 입력하세요…"
                className="flex-1 resize-none max-h-28 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-[14px] text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
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
