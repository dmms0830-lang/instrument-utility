import React, { useState, useMemo } from 'react';
import { Copy, Zap, RotateCcw } from 'lucide-react';

// ============================================================
// 저항 색띠 데이터 (IEC 60062 표준)
// ============================================================
const COLORS = [
    { name: 'Black', hex: '#18181b', digit: 0, mult: 1, tol: null },
    { name: 'Brown', hex: '#78350f', digit: 1, mult: 1e1, tol: 1 },
    { name: 'Red', hex: '#dc2626', digit: 2, mult: 1e2, tol: 2 },
    { name: 'Orange', hex: '#f97316', digit: 3, mult: 1e3, tol: null },
    { name: 'Yellow', hex: '#facc15', digit: 4, mult: 1e4, tol: null },
    { name: 'Green', hex: '#16a34a', digit: 5, mult: 1e5, tol: 0.5 },
    { name: 'Blue', hex: '#2563eb', digit: 6, mult: 1e6, tol: 0.25 },
    { name: 'Violet', hex: '#9333ea', digit: 7, mult: 1e7, tol: 0.1 },
    { name: 'Grey', hex: '#9ca3af', digit: 8, mult: 1e8, tol: 0.05 },
    { name: 'White', hex: '#f8fafc', digit: 9, mult: 1e9, tol: null },
    { name: 'Gold', hex: '#d4a017', digit: null, mult: 0.1, tol: 5 },
    { name: 'Silver', hex: '#cbd5e1', digit: null, mult: 0.01, tol: 10 },
];

// 밴드 위치별로 허용되는 색 필터
const allowedForBand = (bandType, bandIndex = 0) => {
    if (bandType === 'digit') {
        // 첫 자리 digit은 black 불가 (선두 0 방지)
        return COLORS.filter(c => c.digit !== null && !(bandIndex === 0 && c.digit === 0));
    }
    if (bandType === 'multiplier') return COLORS.filter(c => c.mult !== null);
    if (bandType === 'tolerance') return COLORS.filter(c => c.tol !== null);
    return COLORS;
};

// E24 표준값 (IEC 60063 공식, 5% 시리즈)
const E24 = [1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7, 3.0,
    3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1];
// E96 표준값 (IEC 60063 공식, 1% 시리즈)
const E96_PURE = [1.00, 1.02, 1.05, 1.07, 1.10, 1.13, 1.15, 1.18, 1.21, 1.24, 1.27, 1.30,
    1.33, 1.37, 1.40, 1.43, 1.47, 1.50, 1.54, 1.58, 1.62, 1.65, 1.69, 1.74,
    1.78, 1.82, 1.87, 1.91, 1.96, 2.00, 2.05, 2.10, 2.15, 2.21, 2.26, 2.32,
    2.37, 2.43, 2.49, 2.55, 2.61, 2.67, 2.74, 2.80, 2.87, 2.94, 3.01, 3.09,
    3.16, 3.24, 3.32, 3.40, 3.48, 3.57, 3.65, 3.74, 3.83, 3.92, 4.02, 4.12,
    4.22, 4.32, 4.42, 4.53, 4.64, 4.75, 4.87, 4.99, 5.11, 5.23, 5.36, 5.49,
    5.62, 5.76, 5.90, 6.04, 6.19, 6.34, 6.49, 6.65, 6.81, 6.98, 7.15, 7.32,
    7.50, 7.68, 7.87, 8.06, 8.25, 8.45, 8.66, 8.87, 9.09, 9.31, 9.53, 9.76];
// 실무 표준: E96 + E24 병합 (Bourns/Vishay 등 많은 제조사가 1% 저항에 E24 값도 포함)
// 예: 47kΩ 1%는 엄밀한 E96엔 없지만(4.75k), E96+E24 병합 리스트엔 존재
const E96 = Array.from(new Set([...E96_PURE, ...E24])).sort((a, b) => a - b);

// ============================================================
// 유틸: 숫자 포맷 (SI 접두어)
// ============================================================
const formatOhm = (val) => {
    if (val === null || isNaN(val)) return '--';
    if (val >= 1e9) return `${(val / 1e9).toFixed(2)} GΩ`;
    if (val >= 1e6) return `${(val / 1e6).toFixed(2)} MΩ`;
    if (val >= 1e3) return `${(val / 1e3).toFixed(2)} kΩ`;
    if (val >= 1) return `${val.toFixed(2)} Ω`;
    return `${(val * 1000).toFixed(1)} mΩ`;
};

