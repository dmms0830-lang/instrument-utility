import React, { useState } from 'react';
import { rtdTempFromRes, rtdResFromTemp } from '../utils/calculations';
import { Copy, Check, AlertTriangle } from 'lucide-react';

// ── 회로도 SVG ──────────────────────────────────────────────
function WireDiagram({ wireType }) {
    const theme = {
        '2': { stroke: '#ca8a04', text: '#fde047', sub: '#fbbf24', bg: '#1c1408' },
        '3': { stroke: '#16a34a', text: '#86efac', sub: '#4ade80', bg: '#0c1f10' },
        '4': { stroke: '#2563eb', text: '#93c5fd', sub: '#60a5fa', bg: '#0d1b3e' },
    }[wireType];

    const s = theme.stroke;
    const Terminal = ({ x, y }) => (
        <circle cx={x} cy={y} r={5} fill={theme.bg} stroke={s} strokeWidth={1.5} />
    );
    const DotJoin = ({ x, y }) => (
        <circle cx={x} cy={y} r={3.5} fill={s} />
    );

    // ── 2선식 ──────────────────────────────────────────────
    // 단자대: x=50~92  소자: x=175~255
    // T1(y=38) → 수평 → 소자 상단 연결점(y=38)
    // T2(y=78) → 수평 → 소자 하단 연결점(y=78)
    // 소자 내부: 상단점→Pt100→하단점 (수직)
    if (wireType === '2') {
        const TB = { x: 50, y: 20, w: 42, h: 76 };
        const SB = { x: 175, y: 20, w: 80, h: 76 };
        const t1y = 38, t2y = 76;          // 단자 y = 소자 연결점 y
        const midY = (t1y + t2y) / 2;      // 57 → Pt100 중심
        const TRx = TB.x + TB.w;           // 단자대 우측 x = 92
        const SLx = SB.x;                  // 소자 좌측 x = 175

        return (
            <svg viewBox="0 0 270 108" className="w-full" style={{ maxHeight: 108 }}>
                {/* 단자대 박스 */}
                <rect x={TB.x} y={TB.y} width={TB.w} height={TB.h} rx={4}
                    fill="none" stroke={s} strokeWidth={1.5} />
                <text x={TB.x + TB.w / 2} y={TB.y - 6} textAnchor="middle"
                    fontSize={8} fill={theme.sub} fontFamily="monospace">단자대</text>

                <Terminal x={TRx} y={t1y} />
                <text x={TB.x - 6} y={t1y} textAnchor="end" dominantBaseline="middle"
                    fontSize={9} fill={theme.text} fontFamily="monospace" fontWeight="bold">T1</text>

                <Terminal x={TRx} y={t2y} />
                <text x={TB.x - 6} y={t2y} textAnchor="end" dominantBaseline="middle"
                    fontSize={9} fill={theme.text} fontFamily="monospace" fontWeight="bold">T2</text>

                {/* RL1: T1 → 소자 상단 (완전 수평) */}
                <line x1={TRx} y1={t1y} x2={SLx} y2={t1y} stroke={s} strokeWidth={1.5} />
                <text x={(TRx + SLx) / 2} y={t1y - 7} textAnchor="middle"
                    fontSize={8} fill={theme.sub} fontFamily="monospace" fontWeight="bold">RL1</text>

                {/* RL2: T2 → 소자 하단 (완전 수평) */}
                <line x1={TRx} y1={t2y} x2={SLx} y2={t2y} stroke={s} strokeWidth={1.5} />
                <text x={(TRx + SLx) / 2} y={t2y + 13} textAnchor="middle"
                    fontSize={8} fill={theme.sub} fontFamily="monospace" fontWeight="bold">RL2</text>

                {/* 소자 박스 */}
                <rect x={SB.x} y={SB.y} width={SB.w} height={SB.h} rx={8}
                    fill={theme.bg} stroke={s} strokeWidth={2} />

                {/* 소자 내부: 상단점 → Pt100 → 하단점 */}
                <line x1={SLx} y1={t1y} x2={SLx + 12} y2={t1y} stroke={s} strokeWidth={1.5} />
                <line x1={SLx + 12} y1={t1y} x2={SLx + 12} y2={midY - 11} stroke={s} strokeWidth={1.5} />
                <rect x={SLx + 12} y={midY - 11} width={SB.w - 24} height={22} rx={4}
                    fill="none" stroke={s} strokeWidth={1.5} />
                <text x={SB.x + SB.w / 2} y={midY + 1} textAnchor="middle" dominantBaseline="middle"
                    fontSize={10} fill={theme.text} fontFamily="monospace" fontWeight="bold">Pt100</text>
                <line x1={SLx + 12} y1={midY + 11} x2={SLx + 12} y2={t2y} stroke={s} strokeWidth={1.5} />
                <line x1={SLx + 12} y1={t2y} x2={SLx} y2={t2y} stroke={s} strokeWidth={1.5} />

                <text x={SB.x + SB.w / 2} y={SB.y + SB.h + 13} textAnchor="middle"
                    fontSize={8} fill={theme.sub} fontFamily="monospace">RTD 소자</text>
            </svg>
        );
    }

    // ── 3선식 ──────────────────────────────────────────────
    // A(y=30) → 수평 → 소자 상단(y=30)       : RL1
    // B(y=65) → 수평 → 소자 하단(y=95)으로    : RL2  (꺾어서)
    // B'(y=100)→ B에서 분기                   : RL3
    //
    // 핵심: 단자대 단자는 y=30/65/100에 배치
    //       소자 연결점은 상단 y=30, 하단 y=95
    //       B(65)에서 나온 선은 수평으로 forkX까지 → 위로 꺾어 소자 하단(95)로 직결
    //       B'(100)는 forkX에서 합류(dot)
    if (wireType === '3') {
        const TB = { x: 50, y: 16, w: 42, h: 100 };
        const SB = { x: 175, y: 20, w: 80, h: 82 };
        const ay = 30, by = 65, bpy = 100;
        const sTopY = 30;                   // 소자 상단 연결점 y = A와 같은 높이
        const sBotY = 82;                   // 소자 하단 연결점 y
        const midY = (sTopY + sBotY) / 2;  // Pt100 중심
        const TRx = TB.x + TB.w;
        const SLx = SB.x;
        const forkX = TRx + 22;            // B/B' 분기점 x

        return (
            <svg viewBox="0 0 270 122" className="w-full" style={{ maxHeight: 120 }}>
                <rect x={TB.x} y={TB.y} width={TB.w} height={TB.h} rx={4}
                    fill="none" stroke={s} strokeWidth={1.5} />
                <text x={TB.x + TB.w / 2} y={TB.y - 6} textAnchor="middle"
                    fontSize={8} fill={theme.sub} fontFamily="monospace">단자대</text>

                <Terminal x={TRx} y={ay} />
                <text x={TB.x - 6} y={ay} textAnchor="end" dominantBaseline="middle"
                    fontSize={9} fill={theme.text} fontFamily="monospace" fontWeight="bold">A</text>

                <Terminal x={TRx} y={by} />
                <text x={TB.x - 6} y={by} textAnchor="end" dominantBaseline="middle"
                    fontSize={9} fill={theme.text} fontFamily="monospace" fontWeight="bold">B</text>

                <Terminal x={TRx} y={bpy} />
                <text x={TB.x - 6} y={bpy} textAnchor="end" dominantBaseline="middle"
                    fontSize={9} fill={theme.text} fontFamily="monospace" fontWeight="bold">B'</text>

                {/* RL1: A → 소자 상단 (수평) */}
                <line x1={TRx} y1={ay} x2={SLx} y2={sTopY} stroke={s} strokeWidth={1.5} />
                <text x={(TRx + SLx) / 2} y={ay - 7} textAnchor="middle"
                    fontSize={8} fill={theme.sub} fontFamily="monospace" fontWeight="bold">RL1</text>

                {/* RL2: B → forkX → 소자 하단 */}
                <line x1={TRx} y1={by} x2={forkX} y2={by} stroke={s} strokeWidth={1.5} />
                <line x1={forkX} y1={by} x2={SLx} y2={sBotY} stroke={s} strokeWidth={1.5} />
                <text x={(forkX + SLx) / 2} y={sBotY + 13} textAnchor="middle"
                    fontSize={8} fill={theme.sub} fontFamily="monospace" fontWeight="bold">RL2</text>

                {/* RL3: B' → forkX 합류 */}
                <line x1={TRx} y1={bpy} x2={forkX} y2={bpy} stroke={s} strokeWidth={1.5} />
                <line x1={forkX} y1={bpy} x2={forkX} y2={by} stroke={s} strokeWidth={1.5} />
                <DotJoin x={forkX} y={by} />
                <text x={forkX - 4} y={(by + bpy) / 2} textAnchor="end"
                    dominantBaseline="middle" fontSize={8} fill={theme.sub}
                    fontFamily="monospace" fontWeight="bold">RL3</text>

                {/* 소자 박스 */}
                <rect x={SB.x} y={SB.y} width={SB.w} height={SB.h} rx={8}
                    fill={theme.bg} stroke={s} strokeWidth={2} />

                {/* 소자 내부 */}
                <line x1={SLx} y1={sTopY} x2={SLx + 12} y2={sTopY} stroke={s} strokeWidth={1.5} />
                <line x1={SLx + 12} y1={sTopY} x2={SLx + 12} y2={midY - 11} stroke={s} strokeWidth={1.5} />
                <rect x={SLx + 12} y={midY - 11} width={SB.w - 24} height={22} rx={4}
                    fill="none" stroke={s} strokeWidth={1.5} />
                <text x={SB.x + SB.w / 2} y={midY + 1} textAnchor="middle" dominantBaseline="middle"
                    fontSize={10} fill={theme.text} fontFamily="monospace" fontWeight="bold">Pt100</text>
                <line x1={SLx + 12} y1={midY + 11} x2={SLx + 12} y2={sBotY} stroke={s} strokeWidth={1.5} />
                <line x1={SLx + 12} y1={sBotY} x2={SLx} y2={sBotY} stroke={s} strokeWidth={1.5} />

                <text x={SB.x + SB.w / 2} y={SB.y + SB.h + 13} textAnchor="middle"
                    fontSize={8} fill={theme.sub} fontFamily="monospace">RTD 소자</text>
            </svg>
        );
    }

    // ── 4선식 ──────────────────────────────────────────────
    // 단자 y: RL1=25, RL2=52, RL3=82, RL4=109
    // 소자 상단 합류점 y = (RL1+RL2)/2 = 38  → RL1은 아래로 꺾어, RL2는 위로 꺾어 합류
    // 소자 하단 합류점 y = (RL3+RL4)/2 = 95  → RL3은 아래로 꺾어, RL4는 위로 꺾어 합류
    // 합류점에서 수평선 → 소자 좌벽
    // 소자 내부: 상단합류점 → Pt100 → 하단합류점
    const TB = { x: 50, y: 12, w: 42, h: 110 };
    const SB = { x: 175, y: 12, w: 80, h: 110 };
    const r1y = 25, r2y = 52, r3y = 82, r4y = 109;
    const topJoinY = (r1y + r2y) / 2;   // 38.5 ≈ 39  → 소자 상단 합류점 y
    const botJoinY = (r3y + r4y) / 2;   // 95.5 ≈ 96  → 소자 하단 합류점 y
    const midY4 = (topJoinY + botJoinY) / 2; // Pt100 중심
    const TRx = TB.x + TB.w;  // 92
    const SLx = SB.x;         // 175
    // 합류 꺾임 x: 단자대에서 나와 수평으로 joinX까지, 거기서 수직으로 합류점 y로
    const joinX = TRx + 30;   // 122

    return (
        <svg viewBox="0 0 270 140" className="w-full" style={{ maxHeight: 138 }}>
            <rect x={TB.x} y={TB.y} width={TB.w} height={TB.h} rx={4}
                fill="none" stroke={s} strokeWidth={1.5} />
            <text x={TB.x + TB.w / 2} y={TB.y - 6} textAnchor="middle"
                fontSize={8} fill={theme.sub} fontFamily="monospace">단자대</text>

            {[
                { y: r1y, label: 'RL1' },
                { y: r2y, label: 'RL2' },
                { y: r3y, label: 'RL3' },
                { y: r4y, label: 'RL4' },
            ].map(({ y, label }) => (
                <g key={label}>
                    <Terminal x={TRx} y={y} />
                    <text x={TB.x - 6} y={y} textAnchor="end" dominantBaseline="middle"
                        fontSize={9} fill={theme.text} fontFamily="monospace" fontWeight="bold">{label}</text>
                </g>
            ))}

            {/* ── 상단 그룹: RL1, RL2 → topJoinY 합류 ── */}
            {/* RL1: 수평 → joinX, 수직 아래 → topJoinY */}
            <line x1={TRx} y1={r1y} x2={joinX} y2={r1y} stroke={s} strokeWidth={1.5} />
            <line x1={joinX} y1={r1y} x2={joinX} y2={topJoinY} stroke={s} strokeWidth={1.5} />
            <text x={(TRx + joinX) / 2} y={r1y - 7} textAnchor="middle"
                fontSize={8} fill={theme.sub} fontFamily="monospace" fontWeight="bold">RL1</text>

            {/* RL2: 수평 → joinX, 수직 위 → topJoinY */}
            <line x1={TRx} y1={r2y} x2={joinX} y2={r2y} stroke={s} strokeWidth={1.5} />
            <line x1={joinX} y1={r2y} x2={joinX} y2={topJoinY} stroke={s} strokeWidth={1.5} />
            <text x={(TRx + joinX) / 2} y={r2y + 13} textAnchor="middle"
                fontSize={8} fill={theme.sub} fontFamily="monospace" fontWeight="bold">RL2</text>

            {/* 상단 합류점 dot → 수평으로 소자 좌벽 */}
            <DotJoin x={joinX} y={topJoinY} />
            <line x1={joinX} y1={topJoinY} x2={SLx} y2={topJoinY} stroke={s} strokeWidth={1.5} />

            {/* ── 하단 그룹: RL3, RL4 → botJoinY 합류 ── */}
            {/* RL3: 수평 → joinX, 수직 아래 → botJoinY */}
            <line x1={TRx} y1={r3y} x2={joinX} y2={r3y} stroke={s} strokeWidth={1.5} />
            <line x1={joinX} y1={r3y} x2={joinX} y2={botJoinY} stroke={s} strokeWidth={1.5} />
            <text x={(TRx + joinX) / 2} y={r3y - 7} textAnchor="middle"
                fontSize={8} fill={theme.sub} fontFamily="monospace" fontWeight="bold">RL3</text>

            {/* RL4: 수평 → joinX, 수직 위 → botJoinY */}
            <line x1={TRx} y1={r4y} x2={joinX} y2={r4y} stroke={s} strokeWidth={1.5} />
            <line x1={joinX} y1={r4y} x2={joinX} y2={botJoinY} stroke={s} strokeWidth={1.5} />
            <text x={(TRx + joinX) / 2} y={r4y + 13} textAnchor="middle"
                fontSize={8} fill={theme.sub} fontFamily="monospace" fontWeight="bold">RL4</text>

            {/* 하단 합류점 dot → 수평으로 소자 좌벽 */}
            <DotJoin x={joinX} y={botJoinY} />
            <line x1={joinX} y1={botJoinY} x2={SLx} y2={botJoinY} stroke={s} strokeWidth={1.5} />

            {/* 소자 박스 */}
            <rect x={SB.x} y={SB.y} width={SB.w} height={SB.h} rx={8}
                fill={theme.bg} stroke={s} strokeWidth={2} />

            {/* 소자 내부: 상단합류점 → Pt100 → 하단합류점 */}
            <line x1={SLx} y1={topJoinY} x2={SLx + 12} y2={topJoinY} stroke={s} strokeWidth={1.5} />
            <line x1={SLx + 12} y1={topJoinY} x2={SLx + 12} y2={midY4 - 13} stroke={s} strokeWidth={1.5} />
            <rect x={SLx + 12} y={midY4 - 13} width={SB.w - 24} height={26} rx={4}
                fill="none" stroke={s} strokeWidth={1.5} />
            <text x={SB.x + SB.w / 2} y={midY4 + 1} textAnchor="middle" dominantBaseline="middle"
                fontSize={10} fill={theme.text} fontFamily="monospace" fontWeight="bold">Pt100</text>
            <line x1={SLx + 12} y1={midY4 + 13} x2={SLx + 12} y2={botJoinY} stroke={s} strokeWidth={1.5} />
            <line x1={SLx + 12} y1={botJoinY} x2={SLx} y2={botJoinY} stroke={s} strokeWidth={1.5} />

            <text x={SB.x + SB.w / 2} y={SB.y + SB.h + 13} textAnchor="middle"
                fontSize={8} fill={theme.sub} fontFamily="monospace">RTD 소자</text>
        </svg>
    );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────
export default function RTDCalc() {
    const [mode, setMode] = useState('R2T');
    const [inputValue, setInputValue] = useState('');
    const [wireType, setWireType] = useState('4');
    const [leadOffset, setLeadOffset] = useState('0');
    const [rBB, setRBB] = useState('0');
    const [rRL12, setRRL12] = useState('0');
    const [activeField, setActiveField] = useState(null);

    const THEME = {
        '2': {
            bg: 'bg-yellow-900/20', border: 'border-yellow-700/50',
            label: 'text-yellow-400', inputText: 'text-yellow-400',
            focusBorder: 'border-yellow-500', unit: 'text-yellow-500',
            btnActive: 'bg-yellow-600 ring-2 ring-yellow-400',
            footerText: 'text-yellow-600', offsetText: 'text-yellow-600',
        },
        '3': {
            bg: 'bg-green-900/20', border: 'border-green-700/50',
            label: 'text-green-400', inputText: 'text-green-400',
            focusBorder: 'border-green-500', unit: 'text-green-500',
            btnActive: 'bg-green-600 ring-2 ring-green-400',
            footerText: 'text-green-600', offsetText: 'text-green-600',
        },
        '4': {
            bg: 'bg-blue-900/20', border: 'border-blue-700/50',
            label: 'text-blue-400', inputText: 'text-blue-400',
            focusBorder: 'border-blue-500', unit: 'text-blue-500',
            btnActive: 'bg-blue-600 ring-2 ring-blue-400',
            footerText: 'text-blue-600', offsetText: 'text-blue-600',
        },
    };
    const t = THEME[wireType];

    let effectiveOffset = 0;
    if (wireType === '2') effectiveOffset = parseFloat(leadOffset) || 0;
    else if (wireType === '3') effectiveOffset = parseFloat(rBB) || 0;
    else if (wireType === '4') effectiveOffset = parseFloat(rRL12) || 0;

    const val = parseFloat(inputValue);
    let result = null;
    if (inputValue !== '' && !isNaN(val)) {
        result = mode === 'R2T'
            ? rtdTempFromRes(val - effectiveOffset)
            : rtdResFromTemp(val) + effectiveOffset;
    }

    const copyToClipboard = () => {
        if (result !== null && !isNaN(result)) {
            navigator.clipboard.writeText(result.toFixed(2));
            if (navigator.vibrate) navigator.vibrate(30);
        }
    };

    const handleFocus = (field, e) => { setActiveField(field); e.target.select(); };
    const inputUnit = mode === 'R2T' ? 'Ω' : '°C';
    const outputUnit = mode === 'R2T' ? '°C' : 'Ω';

    const COMP_LABEL = {
        '2': '리드선 저항 보상 (RL1 + RL2)',
        '3': '리드선 저항 보상 — R(B-B′)',
        '4': '리드선 저항 보상 — R(RL1-RL2)',
    };
    const COMP_PLACEHOLDER = { '2': '0.00', '3': '0.00', '4': '0.00' };
    const MAIN_LABEL = {
        '2': mode === 'R2T' ? '저항값 입력' : '온도 입력',
        '3': mode === 'R2T' ? 'R(A-B) 입력' : '온도 입력',
        '4': mode === 'R2T' ? 'R(RL1-RL3) 입력' : '온도 입력',
    };
    const FOOTER = {
        '2': { icon: <AlertTriangle className="w-3 h-3" />, msg: '2선식: 리드선 저항 수동 보정 필요' },
        '3': { icon: <Check className="w-3 h-3" />, msg: '3선식: R(A-B) − R(B-B′) 보상' },
        '4': { icon: <Check className="w-3 h-3" />, msg: '4선식: R(RL1-RL3) − R(RL1-RL2) 보상' },
    };

    const compValue = wireType === '2' ? leadOffset : wireType === '3' ? rBB : rRL12;
    const setCompValue = wireType === '2' ? setLeadOffset : wireType === '3' ? setRBB : setRRL12;

    return (
        <div className="flex flex-col gap-2 h-full">
            <div className="flex items-center gap-2">
                <span className="text-lg font-black text-blue-400">Pt100</span>
                <span className="text-xs text-slate-500 font-mono">IEC 60751</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
                {['2', '3', '4'].map(w => (
                    <button
                        key={w}
                        onClick={() => setWireType(w)}
                        className={`py-3 rounded-2xl font-bold text-lg transition-all active:scale-[0.98] touch-manipulation flex items-center justify-center gap-2
                            ${wireType === w
                                ? `${THEME[w].btnActive} text-white shadow-lg`
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                    >
                        {wireType === w && (w === '2'
                            ? <AlertTriangle className="w-4 h-4" />
                            : <Check className="w-4 h-4" />)}
                        {w}선식
                    </button>
                ))}
            </div>

            <div className={`${t.bg} ${t.border} border rounded-2xl p-3 shadow-lg flex flex-col gap-2`}>
                <div className="flex flex-col items-center">
                    <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${t.label}`}>
                        {wireType}-Wire RTD Circuit
                    </span>
                    <WireDiagram wireType={wireType} />
                </div>

                <div className={`border-t ${t.border} opacity-50`} />

                <div>
                    <label className={`block text-sm font-bold mb-2 ${t.label}`}>
                        {COMP_LABEL[wireType]}
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            step="0.01"
                            value={compValue}
                            onChange={e => setCompValue(e.target.value)}
                            onFocus={(e) => handleFocus('comp', e)}
                            onBlur={() => setActiveField(null)}
                            className={`w-full h-12 bg-black rounded-xl px-3 pr-10 font-mono text-xl font-bold text-center outline-none transition-all
                                ${t.inputText} ${activeField === 'comp'
                                    ? `border-2 ${t.focusBorder}`
                                    : 'border border-slate-700'}`}
                            placeholder={COMP_PLACEHOLDER[wireType]}
                        />
                        <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold ${t.unit}`}>Ω</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 bg-slate-900 rounded-2xl p-1 border border-slate-800">
                {['R2T', 'T2R'].map(m => (
                    <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={`py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.98] touch-manipulation
                            ${mode === m
                                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50'
                                : 'bg-transparent text-slate-400 hover:text-white'}`}
                    >
                        {m === 'R2T' ? 'Ω → °C' : '°C → Ω'}
                    </button>
                ))}
            </div>

            <div className="bg-card rounded-2xl border border-slate-800 p-3 shadow-2xl flex-1 flex flex-col">
                <div className="mb-2">
                    <label className="block text-[10px] text-slate-500 font-bold mb-1 uppercase tracking-wider">
                        {MAIN_LABEL[wireType]}
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            step="0.01"
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            onFocus={(e) => handleFocus('input', e)}
                            onBlur={() => setActiveField(null)}
                            className={`w-full h-14 bg-black rounded-xl px-3 pr-12 font-mono text-2xl font-bold text-center outline-none transition-all text-white
                                ${activeField === 'input'
                                    ? 'border-2 border-blue-500 ring-2 ring-blue-500/30'
                                    : 'border border-slate-700'}`}
                            placeholder={mode === 'R2T' ? '100.00' : '0.00'}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">{inputUnit}</span>
                    </div>
                </div>

                <div
                    className="bg-black/80 rounded-2xl border border-slate-700 p-3 flex-1 flex flex-col items-center justify-center cursor-pointer hover:border-green-600/50 transition-all relative overflow-hidden min-h-[120px] shadow-lg"
                    onClick={copyToClipboard}
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-green-950/20 to-transparent pointer-events-none" />
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 relative z-10">
                        {mode === 'R2T' ? '온도 (IEC 60751)' : '저항값'}
                    </span>
                    <div className="flex items-baseline gap-2 relative z-10">
                        <span className="font-mono text-5xl font-black text-green-400 drop-shadow-[0_0_20px_rgba(34,197,94,0.5)]">
                            {result !== null && !isNaN(result)
                                ? result.toFixed(2)
                                : (result !== null && isNaN(result) ? 'ERR' : '--.-')}
                        </span>
                        <span className="text-slate-500 text-xl font-thin">{outputUnit}</span>
                    </div>
                    {result !== null && !isNaN(result) && (
                        <div className="flex items-center gap-1 mt-1 text-slate-600 text-xs relative z-10">
                            <Copy className="w-3 h-3" />
                            <span>탭하여 복사</span>
                        </div>
                    )}
                    {effectiveOffset !== 0 && (
                        <div className={`absolute bottom-2 left-2 text-[9px] font-mono z-10 ${t.offsetText}`}>
                            보정: -{effectiveOffset.toFixed(2)}Ω
                        </div>
                    )}
                </div>

                <div className={`mt-2 flex items-center justify-center gap-2 text-[10px] ${t.footerText}`}>
                    {FOOTER[wireType].icon}
                    <span>{FOOTER[wireType].msg}</span>
                </div>
            </div>
        </div>
    );
}
