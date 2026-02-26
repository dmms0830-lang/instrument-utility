import React, { useState } from 'react';
import { AlertTriangle, Wrench, Info } from 'lucide-react';

// --- Yokogawa Alarm Data ---
const YOKOGAWA_ALARMS = [
    { id: "AL.01", name: "CAP.ERR", cause: "캡슐(센서) 문제 / 온도 센서 오류 / EEPROM 오류", output: "설정된 신호 출력 (Hold, High, Low)", action: "재시작 후에도 지속되면 캡슐을 교체하십시오." },
    { id: "AL.02", name: "AMP.ERR", cause: "앰프 회로 온도 센서 문제 / EEPROM 오류 / 앰프 자체 고장", output: "설정된 신호 출력 (Hold, High, Low)", action: "앰프 보드를 교체하십시오." },
    { id: "AL.10", name: "PRESS", cause: "입력값이 캡슐의 측정 범위를 벗어남", output: "상한값(High) 또는 하한값(Low) 출력", action: "입력을 점검하고 필요시 캡슐을 교체하십시오." },
    { id: "AL.11", name: "ST.PRSS", cause: "정압(Static Pressure)이 한계를 초과함", output: "작동 및 출력 유지", action: "정압 상태를 확인하십시오." },
    { id: "AL.12", name: "CAP.TMP", cause: "캡슐 온도가 범위를 벗어남 (-50 ~ 130°C)", output: "작동 유지", action: "단열재 보강 또는 래깅(Lagging)으로 온도를 유지하십시오." },
    { id: "AL.13", name: "AMP.TMP", cause: "앰프 온도가 범위를 벗어남 (-50 ~ 95°C)", output: "작동 유지", action: "단열재 보강 또는 래깅으로 온도를 유지하십시오." },
    { id: "AL.30", name: "RANGE", cause: "출력이 상한 또는 하한 레인지 한계를 벗어남", output: "상한값 또는 하한값 출력", action: "입력 및 레인지 설정을 점검하고 변경하십시오." },
    { id: "AL.31", name: "SP.RNG", cause: "정압이 규정된 범위를 초과함", output: "작동 및 출력 유지", action: "정압 설정을 확인하십시오." },
    { id: "AL.35", name: "P.HI", cause: "입력 압력이 설정된 상한 임계값을 초과함", output: "작동 유지", action: "입력 압력을 점검하십시오." },
    { id: "AL.36", name: "P.LO", cause: "입력 압력이 설정된 하중 임계값보다 낮음", output: "작동 유지", action: "입력 압력을 점검하십시오." },
    { id: "AL.37", name: "SP.HI", cause: "입력 정압이 설정된 상한 임계값을 초과함", output: "작동 유지", action: "입력 정압을 점검하십시오." },
    { id: "AL.38", name: "SP.LO", cause: "입력 정압이 설정된 하중 임계값보다 낮음", output: "작동 유지", action: "입력 정압을 점검하십시오." },
    { id: "AL.39", name: "TMP.HI", cause: "감지된 온도가 설정된 상한 임계값을 초과함", output: "작동 유지", action: "온도를 점검하십시오." },
    { id: "AL.40", name: "TMP.LO", cause: "감지된 온도가 설정된 하중 임계값보다 낮음", output: "작동 유지", action: "온도를 점검하십시오." },
    { id: "AL.50", name: "P.LRV", cause: "설정된 LRV(하한값)가 범위를 벗어남", output: "에러 발생 직전 출력값 유지", action: "설정을 점검하고 적절한 값으로 변경하십시오." },
    { id: "AL.51", name: "P.URV", cause: "설정된 URV(상한값)가 범위를 벗어남", output: "에러 발생 직전 출력값 유지", action: "설정을 점검하고 적절한 값으로 변경하십시오." },
    { id: "AL.52", name: "P.SPN", cause: "설정된 스팬(Span)이 범위를 벗어남", output: "에러 발생 직전 출력값 유지", action: "설정을 점검하고 적절한 값으로 변경하십시오." },
    { id: "AL.53", name: "P.ADJ", cause: "압력 조정 오류", output: "작동 및 출력 유지", action: "입력을 점검하십시오." },
    { id: "AL.54", name: "SP.RNG", cause: "정압 레인지 설정 오류", output: "정압 %값 유지하며 작동", action: "설정을 점검하고 변경하십시오." },
    { id: "AL.55", name: "SP.ADJ", cause: "정압 조정 오류", output: "작동 및 출력 유지", action: "입력을 점검하십시오." },
    { id: "AL.60", name: "SC.CFG", cause: "신호 특성 설정 조건 미충족", output: "작동 유지", action: "설정을 점검하고 변경하십시오." },
    { id: "AL.79", name: "OV.DISP", cause: "표시값이 한계를 초과함", output: "디스플레이 한계 표시", action: "측정값 확인 및 레인지 조정을 검토하십시오." }
];