// 색띠 배열 → 저항값 계산
const bandsToOhm = (bands, isFiveBand) => {
    try {
        const digitCount = isFiveBand ? 3 : 2;
        let digits = 0;
        for (let i = 0; i < digitCount; i++) {
            if (bands[i].digit === null) return null;
            digits = digits * 10 + bands[i].digit;
        }
        const mult = bands[digitCount].mult;
        const tol = bands[digitCount + 1].tol;
        if (mult === null || tol === null) return null;
        return { value: digits * mult, tolerance: tol };
    } catch {
        return null;
    }
};

// 값 → 가장 가까운 표준값 + 색띠
const ohmToBands = (targetOhm, isFiveBand, preferredTol) => {
    if (!targetOhm || targetOhm <= 0) return null;

    const series = isFiveBand ? E96 : E24;
    const digitCount = isFiveBand ? 3 : 2;

    // 10^exp * series[i] 조합 중 target에 가장 가까운 것 찾기
    let best = null;
    for (let exp = -2; exp <= 10; exp++) {
        for (const base of series) {
            const val = base * Math.pow(10, exp);
            const diff = Math.abs(val - targetOhm) / targetOhm;
            if (!best || diff < best.diff) {
                best = { value: val, diff, base, exp };
            }
        }
    }

    if (!best) return null;

    // base를 digit 배열로 변환 (E24는 2자리, E96은 3자리)
    const normalizedBase = Math.round(best.base * (isFiveBand ? 100 : 10));
    const digitsArr = [];
    let temp = normalizedBase;
    for (let i = 0; i < digitCount; i++) {
        digitsArr.unshift(temp % 10);
        temp = Math.floor(temp / 10);
    }

    // multiplier exponent = best.exp - (digitCount - 1)
    const multExp = best.exp - (digitCount - 1);
    const multColor = COLORS.find(c => c.mult === Math.pow(10, multExp));

    if (!multColor) return null;

    const digitColors = digitsArr.map(d => COLORS.find(c => c.digit === d));
    if (digitColors.some(c => !c)) return null;

    // tolerance color (기본 5% for 4-band, 1% for 5-band)
    const defaultTol = preferredTol ?? (isFiveBand ? 1 : 5);
    const tolColor = COLORS.find(c => c.tol === defaultTol) ?? COLORS.find(c => c.tol === 5);

    return {
        bands: [...digitColors, multColor, tolColor],
        actualValue: best.value,
        diffPercent: best.diff * 100,
    };
};

// ============================================================
// 저항 실물 시각화 컴포넌트
// ============================================================
const ResistorVisual = ({ bands, isFiveBand }) => {
    const bandCount = isFiveBand ? 5 : 4;
    const displayBands = bands.slice(0, bandCount);

    return (
        <div className="relative w-full h-24 sm:h-28 flex items-center justify-center">
            {/* 리드선 (왼쪽) */}
            <div className="flex-1 h-1 bg-gradient-to-b from-slate-400 via-slate-300 to-slate-500 shadow-md" />

            {/* 저항 몸통 */}
            <div
                className="relative h-16 sm:h-20 w-[65%] rounded-2xl flex items-center justify-around px-3 sm:px-5"
                style={{
                    background: 'linear-gradient(to bottom, #d4b896 0%, #c4a578 40%, #a8885c 100%)',
                    boxShadow: 'inset 0 3px 6px rgba(255,255,255,0.3), inset 0 -4px 8px rgba(0,0,0,0.4), 0 4px 10px rgba(0,0,0,0.5)',
                    border: '1px solid rgba(0,0,0,0.3)',
                }}
            >
                {/* 몸통 하이라이트 */}
                <div
                    className="absolute top-1 left-2 right-2 h-2 rounded-full opacity-30"
                    style={{ background: 'linear-gradient(to right, transparent, #fff, transparent)' }}
                />

                {/* 색띠들 */}
                {displayBands.map((band, idx) => {
                    // tolerance 밴드(마지막)는 간격 띄움
                    const isToleranceBand = idx === bandCount - 1;
                    return (
                        <div
                            key={idx}
                            className="relative h-full w-[10%] sm:w-[9%]"
                            style={{
                                marginLeft: isToleranceBand ? '4%' : 0,
                            }}
                        >
                            <div
                                className="absolute inset-y-0 left-0 right-0 rounded-sm"
                                style={{
                                    backgroundColor: band?.hex ?? '#27272a',
                                    backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.35) 0%, transparent 40%, rgba(0,0,0,0.5) 100%)',
                                    boxShadow: '0 0 3px rgba(0,0,0,0.4)',
                                }}
                            />
                        </div>
                    );
                })}
            </div>

            {/* 리드선 (오른쪽) */}
            <div className="flex-1 h-1 bg-gradient-to-b from-slate-400 via-slate-300 to-slate-500 shadow-md" />
        </div>
    );
};

