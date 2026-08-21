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

    // Color and Material data mapping
    const tcData = {
        K: { materials: { pos: 'Chromel', neg: 'Alumel' }, ansi: { jacket: '#FFD700', pos: '#FFD700', neg: '#E53935' }, jis: { jacket: '#2563EB', pos: '#E53935', neg: '#F8F9FA' } },
        J: { materials: { pos: 'Iron', neg: 'Constantan' }, ansi: { jacket: '#27272A', pos: '#F8F9FA', neg: '#E53935' }, jis: { jacket: '#FFD700', pos: '#E53935', neg: '#F8F9FA' } },
        E: { materials: { pos: 'Chromel', neg: 'Constantan' }, ansi: { jacket: '#9333EA', pos: '#9333EA', neg: '#E53935' }, jis: { jacket: '#9333EA', pos: '#E53935', neg: '#F8F9FA' } },
        T: { materials: { pos: 'Copper', neg: 'Constantan' }, ansi: { jacket: '#2563EB', pos: '#2563EB', neg: '#E53935' }, jis: { jacket: '#92400E', pos: '#E53935', neg: '#F8F9FA' } },
        S: { materials: { pos: 'Pt-10%Rh', neg: 'Platinum' }, ansi: { jacket: '#16A34A', pos: '#27272A', neg: '#E53935' }, jis: { jacket: '#9CA3AF', pos: '#E53935', neg: '#F8F9FA' } },
        R: { materials: { pos: 'Pt-13%Rh', neg: 'Platinum' }, ansi: { jacket: '#16A34A', pos: '#27272A', neg: '#E53935' }, jis: { jacket: '#27272A', pos: '#E53935', neg: '#F8F9FA' } },
        N: { materials: { pos: 'Nicrosil', neg: 'Nisil' }, ansi: { jacket: '#F97316', pos: '#F97316', neg: '#E53935' }, jis: { jacket: '#FFC0CB', pos: '#FFC0CB', neg: '#F8F9FA' } },
    };

    const getContrastYIQ = (hexcolor) => {
        const hex = hexcolor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return (yiq >= 128) ? '#000000' : '#FFFFFF';
    };

    const RealisticWire = ({ standard, colors, materials }) => {
        const getCylinderStyle = (baseColor) => ({
            backgroundColor: baseColor,
            backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.4) 0%, transparent 40%, rgba(0,0,0,0.3) 80%, rgba(0,0,0,0.7) 100%)',
            boxShadow: 'inset 0px 4px 6px -2px rgba(255,255,255,0.3), inset 0px -4px 6px -2px rgba(0,0,0,0.7)'
        });

        const getMetalColor = (material) => {
            if (material.includes('Copper')) return '#b87333';
            if (material.includes('Iron')) return '#71717a';
            if (material.includes('Pt') || material.includes('Platinum')) return '#e5e7eb';
            if (material.includes('Nicrosil')) return '#c0c8d8';  // Nicrosil: silver-blue metallic
            if (material.includes('Nisil')) return '#b8c4b8';     // Nisil: silver-green metallic
            return '#d1d5db';
        };

        const getMetalStyle = (material) => ({
            backgroundColor: getMetalColor(material),
            backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.8) 10%, transparent 45%, rgba(0,0,0,0.6) 90%)',
            boxShadow: 'inset -2px 0 4px rgba(0,0,0,0.6)'
        });

        return (
            <div className="flex flex-col w-full h-full bg-elev/40 rounded-xl sm:rounded-2xl p-2 sm:p-3 border border-line/50 shadow-inner relative justify-center">
                <div className="absolute top-2 left-2 sm:top-2 sm:left-3 z-20">
                    <span className="text-[9px] sm:text-[10px] md:text-xs text-ink2 font-bold tracking-widest uppercase bg-panel/80 px-2 py-0.5 rounded shadow-sm border border-line">
                        {standard}
                    </span>
                </div>

                <div className="flex w-full min-h-[70px] h-[60%] sm:h-[70%] mt-3 sm:mt-5 items-center relative pl-1 sm:pl-2">
                    {/* Outer Jacket */}
                    <div
                        className="w-[15%] sm:w-[20%] h-[90%] sm:h-full rounded-l-md border-y border-l border-line z-10 relative flex items-center justify-end"
                        style={{ ...getCylinderStyle(colors.jacket), boxShadow: 'inset 0px 4px 6px -2px rgba(255,255,255,0.3), inset 0px -4px 6px -2px rgba(0,0,0,0.7), 4px 0 10px rgba(0,0,0,0.9)' }}
                    >
                    </div>

                    {/* Inner Wires Container */}
                    <div className="flex flex-col flex-1 h-[75%] z-0 relative ml-[-2px] justify-between py-[1%]">
                        {/* Positive Wire */}
                        <div className="flex w-full h-[45%] relative group">
                            {/* Insulation */}
                            <div
                                className="flex-1 rounded-r-sm border-y border-line flex items-center pl-2 sm:pl-4 shadow-[0_2px_5px_rgba(0,0,0,0.6)] z-10 overflow-hidden"
                                style={getCylinderStyle(colors.pos)}
                            >
                                <span className="font-bold font-sans text-[clamp(0.6rem,2.5vw,1rem)] sm:text-xs md:text-sm tracking-wide truncate" style={{ color: getContrastYIQ(colors.pos) }}>
                                    + : {materials.pos}
                                </span>
                            </div>
                            {/* Stripped Metal Tip */}
                            <div
                                className="w-[12%] sm:w-[15%] h-[60%] my-auto rounded-r-full border-y border-r border-line ml-[-1px] z-0 shadow-sm"
                                style={getMetalStyle(materials.pos)}
                            ></div>
                        </div>

                        {/* Negative Wire */}
                        <div className="flex w-full h-[45%] relative group mt-[2%]">
                            {/* Insulation */}
                            <div
                                className="flex-1 rounded-r-sm border-y border-line flex items-center pl-2 sm:pl-4 shadow-[0_2px_5px_rgba(0,0,0,0.6)] z-10 overflow-hidden"
                                style={getCylinderStyle(colors.neg)}
                            >
                                <span className="font-bold font-sans text-[clamp(0.6rem,2.5vw,1rem)] sm:text-xs md:text-sm tracking-wide truncate" style={{ color: getContrastYIQ(colors.neg) }}>
                                    - : {materials.neg}
                                </span>
                            </div>
                            {/* Stripped Metal Tip */}
                            <div
                                className="w-[12%] sm:w-[15%] h-[60%] my-auto rounded-r-full border-y border-r border-line ml-[-1px] z-0 shadow-sm"
                                style={getMetalStyle(materials.neg)}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-2 h-full">
            {/* Type Selector */}
            <div className="grid grid-cols-7 gap-1">
                {['K', 'J', 'E', 'T', 'S', 'R', 'N'].map(t => (
                    <button
                        key={t}
                        onClick={() => setType(t)}
                        className={`py-3 rounded-2xl font-black text-xl transition-all active:scale-[0.98] touch-manipulation flex items-center justify-center ${type === t
                            ? 'bg-blue-fill text-blue-on shadow-lg shadow-shade ring-2 ring-blue-line'
                            : 'bg-elev text-ink2 hover:bg-elev2'
                            }`}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {/* Mode Selector - Segmented Control */}
            <div className="grid grid-cols-2 bg-panel rounded-2xl p-1 border border-line-soft">
                <button
                    onClick={() => setMode('mV2T')}
                    className={`py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.98] touch-manipulation ${mode === 'mV2T'
                        ? 'bg-orange-fill text-orange-on shadow-lg shadow-shade'
                        : 'bg-transparent text-ink2 hover:text-ink'
                        }`}
                >
                    mV → °C
                </button>
                <button
                    onClick={() => setMode('T2mV')}
                    className={`py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.98] touch-manipulation ${mode === 'T2mV'
                        ? 'bg-orange-fill text-orange-on shadow-lg shadow-shade'
                        : 'bg-transparent text-ink2 hover:text-ink'
                        }`}
                >
                    °C → mV
                </button>
            </div>

            {/* Main Card */}
            <div className="bg-card rounded-2xl border border-line-soft p-3 shadow-2xl flex-1 flex flex-col">
                {/* CJC Input - Enlarged */}
                <div className="bg-cyan-soft border border-cyan-line rounded-lg p-3 mb-3">
                    <div className="flex items-center gap-2 mb-2">
                        <Thermometer className="w-4 h-4 text-cyan-ink" />
                        <span className="text-sm text-cyan-ink font-bold">냉접점 보상 (CJC)</span>
                    </div>
                    <div className="relative">
                        <input
                            type="number"
                            step="0.1"
                            value={cjcTemp}
                            onChange={e => setCjcTemp(e.target.value)}
                            onFocus={(e) => handleFocus('cjc', e)}
                            onBlur={() => setActiveField(null)}
                            className={`w-full h-14 bg-field rounded-xl px-4 pr-12 font-mono text-2xl font-bold text-center text-cyan-ink outline-none transition-all ${activeField === 'cjc' ? 'border-2 border-cyan-line' : 'border border-line'
                                }`}
                            placeholder="25.0"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-cyan-ink text-lg font-bold">°C</span>
                    </div>
                </div>

                {/* Input */}
                <div className="mb-2">
                    <label className="block text-[10px] text-ink3 font-bold mb-1 uppercase tracking-wider">
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
                            className={`w-full h-14 bg-field rounded-xl px-3 pr-14 font-mono text-2xl font-bold text-center outline-none transition-all text-ink ${activeField === 'input' ? 'border-2 border-blue-line ring-2 ring-blue-line' : 'border border-line'
                                }`}
                            placeholder="0.000"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-ink2 font-bold text-lg">{inputUnit}</span>
                    </div>
                </div>

                {/* Result Display */}
                <div
                    className="bg-well rounded-2xl border border-line p-3 flex-1 flex flex-col items-center justify-center cursor-pointer hover:border-yellow-line transition-all min-h-[100px] shadow-lg"
                    onClick={copyToClipboard}
                >
                    <span className="text-[10px] text-ink3 font-bold uppercase tracking-wider mb-1">
                        {mode === 'mV2T' ? 'ITS-90 온도' : '열기전력'}
                    </span>
                    <div className="flex items-baseline gap-2">
                        <span className="font-mono text-5xl font-black text-yellow-ink value-glow">
                            {result !== null && !isNaN(result)
                                ? (mode === 'mV2T' ? result.toFixed(1) : result.toFixed(3))
                                : '--.-'}
                        </span>
                        <span className="text-ink3 text-xl font-thin">{outputUnit}</span>
                    </div>
                    {result !== null && !isNaN(result) && (
                        <div className="flex items-center gap-1 mt-1 text-ink4 text-xs">
                            <Copy className="w-3 h-3" />
                            <span>탭하여 복사</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Extended Color Codes & Materials display */}
            <div className="bg-panel rounded-2xl border border-line-soft p-2 sm:p-3 shadow-2xl flex flex-col gap-2 min-h-[220px] sm:min-h-[25vh]">
                <div className="text-xs sm:text-sm text-ink2 font-black text-center uppercase tracking-widest bg-surface/50 py-1.5 rounded-lg flex-shrink-0">
                    Type {type} 보상도선 사양
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1 relative">
                    <RealisticWire standard="ANSI (USA)" colors={tcData[type].ansi} materials={tcData[type].materials} />
                    <RealisticWire standard="JIS (Japan)" colors={tcData[type].jis} materials={tcData[type].materials} />
                </div>
            </div>
        </div>
    );
}
