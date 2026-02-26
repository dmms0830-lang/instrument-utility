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

export default function InstallButton() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isInstalled, setIsInstalled] = useState(isInStandaloneMode());
    const [showIosGuide, setShowIosGuide] = useState(false);

    useEffect(() => {
        // 이미 standalone 모드이면 아무것도 안 함
        if (isInStandaloneMode()) {
            setIsInstalled(true);
            return;
        }

        const handleBeforeInstall = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        const handleAppInstalled = () => {
            setIsInstalled(true);
            setDeferredPrompt(null);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstallClick = useCallback(async () => {
        // iOS: 안내 모달 표시
        if (isIos()) {
            setShowIosGuide(true);
            return;
        }

        // 크롬/엣지 등: 설치 프롬프트 실행
        if (!deferredPrompt) return;

        try {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log('[Install]', outcome);
        } catch (err) {
            console.error('[Install] error:', err);
        } finally {
            setDeferredPrompt(null);
        }
    }, [deferredPrompt]);

    // 설치 완료 상태면 버튼 숨김
    if (isInstalled) return null;

    // iOS도 아니고 beforeinstallprompt도 아직 안 온 경우 → iOS면 보여주고, 아니면 숨김
    if (!deferredPrompt && !isIos()) return null;

    return (
        <>
            {/* 플로팅 설치 버튼 */}
            <button
                id="pwa-install-btn"
                onClick={handleInstallClick}
                className="fixed bottom-6 right-6 z-[999] flex items-center gap-2 px-5 py-3 bg-lime-500 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-lime-500/30 transition-all duration-200 hover:bg-lime-400 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-lime-400/40 active:scale-95 active:translate-y-0 touch-manipulation"
            >
                <Download className="w-5 h-5" />
                <span>앱 설치</span>
            </button>

            {/* iOS 안내 모달 */}
            {showIosGuide && (
                <div
                    className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setShowIosGuide(false)}
                >
                    <div
                        className="w-full max-w-md mx-4 mb-8 bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom-4 duration-300"
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
