import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Waves, AlertTriangle, ArrowRight, Delete, Droplets, RotateCcw, RefreshCw } from 'lucide-react';
import LiveView3D from './LiveView3D';

/* ═══════════════════════════════════════════════════════════════
   SHAKE RESET TOAST
═══════════════════════════════════════════════════════════════ */
function ShakeToast({ visible, countdown }) {
    if (!visible) return null;
    return (
        <div style={{
            position: 'fixed', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 9999, pointerEvents: 'none',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: '8px',
            background: 'rgba(220,38,38,0.92)',
            border: '2px solid rgba(239,68,68,0.7)',
            borderRadius: '20px',
            padding: '20px 32px',
            boxShadow: '0 0 40px rgba(220,38,38,0.5)',
        }}>
            <span style={{ fontSize: '32px' }}>📳</span>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: '16px', letterSpacing: '0.05em' }}>
                흔들기 감지됨
            </span>
            <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '13px' }}>
                {countdown}초 후 전체 초기화
            </span>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════
   useShakeDetect 훅
   - iOS 13+: DeviceMotionEvent.requestPermission() 필요
   - Android: 자동 등록
   - threshold: 가속도 임계값 (기본 18 m/s²) — 너무 낮으면 오감지
   - cooldown: 연속 감지 방지 ms
