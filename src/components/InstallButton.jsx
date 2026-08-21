import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Download, X, Share, PlusSquare, Smartphone, ExternalLink, Chrome, CheckCircle } from 'lucide-react';

// === 유틸리티 함수 ===

// 1. 카카오톡, 라인 등 인앱 브라우저 감지
const isInAppBrowser = () => {
    const ua = window.navigator.userAgent.toLowerCase();
    const inAppRegex = /kakaotalk|line|fban|fbav|fb_iab|instagram|naver|snapchat|twitter/i;
    return inAppRegex.test(ua);
};

// 2. iOS 환경 감지
const isIos = () => {
    const ua = window.navigator.userAgent;
    return /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
};

// 3. 안드로이드 환경 감지
const isAndroid = () => {
    return /android/i.test(window.navigator.userAgent);
};

// 4. 이미 PWA 앱(standalone)으로 설치되어 실행 중인지 확인
const isInStandaloneMode = () =>
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

// === 메인 컴포넌트 ===
export default function InstallButton({ className = '', onClick, deferredPrompt, setDeferredPrompt }) {
    const [showIosGuide, setShowIosGuide] = useState(false);
    const [showFallback, setShowFallback] = useState(false);
    const [showInstallSuccess, setShowInstallSuccess] = useState(false); // [개선 7] 설치 완료 피드백
    const [showInAppBlocker, setShowInAppBlocker] = useState(false);
    const [showIosInlineGuide, setShowIosInlineGuide] = useState(false);

    useEffect(() => {
        // [개선 5] localStorage로 변경 — 탭 닫아도 dismiss 기억 유지
        if (isInAppBrowser() && !isInStandaloneMode() && !localStorage.getItem('inAppModalDismissed')) {
            setShowInAppBlocker(true);
        }

        const handleBeforeInstall = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        // [개선 7] 설치 완료 시 성공 토스트 표시
        const handleAppInstalled = () => {
            setDeferredPrompt(null);
            setShowInstallSuccess(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    // [개선 7] 설치 성공 토스트 4초 후 자동 닫기
    useEffect(() => {
        if (!showInstallSuccess) return;
        const timer = setTimeout(() => setShowInstallSuccess(false), 4000);
        return () => clearTimeout(timer);
    }, [showInstallSuccess]);

    // [개선 5] localStorage로 변경
    const dismissInAppBlocker = useCallback(() => {
        localStorage.setItem('inAppModalDismissed', 'true');
        setShowInAppBlocker(false);
    }, []);

    // 설치 버튼 클릭 핸들러
    const handleInstallClick = useCallback(async () => {
        // 1. 인앱 브라우저일 경우 -> 차단 안내 모달
        if (isInAppBrowser()) {
            setShowInAppBlocker(true);
            return;
        }

        // 2. iOS 일반 브라우저 -> iOS 전용 설치 가이드
        if (isIos()) {
            setShowIosGuide(true);
            return;
        }

        // 3. 앱 설치 이벤트(Prompt)가 준비된 경우 (Chrome/Edge)
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

        // [개선 1] Android인데 deferredPrompt 없으면 Chrome으로 즉시 이동
        if (isAndroid()) {
            openChromeOnAndroid();
            return;
        }

        // 4. 그 외 (PC Safari, 이미 설치 등) -> 폴백 안내
        setShowFallback(true);
    }, [deferredPrompt]);

    // 안드로이드 Chrome 강제 이동
    const openChromeOnAndroid = () => {
        const targetUrl = window.location.href.replace(/^https?:\/\//i, '');
        const intentUrl = `intent://${targetUrl}#Intent;scheme=https;package=com.android.chrome;end;`;
        window.location.href = intentUrl;
    };

    // 폴백 토스트 4초 후 자동 닫기
    useEffect(() => {
        if (!showFallback) return;
        const timer = setTimeout(() => setShowFallback(false), 4000);
        return () => clearTimeout(timer);
    }, [showFallback]);

    return (
        <>
            {/* 1. 헤더용 인라인 설치 버튼 */}
            <button
                id="pwa-install-btn"
                onClick={onClick || handleInstallClick}
                className={className}
                aria-label="앱 설치"
            >
                <Download className="w-[18px] h-[18px]" />
                <span className="inline">설치</span>
            </button>

            {/* 2. 일반 폴백 안내 토스트 — Android/기타 분기 */}
            {showFallback && (
                <div className="fixed bottom-6 left-4 right-4 z-[1000] flex justify-center animate-in slide-in-from-bottom-4 fade-in duration-300">
                    <div className="w-full max-w-md bg-elev/95 backdrop-blur-xl border border-line rounded-2xl shadow-2xl p-4 flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-lime-soft flex items-center justify-center mt-0.5">
                            <Download className="w-4 h-4 text-lime-ink" />
                        </div>
                        {isAndroid() ? (
                            <p className="flex-1 text-sm text-ink2 leading-relaxed">
                                설치 버튼이 보이지 않으면{' '}
                                <strong className="text-ink">점 세 개 메뉴</strong>에서{' '}
                                <strong className="text-lime-ink">[앱 설치]</strong> 또는{' '}
                                <strong className="text-lime-ink">[홈 화면에 추가]</strong>를 선택하세요.
                            </p>
                        ) : (
                            <p className="flex-1 text-sm text-ink2 leading-relaxed">
                                이미 설치되었거나 지원하지 않는 브라우저입니다.
                                <br />
                                <span className="text-lime-ink font-semibold">아이폰</span>은 공유 버튼을 통해 홈 화면에 추가해주세요.
                            </p>
                        )}
                        <button
                            onClick={() => setShowFallback(false)}
                            className="flex-shrink-0 p-1 text-ink3 hover:text-ink transition-colors"
                            aria-label="닫기"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* [개선 7] 설치 완료 성공 토스트 */}
            {showInstallSuccess && (
                <div className="fixed bottom-6 left-4 right-4 z-[1000] flex justify-center animate-in slide-in-from-bottom-4 fade-in duration-300">
                    <div className="w-full max-w-md bg-elev/95 backdrop-blur-xl border border-lime-line rounded-2xl shadow-2xl p-4 flex items-center gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-lime-soft flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-lime-ink" />
                        </div>
                        <p className="flex-1 text-sm text-ink font-semibold">
                            앱이 성공적으로 설치되었습니다! 🎉
                        </p>
                        <button
                            onClick={() => setShowInstallSuccess(false)}
                            className="flex-shrink-0 p-1 text-ink3 hover:text-ink transition-colors"
                            aria-label="닫기"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* 3. iOS 기본 브라우저용 수동 설치 안내 모달 */}
            {showIosGuide && createPortal(
                <div
                    className="fixed inset-0 h-[100dvh] w-screen z-[9999] flex flex-col items-center justify-center bg-well backdrop-blur-sm animate-in fade-in duration-200 px-4"
                    onClick={() => setShowIosGuide(false)}
                >
                    <div
                        className="w-full max-w-md bg-panel border border-line rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom-4 duration-300 relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setShowIosGuide(false)}
                            className="absolute top-4 right-4 p-1 text-ink2 hover:text-ink transition-colors"
                            aria-label="닫기"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h3 className="text-lg font-bold text-ink mb-4">
                            홈 화면에 추가하기
                        </h3>

                        <div className="space-y-4 text-ink2 text-sm">
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-blue-soft flex items-center justify-center">
                                    <span className="text-blue-ink font-bold text-xs">1</span>
                                </div>
                                <p className="pt-0.5">
                                    하단 메뉴바의{' '}
                                    <Share className="inline w-4 h-4 text-blue-ink -mt-0.5" />{' '}
                                    <strong className="text-ink">공유</strong> 버튼을 탭하세요
                                </p>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-lime-soft flex items-center justify-center">
                                    <span className="text-lime-ink font-bold text-xs">2</span>
                                </div>
                                <p className="pt-0.5">
                                    목록에서{' '}
                                    <PlusSquare className="inline w-4 h-4 text-lime-ink -mt-0.5" />{' '}
                                    <strong className="text-ink">홈 화면에 추가</strong>를 선택하세요
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowIosGuide(false)}
                            className="mt-6 w-full py-3 bg-elev hover:bg-elev2 text-ink font-semibold rounded-xl transition-colors"
                        >
                            확인
                        </button>
                    </div>
                </div>,
                document.body
            )}

            {/* 4. 인앱 브라우저 차단 전면 오버레이 */}
            {showInAppBlocker && createPortal(
                <div className="fixed inset-0 h-[100dvh] w-screen z-[9999] flex flex-col items-center justify-center bg-well backdrop-blur-sm px-4 animate-in fade-in duration-300">
                    <div className="bg-panel border border-line w-full max-w-[90%] sm:max-w-sm rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center">

                        <img src="/pic/HDO_new.png" alt="HD현대오일뱅크" className="h-5 object-contain opacity-80 mb-5" />

                        <div className="w-16 h-16 rounded-full bg-red-soft flex items-center justify-center mb-5">
                            <Smartphone className="w-8 h-8 text-red-ink" />
                        </div>

                        <h2 className="text-xl font-bold text-ink mb-2 tracking-tight">
                            이곳은 <span className="text-red-ink">임시 브라우저</span>입니다
                        </h2>

                        <p className="text-base text-ink2 leading-relaxed mb-6">
                            원활한 앱 설치와 모든 기능 사용을 위해
                            아래 버튼을 눌러 <span className="text-lime-ink font-bold">기본 브라우저</span>로 이동해주세요.
                        </p>

                        <div className="w-full flex flex-col">
                            {/* [개선 1] Android: Chrome 즉시 이동 */}
                            <button
                                onClick={openChromeOnAndroid}
                                className="h-14 w-full mb-3 rounded-xl font-bold flex items-center justify-center gap-2 bg-lime-fill text-lime-on hover:bg-lime-fill active:scale-95 transition-all shadow-lg"
                            >
                                <Chrome className="w-5 h-5" />
                                Android 사용자 (Chrome으로 열기)
                            </button>

                            {/* [개선 2] iOS: 시각 가이드 강화 */}
                            <button
                                onClick={() => setShowIosInlineGuide(prev => !prev)}
                                className="h-14 w-full mb-3 rounded-xl font-bold flex items-center justify-center gap-2 bg-blue-fill text-blue-on hover:bg-blue-fill active:scale-95 transition-all shadow-lg"
                            >
                                <ExternalLink className="w-5 h-5" />
                                iOS 사용자 (Safari로 열기)
                            </button>

                            {/* [개선 2] iOS 인라인 가이드 — 애니메이션 시각 가이드로 강화 */}
                            {showIosInlineGuide && (
                                <div className="mb-4 p-4 bg-elev rounded-xl border border-blue-line animate-in slide-in-from-top-2 fade-in duration-300 shadow-md">
                                    <ol className="flex flex-col gap-3 text-sm text-left">
                                        <li className="flex items-center gap-3">
                                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-soft text-blue-ink text-xs font-bold flex items-center justify-center">1</span>
                                            <span className="text-ink">
                                                우측 하단 또는 상단{' '}
                                                <Share className="inline w-4 h-4 text-blue-ink animate-bounce mx-0.5" />{' '}
                                                <strong className="text-ink">공유 버튼</strong> 클릭
                                            </span>
                                        </li>
                                        <li className="flex items-center gap-3">
                                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-soft text-blue-ink text-xs font-bold flex items-center justify-center">2</span>
                                            <span className="text-ink">
                                                메뉴에서 <strong className="text-ink">Safari로 열기</strong> 선택
                                            </span>
                                        </li>
                                        <li className="flex items-center gap-3">
                                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-lime-soft text-lime-ink text-xs font-bold flex items-center justify-center">3</span>
                                            <span className="text-ink">
                                                Safari에서 다시{' '}
                                                <strong className="text-lime-ink">설치 버튼</strong> 클릭
                                            </span>
                                        </li>
                                    </ol>
                                </div>
                            )}
                        </div>

                        {/* [개선 5] localStorage로 dismiss 유지 */}
                        <button
                            onClick={dismissInAppBlocker}
                            className="mt-8 text-sm font-medium text-ink2 hover:text-ink underline underline-offset-4 transition-colors p-3"
                        >
                            그냥 계속하기
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