// ============================================================
// 색상 선택 팔레트 (한 밴드용)
// ============================================================
const ColorPalette = ({ bandType, bandIndex, selectedColor, onSelect, label }) => {
    const allowed = allowedForBand(bandType, bandIndex);

    // label에 표시할 현재 선택된 값
    const currentDisplay = selectedColor ? (
        bandType === 'digit' ? selectedColor.digit :
            bandType === 'multiplier' ? `×${selectedColor.mult >= 1 ? selectedColor.mult.toExponential(0).replace('e+', 'e') : selectedColor.mult}` :
                `±${selectedColor.tol}%`
    ) : '-';

    return (
        <div className="bg-slate-900/60 rounded-xl p-2 border border-slate-800">
            <div className="flex items-center justify-between mb-1.5 px-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{label}</span>
                <span className="text-xs font-mono font-bold text-yellow-400">{currentDisplay}</span>
            </div>
            <div className="grid grid-cols-6 gap-1">
                {COLORS.map(c => {
                    const isAllowed = allowed.includes(c);
                    const isSelected = selectedColor?.name === c.name;
                    return (
                        <button
                            key={c.name}
                            onClick={() => isAllowed && onSelect(c)}
                            disabled={!isAllowed}
                            className={`aspect-square rounded-md transition-all touch-manipulation ${isSelected ? 'ring-2 ring-yellow-400 scale-105' : ''
                                } ${!isAllowed ? 'opacity-20 cursor-not-allowed' : 'active:scale-95 hover:ring-1 hover:ring-slate-500'
                                }`}
                            style={{
                                backgroundColor: c.hex,
                                backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.3) 0%, transparent 50%, rgba(0,0,0,0.4) 100%)',
                                border: c.name === 'White' ? '1px solid #64748b' : '1px solid rgba(0,0,0,0.3)',
                            }}
                            title={c.name}
                        />
                    );
                })}
            </div>
        </div>
    );
};

