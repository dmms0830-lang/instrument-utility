import React, { useState } from 'react';
import { UNITS, convertPressure } from '../utils/calculations';
import { ArrowRight } from 'lucide-react';

const LENGTH_UNITS = {
    'm': 1,
    'cm': 100,
    'mm': 1000,
    'km': 0.001,
    'inch': 39.3701,
    'ft': 3.28084,
    'yd': 1.09361,
    'mile': 0.000621371
};

const convertLength = (val, from, to) => {
    if (!LENGTH_UNITS[from] || !LENGTH_UNITS[to]) return 0;
    const valInMeters = val / LENGTH_UNITS[from];
    return valInMeters * LENGTH_UNITS[to];
};

const convertTemp = (val, from, to) => {
    if (from === to) return val;
    let celsius = val;
    if (from === '°F') celsius = (val - 32) * 5 / 9;
    else if (from === 'K') celsius = val - 273.15;

    if (to === '°F') return celsius * 9 / 5 + 32;
    if (to === 'K') return celsius + 273.15;
    return celsius;
};

const TEMP_UNITS = ['°C', '°F', 'K'];

// Common Card Component
const ConversionCard = ({ title, value, onValueChange, fromUnit, onFromUnitChange, toUnit, onToUnitChange, units, result }) => {
    return (
        <div className="bg-slate-900 rounded-2xl p-5 lg:p-6 border border-slate-800 shadow-lg flex flex-col gap-4">
            <h3 className="text-xl font-bold text-slate-100">{title}</h3>

            <div className="flex flex-col items-stretch gap-3">
                {/* Input Group */}
                <div className="flex w-full items-center rounded-xl overflow-hidden border border-slate-700 bg-slate-800 h-12 focus-within:border-lime-500 transition-colors duration-200">
                    <input
                        type="number"
                        value={value}
                        onChange={(e) => onValueChange(e.target.value)}
                        placeholder="0"
                        className="flex-1 w-full bg-transparent text-lg font-mono text-white pl-4 pr-2 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <div className="h-6 w-px bg-slate-700 mx-1" />
                    <select
                        value={fromUnit}
                        onChange={(e) => onFromUnitChange(e.target.value)}
                        className="bg-transparent text-slate-300 font-mono text-lg pr-8 pl-2 outline-none cursor-pointer h-full appearance-none hover:bg-slate-700 transition-colors"
                        style={{ backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2em 1.2em', backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2364748b\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")' }}
                    >
                        {units.map(u => <option key={u} value={u} className="bg-slate-900">{u}</option>)}
                    </select>
                </div>

                {/* Arrow */}
                <div className="text-slate-500 flex-shrink-0 rotate-90 flex items-center justify-center py-1">
                    <ArrowRight className="w-5 h-5" />
                </div>

                {/* Result Group (Slightly brighter bg: bg-slate-700) */}
                <div className="flex w-full items-center rounded-xl overflow-hidden border border-slate-700 bg-slate-700 h-12">
                    <div className="flex-1 text-lg font-mono text-lime-400 pl-4 pr-2 font-bold flex items-center overflow-x-auto whitespace-nowrap scrollbar-hide">
                        {result}
                    </div>
                    <div className="h-6 w-px bg-slate-600 mx-1" />
                    <select
                        value={toUnit}
                        onChange={(e) => onToUnitChange(e.target.value)}
                        className="bg-transparent text-slate-200 font-mono text-lg pr-8 pl-2 outline-none cursor-pointer h-full appearance-none hover:bg-slate-600 transition-colors focus:ring-0"
                        style={{ backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2em 1.2em', backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23cbd5e1\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")' }}
                    >
                        {units.map(u => <option key={u} value={u} className="bg-slate-800">{u}</option>)}
                    </select>
                </div>
            </div>
        </div>
    );
};

export default function UnitConverter() {
    // Pressure State
    const [pVal, setPVal] = useState('1');
    const [pFrom, setPFrom] = useState('atm');
    const [pTo, setPTo] = useState('MPa');

    // Temperature State
    const [tVal, setTVal] = useState('0');
    const [tFrom, setTFrom] = useState('°C');
    const [tTo, setTTo] = useState('°F');

    // Length State
    const [lVal, setLVal] = useState('1');
    const [lFrom, setLFrom] = useState('m');
    const [lTo, setLTo] = useState('cm');

    const pressureUnits = Object.keys(UNITS);
    const lengthUnits = Object.keys(LENGTH_UNITS);
    const formatResult = (raw) => Number(raw.toPrecision(7)).toString();

    const pResult = pVal && !isNaN(pVal) ? formatResult(convertPressure(parseFloat(pVal), pFrom, pTo)) : '0';
    const tResult = tVal && !isNaN(tVal) ? formatResult(convertTemp(parseFloat(tVal), tFrom, tTo)) : '0';
    const lResult = lVal && !isNaN(lVal) ? formatResult(convertLength(parseFloat(lVal), lFrom, lTo)) : '0';

    return (
        <div className="h-full w-full flex flex-col px-4 py-4 min-h-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 w-full overflow-y-auto overflow-x-hidden pb-6 items-stretch flex-1">
                <ConversionCard
                    title="압력 변환"
                    value={pVal}
                    onValueChange={setPVal}
                    fromUnit={pFrom}
                    onFromUnitChange={setPFrom}
                    toUnit={pTo}
                    onToUnitChange={setPTo}
                    units={pressureUnits}
                    result={pResult}
                />

                <ConversionCard
                    title="온도 변환"
                    value={tVal}
                    onValueChange={setTVal}
                    fromUnit={tFrom}
                    onFromUnitChange={setTFrom}
                    toUnit={tTo}
                    onToUnitChange={setTTo}
                    units={TEMP_UNITS}
                    result={tResult}
                />

                <ConversionCard
                    title="길이 변환"
                    value={lVal}
                    onValueChange={setLVal}
                    fromUnit={lFrom}
                    onFromUnitChange={setLFrom}
                    toUnit={lTo}
                    onToUnitChange={setLTo}
                    units={lengthUnits}
                    result={lResult}
                />
            </div>
        </div>
    );
}
