import React, { useState, useCallback } from 'react';
import { UNITS, convertPressure } from '../utils/calculations';

const LENGTH_UNITS = {
    m: { factor: 1, name: 'Meter' },
    cm: { factor: 100, name: 'Centimeter' },
    mm: { factor: 1000, name: 'Millimeter' },
    km: { factor: 0.001, name: 'Kilometer' },
    inch: { factor: 39.3701, name: 'Inch' },
    ft: { factor: 3.28084, name: 'Feet' },
    yd: { factor: 1.09361, name: 'Yard' },
    mile: { factor: 0.000621371, name: 'Mile' },
};

const PRESSURE_NAMES = {
    atm: 'Atmosphere', Pa: 'Pascal', kPa: 'Kilopascal', MPa: 'Megapascal',
    bar: 'Bar', mbar: 'Millibar', psi: 'Pounds/in²', 'kgf/cm²': 'kgf/cm²',
    mmHg: 'mmHg', torr: 'Torr', inHg: 'Inches Hg', mmH2O: 'mmH₂O', inH2O: 'Inches H₂O',
};

const TEMP_DATA = { '°C': { name: 'Celsius' }, '°F': { name: 'Fahrenheit' }, K: { name: 'Kelvin' } };

const convertLength = (val, from, to) => {
    if (!LENGTH_UNITS[from] || !LENGTH_UNITS[to]) return 0;
    return (val / LENGTH_UNITS[from].factor) * LENGTH_UNITS[to].factor;
};

const convertTemp = (val, from, to) => {
    if (from === to) return val;
    let c = val;
    if (from === '°F') c = (val - 32) * 5 / 9;
    else if (from === 'K') c = val - 273.15;
    if (to === '°F') return c * 9 / 5 + 32;
    if (to === 'K') return c + 273.15;
    return c;
};

const formatResult = (raw) => {
    if (raw === 0) return '0';
    const abs = Math.abs(raw);
    if (abs >= 1e9 || (abs < 1e-4 && abs !== 0)) return raw.toExponential(4);
    return Number(raw.toPrecision(7)).toString();
};

const TABS = [
    { key: 'pressure', label: '압력', icon: '⚙', accent: '#22d3ee', bg: 'rgba(34,211,238,0.06)', border: 'rgba(34,211,238,0.2)' },
    { key: 'temperature', label: '온도', icon: '🌡', accent: '#f97316', bg: 'rgba(249,115,22,0.06)', border: 'rgba(249,115,22,0.2)' },
    { key: 'length', label: '길이', icon: '📐', accent: '#a78bfa', bg: 'rgba(167,139,250,0.06)', border: 'rgba(167,139,250,0.2)' },
];

const SwapIcon = ({ color }) => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 16V4m0 0L3 8m4-4l4 4" /><path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
    </svg>
);

const CopyIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
);

const CheckIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const selectBgImage = (strokeColor) =>
    `url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(strokeColor)}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`;