// ============================================================
// 메인 컴포넌트
// ============================================================
export default function ResistorCalc() {
    const [bandMode, setBandMode] = useState('4'); // '4' | '5'
    const [direction, setDirection] = useState('c2v'); // 'c2v': color→value, 'v2c': value→color
    const isFiveBand = bandMode === '5';

    // 색→값 모드의 band state
    // 기본값: 4-band = [Brown, Black, Red, Gold] = 1.0 kΩ ±5%
    //        5-band = [Brown, Black, Black, Brown, Brown] = 100 Ω ±1%
    const [bands, setBands] = useState(() => [
        COLORS.find(c => c.name === 'Brown'),
        COLORS.find(c => c.name === 'Black'),
        COLORS.find(c => c.name === 'Red'),
        COLORS.find(c => c.name === 'Gold'),
        COLORS.find(c => c.name === 'Brown'),
    ]);

    // 값→색 모드의 input
    const [ohmInput, setOhmInput] = useState('1000');

    // 밴드 수 변경 시 기본값 재설정
    const handleBandModeChange = (mode) => {
        setBandMode(mode);
        if (mode === '5') {
            setBands([
                COLORS.find(c => c.name === 'Brown'),
                COLORS.find(c => c.name === 'Black'),
                COLORS.find(c => c.name === 'Black'),
                COLORS.find(c => c.name === 'Brown'),
                COLORS.find(c => c.name === 'Brown'),
            ]);
        } else {
            setBands([
                COLORS.find(c => c.name === 'Brown'),
                COLORS.find(c => c.name === 'Black'),
                COLORS.find(c => c.name === 'Red'),
                COLORS.find(c => c.name === 'Gold'),
                COLORS.find(c => c.name === 'Brown'),
            ]);
        }
    };

    const updateBand = (idx, color) => {
        setBands(prev => {
            const next = [...prev];
            next[idx] = color;
            return next;
        });
    };

    // 색→값 결과
    const colorResult = useMemo(() => bandsToOhm(bands, isFiveBand), [bands, isFiveBand]);

    // 값→색 결과
    const valueResult = useMemo(() => {
        const v = parseFloat(ohmInput);
        if (isNaN(v)) return null;
        return ohmToBands(v, isFiveBand);
    }, [ohmInput, isFiveBand]);

    // 표시할 bands (direction에 따라)
    const displayBands = direction === 'c2v' ? bands : (valueResult?.bands ?? bands);

    const copyResult = () => {
        if (direction === 'c2v' && colorResult) {
            navigator.clipboard.writeText(formatOhm(colorResult.value));
        } else if (direction === 'v2c' && valueResult) {
            navigator.clipboard.writeText(formatOhm(valueResult.actualValue));
        }
        if (navigator.vibrate) navigator.vibrate(30);
    };

    const resetBands = () => {
        handleBandModeChange(bandMode);
    };

    return (
        <div className="flex flex-col gap-2 h-full">
            {/* Band count selector */}
            <div className="grid grid-cols-2 bg-slate-900 rounded-2xl p-1 border border-slate-800">
                <button
                    onClick={() => handleBandModeChange('4')}
                    className={`py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.98] touch-manipulation ${bandMode === '4'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                        : 'bg-transparent text-slate-400 hover:text-white'
                        }`}
                >
                    4-Band (±5%)
                </button>
                <button
                    onClick={() => handleBandModeChange('5')}
                    className={`py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.98] touch-manipulation ${bandMode === '5'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                        : 'bg-transparent text-slate-400 hover:text-white'
                        }`}
                >
                    5-Band (±1%)
                </button>
            </div>

            {/* Direction selector */}
            <div className="grid grid-cols-2 bg-slate-900 rounded-2xl p-1 border border-slate-800">
                <button
                    onClick={() => setDirection('c2v')}
                    className={`py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.98] touch-manipulation ${direction === 'c2v'
                        ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/50'
                        : 'bg-transparent text-slate-400 hover:text-white'
                        }`}
                >
                    색 → Ω
                </button>
                <button
                    onClick={() => setDirection('v2c')}
                    className={`py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.98] touch-manipulation ${direction === 'v2c'
                        ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/50'
                        : 'bg-transparent text-slate-400 hover:text-white'
                        }`}
                >
                    Ω → 색
                </button>
            </div>

            {/* 저항 실물 시각화 */}
            <div className="bg-card rounded-2xl border border-slate-800 p-3 shadow-2xl">
                <ResistorVisual bands={displayBands} isFiveBand={isFiveBand} />
            </div>

            {/* 결과 디스플레이 */}
            <div
                className="bg-black/80 rounded-2xl border border-slate-700 p-3 flex flex-col items-center justify-center cursor-pointer hover:border-yellow-600/50 transition-all min-h-[90px] shadow-lg"
                onClick={copyResult}
            >
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                    {direction === 'c2v' ? '저항값' : `표준값 (${isFiveBand ? 'E96' : 'E24'})`}
                </span>

                {direction === 'c2v' ? (
                    colorResult ? (
                        <>
                            <div className="flex items-baseline gap-2">
                                <span className="font-mono text-4xl font-black text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.4)]">
                                    {formatOhm(colorResult.value).split(' ')[0]}
                                </span>
                                <span className="text-slate-400 text-xl font-thin">
                                    {formatOhm(colorResult.value).split(' ')[1]}
                                </span>
                                <span className="text-slate-500 text-base font-mono ml-2">
                                    ±{colorResult.tolerance}%
                                </span>
                            </div>
                            <div className="flex items-center gap-1 mt-1 text-slate-600 text-xs">
                                <Copy className="w-3 h-3" />
                                <span>탭하여 복사</span>
                            </div>
                        </>
                    ) : (
                        <span className="text-slate-600 font-mono">색띠 오류</span>
                    )
                ) : (
                    valueResult ? (
                        <>
                            <div className="flex items-baseline gap-2">
                                <span className="font-mono text-4xl font-black text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.4)]">
                                    {formatOhm(valueResult.actualValue).split(' ')[0]}
                                </span>
                                <span className="text-slate-400 text-xl font-thin">
                                    {formatOhm(valueResult.actualValue).split(' ')[1]}
                                </span>
                            </div>
                            {valueResult.diffPercent > 0.1 && (
                                <span className="text-[10px] text-slate-500 mt-1">
                                    입력값 대비 {valueResult.diffPercent.toFixed(2)}% 차이
                                </span>
                            )}
                            <div className="flex items-center gap-1 mt-1 text-slate-600 text-xs">
                                <Copy className="w-3 h-3" />
                                <span>탭하여 복사</span>
                            </div>
                        </>
                    ) : (
                        <span className="text-slate-600 font-mono">값 입력 필요</span>
                    )
                )}
            </div>

            {/* 입력 영역 (방향에 따라 다름) */}
            {direction === 'c2v' ? (
                /* 색 선택 팔레트들 */
                <div className="bg-card rounded-2xl border border-slate-800 p-2 sm:p-3 shadow-2xl flex-1 flex flex-col gap-2 overflow-y-auto">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400 font-black uppercase tracking-widest">
                            색띠 선택
                        </span>
                        <button
                            onClick={resetBands}
                            className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-300 px-2 py-1 rounded-md border border-slate-700 transition-colors"
                        >
                            <RotateCcw className="w-3 h-3" /> 초기화
                        </button>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                        <ColorPalette
                            bandType="digit" bandIndex={0}
                            selectedColor={bands[0]}
                            onSelect={c => updateBand(0, c)}
                            label="1st Digit"
                        />
                        <ColorPalette
                            bandType="digit" bandIndex={1}
                            selectedColor={bands[1]}
                            onSelect={c => updateBand(1, c)}
                            label="2nd Digit"
                        />
                        {isFiveBand && (
                            <ColorPalette
                                bandType="digit" bandIndex={2}
                                selectedColor={bands[2]}
                                onSelect={c => updateBand(2, c)}
                                label="3rd Digit"
                            />
                        )}
                        <ColorPalette
                            bandType="multiplier"
                            selectedColor={bands[isFiveBand ? 3 : 2]}
                            onSelect={c => updateBand(isFiveBand ? 3 : 2, c)}
                            label="Multiplier"
                        />
                        <ColorPalette
                            bandType="tolerance"
                            selectedColor={bands[isFiveBand ? 4 : 3]}
                            onSelect={c => updateBand(isFiveBand ? 4 : 3, c)}
                            label="Tolerance"
                        />
                    </div>
                </div>
            ) : (
                /* 값 입력 */
                <div className="bg-card rounded-2xl border border-slate-800 p-3 shadow-2xl flex-1 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm text-slate-300 font-bold">목표 저항값 (Ω)</span>
                    </div>
                    <div className="relative">
                        <input
                            type="number"
                            step="any"
                            value={ohmInput}
                            onChange={e => setOhmInput(e.target.value)}
                            onFocus={e => e.target.select()}
                            className="w-full h-14 bg-black rounded-xl px-4 pr-14 font-mono text-2xl font-bold text-center text-white border border-slate-700 focus:border-2 focus:border-yellow-500 outline-none transition-all"
                            placeholder="1000"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">Ω</span>
                    </div>

                    {/* 빠른 입력 단위 */}
                    <div className="grid grid-cols-4 gap-2">
                        {[
                            { label: '×1', mult: 1 },
                            { label: '×10³', mult: 1000 },
                            { label: '×10⁶', mult: 1e6 },
                            { label: '÷10', mult: 0.1 },
                        ].map(q => (
                            <button
                                key={q.label}
                                onClick={() => {
                                    const cur = parseFloat(ohmInput) || 0;
                                    setOhmInput((cur * q.mult).toString());
                                }}
                                className="py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-bold text-sm hover:bg-slate-700 active:scale-95 transition-all"
                            >
                                {q.label}
                            </button>
                        ))}
                    </div>

                    {/* 색띠 순서 가이드 */}
                    {valueResult && (
                        <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800 mt-1">
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">
                                색띠 순서 (좌 → 우)
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {valueResult.bands.map((c, idx) => (
                                    <div key={idx} className="flex items-center gap-1.5 bg-black/40 rounded-md px-2 py-1 border border-slate-800">
                                        <div
                                            className="w-4 h-4 rounded"
                                            style={{
                                                backgroundColor: c.hex,
                                                border: c.name === 'White' ? '1px solid #64748b' : '1px solid rgba(0,0,0,0.3)',
                                            }}
                                        />
                                        <span className="text-xs font-mono text-slate-300">{c.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
