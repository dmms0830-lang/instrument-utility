import React, { useState } from 'react';
import { Database, Factory, Settings } from 'lucide-react';
import { convertPressure, UNITS } from '../utils/calculations';

// Refactored Data Structure
const TM_DB = {
    "Yokogawa": {
        "models": ["EJA110E", "EJX110A"], "table": [
            { "code": "F", "minVal": 0.5, "maxVal": 5, "unit": "kPa", "note": "저압용" },
            { "code": "M", "minVal": 1, "maxVal": 100, "unit": "kPa", "note": "범용" },
            { "code": "H", "minVal": 5, "maxVal": 500, "unit": "kPa", "note": "고압용" },
            { "code": "V", "minVal": 0.14, "maxVal": 14, "unit": "MPa", "note": "초고압용" }
        ]
    },
    "Emerson": {
        "models": ["3051C", "2051C"], "table": [
            { "code": "Range 1", "minVal": 0.5, "maxVal": 25, "unit": "inchH₂O", "note": "Draft용" },
            { "code": "Range 2", "minVal": 2.5, "maxVal": 250, "unit": "inchH₂O", "note": "표준 유량/레벨" },
            { "code": "Range 3", "minVal": 10, "maxVal": 1000, "unit": "inchH₂O", "note": "고압 유량" },
            { "code": "Range 4", "minVal": 3, "maxVal": 300, "unit": "psi", "note": "일반 압력" },
            { "code": "Range 5", "minVal": 20, "maxVal": 2000, "unit": "psi", "note": "고압 라인" }
        ]
    },
    "Azbil": {
        "models": ["GTX30G", "GTX60G"], "table": [
            { "code": "G1", "minVal": 17.5, "maxVal": 350, "unit": "kPa", "note": "저압 게이지" },
            { "code": "G2", "minVal": 70, "maxVal": 1400, "unit": "kPa", "note": "중압 게이지" },
            { "code": "G3", "minVal": 350, "maxVal": 7000, "unit": "kPa", "note": "고압 게이지" },
            { "code": "G4", "minVal": 700, "maxVal": 14000, "unit": "kPa", "note": "초고압 게이지" }
        ]
    },
    "Honeywell": {
        "models": ["ST800", "ST700"], "table": [
            { "code": "Range 1", "minVal": 1, "maxVal": 10, "unit": "inchH₂O", "note": "미압용" },
            { "code": "Range 2", "minVal": 4, "maxVal": 400, "unit": "inchH₂O", "note": "표준" },
            { "code": "Range 3", "minVal": 1, "maxVal": 100, "unit": "psi", "note": "중압" },
            { "code": "Range 4", "minVal": 30, "maxVal": 3000, "unit": "psi", "note": "고압" }
        ]
    },
    "ABB": {
        "models": ["266DSH", "266GSH"], "table": [
            { "code": "F", "minVal": 0.4, "maxVal": 40, "unit": "kPa", "note": "저압 차압" },
            { "code": "L", "minVal": 2.5, "maxVal": 250, "unit": "kPa", "note": "표준 차압" },
            { "code": "N", "minVal": 20, "maxVal": 2000, "unit": "kPa", "note": "고압 차압" },
            { "code": "R", "minVal": 100, "maxVal": 10000, "unit": "kPa", "note": "초고압" }
        ]
    }
};

