import React, { useState, useMemo, useRef } from 'react';
import { Layers, Plus, Trash2, Camera, Download, AlertCircle } from 'lucide-react';
import html2canvas from 'html2canvas';

// ══════════════════════════════════════════════════════════
// CONSTANTS & CONFIGURATION
// ══════════════════════════════════════════════════════════
const THREAD_SIZES = ['1/8"', '1/4"', '3/8"', '1/2"', '3/4"', '1"', '1-1/4"', '1-1/2"', '2"'];
const TUBE_SIZES = ['1/8"', '1/4"', '3/8"', '1/2"', '3/4"', '1"', '6mm', '8mm', '10mm', '12mm'];
const NIPPLE_TYPES = ['Hex Nipple (Standard)', 'Close Nipple', 'Long (50mm)', 'Long (75mm)', 'Long (100mm)', 'Long (150mm)'];
const MATERIALS = ['SUS316', 'SUS304', 'Carbon Steel', 'Brass'];

// Each fitting type has:
// - label: User-facing name
// - fields: Array of input configs { id, label, options, prefix? }
// - generateDescription: Function to create the standardized string
const FITTING_TYPES = {
    "male_connector": {
        label: "Male Connector",
        fields: [
            { id: 'threadSize', label: 'Thread Size (NPT)', options: THREAD_SIZES },
            { id: 'tubeSize', label: 'Tube Size (OD)', options: TUBE_SIZES },
        ],
        generateDescription: (v) => `${v.tubeSize} Tube OD × ${v.threadSize} NPT Male Connector`
    },
    "female_connector": {
        label: "Female Connector",
        fields: [
            { id: 'threadSize', label: 'Thread Size (NPT)', options: THREAD_SIZES },
            { id: 'tubeSize', label: 'Tube Size (OD)', options: TUBE_SIZES },
        ],
        generateDescription: (v) => `${v.tubeSize} Tube OD × ${v.threadSize} NPT Female Connector`
    },
    "union": {
        label: "Union",
        fields: [
            { id: 'side1', label: 'Side 1 Size', options: THREAD_SIZES },
            { id: 'side2', label: 'Side 2 Size', options: THREAD_SIZES },
        ],
        generateDescription: (v) => {
            return v.side1 === v.side2
                ? `${v.side1} Union`
                : `${v.side1} × ${v.side2} Reducing Union`;
        }
    },
    "elbow": {
        label: "Elbow",
        fields: [
            { id: 'side1', label: 'Side 1 Size', options: THREAD_SIZES },
            { id: 'side2', label: 'Side 2 Size', options: THREAD_SIZES },
        ],
        generateDescription: (v) => {
            return v.side1 === v.side2
                ? `${v.side1} Elbow`
                : `${v.side1} × ${v.side2} Reducing Elbow`;
        }
    },
    "tee": {
        label: "Tee",
        fields: [
            { id: 'side1', label: 'Side 1 Size', options: THREAD_SIZES },
            { id: 'side2', label: 'Side 2 Size', options: THREAD_SIZES },
            { id: 'side3', label: 'Side 3 Size', options: THREAD_SIZES },
        ],
        generateDescription: (v) => {
            if (v.side1 === v.side2 && v.side2 === v.side3) {
                return `${v.side1} Tee`;
            }
            return `${v.side1} × ${v.side2} × ${v.side3} Reducing Tee`;
        }
    },
    "reducer": {
        label: "Reducer / Bushing",
        fields: [
            { id: 'large', label: 'From (Large Side)', options: THREAD_SIZES },
            { id: 'small', label: 'To (Small Side)', options: THREAD_SIZES },
        ],
        generateDescription: (v) => `${v.large} × ${v.small} Reducer Bushing`
    },
    "nipple": {
        label: "Nipple",
        fields: [
            { id: 'type', label: 'Type', options: NIPPLE_TYPES },
            { id: 'side1', label: 'Side 1 Size', options: THREAD_SIZES },
            { id: 'side2', label: 'Side 2 Size', options: THREAD_SIZES },
        ],
        generateDescription: (v) => {
            const sizeStr = v.side1 === v.side2 ? v.side1 : `${v.side1} × ${v.side2}`;
            return `${sizeStr} ${v.type}`;
        }
    },
    "plug": {
        label: "Plug",
        fields: [
            { id: 'size', label: 'Size', options: THREAD_SIZES },
        ],
        generateDescription: (v) => `${v.size} Plug`
    },
    "cap": {
        label: "Cap",
        fields: [
            { id: 'size', label: 'Size', options: THREAD_SIZES },
        ],
        generateDescription: (v) => `${v.size} Cap`
    },
};

const FITTING_KEYS = Object.keys(FITTING_TYPES);

