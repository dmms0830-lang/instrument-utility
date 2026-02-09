import React, { useState } from 'react';
import { calculateThermocoupleTemp, calculateThermocoupleMV } from '../utils/calculations';
import { Copy, Thermometer } from 'lucide-react';

export default function ThermocoupleCalc() {
    const [type, setType] = useState('K');
    const [mode, setMode] = useState('mV2T');
    const [inputValue, setInputValue] = useState('');
    const [cjcTemp, setCjcTemp] = useState('0');
    const [activeField, setActiveField] = useState(null);

    const val = parseFloat(inputValue);
    const cjc = parseFloat(cjcTemp) || 0;

    let result = null;
    if (inputValue !== '' && !isNaN(val)) {
        result = mode === 'mV2T'
            ? calculateThermocoupleTemp(type, val, cjc)
            : calculateThermocoupleMV(type, val, cjc);
    }

    const copyToClipboard = () => {
        if (result !== null && !isNaN(result)) {
            navigator.clipboard.writeText(result.toFixed(3));
            if (navigator.vibrate) navigator.vibrate(30);
        }
    };

    const handleFocus = (field, e) => {
        setActiveField(field);
        e.target.select();
    };

    const inputUnit = mode === 'mV2T' ? 'mV' : '°C';
    const outputUnit = mode === 'mV2T' ? '°C' : 'mV';

    // Color codes
    const colorCodes = {
        K: { ansi: { jacket: 'bg-yellow-400', pos: 'bg-yellow-400', neg: 'bg-red-600' }, jis: { jacket: 'bg-blue-600', pos: 'bg-red-600', neg: 'bg-white' } },
        J: { ansi: { jacket: 'bg-black', pos: 'bg-white', neg: 'bg-red-600' }, jis: { jacket: 'bg-yellow-400', pos: 'bg-red-600', neg: 'bg-white' } },
        E: { ansi: { jacket: 'bg-purple-600', pos: 'bg-purple-600', neg: 'bg-red-600' }, jis: { jacket: 'bg-purple-600', pos: 'bg-red-600', neg: 'bg-white' } },
        T: { ansi: { jacket: 'bg-blue-600', pos: 'bg-blue-600', neg: 'bg-red-600' }, jis: { jacket: 'bg-amber-700', pos: 'bg-red-600', neg: 'bg-white' } },
        S: { ansi: { jacket: 'bg-green-600', pos: 'bg-black', neg: 'bg-red-600' }, jis: { jacket: 'bg-gray-400', pos: 'bg-red-600', neg: 'bg-white' } },
        R: { ansi: { jacket: 'bg-green-600', pos: 'bg-black', neg: 'bg-red-600' }, jis: { jacket: 'bg-black', pos: 'bg-red-600', neg: 'bg-white' } },
    };

    const CableIcon = ({ jacket, pos, neg }) => (
        <div className={`w-16 h-8 ${jacket} rounded-full flex items-center justify-center gap-2 shadow border border-white/30`}>
            <div className={`w-3 h-3 rounded-full ${pos} ring-1 ring-black/30`} />
            <div className={`w-3 h-3 rounded-full ${neg} ring-1 ring-black/30`} />
        </div>
    );

    return (
        <div className="flex flex-col gap-2 h-full">
            {/* Type Selector */}
            <div className="grid grid-cols-6 gap-1">
                {['K', 'J', 'E', 'T', 'S', 'R'].map(t => (
                    <button
                        key={t}
                        onClick={() => setType(t)}
                        className={`py-3 rounded-2xl font-black text-xl transition-all active:scale-[0.98] touch-manipulation flex items-center justify-center ${type === t
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50 ring-2 ring-blue-400'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {/* Mode Selector - Segmented Control */}
            <div className="grid grid-cols-2 bg-slate-900 rounded-2xl p-1 border border-slate-800">
                <button
                    onClick={() => setMode('mV2T')}
                    className={`py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.98] touch-manipulation ${mode === 'mV2T'
                        ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/50'
                        : 'bg-transparent text-slate-400 hover:text-white'
                        }`}
                >
                    mV → °C
                </button>
                <button
                    onClick={() => setMode('T2mV')}
                    className={`py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.98] touch-manipulation ${mode === 'T2mV'
                        ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/50'
                        : 'bg-transparent text-slate-400 hover:text-white'
                        }`}
                >
                    °C → mV
                </button>
            </div>

            {/* Main Card */}
            <div className="bg-card rounded-2xl border border-slate-800 p-3 shadow-2xl flex-1 flex flex-col">
                {/* CJC Input - Enlarged */}
                <div className="bg-cyan-900/30 border border-cyan-800/50 rounded-lg p-3 mb-3">
                    <div className="flex items-center gap-2 mb-2">
                        <Thermometer className="w-4 h-4 text-cyan-400" />
                        <span className="text-sm text-cyan-400 font-bold">냉접점 보상 (CJC)</span>
                    </div>
                    <div className="relative">
                        <input
                            type="number"
                            step="0.1"
                            value={cjcTemp}
                            onChange={e => setCjcTemp(e.target.value)}
                            onFocus={(e) => handleFocus('cjc', e)}
                            onBlur={() => setActiveField(null)}
                            className={`w-full h-14 bg-black rounded-xl px-4 pr-12 font-mono text-2xl font-bold text-center text-cyan-400 outline-none transition-all ${activeField === 'cjc' ? 'border-2 border-cyan-500' : 'border border-slate-700'
                                }`}
                            placeholder="25.0"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-cyan-500 text-lg font-bold">°C</span>
                    </div>
                </div>

                {/* Input */}
                <div className="mb-2">
                    <label className="block text-[10px] text-slate-500 font-bold mb-1 uppercase tracking-wider">
                        {mode === 'mV2T' ? '열기전력 입력' : '온도 입력'}
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            step="0.001"
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            onFocus={(e) => handleFocus('input', e)}
                            onBlur={() => setActiveField(null)}
                            className={`w-full h-14 bg-black rounded-xl px-3 pr-14 font-mono text-2xl font-bold text-center outline-none transition-all text-white ${activeField === 'input' ? 'border-2 border-blue-500 ring-2 ring-blue-500/30' : 'border border-slate-700'
                                }`}
                            placeholder="0.000"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">{inputUnit}</span>
                    </div>
                </div>

                {/* Result Display */}
                <div
                    className="bg-black/80 rounded-2xl border border-slate-700 p-3 flex-1 flex flex-col items-center justify-center cursor-pointer hover:border-yellow-600/50 transition-all min-h-[100px] shadow-lg"
                    onClick={copyToClipboard}
                >
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                        {mode === 'mV2T' ? 'ITS-90 온도' : '열기전력'}
                    </span>
                    <div className="flex items-baseline gap-2">
                        <span className="font-mono text-5xl font-black text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.4)]">
                            {result !== null && !isNaN(result)
                                ? (mode === 'mV2T' ? result.toFixed(1) : result.toFixed(3))
                                : '--.-'}
                        </span>
                        <span className="text-slate-500 text-xl font-thin">{outputUnit}</span>
                    </div>
                    {result !== null && !isNaN(result) && (
                        <div className="flex items-center gap-1 mt-1 text-slate-600 text-xs">
                            <Copy className="w-3 h-3" />
                            <span>탭하여 복사</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Color Codes - Always Visible 2 Column */}
            <div className="bg-card rounded-2xl border border-slate-800 p-3 shadow-2xl">
                <div className="text-[10px] text-slate-500 font-bold mb-2 text-center uppercase tracking-wider">
                    Type {type} 보상도선 컬러 코드
                </div>
                <div className="grid grid-cols-2 gap-3">
                    {/* ANSI */}
                    <div className="text-center">
                        <div className="text-xs text-slate-400 mb-2 font-bold">ANSI (USA)</div>
                        <div className="flex justify-center mb-1">
                            <CableIcon {...(colorCodes[type]?.ansi || colorCodes.K.ansi)} />
                        </div>
                        <div className="text-[9px] text-slate-600">Red = (−)</div>
                    </div>
                    {/* JIS */}
                    <div className="text-center">
                        <div className="text-xs text-slate-400 mb-2 font-bold">JIS (Japan)</div>
                        <div className="flex justify-center mb-1">
                            <CableIcon {...(colorCodes[type]?.jis || colorCodes.K.jis)} />
                        </div>
                        <div className="text-[9px] text-slate-600">Red = (+), White = (−)</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