export default function TransmitterDatabase() {
    const [maker, setMaker] = useState('Yokogawa');
    const [model, setModel] = useState(TM_DB['Yokogawa'].models[0]);
    const [displayUnit, setDisplayUnit] = useState('Original');

    const currentData = TM_DB[maker];

    const handleMakerChange = (e) => {
        const newMaker = e.target.value;
        setMaker(newMaker);
        setModel(TM_DB[newMaker].models[0]);
    };

    // Helper to calculate and format values
    const formatValue = (value, unit) => {
        let finalValue = value;
        let finalUnit = unit;

        if (displayUnit !== 'Original') {
            finalValue = convertPressure(value, unit, displayUnit);
            finalUnit = displayUnit;
        }

        // Format to 4 decimal places and remove trailing zeros if integer
        const formattedNum = Number(finalValue.toFixed(4)).toString();

        return (
            <span className="font-mono font-bold text-blue-400">
                {formattedNum} <span className="text-slate-500 text-xs font-normal ml-0.5">{finalUnit}</span>
            </span>
        );
    };

    return (
        <div className="space-y-6 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Brand Selection */}
                <div className="bg-card rounded-2xl border border-slate-800 p-4 shadow-xl">
                    <label className="block text-sm text-gray-500 mb-2 flex items-center gap-2">
                        <Factory className="w-4 h-4" /> Brand
                    </label>
                    <select
                        value={maker}
                        onChange={handleMakerChange}
                        className="w-full h-14 bg-black border border-slate-700 rounded-lg px-4 text-lg font-bold focus:border-blue-500 outline-none appearance-none transition-all text-white"
                    >
                        {Object.keys(TM_DB).map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                </div>

                {/* Model Selection */}
                <div className="bg-card rounded-2xl border border-slate-800 p-4 shadow-xl">
                    <label className="block text-sm text-slate-500 mb-2 flex items-center gap-2">
                        <Database className="w-4 h-4" /> Model
                    </label>
                    <select
                        value={model}
                        onChange={e => setModel(e.target.value)}
                        className="w-full h-14 bg-black border border-slate-700 rounded-lg px-4 text-lg font-bold focus:border-blue-500 outline-none appearance-none transition-all text-white"
                    >
                        {currentData.models.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>

                {/* Unit Selection */}
                <div className="bg-card rounded-2xl border border-slate-800 p-4 shadow-xl">
                    <label className="block text-sm text-slate-500 mb-2 flex items-center gap-2">
                        <Settings className="w-4 h-4" /> Display Unit
                    </label>
                    <select
                        value={displayUnit}
                        onChange={e => setDisplayUnit(e.target.value)}
                        className="w-full h-14 bg-black border border-slate-700 rounded-lg px-4 text-lg font-bold focus:border-blue-500 outline-none appearance-none transition-all text-white"
                    >
                        <option value="Original">Maker Original</option>
                        {Object.keys(UNITS).map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                </div>
            </div>

            <div className="bg-card rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
                <div className="px-6 py-4 border-b border-slate-800 bg-black/40 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white tracking-tight">
                        <span className="text-blue-400">{maker}</span> Capsule Data
                    </h3>
                    <span className="text-xs text-slate-500 font-mono border border-slate-800 rounded px-2 py-1">{model} Series</span>
                </div>

                {/* Mobile Card View (< md) */}
                <div className="block md:hidden divide-y divide-gray-800">
                    {currentData.table.map((row, idx) => (
                        <div key={idx} className="p-4 hover:bg-white/5 transition-colors">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-mono font-bold text-blue-300 text-lg">{row.code}</span>
                                <span className="text-xs text-gray-500 border border-gray-700 px-2 py-0.5 rounded-full">{row.note}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <div className="text-gray-500 text-xs mb-1">MIN SPAN</div>
                                    <div className="font-mono text-gray-200">{formatValue(row.minVal, row.unit)}</div>
                                </div>
                                <div>
                                    <div className="text-gray-500 text-xs mb-1">MAX SPAN</div>
                                    <div className="font-mono text-gray-200">{formatValue(row.maxVal, row.unit)}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Desktop Table View (>= md) */}
                <div className="hidden md:block overflow-x-auto pb-2">
                    <table className="w-full text-left border-collapse whitespace-normal">
                        <thead>
                            <tr className="bg-slate-900/80 text-slate-400 text-xs uppercase tracking-wider">
                                <th className="p-4 border-b border-slate-800 w-1/4">Capsule/Range</th>
                                <th className="p-4 border-b border-slate-800 w-1/4">Min Span</th>
                                <th className="p-4 border-b border-slate-800 w-1/4">Max Span</th>
                                <th className="p-4 border-b border-slate-800 w-1/4">Note</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {currentData.table.map((row, idx) => (
                                <tr key={idx} className="hover:bg-white/5 transition-colors group text-sm md:text-base">
                                    <td className="p-4 font-mono font-bold text-blue-300 group-hover:text-blue-200">
                                        {row.code}
                                    </td>
                                    <td className="p-4 font-mono text-slate-300 group-hover:text-white">
                                        {formatValue(row.minVal, row.unit)}
                                    </td>
                                    <td className="p-4 font-mono text-slate-300 group-hover:text-white">
                                        {formatValue(row.maxVal, row.unit)}
                                    </td>
                                    <td className="p-4 text-slate-500 text-xs md:text-sm group-hover:text-slate-400">
                                        {row.note}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