// --- Brand Config ---
const BRANDS = [
    { key: 'yokogawa', label: '요꼬가와', sub: 'Yokogawa', img: '/pic/yokogawa.png', alarms: YOKOGAWA_ALARMS },
    { key: 'emerson', label: '에머슨', sub: 'Emerson', img: '/pic/emerson.png', alarms: [] },
    { key: 'azbil', label: '아즈빌', sub: 'Azbil', img: '/pic/azbil.png', alarms: [] },
];

const chevronSvg = 'url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2364748b\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")';

export default function TransmitterAlarmFinder() {
    const [brand, setBrand] = useState('yokogawa');
    const [selectedId, setSelectedId] = useState('');

    const activeBrand = BRANDS.find(b => b.key === brand);
    const alarms = activeBrand?.alarms ?? [];
    const selected = alarms.find(a => a.id === selectedId);

    const handleBrandChange = (key) => {
        setBrand(key);
        setSelectedId('');
    };

    return (
        <div className="h-full w-full flex flex-col px-4 py-4 min-h-0">
            <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-lg w-full flex flex-col overflow-hidden flex-1">

                {/* ── STEP 1: Brand Image Buttons ── */}
                <div className="px-5 pt-5 pb-3">
                    <div className="grid grid-cols-3 gap-4">
                        {BRANDS.map(b => (
                            <button
                                key={b.key}
                                onClick={() => handleBrandChange(b.key)}
                                className={`
                                    aspect-square w-full rounded-2xl overflow-hidden transition-all duration-200
                                    active:scale-[0.97] touch-manipulation
                                    ${brand === b.key
                                        ? 'border-4 border-lime-500 shadow-xl shadow-lime-900/30 opacity-100'
                                        : 'border-2 border-slate-700 opacity-50 hover:opacity-80 hover:border-slate-500'
                                    }
                                `}
                            >
                                <img
                                    src={b.img}
                                    alt={b.label}
                                    className="w-full h-full object-cover"
                                />
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── STEP 2: Alarm Code Dropdown ── */}
                <div className="px-5 pb-4">
                    {alarms.length > 0 ? (
                        <select
                            value={selectedId}
                            onChange={(e) => setSelectedId(e.target.value)}
                            className="w-full h-12 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-lg px-4 outline-none cursor-pointer appearance-none focus:border-lime-500 transition-colors duration-200 hover:bg-slate-700"
                            style={{ backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2em 1.2em', backgroundImage: chevronSvg }}
                        >
                            <option value="" className="bg-slate-900">알람 코드를 선택하세요</option>
                            {alarms.map(a => (
                                <option key={a.id} value={a.id} className="bg-slate-900">
                                    {a.id} — {a.name}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <div className="w-full h-12 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center text-slate-500 font-mono text-lg">
                            데이터 준비 중
                        </div>
                    )}
                </div>

                {/* ── STEP 3: Result View ── */}
                <div className="px-5 pb-5 flex-1 overflow-y-auto">
                    {!selected ? (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-600">
                            <p className="text-lg font-bold">알람 코드를 선택하세요</p>
                            <p className="text-sm mt-1">브랜드를 선택 후 드롭다운에서 코드를 지정하면 상세 정보가 표시됩니다.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-5">
                            {/* Error Name */}
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">에러명</span>
                                <span className="font-mono text-2xl font-bold text-amber-400">{selected.id} — {selected.name}</span>
                            </div>

                            {/* Cause */}
                            <div className="flex gap-3 items-start">
                                <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">발생 원인</span>
                                    <p className="text-base text-slate-300 leading-relaxed break-words">{selected.cause}</p>
                                </div>
                            </div>

                            {/* Output */}
                            <div className="flex gap-3 items-start">
                                <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">에러 시 출력</span>
                                    <p className="text-base text-slate-400 leading-relaxed break-words">{selected.output}</p>
                                </div>
                            </div>

                            {/* Action */}
                            <div className="bg-emerald-950/40 border border-emerald-800/30 rounded-xl p-4 flex gap-3 items-start">
                                <Wrench className="w-5 h-5 text-lime-400 mt-0.5 flex-shrink-0" />
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs text-lime-500 font-bold uppercase tracking-wider">조치 방법</span>
                                    <p className="text-base text-lime-400 leading-relaxed font-medium break-words">{selected.action}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
