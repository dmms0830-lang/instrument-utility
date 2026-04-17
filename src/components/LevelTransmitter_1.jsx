import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { AlertTriangle, ArrowRight, Delete, Droplets, RotateCcw, RefreshCw, History, X, Trash2, Save, Check } from 'lucide-react';
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
    const fieldWrapperRefs = useRef({ lrv: null, urv: null, curr: null, target: null });
    const [keypadTop, setKeypadTop] = useState(0);
    const [fixedKeypadTop, setFixedKeypadTop] = useState(0);

    // curr 칸 bottom Y → fixedKeypadTop 1회 측정
    useEffect(() => {
        const measure = () => {
            const el = fieldWrapperRefs.current.curr;
            if (el) setFixedKeypadTop(el.getBoundingClientRect().bottom + 8);
        };
        measure();
        const t = setTimeout(measure, 120);
        return () => clearTimeout(t);
    }, []);

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

    // ─── Cal 이력 (localStorage 기반, 최대 100건) ───
    const HISTORY_KEY = 'ltcal-history-v1';
    const HISTORY_MAX = 100;
    const [history, setHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [saveFlash, setSaveFlash] = useState(false);

    // 초기 로드 + visibilitychange 시 재로드 (다른 탭에서 변경된 이력도 반영)
    useEffect(() => {
        const load = () => {
            try {
                const raw = localStorage.getItem(HISTORY_KEY);
                setHistory(raw ? JSON.parse(raw) : []);
            } catch { setHistory([]); }
        };
        load();
        const onVis = () => { if (document.visibilityState === 'visible') load(); };
        document.addEventListener('visibilitychange', onVis);
        // 1시간마다 자동 리프레시 (다른 탭/기기에서 저장된 이력 반영)
        const refreshInterval = setInterval(load, 60 * 60 * 1000);
        return () => {
            document.removeEventListener('visibilitychange', onVis);
            clearInterval(refreshInterval);
        };
    }, []);

    const saveHistory = useCallback((list) => {
        try { localStorage.setItem(HISTORY_KEY, JSON.stringify(list)); } catch { }
    }, []);

    const addHistoryEntry = useCallback((entry) => {
        setHistory(prev => {
            const next = [entry, ...prev].slice(0, HISTORY_MAX);
            saveHistory(next);
            return next;
        });
    }, [saveHistory]);

    const deleteHistoryEntry = useCallback((id) => {
        setHistory(prev => {
            const next = prev.filter(e => e.id !== id);
            saveHistory(next);
            return next;
        });
    }, [saveHistory]);

    const clearAllHistory = useCallback(() => {
        if (!window.confirm('모든 Cal 이력을 삭제하시겠습니까?')) return;
        setHistory([]);
        saveHistory([]);
    }, [saveHistory]);

    const restoreFromHistory = useCallback((entry) => {
        setLrv(String(entry.newLrv));
        setUrv(String(entry.newUrv));
        setCurrPct(''); setTargetPct('');
        setShowHistory(false);
        if (navigator.vibrate) navigator.vibrate(20);
    }, []);
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
    // 저장 — 이력에만 기록, 입력값은 건드리지 않음
    const handleSave = () => {
        if (!calculation) return;
        if (navigator.vibrate) navigator.vibrate(30);
        addHistoryEntry({
            id: Date.now() + '-' + Math.random().toString(36).slice(2, 8),
            timestamp: Date.now(),
            oldLrv: parseFloat(lrv),
            oldUrv: parseFloat(urv),
            currPct: parseFloat(currPct),
            targetPct: parseFloat(targetPct),
            newLrv: calculation.newLrv,
            newUrv: calculation.newUrv,
            deltaMmH2O: calculation.deltaMmH2O,
        });
        // 짧은 시각 피드백용 토스트 플래그 (간단히 flash)
        setSaveFlash(true);
        setTimeout(() => setSaveFlash(false), 1200);
    };

    // 추가 오차보정 — 보정값만 적용, 이력 저장 없음
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

    // 다른 화면(탭/앱)으로 갔다 돌아올 때 키패드 자동 재오픈 방지
    useEffect(() => {
        const onVisibility = () => {
            if (document.visibilityState === 'hidden') {
                setActiveField(null);
            }
        };
        document.addEventListener('visibilitychange', onVisibility);
        return () => document.removeEventListener('visibilitychange', onVisibility);
    }, []);

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

    const handleInputFocus = (field, e) => {
        setActiveField(field);
        e.target.select();
        // 해당 칸의 화면 bottom Y 계산 → 키패드 top 위치
        const wrapper = fieldWrapperRefs.current[field];
        if (wrapper) {
            const rect = wrapper.getBoundingClientRect();
            setKeypadTop(rect.bottom + 6);
        }
    };
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
    const hasAnyInput = lrv !== '' || urv !== '' || currPct !== '' || targetPct !== '';

    return (
        <div className="flex flex-col gap-2 h-full">
            <ShakeToast visible={shakeToast} countdown={shakeCountdown} />

            {/* TOP CARD */}
            <div className="bg-card rounded-2xl border border-slate-800 shadow-xl flex-shrink-0">
                <div className="px-3 pt-3 pb-2">
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="text-[10px] font-bold text-slate-600 tracking-widest uppercase">Range</span>
                        <div className="flex-1 h-px bg-slate-800" />
                        <span className="text-[10px] text-slate-700 font-mono">mmH₂O</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <div ref={el => fieldWrapperRefs.current.lrv = el}
                            style={{ flex: 1 }}
                            className={`flex flex-col px-3 py-2.5 cursor-pointer transition-all rounded-xl border ${activeField === 'lrv' ? 'bg-blue-950/50 border-blue-600/70 glow-blue' : lrv !== '' ? 'bg-black/70 border-slate-600/50' : 'bg-black/70 border-slate-600/40 border-dashed'}`}
                            onClick={() => inputRefs.current.lrv?.focus()}>
                            <span className={`text-[10px] font-black tracking-widest mb-1 flex items-center gap-1 ${activeField === 'lrv' ? 'text-blue-400' : 'text-slate-600'}`}>
                                LRV
                                {lrv === '' && activeField !== 'lrv' && <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(148,163,184,0.5)', display: 'inline-block', flexShrink: 0 }} />}
                            </span>
                            <input ref={el => inputRefs.current.lrv = el} type="text" inputMode="none"
                                value={lrv} onChange={() => { }} onFocus={e => handleInputFocus('lrv', e)} onSelect={handleSelect}
                                className={`w-full bg-transparent font-mono text-xl font-black outline-none placeholder:text-slate-700 placeholder:text-sm ${activeField === 'lrv' ? 'text-white' : 'text-slate-300'}`}
                                placeholder="—" />
                        </div>
                        <div ref={el => fieldWrapperRefs.current.urv = el}
                            style={{ flex: 1 }}
                            className={`flex flex-col px-3 py-2.5 cursor-pointer transition-all rounded-xl border ${activeField === 'urv' ? 'bg-blue-950/50 border-blue-600/70 glow-blue' : urv !== '' ? 'bg-black/70 border-slate-600/50' : 'bg-black/70 border-slate-600/40 border-dashed'}`}
                            onClick={() => inputRefs.current.urv?.focus()}>
                            <span className={`text-[10px] font-black tracking-widest mb-1 flex items-center gap-1 ${activeField === 'urv' ? 'text-blue-400' : 'text-slate-600'}`}>
                                URV
                                {urv === '' && activeField !== 'urv' && <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(148,163,184,0.5)', display: 'inline-block', flexShrink: 0 }} />}
                            </span>
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
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <div ref={el => fieldWrapperRefs.current.curr = el}
                            style={{ flex: 1 }}
                            className={`flex flex-col px-3 py-2.5 cursor-pointer transition-all rounded-xl border ${activeField === 'curr' ? 'bg-cyan-950/35 border-cyan-600/70 glow-cyan' : currPct !== '' ? 'bg-black/70 border-slate-600/50' : 'bg-black/70 border-slate-600/40 border-dashed'}`}
                            onClick={() => inputRefs.current.curr?.focus()}>
                            <span className={`text-[10px] font-bold tracking-wide mb-1 flex items-center gap-1 ${activeField === 'curr' ? 'text-cyan-400' : 'text-slate-600'}`}>
                                LT값
                                {currPct === '' && activeField !== 'curr' && <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(148,163,184,0.5)', display: 'inline-block', flexShrink: 0 }} />}
                            </span>
                            <input ref={el => inputRefs.current.curr = el} type="text" inputMode="none"
                                value={currPct} onChange={() => { }} onFocus={e => handleInputFocus('curr', e)} onSelect={handleSelect}
                                className="w-full bg-transparent font-mono text-xl font-black text-cyan-400 outline-none placeholder:text-slate-700 placeholder:text-sm"
                                placeholder="—" />
                        </div>
                        <div ref={el => fieldWrapperRefs.current.target = el}
                            style={{ flex: 1 }}
                            className={`flex flex-col px-3 py-2.5 cursor-pointer transition-all rounded-xl border ${activeField === 'target' ? 'bg-green-950/30 border-green-600/70 glow-green' : targetPct !== '' ? 'bg-black/70 border-slate-600/50' : 'bg-black/70 border-slate-600/40 border-dashed'}`}
                            onClick={() => inputRefs.current.target?.focus()}>
                            <span className={`text-[10px] font-bold tracking-wide mb-1 flex items-center gap-1 ${activeField === 'target' ? 'text-green-400' : 'text-slate-600'}`}>
                                LG 값
                                {targetPct === '' && activeField !== 'target' && <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(148,163,184,0.5)', display: 'inline-block', flexShrink: 0 }} />}
                            </span>
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
                        <div className="flex items-baseline justify-center gap-1.5">
                            <span className="font-mono text-2xl font-bold text-white">{calculation ? calculation.newLrv.toFixed(2) : '--'}</span>
                            <span className="text-slate-500 text-[10px]">mmH₂O</span>
                        </div>
                    </div>
                    <div className="flex-1 bg-black/50 p-3 rounded-xl border border-yellow-700/30 text-center">
                        <div className="text-xs text-yellow-500 font-bold mb-1">New URV</div>
                        <div className="flex items-baseline justify-center gap-1.5">
                            <span className="font-mono text-2xl font-bold text-white">{calculation ? calculation.newUrv.toFixed(2) : '--'}</span>
                            <span className="text-slate-500 text-[10px]">mmH₂O</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-1.5 mt-2">
                    {/* 1. 저장 — 이력에 기록만, calculation 있어야 활성 */}
                    <button onClick={handleSave} disabled={!calculation}
                        className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95 touch-manipulation
                            ${saveFlash
                                ? 'bg-emerald-800/70 border border-emerald-400/80 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                                : calculation
                                    ? 'bg-emerald-900/40 border border-emerald-600/60 text-emerald-300 hover:bg-emerald-800/50 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                                    : 'bg-slate-800/30 border border-slate-700/40 text-slate-600 cursor-not-allowed'}`}>
                        {saveFlash
                            ? <Check className="w-4 h-4 text-emerald-300" />
                            : <Save className={`w-4 h-4 ${calculation ? 'text-emerald-400' : 'text-slate-600'}`} />}
                        {saveFlash ? '저장됨' : '저장'}
                    </button>
                    {/* 2. 이력 — 항상 활성 */}
                    <button onClick={() => setShowHistory(true)}
                        className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95 touch-manipulation bg-amber-900/40 border border-amber-600/60 text-amber-300 hover:bg-amber-800/50 shadow-[0_0_12px_rgba(245,158,11,0.15)] relative">
                        <History className="w-4 h-4 text-amber-400" />
                        이력
                        {history.length > 0 && (
                            <span className="absolute top-1 right-1 text-[9px] font-mono bg-amber-500/30 text-amber-200 px-1 py-0 rounded leading-tight">{history.length}</span>
                        )}
                    </button>
                    {/* 3. 초기화 — 아무 필드 하나라도 입력되면 활성화 */}
                    <button onClick={handleResetButtonClick} disabled={!hasAnyInput}
                        className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95 touch-manipulation
                            ${hasAnyInput
                                ? 'bg-red-900/40 border border-red-600/60 text-red-300 hover:bg-red-800/50 shadow-[0_0_12px_rgba(239,68,68,0.15)]'
                                : 'bg-slate-800/30 border border-slate-700/40 text-slate-600 cursor-not-allowed'}`}>
                        <RotateCcw className={`w-4 h-4 ${hasAnyInput ? 'text-red-400' : 'text-slate-600'}`} />
                        초기화
                    </button>
                    {/* 4. 추가보정 — calculation 있어야 활성 */}
                    <button onClick={handleAdditionalCorrection} disabled={!calculation}
                        className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95 touch-manipulation
                            ${calculation
                                ? 'bg-cyan-900/40 border border-cyan-600/60 text-cyan-300 hover:bg-cyan-800/50 shadow-[0_0_12px_rgba(34,211,238,0.15)]'
                                : 'bg-slate-800/30 border border-slate-700/40 text-slate-600 cursor-not-allowed'}`}>
                        <RefreshCw className={`w-4 h-4 ${calculation ? 'text-cyan-400' : 'text-slate-600'}`} />
                        추가보정
                    </button>
                </div>
            </div>

            {/* KEYPAD — 입력칸 바로 아래, 화면 중앙 정렬, 화면 밖 안 나감 */}
            {activeField && (
                <div style={{
                    position: 'fixed',
                    top: fixedKeypadTop,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 'calc(100vw - 24px)',
                    maxWidth: '480px',
                    zIndex: 200,
                    background: '#080f1e',
                    border: '1px solid rgba(100,116,139,0.3)',
                    borderRadius: '20px',
                    padding: '12px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.9)',
                }}>
                    <div className="grid grid-cols-4 gap-2">
                        {['1', '2', '3', 'DEL'].map(k => (
                            <button key={k}
                                onPointerDown={e => { e.preventDefault(); handleKeypad(k); }}
                                className={`aspect-[4/3] rounded-2xl font-black flex items-center justify-center transition-all active:scale-95 shadow-lg ${k === 'DEL' ? 'bg-red-900/60 text-red-400 text-base' : 'bg-slate-800 text-white text-3xl'}`}>
                                {k === 'DEL' ? <Delete className="w-6 h-6" /> : k}
                            </button>
                        ))}
                        {['4', '5', '6', 'CLR'].map(k => (
                            <button key={k}
                                onPointerDown={e => { e.preventDefault(); handleKeypad(k); }}
                                className={`aspect-[4/3] rounded-2xl font-black flex items-center justify-center transition-all active:scale-95 shadow-lg ${k === 'CLR' ? 'bg-orange-900/60 text-orange-400 text-base' : 'bg-slate-800 text-white text-3xl'}`}>
                                {k}
                            </button>
                        ))}
                        {['7', '8', '9', '.'].map(k => (
                            <button key={k}
                                onPointerDown={e => { e.preventDefault(); handleKeypad(k); }}
                                className={`aspect-[4/3] rounded-2xl font-black flex items-center justify-center transition-all active:scale-95 shadow-lg ${k === '.' ? 'bg-slate-700 text-blue-300 text-3xl' : 'bg-slate-800 text-white text-3xl'}`}>
                                {k}
                            </button>
                        ))}
                        <button
                            onPointerDown={e => { e.preventDefault(); handleKeypad('-'); }}
                            className="aspect-[4/3] rounded-2xl font-black flex items-center justify-center transition-all active:scale-95 shadow-lg bg-slate-700 text-blue-300 text-4xl">-</button>
                        <button
                            onPointerDown={e => { e.preventDefault(); handleKeypad('0'); }}
                            className="aspect-[4/3] rounded-2xl font-black flex items-center justify-center transition-all active:scale-95 shadow-lg bg-slate-800 text-white text-3xl">0</button>
                        <button
                            onPointerDown={e => {
                                e.preventDefault();
                                // 현재 focus된 input blur → 커서 제거
                                if (activeField && inputRefs.current[activeField]) {
                                    inputRefs.current[activeField].blur();
                                }
                                // 혹시 다른 element가 focus 잡고 있으면 그것도 해제
                                if (document.activeElement && document.activeElement.blur) {
                                    document.activeElement.blur();
                                }
                                setActiveField(null);
                            }}
                            className="col-span-2 aspect-[8/3] rounded-2xl font-black flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-lg bg-emerald-700 hover:bg-emerald-600 text-white text-base tracking-wide touch-manipulation">
                            ✓ 입력완료
                        </button>
                    </div>
                </div>
            )}

            {/* ─── Cal 이력 모달 ─── */}
            {showHistory && (
                <div
                    onClick={() => setShowHistory(false)}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 10000,
                        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '16px',
                    }}>
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            width: '100%', maxWidth: '520px', maxHeight: '85vh',
                            background: 'linear-gradient(180deg, #0a1420 0%, #050b14 100%)',
                            border: '1px solid rgba(245,158,11,0.4)',
                            borderRadius: '20px',
                            boxShadow: '0 0 40px rgba(245,158,11,0.15)',
                            display: 'flex', flexDirection: 'column',
                            overflow: 'hidden',
                        }}>
                        {/* 헤더 */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-amber-900/40">
                            <div className="flex items-center gap-2">
                                <History className="w-5 h-5 text-amber-400" />
                                <span className="font-bold text-amber-300">LT Cal 이력</span>
                                <span className="text-[10px] font-mono text-slate-500">({history.length}건)</span>
                            </div>
                            <div className="flex items-center gap-1">
                                {history.length > 0 && (
                                    <button onClick={clearAllHistory}
                                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-red-400 hover:bg-red-900/30 transition-all">
                                        <Trash2 className="w-3 h-3" /> 전체삭제
                                    </button>
                                )}
                                <button onClick={() => setShowHistory(false)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800/60 transition-all">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* 리스트 */}
                        <div style={{ overflowY: 'auto', flex: 1 }} className="px-3 py-2">
                            {history.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-slate-600">
                                    <History className="w-10 h-10 mb-3 opacity-40" />
                                    <div className="text-sm">저장된 Cal 이력이 없습니다</div>
                                    <div className="text-[11px] mt-1 text-slate-700">추가 오차보정 시 자동 기록됩니다</div>
                                </div>
                            ) : (
                                history.map((e) => {
                                    const d = new Date(e.timestamp);
                                    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                                    const delta = e.currPct - e.targetPct;
                                    const deltaCol = delta > 0 ? '#ef4444' : delta < 0 ? '#22c55e' : '#94a3b8';
                                    return (
                                        <div key={e.id}
                                            className="mb-2 p-3 rounded-xl bg-black/50 border border-slate-800/60 hover:border-amber-700/50 transition-all">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[11px] font-mono text-slate-400">{dateStr}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-mono font-bold" style={{ color: deltaCol }}>
                                                        {delta > 0 ? '▼' : delta < 0 ? '▲' : ''} {Math.abs(delta).toFixed(1)}%p
                                                    </span>
                                                    <button onClick={() => deleteHistoryEntry(e.id)}
                                                        className="p-1 rounded text-slate-600 hover:text-red-400 hover:bg-red-900/20 transition-all">
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-[11px] mb-2">
                                                <div className="bg-slate-900/50 rounded px-2 py-1">
                                                    <div className="text-slate-600 text-[9px] font-bold">이전 LRV/URV</div>
                                                    <div className="font-mono text-slate-300">{e.oldLrv.toFixed(1)} / {e.oldUrv.toFixed(1)}</div>
                                                </div>
                                                <div className="bg-amber-950/30 rounded px-2 py-1 border border-amber-900/40">
                                                    <div className="text-amber-600 text-[9px] font-bold">신규 LRV/URV</div>
                                                    <div className="font-mono text-amber-200">{e.newLrv.toFixed(1)} / {e.newUrv.toFixed(1)}</div>
                                                </div>
                                                <div className="bg-cyan-950/30 rounded px-2 py-1">
                                                    <div className="text-cyan-600 text-[9px] font-bold">LT (현재)</div>
                                                    <div className="font-mono text-cyan-300">{e.currPct.toFixed(1)}%</div>
                                                </div>
                                                <div className="bg-green-950/30 rounded px-2 py-1">
                                                    <div className="text-green-600 text-[9px] font-bold">LG (목표)</div>
                                                    <div className="font-mono text-green-300">{e.targetPct.toFixed(1)}%</div>
                                                </div>
                                            </div>
                                            <button onClick={() => restoreFromHistory(e)}
                                                className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold bg-amber-900/30 border border-amber-700/40 text-amber-300 hover:bg-amber-800/40 active:scale-95 transition-all">
                                                <RefreshCw className="w-3 h-3" /> 이 값으로 복원
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* 푸터 */}
                        <div className="px-4 py-2 border-t border-amber-900/40 text-[10px] text-slate-600 text-center">
                            최근 {HISTORY_MAX}건까지 저장 · 1시간마다 자동 리프레시 · 이 기기에만 저장됨
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
