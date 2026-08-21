import React, { useState, useMemo } from 'react';
import { Activity, BarChart3, Cpu, RotateCcw, Copy, Check, Calculator, X } from 'lucide-react';

export default function LoopTest() {
    const [mA, setMA] = useState('12');
    const [pct, setPct] = useState('50');
    const [mode, setMode] = useState('linear');
    const [activeField, setActiveField] = useState(null);

    // Calculator Modal state
    const [calcOpen, setCalcOpen] = useState(false);
    const [calcLrv, setCalcLrv] = useState('');
    const [calcUrv, setCalcUrv] = useState('');
    const [calcTarget, setCalcTarget] = useState('');
    const [calcResult, setCalcResult] = useState(null); // string mA, 'error', or null
    const [isCopied, setIsCopied] = useState(false);

    // Conversion functions
    const maToPct = (maValue, isLinearMode) => {
        const ma = parseFloat(maValue);
        if (isNaN(ma)) return '';
        const normalized = (ma - 4) / 16;
        if (normalized < 0) return '0';
        if (normalized > 1) return '100';
        return isLinearMode ? (normalized * 100).toFixed(2) : (Math.sqrt(normalized) * 100).toFixed(2);
    };

    const pctToMa = (pctValue, isLinearMode) => {
        const p = parseFloat(pctValue);
        if (isNaN(p)) return '';
        const pNorm = Math.max(0, Math.min(100, p)) / 100;
        return isLinearMode ? (4 + pNorm * 16).toFixed(3) : (4 + (pNorm * pNorm) * 16).toFixed(3);
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
        setCalcResult(null);
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

    // ----- Calculator Modal logic -----
    const openCalculator = () => {
        if (navigator.vibrate) navigator.vibrate(20);
        setCalcOpen(true);
    };

    const closeCalculator = () => {
        setCalcOpen(false);
        setIsCopied(false);
    };

    const handleCalculateMa = () => {
        const lrv = parseFloat(calcLrv);
        const urv = parseFloat(calcUrv);
        const target = parseFloat(calcTarget);

        if (isNaN(lrv) || isNaN(urv) || isNaN(target) || (urv - lrv) === 0) {
            setCalcResult('error');
            setTimeout(() => setCalcResult(null), 2000);
            return;
        }

        const p = (target - lrv) / (urv - lrv); // 0 ~ 1
        const ma = mode === 'linear'
            ? (p * 16) + 4
            : (Math.pow(p, 2) * 16) + 4;

        setCalcResult(ma.toFixed(3));
    };

    const handleApplyMa = () => {
        if (!calcResult || calcResult === 'error') return;
        if (navigator.vibrate) navigator.vibrate(40);
        handleMAChange(calcResult);
        setCalcOpen(false);
    };

    const handleCopyMa = () => {
        if (calcResult && calcResult !== 'error') {
            navigator.clipboard.writeText(calcResult);
            if (navigator.vibrate) navigator.vibrate(30);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    const handleResetCalc = () => {
        setCalcLrv('');
        setCalcUrv('');
        setCalcTarget('');
        setCalcResult(null);
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

    // 모드별 액센트 토큰
    const isLinear = mode === 'linear';
    const accentBgSolid = isLinear ? 'bg-blue-fill' : 'bg-purple-fill';
    const accentBgHover = isLinear ? 'hover:bg-blue-fill' : 'hover:bg-purple-fill';
    const accentText = isLinear ? 'text-blue-ink' : 'text-purple-ink';
    const accentTextOn = isLinear ? 'text-blue-on' : 'text-purple-on';
    const accentBorderFocus = isLinear ? 'focus-within:border-blue-line' : 'focus-within:border-purple-line';
    const accentRingFocus = isLinear ? 'focus-within:ring-blue-line' : 'focus-within:ring-purple-line';
    const accentShadow = isLinear ? 'shadow-[0_0_15px_rgba(59,130,246,0.25)]' : 'shadow-[0_0_15px_rgba(168,85,247,0.25)]';
    const accentIconBg = isLinear
        ? 'bg-blue-soft border-blue-line text-blue-ink hover:bg-blue-soft'
        : 'bg-purple-soft border-purple-line text-purple-ink hover:bg-purple-soft';

    return (
        <div className="flex flex-col gap-1.5 h-full relative">
            {/* Mode Selector */}
            <div className="grid grid-cols-2 gap-2">
                <button
                    onClick={() => handleModeChange('linear')}
                    className={`py-2.5 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] touch-manipulation flex items-center justify-center ${mode === 'linear'
                        ? 'bg-blue-fill text-blue-on shadow-lg shadow-shade ring-2 ring-blue-line'
                        : 'bg-elev text-ink2 hover:bg-elev2'
                        }`}
                >
                    <BarChart3 className="w-4 h-4 mr-1.5" />
                    Linear
                </button>
                <button
                    onClick={() => handleModeChange('sqrt')}
                    className={`py-2.5 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] touch-manipulation flex items-center justify-center ${mode === 'sqrt'
                        ? 'bg-purple-fill text-purple-on shadow-lg shadow-shade ring-2 ring-purple-line'
                        : 'bg-elev text-ink2 hover:bg-elev2'
                        }`}
                >
                    <Activity className="w-4 h-4 mr-1.5" />
                    Square Root
                </button>
            </div>

            {/* Input Card: mA / % + 계산기 아이콘 + Quick Buttons */}
            <div className="bg-card rounded-2xl border border-line-soft p-2 shadow-xl">
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
                                className={`w-full h-12 bg-field rounded-xl px-2 pr-9 font-mono text-lg font-bold text-center outline-none transition-all text-ink ${activeField === 'ma' ? 'border-2 border-cyan-line' : 'border border-line'
                                    }`}
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-ink3 text-xs font-bold">mA</span>
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
                                className={`w-full h-12 bg-field rounded-xl px-2 pr-7 font-mono text-lg font-bold text-center text-yellow-ink outline-none transition-all ${activeField === 'pct' ? 'border-2 border-yellow-line' : 'border border-line'
                                    }`}
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-ink3 text-sm font-bold">%</span>
                        </div>
                    </div>
                    {/* 계산기 버튼 */}
                    <button
                        onClick={openCalculator}
                        className={`h-12 w-14 rounded-xl border flex flex-col items-center justify-center transition-all active:scale-95 touch-manipulation ${accentIconBg}`}
                        title="공정값 → mA 계산기"
                    >
                        <Calculator className="w-4 h-4" />
                        <span className="text-[9px] font-bold leading-tight mt-0.5">계산기</span>
                    </button>
                </div>
                {/* Quick Buttons */}
                <div className="grid grid-cols-5 gap-1">
                    {quickButtons.map((val) => (
                        <button
                            key={val}
                            onClick={() => handleQuickSet(val)}
                            className={`py-2 rounded-xl font-bold text-sm transition-all active:scale-95 touch-manipulation ${Math.round(parseFloat(pct)) === val
                                ? mode === 'linear' ? 'bg-blue-fill text-blue-on' : 'bg-purple-fill text-purple-on'
                                : 'bg-elev text-ink2 hover:bg-elev2'
                                }`}
                        >
                            {val}%
                        </button>
                    ))}
                </div>
            </div>

            {/* DCS Faceplate */}
            <div className="bg-card rounded-2xl border border-line-soft p-2 shadow-xl flex-1 min-h-0">
                <div className="flex items-center gap-1 mb-1 text-emerald-ink">
                    <Cpu className="w-3 h-3" />
                    <span className="text-[9px] font-bold tracking-wider uppercase">DCS Faceplate</span>
                </div>

                <div className="grid grid-cols-2 gap-2 h-[calc(100%-20px)]">
                    {/* LEFT: Vertical Gauge */}
                    <div className="relative bg-surface rounded-xl border border-line overflow-hidden shadow-inner">
                        {[0, 25, 50, 75, 100].map((mark) => (
                            <div
                                key={mark}
                                className="absolute left-0 right-0 flex items-center pointer-events-none"
                                style={{ bottom: `${mark}%` }}
                            >
                                <div className="w-3 h-px bg-elev2" />
                                <span className="text-[9px] text-ink3 font-mono ml-1">{mark}</span>
                            </div>
                        ))}

                        <div
                            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-emerald-fill via-emerald-fill to-teal-fill transition-all duration-300 ease-out"
                            style={{ height: `${gaugeHeight}%` }}
                        >
                            <div className="absolute top-0 left-0 right-0 h-1 bg-hover" />
                        </div>

                        <div
                            className="absolute left-0 right-0 h-1 bg-panel shadow-[0_0_12px_rgba(255,255,255,1)] transition-all duration-300 z-10"
                            style={{ bottom: `calc(${gaugeHeight}% - 2px)` }}
                        />

                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="font-mono text-4xl sm:text-5xl font-black text-ink value-halo tracking-tight">
                                {parseFloat(pct).toFixed(0)}
                            </span>
                        </div>
                    </div>

                    {/* RIGHT: Triple Data Block */}
                    <div className="flex flex-col gap-1">
                        <div className="flex-1 bg-well rounded-xl border border-emerald-line flex flex-col items-center justify-center p-1 shadow-lg">
                            <span className="text-[9px] text-ink3 font-bold tracking-wider">PV</span>
                            <span className="font-mono text-3xl sm:text-4xl font-black text-emerald-ink value-glow leading-none">
                                {parseFloat(pct).toFixed(1)}
                            </span>
                            <span className="text-[10px] text-ink4">%</span>
                        </div>

                        <div className="flex-1 bg-well rounded-xl border border-cyan-line flex flex-col items-center justify-center p-1 shadow-lg">
                            <span className="text-[9px] text-ink3 font-bold tracking-wider">SIGNAL</span>
                            <span className="font-mono text-2xl sm:text-3xl font-black text-cyan-ink leading-none">
                                {parseFloat(mA).toFixed(2)}
                            </span>
                            <span className="text-[10px] text-ink4">mA</span>
                        </div>

                        <div className="flex-1 bg-well rounded-xl border border-orange-line flex flex-col items-center justify-center p-1 shadow-lg">
                            <span className="text-[9px] text-ink3 font-bold tracking-wider">TMR</span>
                            <span className="font-mono text-2xl sm:text-3xl font-black text-orange-ink leading-none">
                                {tmrValue}
                            </span>
                            <span className="text-[10px] text-ink4">819-4095</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reset Button */}
            <button
                onClick={handleReset}
                className="py-2.5 bg-red-soft border border-red-line text-red-ink rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all touch-manipulation hover:bg-red-soft"
            >
                <RotateCcw className="w-4 h-4" />
                초기화
            </button>

            {/* ===== Calculator Modal ===== */}
            {calcOpen && (
                <div
                    className="absolute inset-0 z-50 flex items-center justify-center bg-well backdrop-blur-sm rounded-2xl"
                    onClick={closeCalculator}
                >
                    <div
                        className={`w-[92%] max-w-sm bg-panel rounded-2xl border border-line ${accentShadow} p-3 flex flex-col gap-2.5`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <Calculator className={`w-4 h-4 ${accentText}`} />
                                <span className={`text-sm font-black ${accentText}`}>
                                    공정값 → mA 계산기
                                </span>
                                <span className="text-[10px] text-ink3 font-bold ml-1">
                                    [{isLinear ? 'Linear' : 'Square Root'}]
                                </span>
                            </div>
                            <button
                                onClick={closeCalculator}
                                className="p-1 text-ink2 hover:text-ink hover:bg-elev rounded-lg transition-all active:scale-90"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* LRV / URV */}
                        <div className="flex gap-2">
                            <div className={`flex-1 rounded-xl bg-elev border border-line flex flex-col p-2 ${accentBorderFocus} focus-within:ring-1 ${accentRingFocus} transition-all`}>
                                <span className="text-[10px] text-ink2 font-bold px-1 mb-0.5">LRV</span>
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={calcLrv}
                                    onChange={(e) => setCalcLrv(e.target.value)}
                                    className={`w-full bg-transparent ${accentText} text-base font-bold px-1 outline-none placeholder:text-ink4`}
                                />
                            </div>
                            <div className={`flex-1 rounded-xl bg-elev border border-line flex flex-col p-2 ${accentBorderFocus} focus-within:ring-1 ${accentRingFocus} transition-all`}>
                                <span className="text-[10px] text-ink2 font-bold px-1 mb-0.5">URV</span>
                                <input
                                    type="number"
                                    placeholder="100"
                                    value={calcUrv}
                                    onChange={(e) => setCalcUrv(e.target.value)}
                                    className={`w-full bg-transparent ${accentText} text-base font-bold px-1 outline-none placeholder:text-ink4`}
                                />
                            </div>
                        </div>

                        {/* Target */}
                        <div className={`rounded-xl bg-elev border border-line flex flex-col p-2 ${accentBorderFocus} focus-within:ring-1 ${accentRingFocus} transition-all`}>
                            <span className="text-[10px] text-ink2 font-bold px-1 mb-0.5">Target (공정값)</span>
                            <input
                                type="number"
                                placeholder="원하는 공정값 입력"
                                value={calcTarget}
                                onChange={(e) => setCalcTarget(e.target.value)}
                                className={`w-full bg-transparent ${accentText} text-base font-bold px-1 outline-none placeholder:text-ink4`}
                            />
                        </div>

                        {/* Result Display */}
                        <div className="bg-surface rounded-xl border border-line p-3 min-h-[60px] flex items-center justify-center">
                            {calcResult === 'error' ? (
                                <span className="text-red-ink text-sm font-bold">입력값을 확인해주세요</span>
                            ) : calcResult ? (
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-ink3 font-bold tracking-wider">결과</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className={`font-mono text-2xl font-black ${accentText}`}>
                                                {calcResult}
                                            </span>
                                            <span className="text-ink3 text-xs font-bold">mA</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleCopyMa}
                                        className="p-2 text-ink2 hover:text-ink bg-elev hover:bg-elev2 rounded-lg transition-all active:scale-90"
                                        title="복사"
                                    >
                                        {isCopied ? <Check className="w-4 h-4 text-lime-ink" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                            ) : (
                                <span className="text-ink4 text-xs font-bold">[계산] 버튼을 눌러주세요</span>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={handleResetCalc}
                                className="py-2.5 bg-elev hover:bg-elev2 text-ink2 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                초기화
                            </button>
                            <button
                                onClick={handleCalculateMa}
                                className={`py-2.5 ${accentBgSolid} ${accentBgHover} ${accentTextOn} rounded-xl text-sm font-black transition-all active:scale-95`}
                            >
                                계산
                            </button>
                            <button
                                onClick={handleApplyMa}
                                disabled={!calcResult || calcResult === 'error'}
                                className={`py-2.5 rounded-xl text-sm font-black transition-all active:scale-95 ${calcResult && calcResult !== 'error'
                                    ? 'bg-lime-fill hover:bg-lime-fill text-lime-on'
                                    : 'bg-elev text-ink4 cursor-not-allowed'
                                    }`}
                            >
                                적용하기
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