// ══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════
export default function ConnectorStudio() {
    const [selectedType, setSelectedType] = useState('');
    const [fieldValues, setFieldValues] = useState({});
    const [savedList, setSavedList] = useState([]);
    const listRef = useRef(null);

    // Active configuration based on selection
    const activeConfig = useMemo(() => {
        return selectedType ? FITTING_TYPES[selectedType] : null;
    }, [selectedType]);

    // Derived description
    const currentDescription = useMemo(() => {
        if (!activeConfig) return '';
        // Check if all required fields are filled
        const allFilled = activeConfig.fields.every(f => fieldValues[f.id]);
        if (!allFilled) return '';
        return activeConfig.generateDescription(fieldValues);
    }, [activeConfig, fieldValues]);

    // Handlers
    const handleTypeChange = (e) => {
        setSelectedType(e.target.value);
        setFieldValues({}); // Reset fields on type change
    };

    const handleFieldChange = (id, value) => {
        setFieldValues(prev => ({ ...prev, [id]: value }));
    };

    const handleAddToList = () => {
        if (!currentDescription) return;
        const newItem = {
            id: Date.now(),
            type: activeConfig.label,
            description: currentDescription,
            timestamp: new Date().toLocaleTimeString()
        };
        setSavedList(prev => [...prev, newItem]);
        // Optional: vibrate
        if (navigator.vibrate) navigator.vibrate(30);
    };

    const handleRemoveItem = (id) => {
        setSavedList(prev => prev.filter(item => item.id !== id));
    };

    const handleSaveImage = async () => {
        if (!listRef.current || savedList.length === 0) return;
        try {
            const canvas = await html2canvas(listRef.current, {
                backgroundColor: '#0f172a', // slate-900
                scale: 2, // High resolution
            });
            const link = document.createElement('a');
            link.download = `fitting-list-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error('Image save failed', err);
            alert('이미지 저장 중 오류가 발생했습니다.');
        }
    };

    return (
        <div className="flex flex-col gap-4 h-full">
            {/* Header */}
            <div className="flex items-center gap-3 shrink-0">
                <div className="w-10 h-10 bg-lime-500/20 rounded-xl flex items-center justify-center border border-lime-500/30">
                    <Layers className="w-5 h-5 text-lime-400" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-white">피팅 자재 선정</h2>
                    <p className="text-xs text-lime-400/70">Fitting Selector & List Builder</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4">
                {/* ── SECTION 1: SELECTION ── */}
                <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 shadow-xl">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">1. 부품 선택</h3>

                    {/* Type Selector */}
                    <div className="mb-4">
                        <label className="block text-xs text-lime-400 font-bold mb-1 ml-1">부품 종류</label>
                        <select
                            value={selectedType}
                            onChange={handleTypeChange}
                            className="w-full h-12 bg-slate-800 rounded-xl px-3 text-base font-bold text-lime-400 border border-lime-500 focus:ring-2 focus:ring-lime-500/50 outline-none appearance-none"
                            style={{ backgroundImage: 'none' }} // Ensure cross-browser consistency
                        >
                            <option value="" className="text-slate-500">부품을 선택하세요...</option>
                            {FITTING_KEYS.map(key => (
                                <option key={key} value={key} className="bg-slate-800 text-lime-400 py-2">
                                    {FITTING_TYPES[key].label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Dynamic Fields */}
                    {activeConfig && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                            {activeConfig.fields.map(field => (
                                <div key={field.id} className="flex flex-col">
                                    <label className="text-xs text-slate-500 font-bold mb-1 ml-1">{field.label}</label>
                                    <select
                                        value={fieldValues[field.id] || ''}
                                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                        className="w-full h-12 bg-slate-800 rounded-xl px-3 text-base font-bold text-lime-400 border border-lime-500 focus:ring-2 focus:ring-lime-500/50 outline-none appearance-none"
                                    >
                                        <option value="" className="text-slate-500">선택...</option>
                                        {field.options.map(opt => (
                                            <option key={opt} value={opt} className="bg-slate-800 text-lime-400">
                                                {opt}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add to List Button */}
                    <button
                        onClick={handleAddToList}
                        disabled={!currentDescription}
                        className={`w-full mt-4 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${currentDescription
                                ? 'bg-lime-500 text-slate-900 hover:bg-lime-400 shadow-lg shadow-lime-500/20'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                            }`}
                    >
                        <Plus className="w-5 h-5" />
                        {currentDescription ? '리스트에 추가 (Add to List)' : '옵션을 모두 선택하세요'}
                    </button>

                    {/* Live Preview */}
                    {currentDescription && (
                        <div className="mt-3 p-3 bg-slate-950/50 rounded-lg border border-slate-800 text-center">
                            <span className="text-xs text-slate-500 block mb-1">PREVIEW</span>
                            <span className="text-lime-300 font-mono font-bold">{currentDescription}</span>
                        </div>
                    )}
                </div>

                {/* ── SECTION 2: SAVED LIST ── */}
                <div className="flex-1 bg-slate-900/80 rounded-2xl p-4 border border-slate-800 shadow-xl flex flex-col min-h-[200px]">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            2. 자재 목록 <span className="bg-lime-500/20 text-lime-400 px-2 py-0.5 rounded-full text-[10px]">{savedList.length}</span>
                        </h3>
                        {savedList.length > 0 && (
                            <button
                                onClick={handleSaveImage}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-lime-400 text-xs font-bold rounded-lg border border-slate-700 transition-colors"
                            >
                                <Camera className="w-3.5 h-3.5" />
                                <span>이미지 저장</span>
                            </button>
                        )}
                    </div>

                    <div
                        ref={listRef}
                        className="flex-1 flex flex-col gap-2 p-2 bg-slate-900/50 rounded-xl border border-slate-800/50 min-h-[150px]"
                    >
                        {savedList.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-600 opacity-50">
                                <AlertCircle className="w-12 h-12 mb-2" />
                                <p className="text-sm font-bold">리스트가 비어있습니다</p>
                            </div>
                        ) : (
                            savedList.map((item, index) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between bg-slate-800 p-3 rounded-lg border border-slate-700 group hover:border-lime-500/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 flex items-center justify-center bg-slate-900 text-slate-500 text-xs font-bold rounded-full">
                                            {index + 1}
                                        </span>
                                        <div>
                                            <p className="text-xs text-slate-500 font-bold mb-0.5">{item.type}</p>
                                            <p className="text-sm text-white font-mono font-bold leading-tight">{item.description}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveItem(item.id)}
                                        className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        )}
                        {/* Timestamp for screenshot */}
                        {savedList.length > 0 && (
                            <div className="mt-4 pt-2 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-600">
                                <span>Instrument Fitting List</span>
                                <span>{new Date().toLocaleString()}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
