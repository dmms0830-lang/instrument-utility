import React, { useState, useMemo } from 'react';
import { Activity, Zap, BarChart3, Cpu, RotateCcw, Copy, Check } from 'lucide-react';

export default function LoopTest() {
    const [mA, setMA] = useState('12');
    const [pct, setPct] = useState('50');
    const [mode, setMode] = useState('linear');
    const [activeField, setActiveField] = useState(null);

    // Flow MA Calculator state
    const [flowLrv, setFlowLrv] = useState('');
    const [flowUrv, setFlowUrv] = useState('');
    const [targetFlow, setTargetFlow] = useState('');
    const [calculatedMa, setCalculatedMa] = useState(null);
    const [isCopied, setIsCopied] = useState(false);

    const handleCalculateMa = () => {
        const lrv = parseFloat(flowLrv);
        const urv = parseFloat(flowUrv);
        const target = parseFloat(targetFlow);

        if (isNaN(lrv) || isNaN(urv) || isNaN(target) || (urv - lrv) === 0) {
            setCalculatedMa('error');
            setTimeout(() => setCalculatedMa(null), 2000);
            return;
        }

        const p = (target - lrv) / (urv - lrv);
        const ma = (Math.pow(p, 2) * 16) + 4;
        setCalculatedMa(ma.toFixed(2));
    };

    const handleCopyMa = () => {
        if (calculatedMa && calculatedMa !== 'error') {
            navigator.clipboard.writeText(calculatedMa);
            if (navigator.vibrate) navigator.vibrate(30);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    // Conversion functions
    const maToPct = (maValue, isLinear) => {
        const ma = parseFloat(maValue);
        if (isNaN(ma)) return '';
        const normalized = (ma - 4) / 16;
        if (normalized < 0) return '0';
        if (normalized > 1) return '100';
        return isLinear ? (normalized * 100).toFixed(2) : (Math.sqrt(normalized) * 100).toFixed(2);
    };

    const pctToMa = (pctValue, isLinear) => {
        const p = parseFloat(pctValue);
        if (isNaN(p)) return '';
        const pNorm = Math.max(0, Math.min(100, p)) / 100;
        return isLinear ? (4 + pNorm * 16).toFixed(3) : (4 + (pNorm * pNorm) * 16).toFixed(3);
    };

    const handleMAChange = (value) => {
        setMA(value);
        const newPct = maToPct(value, mode === 'linear');
        if (newPct !== '') setPct(newPct);
    };

    const handlePctChange = (value) => {
        setPct(value);
        const newMA = pctToMa(value, mode === 'linear');
        if (newMA !== '') setMA(newMA);
    };

    const handleModeChange = (newMode) => {
        setMode(newMode);
        const newPct = maToPct(mA, newMode === 'linear');
        if (newPct !== '') setPct(newPct);
    };

    const handleQuickSet = (value) => {
        if (navigator.vibrate) navigator.vibrate(30);
        handlePctChange(value.toString());
    };

    const handleReset = () => {
        if (navigator.vibrate) navigator.vibrate(50);
        setMA('4.000');
        setPct('0');
    };

    const tmrValue = useMemo(() => {
        const p = parseFloat(pct);
        if (isNaN(p)) return '--';
        return Math.round(819 + (Math.max(0, Math.min(100, p)) * 32.76));
    }, [pct]);

    const gaugeHeight = useMemo(() => {
        const p = parseFloat(pct);
        return isNaN(p) ? 0 : Math.max(0, Math.min(100, p));
    }, [pct]);

    const handleFocus = (field, e) => {
        setActiveField(field);
        e.target.select();
    };

    const quickButtons = [0, 25, 50, 75, 100];

    return (
        <div className="flex flex-col gap-1.5 h-full">
            {/* Mode Selector - Compact */}
            <div className="grid grid-cols-2 gap-2">
                <button
                    onClick={() => handleModeChange('linear')}
                    className={`py-2.5 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] touch-manipulation flex items-center justify-center ${mode === 'linear'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50 ring-2 ring-blue-400'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                >
                    <BarChart3 className="w-4 h-4 mr-1.5" />
                    Linear
                </button>
                <button
                    onClick={() => handleModeChange('sqrt')}
                    className={`py-2.5 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] touch-manipulation flex items-center justify-center ${mode === 'sqrt'
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50 ring-2 ring-purple-400'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                >
                    <Activity className="w-4 h-4 mr-1.5" />
                    Square Root
                </button>
            </div>

            {/* 유량 기반 mA 역계산 (Square Root 모드일 때만 표시) */}
            {mode === 'sqrt' && (
                <div className="bg-card rounded-2xl border border-slate-800 p-3 shadow-xl flex flex-col gap-2">
                    {/* 첫 번째 줄: Qm_Min / Qm_Max / Qm_Target — 3등분 */}
                    <div className="grid grid-cols-3 gap-2">
                        <div className="rounded-xl bg-slate-800 border border-slate-700 flex flex-col p-1.5 focus-within:border-lime-500 focus-within:ring-1 focus-within:ring-lime-500/50 transition-all">
                            <span className="text-[10px] text-slate-400 font-bold px-1 mb-0.5">Qm_Min</span>
                            <input
                                type="number"
                                placeholder="0"
                                value={flowLrv}
                                onChange={(e) => setFlowLrv(e.target.value)}
                                className="w-full bg-transparent text-lime-400 text-sm font-bold px-1 outline-none placeholder:text-slate-600"
                            />
                        </div>
                        <div className="rounded-xl bg-slate-800 border border-slate-700 flex flex-col p-1.5 focus-within:border-lime-500 focus-within:ring-1 focus-within:ring-lime-500/50 transition-all">
                            <span className="text-[10px] text-slate-400 font-bold px-1 mb-0.5">Qm_Max</span>
                            <input
                                type="number"
                                placeholder="100"
                                value={flowUrv}
                                onChange={(e) => setFlowUrv(e.target.value)}
                                className="w-full bg-transparent text-lime-400 text-sm font-bold px-1 outline-none placeholder:text-slate-600"
                            />
                        </div>
                        <div className="rounded-xl bg-slate-800 border border-slate-700 flex flex-col p-1.5 focus-within:border-lime-500 focus-within:ring-1 focus-within:ring-lime-500/50 transition-all">
                            <span className="text-[10px] text-slate-400 font-bold px-1 mb-0.5">Qm_Target</span>
                            <input
                                type="number"
                                placeholder="Flow"
                                value={targetFlow}
                                onChange={(e) => setTargetFlow(e.target.value)}
                                className="w-full bg-transparent text-lime-400 text-sm font-bold px-1 outline-none placeholder:text-slate-600"
                            />
                        </div>
                    </div>

                    {/* 두 번째 줄: 계산 버튼 (전체 너비) */}
                    <button
                        onClick={handleCalculateMa}
                        className="w-full bg-lime-500 text-slate-950 rounded-xl py-3 text-[14px] font-black active:scale-[0.98] hover:scale-[1.01] transition-all hover:bg-lime-400 shadow-[0_0_15px_rgba(132,204,22,0.2)] flex items-center justify-center gap-2"
                    >
                        <span>⚡</span>
                        <span>계산</span>
                        <span className="text-[11px] font-bold opacity-60">→ mA 역산</span>
                    </button>

                    {/* 세 번째 줄: 결과값 (전체 너비) */}
                    <div className="w-full bg-slate-800 rounded-xl border border-slate-700 min-h-[44px] flex items-center justify-center relative overflow-hidden">
                        {calculatedMa === 'error' ? (
                            <span className="text-red-400 text-[11px] font-bold">⚠ 입력값 오류 — Min/Max/Target 확인</span>
                        ) : calculatedMa ? (
                            <div className="flex items-center justify-between w-full px-3">
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-[10px] text-slate-500 font-bold">결과값</span>
                                    <span className="text-lime-400 text-xl font-black tracking-tight">{calculatedMa}</span>
                                    <span className="text-slate-400 text-xs font-bold">mA</span>
                                </div>
                                <button
                                    onClick={handleCopyMa}
                                    className="p-1.5 text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-all active:scale-90 flex-shrink-0"
                                    title="복사하기"
                                >
                                    {isCopied ? <Check className="w-3.5 h-3.5 text-lime-400" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                            </div>
                        ) : (
                            <span className="text-slate-600 text-[11px] font-bold">결과값 mA</span>
                        )}
                    </div>
                </div>
            )}

            {/* Input + Quick Buttons */}
            <div className="bg-card rounded-2xl border border-slate-800 p-2 shadow-xl">
                <div className="flex gap-2 mb-2">
                    {/* mA Input */}
                    <div className="flex-1">
                        <div className="relative">
                            <input
                                type="number"
                                step="0.001"
                                value={mA}
                                onChange={(e) => handleMAChange(e.target.value)}
                                onFocus={(e) => handleFocus('ma', e)}
                                onBlur={() => setActiveField(null)}
                                className={`w-full h-10 bg-black rounded-xl px-2 pr-9 font-mono text-lg font-bold text-center outline-none transition-all text-white ${activeField === 'ma' ? 'border-2 border-cyan-500' : 'border border-slate-700'
                                    }`}
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">mA</span>
                        </div>
                    </div>
                    {/* % Input */}
                    <div className="flex-1">
                        <div className="relative">
                            <input
                                type="number"
                                step="0.01"
                                value={pct}
                                onChange={(e) => handlePctChange(e.target.value)}
                                onFocus={(e) => handleFocus('pct', e)}
                                onBlur={() => setActiveField(null)}
                                className={`w-full h-10 bg-black rounded-xl px-2 pr-7 font-mono text-lg font-bold text-center text-yellow-400 outline-none transition-all ${activeField === 'pct' ? 'border-2 border-yellow-500' : 'border border-slate-700'
                                    }`}
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-bold">%</span>
                        </div>
                    </div>
                </div>
                {/* Quick Buttons */}
                <div className="grid grid-cols-5 gap-1">
                    {quickButtons.map((val) => (
                        <button
                            key={val}
                            onClick={() => handleQuickSet(val)}
                            className={`py-2 rounded-xl font-bold text-sm transition-all active:scale-95 touch-manipulation ${Math.round(parseFloat(pct)) === val
                                ? mode === 'linear' ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                }`}
                        >
                            {val}%
                        </button>
                    ))}
                </div>
            </div>

            {/* DCS Faceplate - 50:50 Split Layout */}
            <div className="bg-card rounded-2xl border border-slate-800 p-2 shadow-xl flex-1 min-h-0">
                <div className="flex items-center gap-1 mb-1 text-emerald-400">
                    <Cpu className="w-3 h-3" />
                    <span className="text-[9px] font-bold tracking-wider uppercase">DCS Faceplate</span>
                </div>

                <div className="grid grid-cols-2 gap-2 h-[calc(100%-20px)]">
                    {/* LEFT: Large Vertical Gauge */}
                    <div className="relative bg-slate-950 rounded-xl border border-slate-700 overflow-hidden shadow-inner">
                        {/* Scale Lines & Labels */}
                        {[0, 25, 50, 75, 100].map((mark) => (
                            <div
                                key={mark}
                                className="absolute left-0 right-0 flex items-center pointer-events-none"
                                style={{ bottom: `${mark}%` }}
                            >
                                <div className="w-3 h-px bg-slate-600" />
                                <span className="text-[9px] text-slate-500 font-mono ml-1">{mark}</span>
                            </div>
                        ))}

                        {/* Gauge Fill */}
                        <div
                            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-emerald-600 via-emerald-500 to-teal-400 transition-all duration-300 ease-out"
                            style={{ height: `${gaugeHeight}%` }}
                        >
                            <div className="absolute top-0 left-0 right-0 h-1 bg-white/40" />
                        </div>

                        {/* Level Indicator */}
                        <div
                            className="absolute left-0 right-0 h-1 bg-white shadow-[0_0_12px_rgba(255,255,255,1)] transition-all duration-300 z-10"
                            style={{ bottom: `calc(${gaugeHeight}% - 2px)` }}
                        />

                        {/* Large Center Value */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="font-mono text-4xl sm:text-5xl font-black text-white drop-shadow-[0_0_15px_rgba(0,0,0,0.9)] tracking-tight">
                                {parseFloat(pct).toFixed(0)}
                            </span>
                        </div>
                    </div>

                    {/* RIGHT: Triple Data Block */}
                    <div className="flex flex-col gap-1">
                        {/* PV (%) */}
                        <div className="flex-1 bg-black/60 rounded-xl border border-emerald-900/50 flex flex-col items-center justify-center p-1 shadow-lg">
                            <span className="text-[9px] text-slate-500 font-bold tracking-wider">PV</span>
                            <span className="font-mono text-3xl sm:text-4xl font-black text-emerald-400 drop-shadow-[0_0_10px_rgba(34,197,94,0.6)] leading-none">
                                {parseFloat(pct).toFixed(1)}
                            </span>
                            <span className="text-[10px] text-slate-600">%</span>
                        </div>

                        {/* Signal (mA) */}
                        <div className="flex-1 bg-black/60 rounded-xl border border-cyan-900/50 flex flex-col items-center justify-center p-1 shadow-lg">
                            <span className="text-[9px] text-slate-500 font-bold tracking-wider">SIGNAL</span>
                            <span className="font-mono text-2xl sm:text-3xl font-black text-cyan-400 leading-none">
                                {parseFloat(mA).toFixed(2)}
                            </span>
                            <span className="text-[10px] text-slate-600">mA</span>
                        </div>

                        {/* TMR (Raw) */}
                        <div className="flex-1 bg-black/60 rounded-xl border border-orange-900/50 flex flex-col items-center justify-center p-1 shadow-lg">
                            <span className="text-[9px] text-slate-500 font-bold tracking-wider">TMR</span>
                            <span className="font-mono text-2xl sm:text-3xl font-black text-orange-400 leading-none">
                                {tmrValue}
                            </span>
                            <span className="text-[10px] text-slate-600">819-4095</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reset Button - Compact */}
            <button
                onClick={handleReset}
                className="py-2.5 bg-red-950/40 border border-red-900/40 text-red-400 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all touch-manipulation hover:bg-red-900/60"
            >
                <RotateCcw className="w-4 h-4" />
                초기화
            </button>
        </div>
    );
}
