import React, { useState } from 'react';
import { Smartphone, Share, PlusSquare, ArrowLeft, MoreVertical, Compass, Home } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
    try {
        return twMerge(clsx(inputs));
    } catch {
        return inputs.flat().filter(Boolean).join(' ');
    }
}

export default function InstallGuide({ setActiveTab }) {
    const [step, setStep] = useState('selection'); // 'selection' | 'android' | 'ios'

    const handleHome = () => {
        setActiveTab('lt');
    };

    const handleChromeIntent = () => {
        // [개선 1] 현재 전체 URL 기반으로 intent 구성
        const targetUrl = window.location.href.replace(/^https?:\/\//i, '');
        const intentUrl = `intent://${targetUrl}#Intent;scheme=https;package=com.android.chrome;end;`;
        window.location.href = intentUrl;
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-start pt-4 sm:pt-8 pb-20 overflow-y-auto">
            <div className="w-full max-w-lg flex flex-col gap-6 relative animate-in fade-in duration-500">

                {/* 상단 홈으로 돌아가기 버튼 */}
                <button
                    onClick={handleHome}
                    className="self-start flex items-center gap-2 text-ink2 hover:text-ink transition-colors px-2 py-1 mb-2 rounded-lg hover:bg-elev"
                >
                    <Home className="w-5 h-5" />
                    <span className="font-semibold text-sm">홈으로 돌아가기</span>
                </button>

                {step === 'selection' && (
                    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="text-center mb-4">
                            <h2 className="text-2xl font-bold text-ink mb-2">사용 중인 기기를 선택해주세요.</h2>
                            <p className="text-ink2">앱 설치를 위해 현재 사용 중인 기기를 선택해주세요.</p>
                        </div>

                        <button
                            onClick={() => setStep('ios')}
                            className={cn(
                                "flex items-center justify-between p-6 bg-elev rounded-2xl border border-line shadow-lg",
                                "hover:bg-elev2 hover:border-blue-line transition-all active:scale-[0.98]",
                                "group"
                            )}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-soft text-blue-ink rounded-xl flex items-center justify-center group-hover:bg-blue-fill group-hover:text-blue-on transition-colors">
                                    <Smartphone className="w-6 h-6" />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-xl font-bold text-ink">아이폰 (iOS)</h3>
                                    <p className="text-sm text-ink2 font-medium">Safari 브라우저 권장</p>
                                </div>
                            </div>
                            <ArrowLeft className="w-5 h-5 text-ink3 group-hover:text-blue-ink rotate-180 transition-colors" />
                        </button>

                        <button
                            onClick={() => setStep('android')}
                            className={cn(
                                "flex items-center justify-between p-6 bg-elev rounded-2xl border border-line shadow-lg",
                                "hover:bg-elev2 hover:border-lime-line transition-all active:scale-[0.98]",
                                "group"
                            )}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-lime-soft text-lime-ink rounded-xl flex items-center justify-center group-hover:bg-lime-fill group-hover:text-lime-on transition-colors">
                                    <Smartphone className="w-6 h-6" />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-xl font-bold text-ink">갤럭시 (Android)</h3>
                                    <p className="text-sm text-ink2 font-medium">Chrome 브라우저 필수</p>
                                </div>
                            </div>
                            <ArrowLeft className="w-5 h-5 text-ink3 group-hover:text-lime-ink rotate-180 transition-colors" />
                        </button>
                    </div>
                )}

                {step === 'android' && (
                    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="text-center mb-2">
                            <h2 className="text-2xl font-bold text-ink mb-2">Android 설치 가이드</h2>
                            <p className="text-ink2 text-sm">안드로이드 환경에서는 크롬 브라우저를 권장합니다.</p>
                        </div>

                        {/* [개선 1] Chrome 즉시 이동 버튼 — URL 전체 경로 포함 */}
                        <button
                            onClick={handleChromeIntent}
                            className={cn(
                                "w-full flex items-center justify-center gap-2 p-4 bg-lime-fill text-lime-on font-bold rounded-2xl",
                                "hover:bg-lime-fill active:scale-95 transition-all shadow-lg shadow-shade"
                            )}
                        >
                            <Compass className="w-5 h-5" />
                            Chrome 브라우저로 열기
                        </button>

                        <div className="bg-elev/80 rounded-2xl p-5 border border-line mt-2">
                            <h3 className="font-bold text-ink mb-4 flex items-center gap-2">
                                <span className="bg-elev2 text-xs px-2 py-0.5 rounded text-amber-ink">TIP</span>
                                만약 버튼이 작동하지 않는다면?
                            </h3>
                            <ul className="flex flex-col gap-4 text-sm text-ink2">
                                <li className="flex items-start gap-3">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-elev2 text-ink2 text-xs font-bold shrink-0">1</span>
                                    <span className="leading-snug">화면 우측 상단의 <strong>점 세 개(<MoreVertical className="inline w-4 h-4 text-ink2" />) 아이콘</strong>을 클릭하세요.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-elev2 text-ink2 text-xs font-bold shrink-0">2</span>
                                    <span className="leading-snug">메뉴에서 <strong>[다른 브라우저로 열기]</strong> 혹은 <strong>[Chrome으로 열기]</strong>를 찾아 선택하세요.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-elev2 text-ink2 text-xs font-bold shrink-0">3</span>
                                    <span className="leading-snug">크롬으로 접속된 후 <strong>[설치]</strong> 버튼을 다시 클릭해주세요.</span>
                                </li>
                            </ul>
                        </div>

                        {/* 설치 버튼이 안 보이는 경우 별도 안내 카드 */}
                        <div className="bg-elev/80 rounded-2xl p-5 border border-amber-line mt-2">
                            <h3 className="font-bold text-ink mb-4 flex items-center gap-2">
                                <span className="bg-amber-soft text-xs px-2 py-0.5 rounded text-amber-ink">주의</span>
                                크롬에서도 설치 버튼이 안 보인다면?
                            </h3>
                            <p className="text-xs text-ink2 mb-4 leading-relaxed">
                                크롬이 설치 조건을 아직 확인 중이거나, 이미 설치된 경우 버튼이 표시되지 않을 수 있습니다. 이 경우 메뉴에서 직접 추가하세요.
                            </p>
                            <ul className="flex flex-col gap-4 text-sm text-ink2">
                                <li className="flex items-start gap-3">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-soft text-amber-ink text-xs font-bold shrink-0">1</span>
                                    <span className="leading-snug">화면 우측 상단의 <strong>점 세 개(<MoreVertical className="inline w-4 h-4 text-ink2" />) 아이콘</strong>을 클릭하세요.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-soft text-amber-ink text-xs font-bold shrink-0">2</span>
                                    <span className="leading-snug">메뉴에서 <strong className="text-amber-ink">[앱 설치]</strong> 또는 <strong className="text-amber-ink">[홈 화면에 추가]</strong>를 선택하세요.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-soft text-amber-ink text-xs font-bold shrink-0">3</span>
                                    <span className="leading-snug">팝업이 뜨면 <strong>[설치]</strong> 또는 <strong>[추가]</strong>를 눌러 완료하세요.</span>
                                </li>
                            </ul>
                        </div>

                        <button
                            onClick={() => setStep('selection')}
                            className="mt-4 text-ink2 hover:text-ink pb-2 text-sm font-semibold transition-colors decoration-line underline underline-offset-4 text-center"
                        >
                            기기 다시 선택하기
                        </button>
                    </div>
                )}

                {/* [개선 4] iOS step 순서 버그 수정 — 일반 Safari 기준으로 재작성 */}
                {step === 'ios' && (
                    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="text-center mb-2">
                            <h2 className="text-2xl font-bold text-ink mb-2">iOS 설치 가이드</h2>
                            <p className="text-ink2 text-sm">아이폰에서는 Safari 브라우저에서만 설치할 수 있습니다.</p>
                        </div>

                        <div className="bg-elev rounded-2xl p-6 border border-line shadow-xl overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-soft blur-3xl rounded-full translate-x-10 -translate-y-10" />

                            <h3 className="font-bold text-blue-ink mb-6 text-lg flex items-center gap-2">
                                <Compass className="w-5 h-5 bg-blue-soft rounded p-0.5" />
                                Safari 브라우저 안내
                            </h3>

                            <ul className="flex flex-col gap-6 text-sm text-ink2 relative z-10">
                                {/* Step 1: 공유 버튼 클릭 */}
                                <li className="flex items-start gap-3">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-soft text-blue-ink text-xs font-bold shrink-0 mt-0.5">1</span>
                                    <div className="flex-1">
                                        <p className="font-medium text-ink mb-2 leading-snug">
                                            화면 하단 가운데 또는 상단의{' '}
                                            <strong className="text-blue-ink bg-blue-soft px-1 py-0.5 rounded mx-0.5">공유</strong>
                                            아이콘을 클릭하세요.
                                        </p>
                                        <div className="bg-panel border border-line rounded-lg p-3 flex justify-center items-center">
                                            <Share className="w-6 h-6 text-blue-ink" />
                                        </div>
                                    </div>
                                </li>

                                {/* [개선 4] Step 2: 홈 화면에 추가 — 기존에 "Safari로 열기"가 잘못 들어가 있던 것 수정 */}
                                <li className="flex items-start gap-3">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-soft text-blue-ink text-xs font-bold shrink-0 mt-0.5">2</span>
                                    <div className="flex-1">
                                        <p className="font-medium text-ink mb-2 leading-snug">
                                            목록을 아래로 내려 <strong className="text-ink">홈 화면에 추가</strong>를 선택하세요.
                                        </p>
                                        <div className="bg-panel border border-line rounded-lg p-4 flex justify-between items-center px-4">
                                            <span className="font-medium text-ink">홈 화면에 추가</span>
                                            <PlusSquare className="w-6 h-6 text-ink2" />
                                        </div>
                                    </div>
                                </li>

                                {/* Step 3: 추가 확인 */}
                                <li className="flex items-start gap-3">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-soft text-blue-ink text-xs font-bold shrink-0 mt-0.5">3</span>
                                    <div className="flex-1">
                                        <p className="font-medium text-ink leading-snug">
                                            우측 상단 <strong className="text-ink">추가</strong>를 탭하면 홈 화면에 아이콘이 생성됩니다.
                                        </p>
                                    </div>
                                </li>
                            </ul>
                        </div>

                        <button
                            onClick={() => setStep('selection')}
                            className="mt-4 text-ink2 hover:text-ink pb-2 text-sm font-semibold transition-colors decoration-line underline underline-offset-4 text-center"
                        >
                            기기 다시 선택하기
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
