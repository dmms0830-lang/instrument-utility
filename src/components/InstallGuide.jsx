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
                    className="self-start flex items-center gap-2 text-slate-400 hover:text-white transition-colors px-2 py-1 mb-2 rounded-lg hover:bg-slate-800"
                >
                    <Home className="w-5 h-5" />
                    <span className="font-semibold text-sm">홈으로 돌아가기</span>
                </button>

                {step === 'selection' && (
                    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="text-center mb-4">
                            <h2 className="text-2xl font-bold text-white mb-2">사용 중인 기기를 선택해주세요.</h2>
                            <p className="text-slate-400">앱 설치를 위해 현재 사용 중인 기기를 선택해주세요.</p>
                        </div>

                        <button
                            onClick={() => setStep('ios')}
                            className={cn(
                                "flex items-center justify-between p-6 bg-slate-800 rounded-2xl border border-slate-700 shadow-lg",
                                "hover:bg-slate-700 hover:border-blue-500 transition-all active:scale-[0.98]",
                                "group"
                            )}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                    <Smartphone className="w-6 h-6" />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-xl font-bold text-white">아이폰 (iOS)</h3>
                                    <p className="text-sm text-slate-400 font-medium">Safari 브라우저 권장</p>
                                </div>
                            </div>
                            <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-blue-400 rotate-180 transition-colors" />
                        </button>

                        <button
                            onClick={() => setStep('android')}
                            className={cn(
                                "flex items-center justify-between p-6 bg-slate-800 rounded-2xl border border-slate-700 shadow-lg",
                                "hover:bg-slate-700 hover:border-lime-500 transition-all active:scale-[0.98]",
                                "group"
                            )}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-lime-500/20 text-lime-400 rounded-xl flex items-center justify-center group-hover:bg-lime-500 group-hover:text-slate-900 transition-colors">
                                    <Smartphone className="w-6 h-6" />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-xl font-bold text-white">갤럭시 (Android)</h3>
                                    <p className="text-sm text-slate-400 font-medium">Chrome 브라우저 필수</p>
                                </div>
                            </div>
                            <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-lime-400 rotate-180 transition-colors" />
                        </button>
                    </div>
                )}

                {step === 'android' && (
                    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="text-center mb-2">
                            <h2 className="text-2xl font-bold text-white mb-2">Android 설치 가이드</h2>
                            <p className="text-slate-400 text-sm">안드로이드 환경에서는 크롬 브라우저를 권장합니다.</p>
                        </div>

                        {/* [개선 1] Chrome 즉시 이동 버튼 — URL 전체 경로 포함 */}
                        <button
                            onClick={handleChromeIntent}
                            className={cn(
                                "w-full flex items-center justify-center gap-2 p-4 bg-lime-500 text-slate-950 font-bold rounded-2xl",
                                "hover:bg-lime-400 active:scale-95 transition-all shadow-lg shadow-lime-500/20"
                            )}
                        >
                            <Compass className="w-5 h-5" />
                            Chrome 브라우저로 열기
                        </button>

                        <div className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700 mt-2">
                            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                <span className="bg-slate-700 text-xs px-2 py-0.5 rounded text-amber-400">TIP</span>
                                만약 버튼이 작동하지 않는다면?
                            </h3>
                            <ul className="flex flex-col gap-4 text-sm text-slate-300">
                                <li className="flex items-start gap-3">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-700 text-slate-300 text-xs font-bold shrink-0">1</span>
                                    <span className="leading-snug">화면 우측 상단의 <strong>점 세 개(<MoreVertical className="inline w-4 h-4 text-slate-400" />) 아이콘</strong>을 클릭하세요.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-700 text-slate-300 text-xs font-bold shrink-0">2</span>
                                    <span className="leading-snug">메뉴에서 <strong>[다른 브라우저로 열기]</strong> 혹은 <strong>[Chrome으로 열기]</strong>를 찾아 선택하세요.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-700 text-slate-300 text-xs font-bold shrink-0">3</span>
                                    <span className="leading-snug">크롬으로 접속된 후 <strong>[설치]</strong> 버튼을 다시 클릭해주세요.</span>
                                </li>
                            </ul>
                        </div>

                        {/* 설치 버튼이 안 보이는 경우 별도 안내 카드 */}
                        <div className="bg-slate-800/80 rounded-2xl p-5 border border-amber-500/30 mt-2">
                            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                <span className="bg-amber-500/20 text-xs px-2 py-0.5 rounded text-amber-400">주의</span>
                                크롬에서도 설치 버튼이 안 보인다면?
                            </h3>
                            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                                크롬이 설치 조건을 아직 확인 중이거나, 이미 설치된 경우 버튼이 표시되지 않을 수 있습니다. 이 경우 메뉴에서 직접 추가하세요.
                            </p>
                            <ul className="flex flex-col gap-4 text-sm text-slate-300">
                                <li className="flex items-start gap-3">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold shrink-0">1</span>
                                    <span className="leading-snug">화면 우측 상단의 <strong>점 세 개(<MoreVertical className="inline w-4 h-4 text-slate-400" />) 아이콘</strong>을 클릭하세요.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold shrink-0">2</span>
                                    <span className="leading-snug">메뉴에서 <strong className="text-amber-300">[앱 설치]</strong> 또는 <strong className="text-amber-300">[홈 화면에 추가]</strong>를 선택하세요.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold shrink-0">3</span>
                                    <span className="leading-snug">팝업이 뜨면 <strong>[설치]</strong> 또는 <strong>[추가]</strong>를 눌러 완료하세요.</span>
                                </li>
                            </ul>
                        </div>

                        <button
                            onClick={() => setStep('selection')}
                            className="mt-4 text-slate-400 hover:text-white pb-2 text-sm font-semibold transition-colors decoration-slate-500 underline underline-offset-4 text-center"
                        >
                            기기 다시 선택하기
                        </button>
                    </div>
                )}

                {/* [개선 4] iOS step 순서 버그 수정 — 일반 Safari 기준으로 재작성 */}
                {step === 'ios' && (
                    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="text-center mb-2">
                            <h2 className="text-2xl font-bold text-white mb-2">iOS 설치 가이드</h2>
                            <p className="text-slate-400 text-sm">아이폰에서는 Safari 브라우저에서만 설치할 수 있습니다.</p>
                        </div>

                        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full translate-x-10 -translate-y-10" />

                            <h3 className="font-bold text-blue-400 mb-6 text-lg flex items-center gap-2">
                                <Compass className="w-5 h-5 bg-blue-500/20 rounded p-0.5" />
                                Safari 브라우저 안내
                            </h3>

                            <ul className="flex flex-col gap-6 text-sm text-slate-300 relative z-10">
                                {/* Step 1: 공유 버튼 클릭 */}
                                <li className="flex items-start gap-3">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold shrink-0 mt-0.5">1</span>
                                    <div className="flex-1">
                                        <p className="font-medium text-slate-200 mb-2 leading-snug">
                                            화면 하단 가운데 또는 상단의{' '}
                                            <strong className="text-blue-400 bg-blue-500/10 px-1 py-0.5 rounded mx-0.5">공유</strong>
                                            아이콘을 클릭하세요.
                                        </p>
                                        <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 flex justify-center items-center">
                                            <Share className="w-6 h-6 text-blue-400" />
                                        </div>
                                    </div>
                                </li>

                                {/* [개선 4] Step 2: 홈 화면에 추가 — 기존에 "Safari로 열기"가 잘못 들어가 있던 것 수정 */}
                                <li className="flex items-start gap-3">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold shrink-0 mt-0.5">2</span>
                                    <div className="flex-1">
                                        <p className="font-medium text-slate-200 mb-2 leading-snug">
                                            목록을 아래로 내려 <strong className="text-white">홈 화면에 추가</strong>를 선택하세요.
                                        </p>
                                        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 flex justify-between items-center px-4">
                                            <span className="font-medium text-white">홈 화면에 추가</span>
                                            <PlusSquare className="w-6 h-6 text-slate-400" />
                                        </div>
                                    </div>
                                </li>

                                {/* Step 3: 추가 확인 */}
                                <li className="flex items-start gap-3">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold shrink-0 mt-0.5">3</span>
                                    <div className="flex-1">
                                        <p className="font-medium text-slate-200 leading-snug">
                                            우측 상단 <strong className="text-white">추가</strong>를 탭하면 홈 화면에 아이콘이 생성됩니다.
                                        </p>
                                    </div>
                                </li>
                            </ul>
                        </div>

                        <button
                            onClick={() => setStep('selection')}
                            className="mt-4 text-slate-400 hover:text-white pb-2 text-sm font-semibold transition-colors decoration-slate-500 underline underline-offset-4 text-center"
                        >
                            기기 다시 선택하기
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
