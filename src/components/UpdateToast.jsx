import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

export default function UpdateToast() {
    const {
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegisteredSW(swUrl, registration) {
            // 주기적으로 SW 업데이트 확인 (1시간 간격)
            if (registration) {
                setInterval(() => {
                    registration.update();
                }, 60 * 60 * 1000);
            }
        },
        onRegisterError(error) {
            console.error('[SW] Registration error:', error);
        },
    });

    if (!needRefresh) return null;

    const handleUpdate = () => {
        updateServiceWorker(true);
    };

    const handleDismiss = () => {
        setNeedRefresh(false);
    };

    return (
        <div className="fixed bottom-20 left-4 right-4 z-[998] flex justify-center animate-in slide-in-from-bottom-4 fade-in duration-300">
            <div className="w-full max-w-md bg-slate-800/95 backdrop-blur-xl border border-slate-600 rounded-2xl shadow-2xl shadow-black/40 p-4 flex items-center gap-3">
                {/* 아이콘 */}
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-lime-500/15 flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 text-lime-400" />
                </div>

                {/* 메시지 */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white">새로운 버전이 준비되었습니다</p>
                    <p className="text-xs text-slate-400 mt-0.5">업데이트하여 최신 기능을 사용하세요</p>
                </div>

                {/* 업데이트 버튼 */}
                <button
                    onClick={handleUpdate}
                    className="flex-shrink-0 h-10 px-4 bg-lime-500 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-lime-500/30 transition-all duration-200 hover:bg-lime-400 hover:shadow-xl hover:shadow-lime-400/40 active:scale-95 touch-manipulation"
                >
                    업데이트
                </button>

                {/* 닫기 */}
                <button
                    onClick={handleDismiss}
                    className="flex-shrink-0 p-2 text-slate-500 hover:text-white transition-colors touch-manipulation"
                    aria-label="닫기"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

/**
 * 수동으로 SW 업데이트를 체크하는 함수.
 * 헤더의 새로고침 버튼에서 호출합니다.
 */
export async function checkForUpdate() {
    if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
            await registration.update();
        }
    }
}