const ConversionPanel = ({ value, onValueChange, fromUnit, onFromUnitChange, toUnit, onToUnitChange, units, unitNames, result, theme, onSwap }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(result).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1400);
        });
    }, [result]);

    const selectBase = {
        backgroundPosition: 'right 0.5rem center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: '0.8em 0.8em',
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '24px 0 8px' }}>
            {/* Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={{ fontSize: 11, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', paddingLeft: 2 }}>입력값</span>
                <div style={{ display: 'flex', alignItems: 'center', borderRadius: 12, overflow: 'hidden', border: '1.5px solid #1e293b', background: '#0a0f1a', height: 48 }}>
                    <input
                        type="number" inputMode="decimal" value={value}
                        onChange={e => onValueChange(e.target.value)}
                        onFocus={e => e.target.select()}
                        placeholder="0"
                        className="flex-1 w-full bg-transparent text-lg font-mono text-white pl-4 pr-2 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        style={{ caretColor: theme.accent }}
                    />
                    <div style={{ width: 1, height: 24, background: '#1e293b', margin: '0 4px' }} />
                    <select value={fromUnit} onChange={e => onFromUnitChange(e.target.value)}
                        className="bg-transparent text-slate-400 font-mono text-sm pr-7 pl-2 outline-none cursor-pointer h-full appearance-none hover:text-white transition-colors"
                        style={{ ...selectBase, backgroundImage: selectBgImage('#64748b') }}>
                        {units.map(u => <option key={u} value={u} className="bg-slate-900">{u} — {unitNames[u]}</option>)}
                    </select>
                </div>
                <span className="text-[11px] text-slate-700 font-medium pl-0.5">{unitNames[fromUnit]}</span>
            </div>

            {/* Swap */}
            <div className="flex justify-center">
                <button onClick={onSwap} title="단위 교환" aria-label="단위 교환"
                    className="p-2 rounded-full cursor-pointer transition-transform active:scale-90"
                    style={{ border: `1px solid ${theme.border}`, background: theme.bg, color: theme.accent }}>
                    <SwapIcon color={theme.accent} />
                </button>
            </div>

            {/* Result */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={{ fontSize: 11, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', paddingLeft: 2 }}>결과</span>
                <div style={{ display: 'flex', alignItems: 'center', borderRadius: 12, overflow: 'hidden', border: `1.5px solid ${theme.border}`, background: theme.bg, height: 48 }}>
                    <div className="flex-1 text-lg font-mono font-bold pl-4 pr-2 flex items-center overflow-x-auto whitespace-nowrap"
                        style={{ color: theme.accent }}>
                        {result}
                    </div>
                    <div style={{ width: 1, height: 24, background: theme.border, margin: '0 4px' }} />
                    <select value={toUnit} onChange={e => onToUnitChange(e.target.value)}
                        className="bg-transparent text-slate-300 font-mono text-sm pr-7 pl-2 outline-none cursor-pointer h-full appearance-none hover:text-white transition-colors"
                        style={{ ...selectBase, backgroundImage: selectBgImage('#94a3b8') }}>
                        {units.map(u => <option key={u} value={u} className="bg-slate-900">{u} — {unitNames[u]}</option>)}
                    </select>
                </div>
                <div className="flex items-center justify-between px-0.5">
                    <span className="text-[11px] text-slate-700 font-medium">{unitNames[toUnit]}</span>
                    <button onClick={handleCopy}
                        className="flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-md cursor-pointer transition-all font-medium border-none"
                        style={{
                            color: copied ? '#4ade80' : '#475569',
                            background: copied ? 'rgba(74,222,128,0.12)' : 'transparent',
                        }}>
                        {copied ? <><CheckIcon /> 복사됨</> : <><CopyIcon /> 복사</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function UnitConverter() {
    const [activeTab, setActiveTab] = useState('pressure');

    const [pVal, setPVal] = useState('1');
    const [pFrom, setPFrom] = useState('atm');
    const [pTo, setPTo] = useState('MPa');
    const [tVal, setTVal] = useState('0');
    const [tFrom, setTFrom] = useState('°C');
    const [tTo, setTTo] = useState('°F');
    const [lVal, setLVal] = useState('1');
    const [lFrom, setLFrom] = useState('m');
    const [lTo, setLTo] = useState('cm');

    const pressureUnits = Object.keys(UNITS);
    const lengthUnits = Object.keys(LENGTH_UNITS);
    const tempUnits = Object.keys(TEMP_DATA);

    const pressureNames = Object.fromEntries(pressureUnits.map(k => [k, PRESSURE_NAMES[k] || k]));
    const lengthNames = Object.fromEntries(lengthUnits.map(k => [k, LENGTH_UNITS[k].name]));
    const tempNames = Object.fromEntries(tempUnits.map(k => [k, TEMP_DATA[k].name]));

    const pResult = pVal && !isNaN(pVal) ? formatResult(convertPressure(parseFloat(pVal), pFrom, pTo)) : '0';
    const tResult = tVal && !isNaN(tVal) ? formatResult(convertTemp(parseFloat(tVal), tFrom, tTo)) : '0';
    const lResult = lVal && !isNaN(lVal) ? formatResult(convertLength(parseFloat(lVal), lFrom, lTo)) : '0';

    const currentTab = TABS.find(t => t.key === activeTab);

    return (
        <div className="h-full w-full flex flex-col items-center px-4 py-5 min-h-0">
            <div className="w-full max-w-md flex flex-col">

                {/* Tab Bar */}
                <div className="flex gap-1.5 rounded-xl p-1 bg-slate-950 border border-slate-800">
                    {TABS.map(tab => {
                        const isActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg cursor-pointer transition-all duration-200"
                                style={{
                                    border: isActive ? `1px solid ${tab.border}` : '1px solid transparent',
                                    background: isActive ? tab.bg : 'transparent',
                                    color: isActive ? tab.accent : '#64748b',
                                    fontSize: 14,
                                    fontWeight: isActive ? 700 : 500,
                                }}
                            >
                                <span style={{ fontSize: 14 }}>{tab.icon}</span>
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Panel */}
                <div className="mt-3 rounded-2xl px-5 pb-4"
                    style={{
                        background: 'linear-gradient(145deg, #0c1221 0%, #131c30 100%)',
                        border: `1px solid ${currentTab.border}`,
                    }}>
                    {activeTab === 'pressure' && (
                        <ConversionPanel value={pVal} onValueChange={setPVal}
                            fromUnit={pFrom} onFromUnitChange={setPFrom} toUnit={pTo} onToUnitChange={setPTo}
                            units={pressureUnits} unitNames={pressureNames} result={pResult}
                            theme={currentTab} onSwap={() => { setPFrom(pTo); setPTo(pFrom); }} />
                    )}
                    {activeTab === 'temperature' && (
                        <ConversionPanel value={tVal} onValueChange={setTVal}
                            fromUnit={tFrom} onFromUnitChange={setTFrom} toUnit={tTo} onToUnitChange={setTTo}
                            units={tempUnits} unitNames={tempNames} result={tResult}
                            theme={currentTab} onSwap={() => { setTFrom(tTo); setTTo(tFrom); }} />
                    )}
                    {activeTab === 'length' && (
                        <ConversionPanel value={lVal} onValueChange={setLVal}
                            fromUnit={lFrom} onFromUnitChange={setLFrom} toUnit={lTo} onToUnitChange={setLTo}
                            units={lengthUnits} unitNames={lengthNames} result={lResult}
                            theme={currentTab} onSwap={() => { setLFrom(lTo); setLTo(lFrom); }} />
                    )}
                </div>
            </div>
        </div>
    );
}
