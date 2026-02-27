import React, { useState, useEffect, useCallback } from 'react';
import { Download, X, Share, PlusSquare } from 'lucide-react';

// iOS 감지 유틸
const isIos = () => {
    const ua = window.navigator.userAgent;
    return /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
};

// 이미 standalone 모드(설치됨)인지 확인
const isInStandaloneMode = () =>
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

export default function InstallButton({ className = '' }) {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showIosGuide, setShowIosGuide] = useState(false);
    const [showFallback, setShowFallback] = useState(false);

    useEffect(() => {
        const handleBeforeInstall = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        const handleAppInstalled = () => {
            setDeferredPrompt(null);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    // 폴백 토스트 자동 닫기
    useEffect(() => {
        if (!showFallback) return;
        const timer = setTimeout(() => setShowFallback(false), 4000);
        return () => clearTimeout(timer);
    }, [showFallback]);

    const handleInstallClick = useCallback(async () => {
        // iOS: 안내 모달 표시
        if (isIos()) {
            setShowIosGuide(true);
            return;
        }

        // 크롬/엣지 등: 설치 프롬프트 실행
        if (deferredPrompt) {
            try {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                console.log('[Install]', outcome);
            } catch (err) {
                console.error('[Install] error:', err);
            } finally {
                setDeferredPrompt(null);
            }
            return;
        }

        // deferredPrompt 없음 → 폴백 안내
        setShowFallback(true);
    }, [deferredPrompt]);

    return (
        <>
            {/* 인라인 설치 버튼 (항상 표시) */}
            <button
                id="pwa-install-btn"
                onClick={handleInstallClick}
                className={className}
                aria-label="앱 설치"
            >
                <Download className="w-[18px] h-[18px]" />
                <span className="hidden sm:inline">설치</span>
            </button>

            {/* 폴백 안내 토스트 */}
            {showFallback && (
                <div className="fixed bottom-6 left-4 right-4 z-[1000] flex justify-center animate-in slide-in-from-bottom-4 fade-in duration-300">
                    <div className="w-full max-w-md bg-slate-800/95 backdrop-blur-xl border border-slate-600 rounded-2xl shadow-2xl p-4 flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-lime-500/15 flex items-center justify-center mt-0.5">
                            <Download className="w-4 h-4 text-lime-400" />
                        </div>
                        <p className="flex-1 text-sm text-slate-300 leading-relaxed">
                            이미 설치되었거나 지원하지 않는 브라우저입니다.
                            <br />
                            <span className="text-lime-400 font-semibold">아이폰</span>은 공유 버튼을 통해 홈 화면에 추가해주세요.
                        </p>
                        <button
                            onClick={() => setShowFallback(false)}
                            className="flex-shrink-0 p-1 text-slate-500 hover:text-white transition-colors"
                            aria-label="닫기"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* iOS 안내 모달 */}
            {showIosGuide && (
                <div
                    className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setShowIosGuide(false)}
                >
                    <div
                        className="w-full max-w-md mx-4 mb-8 bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom-4 duration-300 relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* 닫기 버튼 */}
                        <button
                            onClick={() => setShowIosGuide(false)}
                            className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white transition-colors"
                            aria-label="닫기"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* 안내 내용 */}
                        <h3 className="text-lg font-bold text-white mb-4">
                            홈 화면에 추가하기
                        </h3>

                        <div className="space-y-4 text-slate-300 text-sm">
                            {/* Step 1 */}
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-blue-600/20 flex items-center justify-center">
                                    <span className="text-blue-400 font-bold text-xs">1</span>
                                </div>
                                <p className="pt-0.5">
                                    하단 메뉴바의{' '}
                                    <Share className="inline w-4 h-4 text-blue-400 -mt-0.5" />{' '}
                                    <strong className="text-white">공유</strong> 버튼을 탭하세요
                                </p>
                            </div>

                            {/* Step 2 */}
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-lime-600/20 flex items-center justify-center">
                                    <span className="text-lime-400 font-bold text-xs">2</span>
                                </div>
                                <p className="pt-0.5">
                                    목록에서{' '}
                                    <PlusSquare className="inline w-4 h-4 text-lime-400 -mt-0.5" />{' '}
                                    <strong className="text-white">홈 화면에 추가</strong>를 선택하세요
                                </p>
                            </div>
                        </div>

                        {/* 닫기 */}
                        <button
                            onClick={() => setShowIosGuide(false)}
                            className="mt-6 w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-colors"
                        >
                            확인
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
