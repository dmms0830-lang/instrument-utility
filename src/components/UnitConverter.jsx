import React, { useState } from 'react';
import { UNITS, convertPressure } from '../utils/calculations';
import { ChevronDown } from 'lucide-react';

export default function UnitConverter() {
    const [val, setVal] = useState('1');
    const [baseUnit, setBaseUnit] = useState('atm');
    const [customUnit, setCustomUnit] = useState('MPa');

    // Fixed default display units
    const defaultRows = ['psi', 'bar', 'kg/cm²', 'mmH₂O'];
    const unitList = Object.keys(UNITS);

    const getResult = (targetUnit) => {
        return val && !isNaN(val) ? convertPressure(parseFloat(val), baseUnit, targetUnit) : 0;
    };

    return (
        <div className="space-y-5 h-full flex flex-col">
            {/* INPUT CARD - Unified Input Module */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl border border-slate-800 p-4 shadow-2xl shadow-blue-900/10 flex-shrink-0 relative overflow-hidden">
                {/* Subtle glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-transparent pointer-events-none" />

                {/* Tiny caption */}
                <span className="block text-[10px] text-slate-600 uppercase tracking-widest font-bold mb-2">Input</span>

                {/* Unified Input Group - Input + Dropdown as one module */}
                <div className="flex w-full items-stretch rounded-xl overflow-hidden border border-slate-700 bg-slate-900/50">
                    {/* Number Input - takes remaining space */}
                    <input
                        type="number"
                        value={val}
                        onChange={e => setVal(e.target.value)}
                        className="flex-1 min-w-0 bg-transparent text-center font-mono text-3xl md:text-4xl text-white focus:outline-none placeholder-slate-700 transition-all py-4 px-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="0"
                    />

                    {/* Unit Dropdown - fixed width, attached to input */}
                    <div className="relative flex-shrink-0 border-l border-slate-700 bg-slate-800/80">
                        <select
                            value={baseUnit}
                            onChange={e => setBaseUnit(e.target.value)}
                            className="h-full bg-transparent px-3 pr-8 font-mono text-lg text-blue-300 outline-none focus:bg-slate-800 appearance-none cursor-pointer min-w-[100px] hover:bg-slate-800 transition-colors"
                        >
                            {unitList.map(u => (
                                <option key={u} value={u} className="bg-slate-900">{u}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none w-4 h-4" />
                    </div>
                </div>
            </div>

            {/* RESULTS SECTION */}
            <div className="space-y-3 flex-1 overflow-auto">
                {/* Divider */}
                <div className="flex items-center gap-4 py-1">
                    <div className="h-px bg-slate-800 flex-1" />
                    <span className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">Results</span>
                    <div className="h-px bg-slate-800 flex-1" />
                </div>

                {/* Custom Conversion Row - Unified Module Design */}
                <div className="bg-gradient-to-br from-blue-950/40 to-slate-950 border border-blue-800/40 p-4 rounded-2xl relative overflow-hidden shadow-lg shadow-blue-900/20">
                    {/* Left accent bar */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-blue-600" />

                    {/* Tiny caption */}
                    <span className="block text-[10px] text-blue-500/60 uppercase tracking-widest font-bold mb-2 ml-3">Custom</span>

                    {/* Unified Result + Dropdown Module */}
                    <div className="flex w-full items-stretch rounded-xl overflow-hidden border border-blue-700/50 bg-blue-900/20">
                        {/* Result Value - takes remaining space */}
                        <span className="flex-1 min-w-0 font-mono text-2xl md:text-3xl text-blue-400 font-bold text-center py-3 px-3 drop-shadow-[0_0_12px_rgba(59,130,246,0.4)]">
                            {getResult(customUnit).toFixed(4)}
                        </span>

                        {/* Unit Dropdown - attached to result */}
                        <div className="relative flex-shrink-0 border-l border-blue-700/50 bg-blue-900/40">
                            <select
                                value={customUnit}
                                onChange={e => setCustomUnit(e.target.value)}
                                className="h-full bg-transparent px-3 pr-8 font-mono text-lg text-blue-300 outline-none focus:bg-blue-900/60 appearance-none cursor-pointer min-w-[100px] hover:bg-blue-900/60 transition-colors"
                            >
                                {unitList.map(u => (
                                    <option key={u} value={u} className="bg-slate-900">{u}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500/60 pointer-events-none w-4 h-4" />
                        </div>
                    </div>
                </div>

                {/* Default Fixed Rows */}
                {defaultRows.map(target => {
                    const result = getResult(target);
                    return (
                        <div key={target} className="flex items-center bg-slate-950/80 border border-slate-800/80 p-4 rounded-2xl hover:bg-slate-900/60 transition-all group shadow-md">
                            {/* Left: Unit Label */}
                            <div className="flex items-center gap-3 min-w-[100px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-700 group-hover:bg-emerald-500 transition-colors" />
                                <span className="text-slate-500 font-mono text-base group-hover:text-slate-400 transition-colors">{target}</span>
                            </div>

                            {/* Right: Result Value */}
                            <span className="flex-1 text-right font-mono text-2xl md:text-3xl text-emerald-400 font-bold">
                                {result.toFixed(4)}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="text-right text-[10px] text-slate-700 font-mono mt-auto pt-2 border-t border-slate-800/30">
                High Precision Metrology Engine
            </div>
        </div>
    );
}