═══════════════════════════════════════════════════════════════ */
function useShakeDetect({ onShake, threshold = 18, cooldown = 2000 }) {
    const lastShake = useRef(0);
    const last = useRef({ x: null, y: null, z: null });

    const handleMotion = useCallback((e) => {
        const acc = e.accelerationIncludingGravity;
        if (!acc) return;
        const { x, y, z } = acc;
        if (last.current.x === null) { last.current = { x, y, z }; return; }
        const dx = Math.abs(x - last.current.x);
        const dy = Math.abs(y - last.current.y);
        const dz = Math.abs(z - last.current.z);
        last.current = { x, y, z };
        if (Math.max(dx, dy, dz) > threshold) {
            const now = Date.now();
            if (now - lastShake.current > cooldown) {
                lastShake.current = now;
                onShake();
            }
        }
    }, [onShake, threshold, cooldown]);

    const register = useCallback(() => {
        window.addEventListener('devicemotion', handleMotion);
    }, [handleMotion]);

    useEffect(() => {
        // iOS 13+: permission required
        if (typeof DeviceMotionEvent !== 'undefined' &&
            typeof DeviceMotionEvent.requestPermission === 'function') {
            // iOS — 권한은 버튼 탭 이벤트에서만 요청 가능, 여기선 등록만 대기
            return;
        }
        // Android / 기타
        register();
        return () => window.removeEventListener('devicemotion', handleMotion);
    }, [register, handleMotion]);

    // iOS 권한 요청 함수 (버튼 탭에서 호출)
    const requestiOSPermission = useCallback(async () => {
        if (typeof DeviceMotionEvent !== 'undefined' &&
            typeof DeviceMotionEvent.requestPermission === 'function') {
            try {
                const res = await DeviceMotionEvent.requestPermission();
                if (res === 'granted') register();
            } catch (err) {
                console.warn('DeviceMotion permission denied', err);
            }
        }
    }, [register]);

    return { requestiOSPermission };
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function LevelTransmitter() {
    const [lrv, setLrv] = useState('');
    const [urv, setUrv] = useState('');
    const [currPct, setCurrPct] = useState('');
    const [targetPct, setTargetPct] = useState('');
    const [activeField, setActiveField] = useState(null);
    const [selection, setSelection] = useState({ start: 0, end: 0 });
    const inputRefs = useRef({ lrv: null, urv: null, curr: null, target: null });

    // ── 흔들기 토스트 상태 ──
    const [shakeToast, setShakeToast] = useState(false);
    const [shakeCountdown, setShakeCountdown] = useState(2);
    const shakeTimer = useRef(null);

    const handleFullReset = useCallback(() => {
        if (navigator.vibrate) navigator.vibrate(50);
        setLrv(''); setUrv(''); setCurrPct(''); setTargetPct('');
        setActiveField(null);
    }, []);

    // 흔들기 감지 시 → 카운트다운 토스트 후 초기화
    const handleShake = useCallback(() => {
        if (navigator.vibrate) navigator.vibrate([80, 60, 80]);
        setShakeToast(true);
        setShakeCountdown(2);

        let count = 2;
        clearInterval(shakeTimer.current);
        shakeTimer.current = setInterval(() => {
            count -= 1;
            setShakeCountdown(count);
            if (count <= 0) {
                clearInterval(shakeTimer.current);
                setShakeToast(false);
                handleFullReset();
                if (navigator.vibrate) navigator.vibrate([50, 30, 50, 30, 100]);
            }
        }, 1000);
    }, [handleFullReset]);

    useEffect(() => () => clearInterval(shakeTimer.current), []);

    const { requestiOSPermission } = useShakeDetect({ onShake: handleShake });

    // iOS 여부 감지 — 처음 한 번만 권한 팝업 유도
    const [iosPermAsked, setIosPermAsked] = useState(false);
    const isIOS = typeof DeviceMotionEvent !== 'undefined' &&
        typeof DeviceMotionEvent.requestPermission === 'function';

    const handleResetButtonClick = async () => {
        // iOS이고 아직 권한 안 물어봤으면 이 버튼 탭을 기회로 요청
        if (isIOS && !iosPermAsked) {
            setIosPermAsked(true);
            await requestiOSPermission();
        }
        handleFullReset();
    };
    const handleAdditionalCorrection = () => {
        if (!calculation) return;
        if (navigator.vibrate) navigator.vibrate([30, 20, 30]);
        setLrv(calculation.newLrv.toFixed(2));
        setUrv(calculation.newUrv.toFixed(2));
        setCurrPct(''); setTargetPct('');
        setActiveField(null);
    };

    useEffect(() => {
        if (activeField && inputRefs.current[activeField]) {
            const inp = inputRefs.current[activeField];
            inp.focus();
            inp.setSelectionRange(selection.start, selection.end);
        }
    }, [lrv, urv, currPct, targetPct, activeField, selection]);

    const calculation = useMemo(() => {
        const l = parseFloat(lrv), u = parseFloat(urv);
        const c = parseFloat(currPct), t = parseFloat(targetPct);
        if (isNaN(l) || isNaN(u) || isNaN(c) || isNaN(t)) return null;
        const span = u - l;
        const newL = (l + span * (c / 100)) - span * (t / 100);
        return {
            newLrv: newL, newUrv: newL + span,
            inverted: l > u, span,
            error: (c - t) * span / 100,
            deltaLevel: t - c,
            deltaMmH2O: (t - c) * span / 100
        };
    }, [lrv, urv, currPct, targetPct]);

    const handleInputFocus = (field, e) => { setActiveField(field); e.target.select(); };
    const handleSelect = (e) => setSelection({ start: e.target.selectionStart, end: e.target.selectionEnd });

    const handleKeypad = (key) => {
        if (navigator.vibrate) navigator.vibrate(30);
        if (!activeField) return;
        let val, setVal;
        switch (activeField) {
            case 'lrv': val = lrv; setVal = setLrv; break;
            case 'urv': val = urv; setVal = setUrv; break;
            case 'curr': val = currPct; setVal = setCurrPct; break;
            case 'target': val = targetPct; setVal = setTargetPct; break;
            default: return;
        }
        const s = selection.start, e2 = selection.end;
        const up = (v, c) => { setVal(v); setSelection({ start: c, end: c }); };
        if (key === 'CLR') up('', 0);
        else if (key === 'DEL') {
            if (s === e2 && s > 0) up(val.slice(0, s - 1) + val.slice(s), s - 1);
            else if (s !== e2) up(val.slice(0, s) + val.slice(e2), s);
        } else if (key === '-') {
            if (val.startsWith('-')) up(val.substring(1), Math.max(0, s - 1));
            else up('-' + val, s + 1);
        } else {
            if (key === '.' && val.includes('.')) return;
            if (val === '0' && key !== '.' && s === 1) up(key, 1);
            else up(val.slice(0, s) + key + val.slice(e2), s + 1);
        }
    };

    const hasCurrent = currPct !== '' && !isNaN(parseFloat(currPct));
    const hasTarget = targetPct !== '' && !isNaN(parseFloat(targetPct));

    return (
        <div className="flex flex-col gap-2 h-full">
            <ShakeToast visible={shakeToast} countdown={shakeCountdown} />

            {/* TOP CARD */}
            <div className="bg-card rounded-2xl border border-slate-800 shadow-xl flex-shrink-0 overflow-hidden">
                <div className="flex items-center justify-between px-4 pt-3 pb-2">
                    <div className="flex items-center gap-2">
                        <Waves className="w-4 h-4 text-slate-500" />
                        <span className="text-xs font-bold text-slate-500 tracking-widest uppercase">Transmitter Setup</span>
                    </div>
                    <button onClick={handleResetButtonClick}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-red-950/40 border border-red-900/40 text-red-500 rounded-lg text-xs font-bold hover:bg-red-900/40 active:scale-95 transition-all touch-manipulation">
                        <RotateCcw className="w-3 h-3" />초기화
                    </button>
                </div>

                <div className="px-3 pb-2">
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="text-[10px] font-bold text-slate-600 tracking-widest uppercase">Range</span>
                        <div className="flex-1 h-px bg-slate-800" />
                        <span className="text-[10px] text-slate-700 font-mono">mmH₂O</span>
                    </div>
                    <div style={{ display: 'flex', borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid rgba(100,116,139,0.4)' }}>
                        <div style={{ flex: 1 }} className={`flex flex-col px-3 py-2.5 cursor-pointer transition-colors ${activeField === 'lrv' ? 'bg-blue-950/50' : 'bg-black/70'}`}
                            onClick={() => inputRefs.current.lrv?.focus()}>
                            <span className={`text-[10px] font-black tracking-widest mb-1 ${activeField === 'lrv' ? 'text-blue-400' : 'text-slate-600'}`}>LRV</span>
                            <input ref={el => inputRefs.current.lrv = el} type="text" inputMode="none"
                                value={lrv} onChange={() => { }} onFocus={e => handleInputFocus('lrv', e)} onSelect={handleSelect}
                                className={`w-full bg-transparent font-mono text-xl font-black outline-none placeholder:text-slate-700 placeholder:text-sm ${activeField === 'lrv' ? 'text-white' : 'text-slate-300'}`}
                                placeholder="—" />
                        </div>
                        <div style={{ width: '64px', flexShrink: 0, borderLeft: '1px solid rgba(100,116,139,0.4)', borderRight: '1px solid rgba(100,116,139,0.4)' }}
                            className="flex flex-col items-center justify-center py-2.5 bg-slate-900/60">
                            <span className="text-[9px] font-bold text-slate-600 tracking-widest mb-1">SPAN</span>
                            <span className={`font-mono text-sm font-black ${lrv !== '' && urv !== '' && !isNaN(parseFloat(lrv)) && !isNaN(parseFloat(urv)) ? 'text-blue-400' : 'text-slate-700'}`}>
                                {lrv !== '' && urv !== '' && !isNaN(parseFloat(lrv)) && !isNaN(parseFloat(urv)) ? (parseFloat(urv) - parseFloat(lrv)).toFixed(0) : '—'}
                            </span>
                        </div>
                        <div style={{ flex: 1 }} className={`flex flex-col px-3 py-2.5 cursor-pointer transition-colors ${activeField === 'urv' ? 'bg-blue-950/50' : 'bg-black/70'}`}
                            onClick={() => inputRefs.current.urv?.focus()}>
                            <span className={`text-[10px] font-black tracking-widest mb-1 ${activeField === 'urv' ? 'text-blue-400' : 'text-slate-600'}`}>URV</span>
                            <input ref={el => inputRefs.current.urv = el} type="text" inputMode="none"
                                value={urv} onChange={() => { }} onFocus={e => handleInputFocus('urv', e)} onSelect={handleSelect}
                                className={`w-full bg-transparent font-mono text-xl font-black outline-none placeholder:text-slate-700 placeholder:text-sm ${activeField === 'urv' ? 'text-white' : 'text-slate-300'}`}
                                placeholder="—" />
                        </div>
                    </div>
                    {calculation?.inverted && (
                        <div className="mt-1.5 flex items-center gap-2 text-orange-400 bg-orange-900/20 border border-orange-900/40 px-3 py-1.5 rounded-lg animate-pulse">
                            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="text-[11px] font-bold">H/L 라인 역설치 감지됨</span>
                        </div>
                    )}
                </div>

                <div className="mx-3 h-px bg-slate-800" />

                <div className="px-3 pt-2 pb-3">
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="text-[10px] font-bold text-slate-600 tracking-widest uppercase">지시값</span>
                        <div className="flex-1 h-px bg-slate-800" />
                        <span className="text-[10px] text-slate-700 font-mono">%</span>
                    </div>
                    <div className="grid grid-cols-2 gap-0 rounded-xl overflow-hidden border border-slate-700/80">
                        <div className={`flex flex-col px-3 py-2.5 cursor-pointer border-r border-slate-700/80 transition-colors ${activeField === 'curr' ? 'bg-cyan-950/35' : 'bg-black/70'}`}
                            onClick={() => inputRefs.current.curr?.focus()}>
                            <span className={`text-[10px] font-bold tracking-wide mb-1 ${activeField === 'curr' ? 'text-cyan-400' : 'text-slate-600'}`}>현재 지시값</span>
                            <input ref={el => inputRefs.current.curr = el} type="text" inputMode="none"
                                value={currPct} onChange={() => { }} onFocus={e => handleInputFocus('curr', e)} onSelect={handleSelect}
                                className="w-full bg-transparent font-mono text-xl font-black text-cyan-400 outline-none placeholder:text-slate-700 placeholder:text-sm"
                                placeholder="—" />
                        </div>
                        <div className={`flex flex-col px-3 py-2.5 cursor-pointer transition-colors ${activeField === 'target' ? 'bg-green-950/30' : 'bg-black/70'}`}
                            onClick={() => inputRefs.current.target?.focus()}>
                            <span className={`text-[10px] font-bold tracking-wide mb-1 ${activeField === 'target' ? 'text-green-400' : 'text-slate-600'}`}>LG 값</span>
                            <input ref={el => inputRefs.current.target = el} type="text" inputMode="none"
                                value={targetPct} onChange={() => { }} onFocus={e => handleInputFocus('target', e)} onSelect={handleSelect}
                                className="w-full bg-transparent font-mono text-xl font-black text-green-400 outline-none placeholder:text-slate-700 placeholder:text-sm"
                                placeholder="—" />
                        </div>
                    </div>
                </div>
            </div>

            {/* LIVE VIEW */}
            <div className="bg-card rounded-2xl border border-slate-800 shadow-2xl overflow-hidden"
                style={{ flex: '1 1 auto', minHeight: '200px', display: 'flex', flexDirection: 'column' }}>
                <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/60 flex-shrink-0">
                    <div className="flex items-center gap-2 text-cyan-500">
                        <Droplets className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold tracking-widest uppercase">Live View</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-cyan-400"
                                style={{ boxShadow: hasCurrent ? '0 0 6px #00e5ff' : 'none' }} />
                            <span className="text-[10px] text-slate-500">LT</span>
                            {hasCurrent && <span className="text-[10px] font-mono text-cyan-400 font-bold">{parseFloat(currPct).toFixed(1)}%</span>}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-sm bg-green-400"
                                style={{ boxShadow: hasTarget ? '0 0 6px #22c55e' : 'none' }} />
                            <span className="text-[10px] text-slate-500">LG</span>
                            {hasTarget && <span className="text-[10px] font-mono text-green-400 font-bold">{parseFloat(targetPct).toFixed(1)}%</span>}
                        </div>
                        {calculation && (
                            <div className={`px-2 py-0.5 rounded text-[10px] font-black border ${calculation.deltaLevel > 0 ? 'bg-amber-950/40 border-amber-800/50 text-amber-400'
                                    : calculation.deltaLevel < 0 ? 'bg-amber-950/40 border-amber-800/50 text-amber-400'
                                        : 'bg-emerald-950/40 border-emerald-800/50 text-emerald-400'
                                }`}>
                                {calculation.deltaLevel > 0 ? `▲ +${calculation.deltaLevel.toFixed(1)}%p`
                                    : calculation.deltaLevel < 0 ? `▼ ${calculation.deltaLevel.toFixed(1)}%p`
                                        : '✓ 정상'}
                            </div>
                        )}
                    </div>
                </div>
                <div style={{ flex: '1 1 auto', padding: '8px 2px 6px 2px' }}>
                    <LiveView3D currPct={currPct} targetPct={targetPct} />
                </div>
            </div>

            {/* RESULTS */}
            <div className="bg-yellow-900/10 rounded-2xl border border-yellow-700/50 px-2 py-1.5 shadow-xl flex-shrink-0">
                <div className="flex items-center gap-2 mb-1.5 text-yellow-400">
                    <ArrowRight className="w-4 h-4" />
                    <span className="text-sm font-bold">보정 결과값</span>
                </div>
                <div className="flex gap-2">
                    <div className="flex-1 bg-black/50 p-3 rounded-xl border border-yellow-700/30 text-center">
                        <div className="text-xs text-yellow-500 font-bold mb-1">New LRV</div>
                        <div className="font-mono text-2xl font-bold text-white">{calculation ? calculation.newLrv.toFixed(2) : '--'}</div>
                        <span className="text-slate-500 text-[10px]">mmH₂O</span>
                    </div>
                    <div className="flex-1 bg-black/50 p-3 rounded-xl border border-yellow-700/30 text-center">
                        <div className="text-xs text-yellow-500 font-bold mb-1">New URV</div>
                        <div className="font-mono text-2xl font-bold text-white">{calculation ? calculation.newUrv.toFixed(2) : '--'}</div>
                        <span className="text-slate-500 text-[10px]">mmH₂O</span>
                    </div>
                </div>
                <div className="mt-1.5 p-2 bg-black/30 rounded-xl text-center">
                    <p className="text-[10px] text-slate-500 font-mono">
                        New LRV = {lrv || '0'} + ({calculation?.error?.toFixed(2) || '0'}) = {calculation?.newLrv?.toFixed(2) || '--'}
                    </p>
                </div>
                <button onClick={handleAdditionalCorrection} disabled={!calculation}
                    className={`mt-2 w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 touch-manipulation
                        ${calculation
                            ? 'bg-cyan-900/40 border border-cyan-600/60 text-cyan-300 hover:bg-cyan-800/50 shadow-[0_0_12px_rgba(34,211,238,0.15)]'
                            : 'bg-slate-800/30 border border-slate-700/40 text-slate-600 cursor-not-allowed'}`}>
                    <RefreshCw className={`w-4 h-4 ${calculation ? 'text-cyan-400' : 'text-slate-600'}`} />
                    추가 오차보정하기
                </button>
            </div>

            {/* KEYPAD */}
            {activeField && (
                <div className="fixed bottom-0 left-0 right-0 bg-slate-950 border-t border-slate-800 p-2 z-50 animate-in slide-in-from-bottom duration-200 shadow-[0_-5px_20px_rgba(0,0,0,0.8)]">
                    <div className="px-1 mb-1.5">
                        <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">
                            {activeField === 'lrv' ? 'LRV' : activeField === 'urv' ? 'URV' : activeField === 'curr' ? '현재 지시값' : 'LG 값'}
                        </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 max-w-sm mx-auto">
                        {['1', '2', '3', 'DEL'].map(k => (
                            <button key={k} onClick={() => handleKeypad(k)}
                                className={`aspect-[4/3] rounded-2xl font-black flex items-center justify-center transition-all active:scale-95 shadow-lg ${k === 'DEL' ? 'bg-red-900/60 text-red-400 text-base' : 'bg-slate-800 text-white text-3xl'}`}>
                                {k === 'DEL' ? <Delete className="w-6 h-6" /> : k}
                            </button>
                        ))}
                        {['4', '5', '6', 'CLR'].map(k => (
                            <button key={k} onClick={() => handleKeypad(k)}
                                className={`aspect-[4/3] rounded-2xl font-black flex items-center justify-center transition-all active:scale-95 shadow-lg ${k === 'CLR' ? 'bg-orange-900/60 text-orange-400 text-base' : 'bg-slate-800 text-white text-3xl'}`}>
                                {k}
                            </button>
                        ))}
                        {['7', '8', '9', '.'].map(k => (
                            <button key={k} onClick={() => handleKeypad(k)}
                                className={`aspect-[4/3] rounded-2xl font-black flex items-center justify-center transition-all active:scale-95 shadow-lg ${k === '.' ? 'bg-slate-700 text-blue-300 text-3xl' : 'bg-slate-800 text-white text-3xl'}`}>
                                {k}
                            </button>
                        ))}
                        <button onClick={() => handleKeypad('-')}
                            className="aspect-[4/3] rounded-2xl font-black flex items-center justify-center transition-all active:scale-95 shadow-lg bg-slate-700 text-blue-300 text-4xl">-</button>
                        <button onClick={() => handleKeypad('0')}
                            className="aspect-[4/3] rounded-2xl font-black flex items-center justify-center transition-all active:scale-95 shadow-lg bg-slate-800 text-white text-3xl">0</button>
                        <button onClick={() => setActiveField(null)}
                            className="col-span-2 aspect-[8/3] rounded-2xl font-black flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-lg bg-emerald-700 hover:bg-emerald-600 text-white text-base tracking-wide touch-manipulation">
                            ✓ 입력완료
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
