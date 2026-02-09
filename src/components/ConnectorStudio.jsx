import React, { useState, useRef } from 'react';
import { Layers, Plus, Trash2, Package, Download } from 'lucide-react';
import html2canvas from 'html2canvas';

const CONNECTOR_TYPES = [
    { id: 'male', label: 'Male Connector' },
    { id: 'female', label: 'Female Connector' },
    { id: 'union_tee', label: 'Union Tee' },
];

const SIZES_NPT = ['1/8"', '1/4"', '3/8"', '1/2"', '3/4"', '1"'];
const SIZES_TUBE = ['1/8"', '1/4"', '3/8"', '1/2"', '3/4"', '1"'];

export default function ConnectorStudio() {
    const [connectorType, setConnectorType] = useState('male');
    const [sideA, setSideA] = useState('1/4"');
    const [sideB, setSideB] = useState('1/4"');
    const [assemblyList, setAssemblyList] = useState([]);
    const [isSaving, setIsSaving] = useState(false);

    // Ref for the assembly list container
    const assemblyListRef = useRef(null);

    const handleAdd = () => {
        if (navigator.vibrate) navigator.vibrate(30);
        const typeLabel = CONNECTOR_TYPES.find(t => t.id === connectorType)?.label || connectorType;
        const isUnionTee = connectorType === 'union_tee';

        const newItem = {
            id: Date.now(),
            type: typeLabel,
            // Union Tee uses sideB for all three ports (same size)
            sideA: isUnionTee ? sideB : sideA,
            sideB: sideB,
            isUnionTee: isUnionTee,
        };
        setAssemblyList(prev => [...prev, newItem]);
    };

    const handleRemove = (id) => {
        if (navigator.vibrate) navigator.vibrate(30);
        setAssemblyList(prev => prev.filter(item => item.id !== id));
    };

    const handleClearAll = () => {
        if (navigator.vibrate) navigator.vibrate(50);
        setAssemblyList([]);
    };

    // Color mapping for oklch to hex conversion
    const colorMap = {
        'bg-card': '#0f172a',
        'slate-950': '#020617',
        'slate-900': '#0f172a',
        'slate-800': '#1e293b',
        'slate-700': '#334155',
        'slate-600': '#475569',
        'slate-500': '#64748b',
        'slate-400': '#94a3b8',
        'blue-600': '#2563eb',
        'blue-400': '#60a5fa',
        'cyan-400': '#22d3ee',
        'green-400': '#4ade80',
        'green-600': '#16a34a',
        'red-400': '#f87171',
        'red-900': '#7f1d1d',
    };

    // Image save function - High-Contrast Table Capture
    const handleSaveImage = async () => {
        if (assemblyList.length === 0) {
            alert('저장할 항목이 없습니다');
            return;
        }

        setIsSaving(true);
        if (navigator.vibrate) navigator.vibrate(30);

        console.log('Starting high-contrast table capture...');

        try {
            // 1. Create hidden capture container - WHITE BACKGROUND for printing
            const captureContainer = document.createElement('div');
            captureContainer.id = 'capture-template';
            captureContainer.style.cssText = `
                position: fixed;
                left: -9999px;
                top: 0;
                width: 600px;
                padding: 24px;
                background-color: #ffffff;
                font-family: 'Malgun Gothic', 'Segoe UI', system-ui, sans-serif;
                color: #000000;
            `;

            // 2. Create header with Korean title
            const header = document.createElement('div');
            header.style.cssText = `
                text-align: center;
                margin-bottom: 20px;
                padding-bottom: 16px;
                border-bottom: 2px solid #000000;
            `;
            header.innerHTML = `
                <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: bold; color: #000000;">
                    자재 청구 리스트
                </h1>
                <p style="margin: 0; font-size: 14px; color: #666666;">
                    HD HYUNDAI OILBANK | ${new Date().toLocaleDateString('ko-KR')}
                </p>
            `;
            captureContainer.appendChild(header);

            // 3. Create table
            const table = document.createElement('table');
            table.style.cssText = `
                width: 100%;
                border-collapse: collapse;
                font-size: 14px;
            `;

            // 4. Create table header
            const thead = document.createElement('thead');
            thead.innerHTML = `
                <tr style="background-color: #f0f0f0;">
                    <th style="padding: 12px 8px; text-align: center; border: 1px solid #000000; color: #000000; font-weight: bold; width: 50px;">
                        No
                    </th>
                    <th style="padding: 12px 8px; text-align: left; border: 1px solid #000000; color: #000000; font-weight: bold;">
                        종류
                    </th>
                    <th style="padding: 12px 8px; text-align: center; border: 1px solid #000000; color: #000000; font-weight: bold;">
                        상세 규격
                    </th>
                </tr>
            `;
            table.appendChild(thead);

            // 5. Create table body with data
            const tbody = document.createElement('tbody');
            assemblyList.forEach((item, index) => {
                const row = document.createElement('tr');
                row.style.cssText = index % 2 === 0
                    ? 'background-color: #ffffff;'
                    : 'background-color: #f8f8f8;';

                // Format spec based on type
                const specText = item.isUnionTee
                    ? `${item.sideB} (TUBE)`
                    : `${item.sideA} (NPT) × ${item.sideB} (TUBE)`;

                row.innerHTML = `
                    <td style="padding: 10px 8px; text-align: center; border: 1px solid #000000; color: #000000; font-weight: bold;">
                        ${index + 1}
                    </td>
                    <td style="padding: 10px 8px; text-align: left; border: 1px solid #000000; color: #000000;">
                        ${item.type}
                    </td>
                    <td style="padding: 10px 8px; text-align: center; border: 1px solid #000000; color: #000000; font-family: monospace;">
                        ${specText}
                    </td>
                `;
                tbody.appendChild(row);
            });
            table.appendChild(tbody);
            captureContainer.appendChild(table);

            // 6. Add footer
            const footer = document.createElement('div');
            footer.style.cssText = `
                margin-top: 16px;
                padding-top: 12px;
                border-top: 1px solid #cccccc;
                text-align: right;
                font-size: 12px;
                color: #666666;
            `;
            footer.textContent = `총 ${assemblyList.length}개 항목`;
            captureContainer.appendChild(footer);

            // 7. Append to body temporarily
            document.body.appendChild(captureContainer);

            // 8. Wait for render
            await new Promise(r => setTimeout(r, 100));

            // 9. Capture with html2canvas (simple white table - no oklch!)
            const canvas = await html2canvas(captureContainer, {
                backgroundColor: '#ffffff',
                scale: 2,
                useCORS: true,
                logging: false,
            });

            // 10. Remove capture container
            document.body.removeChild(captureContainer);

            // 11. Download image
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `Connector_Assembly_${new Date().toISOString().split('T')[0]}.png`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            console.log('High-contrast table capture successful!', canvas.width, 'x', canvas.height);

        } catch (error) {
            console.error('Capture error:', error);
            alert('이미지 저장에 실패했습니다.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col gap-3 h-full">
            {/* Header */}
            <div className="flex items-center gap-2 text-blue-400">
                <Layers className="w-5 h-5" />
                <h2 className="text-lg font-bold">Connector Studio</h2>
            </div>

            {/* Input Section */}
            <div className="bg-card rounded-2xl border border-slate-800 p-4 shadow-xl">
                <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-3">
                    커넥터 설정
                </div>

                {/* Dropdowns Grid */}
                <div className="grid grid-cols-1 gap-3 mb-4">
                    {/* Type */}
                    <div>
                        <label className="block text-xs text-slate-400 font-bold mb-1">종류 (Type)</label>
                        <select
                            value={connectorType}
                            onChange={e => setConnectorType(e.target.value)}
                            className="w-full h-12 bg-black rounded-xl px-3 font-mono text-base font-bold text-white border border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 outline-none transition-all appearance-none cursor-pointer"
                        >
                            {CONNECTOR_TYPES.map(type => (
                                <option key={type.id} value={type.id}>{type.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Size Dropdowns - Conditional for Union Tee */}
                    {connectorType === 'union_tee' ? (
                        // Union Tee: Single dropdown (all three ports same size)
                        <div>
                            <label className="block text-xs text-slate-400 font-bold mb-1">튜빙 규격 (3방향 동일)</label>
                            <select
                                value={sideB}
                                onChange={e => setSideB(e.target.value)}
                                className="w-full h-12 bg-black rounded-xl px-3 font-mono text-base font-bold text-green-400 border border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 outline-none transition-all appearance-none cursor-pointer"
                            >
                                {SIZES_TUBE.map(size => (
                                    <option key={size} value={size}>{size}</option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        // Male/Female Connector: Two dropdowns
                        <div className="grid grid-cols-2 gap-3">
                            {/* Side A - NPT */}
                            <div>
                                <label className="block text-xs text-slate-400 font-bold mb-1">규격 1 (NPT)</label>
                                <select
                                    value={sideA}
                                    onChange={e => setSideA(e.target.value)}
                                    className="w-full h-12 bg-black rounded-xl px-3 font-mono text-base font-bold text-cyan-400 border border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 outline-none transition-all appearance-none cursor-pointer"
                                >
                                    {SIZES_NPT.map(size => (
                                        <option key={size} value={size}>{size}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Side B - Tube */}
                            <div>
                                <label className="block text-xs text-slate-400 font-bold mb-1">규격 2 (Tube OD)</label>
                                <select
                                    value={sideB}
                                    onChange={e => setSideB(e.target.value)}
                                    className="w-full h-12 bg-black rounded-xl px-3 font-mono text-base font-bold text-green-400 border border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 outline-none transition-all appearance-none cursor-pointer"
                                >
                                    {SIZES_TUBE.map(size => (
                                        <option key={size} value={size}>{size}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* Add Button */}
                <button
                    onClick={handleAdd}
                    className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] touch-manipulation shadow-lg shadow-blue-900/50"
                >
                    <Plus className="w-5 h-5" />
                    추가하기
                </button>
            </div>

            {/* Assembly List Section - Inline styles for html2canvas compatibility */}
            <div
                ref={assemblyListRef}
                className="bg-card rounded-2xl border border-slate-800 p-4 shadow-xl flex-1 min-h-[200px] overflow-auto"
                style={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#ffffff' }}
            >
                <div className="flex items-center justify-between mb-3">
                    <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                        Assembly List ({assemblyList.length})
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Save Image Button */}
                        <button
                            onClick={handleSaveImage}
                            disabled={assemblyList.length === 0 || isSaving}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${assemblyList.length === 0
                                ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                                : 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/30'
                                }`}
                        >
                            <Download className="w-3.5 h-3.5" />
                            {isSaving ? '저장 중...' : '이미지 저장'}
                        </button>

                        {/* Clear All Button */}
                        {assemblyList.length > 0 && (
                            <button
                                onClick={handleClearAll}
                                className="text-xs text-red-400 hover:text-red-300 font-bold px-2 py-1 rounded-lg hover:bg-red-900/30 transition-all"
                            >
                                전체 삭제
                            </button>
                        )}
                    </div>
                </div>

                {assemblyList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-slate-600">
                        <Package className="w-12 h-12 mb-2 opacity-50" />
                        <p className="text-sm font-bold">커넥터를 추가해주세요</p>
                        <p className="text-xs text-slate-500 mt-1">↑ 상단에서 종류와 규격을 선택하세요</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {assemblyList.map((item, index) => (
                            <div
                                key={item.id}
                                className="bg-black/50 rounded-xl border border-slate-700 p-3 flex items-center gap-3 hover:border-slate-600 transition-all"
                            >
                                {/* Index Badge */}
                                <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center text-blue-400 font-bold text-sm flex-shrink-0">
                                    {index + 1}
                                </div>

                                {/* Image Placeholder */}
                                <div className="w-16 h-12 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0 border border-slate-700">
                                    <Package className="w-6 h-6 text-slate-600" />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-bold text-white truncate">{item.type}</div>
                                    <div className="text-xs text-slate-400 font-mono">
                                        <span className="text-cyan-400">{item.sideA}</span>
                                        <span className="text-slate-600 mx-1">×</span>
                                        <span className="text-green-400">{item.sideB}</span>
                                    </div>
                                </div>

                                {/* Remove Button - Ignored in capture */}
                                <button
                                    onClick={() => handleRemove(item.id)}
                                    data-ignore-capture="true"
                                    className="w-8 h-8 bg-red-900/30 hover:bg-red-900/50 rounded-lg flex items-center justify-center text-red-400 transition-all active:scale-95 flex-shrink-0"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
