import React, { useState } from 'react';
import { rtdTempFromRes, rtdResFromTemp } from '../utils/calculations';
import { Copy, Check, AlertTriangle } from 'lucide-react';

export default function RTDCalc() {
    const [mode, setMode] = useState('R2T');
    const [inputValue, setInputValue] = useState('');
    const [wireType, setWireType] = useState('4');
    const [leadOffset, setLeadOffset] = useState('0');
    const [activeField, setActiveField] = useState(null);

    const val = parseFloat(inputValue);
    const offset = parseFloat(leadOffset) || 0;
    const effectiveOffset = wireType === '2' ? offset : 0;

    let result = null;
    if (inputValue !== '' && !isNaN(val)) {
        result = mode === 'R2T'
            ? rtdTempFromRes(val - effectiveOffset)
            : rtdResFromTemp(val) + effectiveOffset;
    }

    const copyToClipboard = () => {
        if (result !== null && !isNaN(result)) {
            navigator.clipboard.writeText(result.toFixed(2));
            if (navigator.vibrate) navigator.vibrate(30);
        }
    };

    const handleFocus = (field, e) => {
        setActiveField(field);
        e.target.select();
    };

    const inputUnit = mode === 'R2T' ? 'Ω' : '°C';
    const outputUnit = mode === 'R2T' ? '°C' : 'Ω';

    return (
        <div className="flex flex-col gap-2 h-full">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-blue-400">Pt100</span>
                    <span className="text-xs text-slate-500 font-mono">IEC 60751</span>
                </div>
            </div>

            {/* Wire Type Selector - Horizontal Buttons */}
            <div className="grid grid-cols-3 gap-2">
                {['2', '3', '4'].map(w => (
                    <button
                        key={w}
                        onClick={() => setWireType(w)}
                        className={`py-3 rounded-2xl font-bold text-lg transition-all active:scale-[0.98] touch-manipulation flex items-center justify-center gap-2 ${wireType === w
                            ? w === '2'
                                ? 'bg-yellow-600 text-white shadow-lg ring-2 ring-yellow-400'
                                : 'bg-green-600 text-white shadow-lg ring-2 ring-green-400'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        {wireType === w && (w === '2' ? <AlertTriangle className="w-4 h-4" /> : <Check className="w-4 h-4" />)}
                        {w}선식
                    </button>
                ))}
            </div>

            {/* 2-Wire Lead Offset (only when 2-wire selected) */}
            {wireType === '2' && (
                <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-2xl p-3 shadow-lg">
                    <label className="block text-sm text-yellow-400 font-bold mb-2">
                        리드선 저항 보상
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            step="0.01"
                            value={leadOffset}
                            onChange={e => setLeadOffset(e.target.value)}
                            onFocus={(e) => handleFocus('lead', e)}
                            onBlur={() => setActiveField(null)}
                            className={`w-full h-12 bg-black rounded-xl px-3 pr-10 font-mono text-xl font-bold text-center text-yellow-400 outline-none transition-all ${activeField === 'lead' ? 'border-2 border-yellow-500' : 'border border-slate-700'
                                }`}
                            placeholder="0.00"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-yellow-500 text-sm font-bold">Ω</span>
                    </div>
                </div>
            )}

            {/* Mode Selector - Segmented Control */}
            <div className="grid grid-cols-2 bg-slate-900 rounded-2xl p-1 border border-slate-800">
                <button
                    onClick={() => setMode('R2T')}
                    className={`py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.98] touch-manipulation ${mode === 'R2T'
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50'
                        : 'bg-transparent text-slate-400 hover:text-white'
                        }`}
                >
                    Ω → °C
                </button>
                <button
                    onClick={() => setMode('T2R')}
                    className={`py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.98] touch-manipulation ${mode === 'T2R'
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50'
                        : 'bg-transparent text-slate-400 hover:text-white'
                        }`}
                >
                    °C → Ω
                </button>
            </div>

            {/* Main Card */}
            <div className="bg-card rounded-2xl border border-slate-800 p-3 shadow-2xl flex-1 flex flex-col">
                {/* Input */}
                <div className="mb-2">
                    <label className="block text-[10px] text-slate-500 font-bold mb-1 uppercase tracking-wider">
                        {mode === 'R2T' ? '저항값 입력' : '온도 입력'}
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            step="0.01"
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            onFocus={(e) => handleFocus('input', e)}
                            onBlur={() => setActiveField(null)}
                            className={`w-full h-14 bg-black rounded-xl px-3 pr-12 font-mono text-2xl font-bold text-center outline-none transition-all text-white ${activeField === 'input' ? 'border-2 border-blue-500 ring-2 ring-blue-500/30' : 'border border-slate-700'
                                }`}
                            placeholder={mode === 'R2T' ? '100.00' : '0.00'}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">{inputUnit}</span>
                    </div>
                </div>

                {/* Result Display */}
                <div
                    className="bg-black/80 rounded-2xl border border-slate-700 p-3 flex-1 flex flex-col items-center justify-center cursor-pointer hover:border-green-600/50 transition-all relative overflow-hidden min-h-[120px] shadow-lg"
                    onClick={copyToClipboard}
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-green-950/20 to-transparent pointer-events-none" />

                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 relative z-10">
                        {mode === 'R2T' ? '온도 (IEC 60751)' : '저항값'}
                    </span>

                    <div className="flex items-baseline gap-2 relative z-10">
                        <span className="font-mono text-5xl font-black text-green-400 drop-shadow-[0_0_20px_rgba(34,197,94,0.5)]">
                            {result !== null && !isNaN(result)
                                ? result.toFixed(2)
                                : (isNaN(result) ? 'ERR' : '--.-')}
                        </span>
                        <span className="text-slate-500 text-xl font-thin">{outputUnit}</span>
                    </div>

                    {result !== null && !isNaN(result) && (
                        <div className="flex items-center gap-1 mt-1 text-slate-600 text-xs relative z-10">
                            <Copy className="w-3 h-3" />
                            <span>탭하여 복사</span>
                        </div>
                    )}

                    {wireType === '2' && effectiveOffset !== 0 && (
                        <div className="absolute bottom-2 left-2 text-[9px] text-yellow-600 font-mono z-10">
                            보정: {effectiveOffset > 0 ? '-' : '+'}{Math.abs(effectiveOffset).toFixed(2)}Ω
                        </div>
                    )}
                </div>

                {/* Wire info footer */}
                <div className="mt-2 flex items-center justify-center gap-2 text-[10px] text-slate-600">
                    {wireType === '2' ? (
                        <>
                            <AlertTriangle className="w-3 h-3 text-yellow-600" />
                            <span className="text-yellow-600">2선식: 수동 보정 필요</span>
                        </>
                    ) : (
                        <>
                            <Check className="w-3 h-3 text-green-600" />
                            <span className="text-green-600">{wireType}선식: 자동 상쇄</span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
