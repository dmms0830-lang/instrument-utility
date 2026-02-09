import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Waves, AlertTriangle, ArrowRight, Delete, X, Droplets, RotateCcw } from 'lucide-react';

export default function LevelTransmitter() {
    // Input States
    const [lrv, setLrv] = useState('0');
    const [urv, setUrv] = useState('100');
    const [currPct, setCurrPct] = useState('');
    const [targetPct, setTargetPct] = useState('');

    // Active Field & Cursor
    const [activeField, setActiveField] = useState(null);
    const [selection, setSelection] = useState({ start: 0, end: 0 });

    // Refs for cursor management
    const inputRefs = useRef({
        lrv: null,
        urv: null,
        curr: null,
        target: null
    });

    // Full Reset Handler
    const handleFullReset = () => {
        if (navigator.vibrate) navigator.vibrate(50);
        setLrv('0');
        setUrv('100');
        setCurrPct('');
        setTargetPct('');
        setActiveField(null);
    };

    // Restore cursor position after render
    useEffect(() => {
        if (activeField && inputRefs.current[activeField]) {
            const input = inputRefs.current[activeField];
            input.focus();
            input.setSelectionRange(selection.start, selection.end);
        }
    }, [lrv, urv, currPct, targetPct, activeField, selection]);

    // Logic
    const calculation = useMemo(() => {
        const l = parseFloat(lrv);
        const u = parseFloat(urv);
        const c = parseFloat(currPct);
        const t = parseFloat(targetPct);

        if (isNaN(l) || isNaN(u) || isNaN(c) || isNaN(t)) return null;

        const span = u - l;
        const inverted = l > u;

        const p = l + span * (c / 100);
        const newL = p - span * (t / 100);
        const newU = newL + span;
        const deltaLevel = (t - c);
        const deltaMmH2O = deltaLevel * span / 100;

        return {
            newLrv: newL,
            newUrv: newU,
            inverted,
            span,
            error: (c - t) * span / 100,
            deltaLevel,
            deltaMmH2O
        };
    }, [lrv, urv, currPct, targetPct]);

    // Input Interaction Handlers
    const handleInputFocus = (field, e) => {
        setActiveField(field);
        e.target.select();
    };

    const handleSelect = (e) => {
        setSelection({
            start: e.target.selectionStart,
            end: e.target.selectionEnd
        });
    };

    // Keypad Input Handler
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

        const start = selection.start;
        const end = selection.end;

        const update = (newVal, newCursor) => {
            setVal(newVal);
            setSelection({ start: newCursor, end: newCursor });
        };

        if (key === 'CLR') {
            update('', 0);
        } else if (key === 'DEL') {
            if (start === end && start > 0) {
                const newVal = val.slice(0, start - 1) + val.slice(start);
                update(newVal, start - 1);
            } else if (start !== end) {
                const newVal = val.slice(0, start) + val.slice(end);
                update(newVal, start);
            }
        } else if (key === '-') {
            if (val.startsWith('-')) {
                const newVal = val.substring(1);
                const newCursor = Math.max(0, start - 1);
                update(newVal, newCursor);
            } else {
                const newVal = '-' + val;
                update(newVal, start + 1);
            }
        } else {
            if (key === '.' && val.includes('.')) return;
            if (val === '0' && key !== '.' && start === 1) {
                update(key, 1);
            } else {
                const newVal = val.slice(0, start) + key + val.slice(end);
                update(newVal, start + 1);
            }
        }
    };

    // Current and Target Y positions for SVG (0% = bottom at 195, 100% = top at 5)
    const currentY = 195 - (Math.min(Math.max(parseFloat(currPct) || 0, 0), 100) / 100 * 190);
    const targetY = 195 - (Math.min(Math.max(parseFloat(targetPct) || 0, 0), 100) / 100 * 190);
    const hasTarget = targetPct !== '' && !isNaN(parseFloat(targetPct));
    const deltaY = Math.abs(currentY - targetY);
    const midY = (currentY + targetY) / 2;

    return (
        <div className="flex flex-col gap-2 h-full">
            {/* ===== TOP CARD: Current Settings - Compact ===== */}
            <div className="bg-card rounded-2xl border border-slate-800 px-3 py-2 shadow-xl flex-shrink-0">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-blue-400">
                        <Waves className="w-5 h-5" />
                        <h2 className="text-base font-bold">현재 설정값</h2>
                    </div>
                    {/* Full Reset Button */}
                    <button
                        onClick={handleFullReset}
                        className="flex items-center gap-1.5 px-3 py-2 bg-red-950/50 border border-red-900/50 text-red-400 rounded-lg text-sm font-bold hover:bg-red-900/40 active:scale-95 transition-all touch-manipulation"
                    >
                        <RotateCcw className="w-4 h-4" />
                        초기화
                    </button>
                </div>

                <div className="flex gap-2">
                    {/* LRV Input */}
                    <div className="flex-1">
                        <label className={`block text-xs mb-1 font-bold transition-colors ${activeField === 'lrv' ? 'text-blue-400' : 'text-slate-500'}`}>
                            현재 LRV
                        </label>
                        <div className="relative">
                            <input
                                ref={el => inputRefs.current.lrv = el}
                                type="text"
                                inputMode="none"
                                value={lrv}
                                onChange={() => { }}
                                onFocus={(e) => handleInputFocus('lrv', e)}
                                onSelect={handleSelect}
                                className={`w-full h-12 bg-black rounded-xl px-2 pr-14 font-mono text-xl font-bold text-center outline-none transition-all text-white ${activeField === 'lrv' ? 'border-2 border-blue-500 ring-2 ring-blue-500/30' : 'border border-slate-700'
                                    }`}
                                placeholder="0"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 font-thin text-xs">mmH₂O</span>
                        </div>
                    </div>

                    {/* URV Input */}
                    <div className="flex-1">
                        <label className={`block text-xs mb-1 font-bold transition-colors ${activeField === 'urv' ? 'text-blue-400' : 'text-slate-500'}`}>
                            현재 URV
                        </label>
                        <div className="relative">
                            <input
                                ref={el => inputRefs.current.urv = el}
                                type="text"
                                inputMode="none"
                                value={urv}
                                onChange={() => { }}
                                onFocus={(e) => handleInputFocus('urv', e)}
                                onSelect={handleSelect}
                                className={`w-full h-12 bg-black rounded-xl px-2 pr-14 font-mono text-xl font-bold text-center outline-none transition-all text-white ${activeField === 'urv' ? 'border-2 border-blue-500 ring-2 ring-blue-500/30' : 'border border-slate-700'
                                    }`}
                                placeholder="100"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 font-thin text-xs">mmH₂O</span>
                        </div>
                    </div>
                </div>

                {/* Inverted Warning */}
                {calculation?.inverted && (
                    <div className="mt-3 flex items-center gap-2 text-orange-400 bg-orange-900/20 border border-orange-900/50 p-2 rounded-lg animate-pulse">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        <span className="text-xs font-bold">H/L 라인 역설치 감지됨</span>
                    </div>
                )}

                {/* Current & Target % */}
                <div className="flex gap-2 mt-3">
                    <div className="flex-1">
                        <label className={`block text-xs mb-1 font-bold transition-colors ${activeField === 'curr' ? 'text-yellow-400' : 'text-slate-500'}`}>
                            현재 지시치
                        </label>
                        <div className="relative">
                            <input
                                ref={el => inputRefs.current.curr = el}
                                type="text"
                                inputMode="none"
                                value={currPct}
                                onChange={() => { }}
                                onFocus={(e) => handleInputFocus('curr', e)}
                                onSelect={handleSelect}
                                className={`w-full h-12 bg-black rounded-xl px-2 pr-8 font-mono text-xl font-bold text-center text-yellow-400 outline-none transition-all ${activeField === 'curr' ? 'border-2 border-yellow-500 ring-2 ring-yellow-500/30' : 'border border-slate-700'
                                    }`}
                                placeholder="입력"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 font-thin text-sm">%</span>
                        </div>
                    </div>
                    <div className="flex-1">
                        <label className={`block text-xs mb-1 font-bold transition-colors ${activeField === 'target' ? 'text-green-400' : 'text-slate-500'}`}>
                            목표 지시치
                        </label>
                        <div className="relative">
                            <input
                                ref={el => inputRefs.current.target = el}
                                type="text"
                                inputMode="none"
                                value={targetPct}
                                onChange={() => { }}
                                onFocus={(e) => handleInputFocus('target', e)}
                                onSelect={handleSelect}
                                className={`w-full h-12 bg-black rounded-xl px-2 pr-8 font-mono text-xl font-bold text-center text-green-400 outline-none transition-all ${activeField === 'target' ? 'border-2 border-green-500 ring-2 ring-green-500/30' : 'border border-slate-700'
                                    }`}
                                placeholder="입력"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 font-thin text-sm">%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ===== MIDDLE CARD: Live Tank View - MAXIMIZED ===== */}
            <div className="bg-card rounded-2xl border border-slate-800 p-2 shadow-2xl flex-1 min-h-[40vh] flex flex-col">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 text-cyan-400">
                        <Droplets className="w-4 h-4" />
                        <span className="text-xs font-bold tracking-wider">LIVE VIEW</span>
                    </div>
                    {/* Legend */}
                    <div className="flex items-center gap-3 text-[10px]">
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded bg-cyan-500/80"></div>
                            <span className="text-slate-400">현재</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded bg-green-500/50 border border-dashed border-green-400"></div>
                            <span className="text-slate-400">목표</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 min-h-[100px] flex gap-2">
                    {/* Left: Tank SVG - Expanded */}
                    <div className="relative flex items-center justify-center w-1/2 min-w-[140px]">
                        {/* LRV/URV Labels */}
                        <div className="absolute left-0 top-2 text-left">
                            <div className="text-slate-500 text-[10px] font-mono">{calculation?.inverted ? 'LRV' : 'URV'}</div>
                            <div className="text-white font-mono font-bold text-sm">{calculation?.inverted ? lrv : urv}</div>
                        </div>
                        <div className="absolute left-0 bottom-2 text-left">
                            <div className="text-slate-500 text-[10px] font-mono">{calculation?.inverted ? 'URV' : 'LRV'}</div>
                            <div className="text-white font-mono font-bold text-sm">{calculation?.inverted ? urv : lrv}</div>
                        </div>

                        {/* Tank SVG - Enlarged */}
                        <svg className="h-full max-h-[320px] w-full max-w-[120px] drop-shadow-2xl ml-8" viewBox="0 0 100 200" preserveAspectRatio="xMidYMid meet">
                            {/* Glass Container */}
                            <rect x="25" y="5" width="50" height="190" rx="6" fill="#1a1a1a" stroke="#333" strokeWidth="2" />

                            {/* Ticks */}
                            <line x1="25" y1="5" x2="15" y2="5" stroke="#555" strokeWidth="1.5" />
                            <line x1="25" y1="100" x2="18" y2="100" stroke="#444" strokeWidth="1" />
                            <line x1="25" y1="195" x2="15" y2="195" stroke="#555" strokeWidth="1.5" />

                            {/* Defs */}
                            <defs>
                                <clipPath id="tankClipLT">
                                    <rect x="27" y="7" width="46" height="186" rx="4" />
                                </clipPath>
                                <linearGradient id="fluidGradientLT" x1="0" x2="0" y1="0" y2="1">
                                    <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.9" />
                                    <stop offset="100%" stopColor="#0077B6" stopOpacity="0.7" />
                                </linearGradient>
                                <linearGradient id="targetGradientLT" x1="0" x2="0" y1="0" y2="1">
                                    <stop offset="0%" stopColor="#22c55e" stopOpacity="0.4" />
                                    <stop offset="100%" stopColor="#16a34a" stopOpacity="0.2" />
                                </linearGradient>
                                <linearGradient id="glassOverlayLT" x1="0" x2="1" y1="0" y2="0">
                                    <stop offset="0%" stopColor="white" stopOpacity="0.15" />
                                    <stop offset="30%" stopColor="white" stopOpacity="0.05" />
                                    <stop offset="70%" stopColor="transparent" stopOpacity="0" />
                                    <stop offset="100%" stopColor="white" stopOpacity="0.1" />
                                </linearGradient>
                            </defs>

                            {/* Target Level (Semi-transparent Green - Behind) */}
                            {hasTarget && (
                                <rect
                                    x="25"
                                    y={targetY}
                                    width="50"
                                    height={195 - targetY}
                                    fill="url(#targetGradientLT)"
                                    clipPath="url(#tankClipLT)"
                                    className="transition-all duration-300 ease-out"
                                />
                            )}

                            {/* Current Fluid Level (Blue - Front) */}
                            <rect
                                x="25"
                                y={currentY}
                                width="50"
                                height={195 - currentY}
                                fill="url(#fluidGradientLT)"
                                clipPath="url(#tankClipLT)"
                                className="transition-all duration-300 ease-out"
                            />

                            {/* Delta Arrow Line */}
                            {hasTarget && deltaY > 10 && (
                                <>
                                    <line
                                        x1="78"
                                        y1={currentY}
                                        x2="78"
                                        y2={targetY}
                                        stroke="#f59e0b"
                                        strokeWidth="2"
                                        markerEnd="url(#arrowhead)"
                                        className="transition-all duration-300"
                                    />
                                    <defs>
                                        <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                                            <polygon points="0 0, 6 3, 0 6" fill="#f59e0b" />
                                        </marker>
                                    </defs>
                                </>
                            )}

                            {/* Target Dotted Line (Green) */}
                            {hasTarget && (
                                <line
                                    x1="20"
                                    y1={targetY}
                                    x2="75"
                                    y2={targetY}
                                    stroke="#22c55e"
                                    strokeWidth="2"
                                    strokeDasharray="4,3"
                                    className="transition-all duration-300"
                                />
                            )}

                            {/* Glass Reflection */}
                            <rect x="25" y="5" width="50" height="190" rx="6" fill="url(#glassOverlayLT)" pointerEvents="none" />
                        </svg>
                    </div>

                    {/* Right: 3-Row Vertical Data Grid - Fluid Typography */}
                    <div className="flex-1 flex flex-col gap-1 min-w-[100px]">
                        {/* Slot 1: 현재 레벨 */}
                        <div className="flex-1 bg-black/60 rounded-xl border border-slate-700 p-2 flex flex-col items-center justify-center overflow-hidden">
                            <span className="text-[10px] text-slate-500 font-bold tracking-wider mb-1">현재 레벨</span>
                            <span className="font-mono font-black text-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.4)] text-[clamp(1.25rem,6vw,2rem)]">
                                {currPct !== '' && !isNaN(parseFloat(currPct)) ? `${parseFloat(currPct).toFixed(1)}%` : '--'}
                            </span>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-slate-800"></div>

                        {/* Slot 2: 목표 레벨 */}
                        <div className="flex-1 bg-black/60 rounded-xl border border-slate-700 p-2 flex flex-col items-center justify-center overflow-hidden">
                            <span className="text-[10px] text-slate-500 font-bold tracking-wider mb-1">목표 레벨</span>
                            <span className="font-mono font-black text-green-400 drop-shadow-[0_0_12px_rgba(34,197,94,0.4)] text-[clamp(1.25rem,6vw,2rem)]">
                                {targetPct !== '' && !isNaN(parseFloat(targetPct)) ? `${parseFloat(targetPct).toFixed(1)}%` : '--'}
                            </span>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-slate-800"></div>

                        {/* Slot 3: 보정값 - Split value and unit for better wrapping */}
                        <div className="flex-1 bg-black/60 rounded-xl border border-slate-700 p-2 flex flex-col items-center justify-center overflow-hidden">
                            <span className="text-[10px] text-slate-500 font-bold tracking-wider mb-1">보정값 (오차)</span>
                            <div className="flex flex-wrap items-baseline justify-center gap-x-1">
                                <span className="font-mono font-black text-orange-400 drop-shadow-[0_0_12px_rgba(251,146,60,0.4)] text-[clamp(1rem,5vw,1.5rem)]">
                                    {calculation ? `${calculation.deltaMmH2O >= 0 ? '+' : ''}${calculation.deltaMmH2O.toFixed(1)}` : '--'}
                                </span>
                                <span className="font-mono text-orange-400/70 text-[0.65em]">mmH₂O</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ===== BOTTOM CARD: Calculation Results - Compact ===== */}
            <div className="bg-yellow-900/10 rounded-2xl border border-yellow-700/50 px-2 py-1.5 shadow-xl flex-shrink-0">
                <div className="flex items-center gap-2 mb-1.5 text-yellow-400">
                    <ArrowRight className="w-4 h-4" />
                    <span className="text-sm font-bold">보정 결과값</span>
                </div>

                <div className="flex gap-2">
                    <div className="flex-1 bg-black/50 p-3 rounded-xl border border-yellow-700/30 text-center">
                        <div className="text-xs text-yellow-500 font-bold mb-1">New LRV</div>
                        <div className="font-mono text-2xl font-bold text-white">
                            {calculation ? calculation.newLrv.toFixed(2) : '--'}
                        </div>
                        <span className="text-slate-500 font-thin text-[10px]">mmH₂O</span>
                    </div>
                    <div className="flex-1 bg-black/50 p-3 rounded-xl border border-yellow-700/30 text-center">
                        <div className="text-xs text-yellow-500 font-bold mb-1">New URV</div>
                        <div className="font-mono text-2xl font-bold text-white">
                            {calculation ? calculation.newUrv.toFixed(2) : '--'}
                        </div>
                        <span className="text-slate-500 font-thin text-[10px]">mmH₂O</span>
                    </div>
                </div>

                {/* Formula Display */}
                <div className="mt-2 p-2 bg-black/30 rounded-xl text-center">
                    <p className="text-[10px] text-slate-500 font-mono">
                        New LRV = {lrv} + ({calculation?.error?.toFixed(2) || '0'}) = {calculation?.newLrv?.toFixed(2) || '--'}
                    </p>
                </div>
            </div>

            {/* ===== FIXED CUSTOM KEYPAD (Uniform Grid) ===== */}
            {activeField && (
                <div className="fixed bottom-0 left-0 right-0 bg-slate-950 border-t border-slate-800 p-2 z-50 animate-in slide-in-from-bottom duration-200 shadow-[0_-5px_20px_rgba(0,0,0,0.8)]">
                    <div className="flex justify-between items-center mb-1.5 px-1">
                        <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">
                            {activeField === 'lrv' ? 'LRV' : activeField === 'urv' ? 'URV' : activeField === 'curr' ? '현재 %' : '목표 %'}
                        </span>
                        <button
                            onClick={() => setActiveField(null)}
                            className="flex items-center gap-1 text-slate-300 px-3 py-1.5 bg-slate-800 rounded-lg hover:bg-slate-700 active:scale-95 transition-all text-sm"
                        >
                            완료 <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Uniform 4x4 Keypad Grid */}
                    <div className="grid grid-cols-4 gap-1.5 max-w-sm mx-auto">
                        {/* Row 1 */}
                        {['1', '2', '3', 'DEL'].map(k => (
                            <button
                                key={k}
                                onClick={() => handleKeypad(k)}
                                className={`aspect-[4/3] rounded-2xl font-black flex items-center justify-center transition-all active:scale-95 shadow-lg ${k === 'DEL'
                                    ? 'bg-red-900/60 text-red-400 text-base'
                                    : 'bg-slate-800 text-white text-3xl'
                                    }`}
                            >
                                {k === 'DEL' ? <Delete className="w-6 h-6" /> : k}
                            </button>
                        ))}
                        {/* Row 2 */}
                        {['4', '5', '6', 'CLR'].map(k => (
                            <button
                                key={k}
                                onClick={() => handleKeypad(k)}
                                className={`aspect-[4/3] rounded-2xl font-black flex items-center justify-center transition-all active:scale-95 shadow-lg ${k === 'CLR'
                                    ? 'bg-orange-900/60 text-orange-400 text-base'
                                    : 'bg-slate-800 text-white text-3xl'
                                    }`}
                            >
                                {k}
                            </button>
                        ))}
                        {/* Row 3 */}
                        {['7', '8', '9', '.'].map(k => (
                            <button
                                key={k}
                                onClick={() => handleKeypad(k)}
                                className={`aspect-[4/3] rounded-2xl font-black flex items-center justify-center transition-all active:scale-95 shadow-lg ${k === '.'
                                    ? 'bg-slate-700 text-blue-300 text-3xl'
                                    : 'bg-slate-800 text-white text-3xl'
                                    }`}
                            >
                                {k}
                            </button>
                        ))}
                        {/* Row 4 */}
                        {['-', '0'].map(k => (
                            <button
                                key={k}
                                onClick={() => handleKeypad(k)}
                                className={`aspect-[4/3] rounded-2xl font-black flex items-center justify-center transition-all active:scale-95 shadow-lg ${k === '-'
                                    ? 'bg-slate-700 text-blue-300 text-4xl'
                                    : 'bg-slate-800 text-white text-3xl'
                                    }`}
                            >
                                {k}
                            </button>
                        ))}
                        <div className="col-span-2"></div>
                    </div>
                </div>
            )}
        </div>
    );
}
