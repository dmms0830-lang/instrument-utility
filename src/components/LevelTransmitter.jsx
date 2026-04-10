import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Waves, AlertTriangle, ArrowRight, Delete, Droplets, RotateCcw, RefreshCw } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   LAYOUT PLAN (viewBox="0 0 400 340")  — CENTERED LAYOUT

   Left:   LT (Yokogawa DP transmitter) at vessel bottom
   Center: Vessel (background, smaller, behind LG)
   Right:  Level Gauge tube (foreground, taller)

   Lead Lines (impulse lines):
     - H line: Vessel HIGH tap → down → LT H port
     - L line: Vessel LOW tap → down → LT L port
     Both lead lines run DOWN from their vessel taps to the
     transmitter head mounted at vessel bottom.

   Measurement range: LRV at 2/5 vessel height, URV at 4/5
═══════════════════════════════════════════════════════════════ */


function LiveViewSVG({ currPct, targetPct }) {
    const hasCurrent = currPct !== '' && !isNaN(parseFloat(currPct));
    const hasTarget  = targetPct !== '' && !isNaN(parseFloat(targetPct));
    const ltPct = hasCurrent ? Math.min(Math.max(parseFloat(currPct), 0), 100) : 0;
    const lgPct = hasTarget  ? Math.min(Math.max(parseFloat(targetPct), 0), 100) : 0;

    /* ══════════════════════════════════════════════════════
       HORIZONTAL LAYOUT — viewBox 500×300
       [LT Transmitter]  [Lead Lines]  [Vessel]  [Pipes]  [LG + Scale]
       All bottom-aligned at y=285
    ══════════════════════════════════════════════════════ */
    const W = 500, HH = 300;
    const BOT = 285, TOP = 15;

    const VX = 185, VW = 125, VY = TOP, VH = BOT - VY, VBot = BOT;
    const VCX = VX + VW / 2;

    const URV_Y = VBot - 0.80 * VH;
    const LRV_Y = VBot - 0.40 * VH;

    const lgMargin = (LRV_Y - URV_Y) * 0.08;
    const LG_X = 365, LG_W = 28;
    const LG_TOP = URV_Y - lgMargin;
    const LG_BOT = LRV_Y + lgMargin;
    const LG_H = LG_BOT - LG_TOP;

    const lgActiveTop = URV_Y;
    const lgActiveBot = LRV_Y;
    const lgActiveH = lgActiveBot - lgActiveTop;
    const lgFillH = (lgPct / 100) * lgActiveH;
    const lgFillY = lgActiveBot - lgFillH;

    const LT_W = 58, LT_CX = 68;
    const LT_LEFT = LT_CX - LT_W / 2;
    const LT_RIGHT = LT_CX + LT_W / 2;

    const SENS_H = 48, COUP_H = 12, AMP_H = 62, COND_H = 16;
    const LT_TOTAL = SENS_H + COUP_H + AMP_H + COND_H;
    const LT_TOP = BOT - LT_TOTAL;
    const SENS_TOP = LT_TOP;
    const SENS_BOT = SENS_TOP + SENS_H;
    const COUP_TOP = SENS_BOT;
    const AMP_TOP = COUP_TOP + COUP_H;
    const AMP_BOT = AMP_TOP + AMP_H;
    const COND_TOP = AMP_BOT;

    const H_PORT_Y = SENS_TOP + 14;
    const L_PORT_Y = SENS_TOP + 36;
    const PORT_RIGHT_X = LT_RIGHT + 16;

    const LEAD_H_VERT_X = 140;
    const LEAD_L_VERT_X = 128;

    const measRange = LRV_Y - URV_Y;
    const vesLiqTop = LRV_Y - (lgPct / 100) * measRange;
    const vesLiqH = VBot - vesLiqTop;

    const PIPE_LEFT = VX + VW + 8;
    const PIPE_RIGHT = LG_X - 2;

    const ltLevelOnLG = lgActiveBot - (ltPct / 100) * lgActiveH;
    const lgLevelOnLG = lgFillY;

    return (
        <svg viewBox={`0 0 ${W} ${HH}`} xmlns="http://www.w3.org/2000/svg"
             preserveAspectRatio="xMidYMid meet"
             style={{ width: '100%', height: '100%', display: 'block' }}>
            <defs>
                <style>{`
                    @keyframes wv1{0%,100%{transform:translateX(0)}50%{transform:translateX(5px)}}
                    @keyframes wv2{0%,100%{transform:translateX(0)}50%{transform:translateX(-3px)}}
                    @keyframes glP{0%,100%{opacity:.45}50%{opacity:.85}}
                    @keyframes ldB{0%,88%,100%{opacity:1}94%{opacity:.25}}
                    .w1{animation:wv1 3.2s ease-in-out infinite}
                    .w2{animation:wv2 2.6s ease-in-out infinite}
                    .gp{animation:glP 2.2s ease-in-out infinite}
                    .lb{animation:ldB 3.5s ease-in-out infinite}
                `}</style>

                <linearGradient id="gVB" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#071822" stopOpacity=".95"/><stop offset="12%" stopColor="#122e42" stopOpacity=".80"/><stop offset="50%" stopColor="#163a52" stopOpacity=".38"/><stop offset="88%" stopColor="#122e42" stopOpacity=".80"/><stop offset="100%" stopColor="#071822" stopOpacity=".95"/></linearGradient>
                <linearGradient id="gVL" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#67d4ff" stopOpacity=".42"/><stop offset="40%" stopColor="#2196f3" stopOpacity=".52"/><stop offset="100%" stopColor="#0d47a1" stopOpacity=".68"/></linearGradient>
                <linearGradient id="gVLS" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#e3f2fd" stopOpacity="0"/><stop offset="18%" stopColor="#e3f2fd" stopOpacity=".14"/><stop offset="40%" stopColor="#bbdefb" stopOpacity=".05"/><stop offset="100%" stopColor="#e3f2fd" stopOpacity="0"/></linearGradient>
                <linearGradient id="gSL" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#90caf9" stopOpacity=".38"/><stop offset="100%" stopColor="#90caf9" stopOpacity="0"/></linearGradient>
                <linearGradient id="gSR" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#90caf9" stopOpacity="0"/><stop offset="100%" stopColor="#90caf9" stopOpacity=".38"/></linearGradient>
                <radialGradient id="gVC" cx="50%" cy="0%" r="120%"><stop offset="0%" stopColor="#2a5a78" stopOpacity=".88"/><stop offset="100%" stopColor="#0a1e2e" stopOpacity=".95"/></radialGradient>
                <linearGradient id="gTB" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#0a1a28"/><stop offset="35%" stopColor="#1a3448"/><stop offset="65%" stopColor="#152e42"/><stop offset="100%" stopColor="#081620"/></linearGradient>
                <linearGradient id="gLL" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="#0a3a18"/><stop offset="30%" stopColor="#16a34a"/><stop offset="70%" stopColor="#22c55e"/><stop offset="100%" stopColor="#86efac"/></linearGradient>
                <linearGradient id="gLG" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="#22c55e" stopOpacity="0"/><stop offset="50%" stopColor="#22c55e" stopOpacity=".28"/><stop offset="100%" stopColor="#4ade80" stopOpacity="0"/></linearGradient>
                <linearGradient id="gGS" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#f0f9ff" stopOpacity=".52"/><stop offset="20%" stopColor="#f0f9ff" stopOpacity=".68"/><stop offset="42%" stopColor="#bae6fd" stopOpacity=".10"/><stop offset="100%" stopColor="#bae6fd" stopOpacity=".02"/></linearGradient>
                <linearGradient id="gPp" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3a6a88"/><stop offset="50%" stopColor="#1e4460"/><stop offset="100%" stopColor="#0e2438"/></linearGradient>
                <linearGradient id="gPH" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#3a6a88"/><stop offset="50%" stopColor="#1e4460"/><stop offset="100%" stopColor="#0e2438"/></linearGradient>
                <linearGradient id="gFl" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4a7a9a"/><stop offset="50%" stopColor="#2a5870"/><stop offset="100%" stopColor="#163848"/></linearGradient>
                <linearGradient id="gSn" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#787878"/><stop offset="35%" stopColor="#b0b0b0"/><stop offset="60%" stopColor="#c8c8c8"/><stop offset="100%" stopColor="#808080"/></linearGradient>
                <linearGradient id="gSnS" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#fff" stopOpacity=".42"/><stop offset="100%" stopColor="#fff" stopOpacity="0"/></linearGradient>
                <linearGradient id="gAm" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#1a3320"/><stop offset="40%" stopColor="#2d5035"/><stop offset="70%" stopColor="#2a4a30"/><stop offset="100%" stopColor="#182e1e"/></linearGradient>
                <linearGradient id="gAmS" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#6ab87a" stopOpacity=".52"/><stop offset="50%" stopColor="#8ad09a" stopOpacity=".22"/><stop offset="100%" stopColor="#6ab87a" stopOpacity="0"/></linearGradient>
                <linearGradient id="gCp" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4a7888"/><stop offset="50%" stopColor="#244a5a"/><stop offset="100%" stopColor="#122838"/></linearGradient>
                <linearGradient id="gLd" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#091a0c"/><stop offset="100%" stopColor="#040e06"/></linearGradient>

                <filter id="fS" x="-12%" y="-6%" width="130%" height="118%"><feDropShadow dx="2" dy="4" stdDeviation="6" floodColor="#000" floodOpacity=".50"/></filter>
                <filter id="fSL" x="-25%" y="-8%" width="160%" height="125%"><feDropShadow dx="2" dy="4" stdDeviation="7" floodColor="#000" floodOpacity=".60"/></filter>
                <filter id="fST" x="-18%" y="-4%" width="150%" height="112%"><feDropShadow dx="2" dy="3" stdDeviation="5" floodColor="#000" floodOpacity=".55"/></filter>
                <filter id="fG" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                <filter id="fC" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                <filter id="fLgG" x="-80%" y="-8%" width="260%" height="118%"><feGaussianBlur in="SourceGraphic" stdDeviation="5"/></filter>
                <filter id="fD" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur in="SourceGraphic" stdDeviation="1.5"/></filter>

                <clipPath id="cV"><rect x={VX+3} y={VY+3} width={VW-6} height={VH-6} rx="3"/></clipPath>
                <clipPath id="cL"><rect x={LG_X+3} y={LG_TOP+3} width={LG_W-6} height={LG_H-6} rx="3"/></clipPath>
            </defs>

            {/* GRID */}
            <g opacity=".05">
                {Array.from({length:11},(_,i)=>{const y=TOP+i*(BOT-TOP)/10;return <line key={`h${i}`} x1="0" y1={y} x2={W} y2={y} stroke="#4a8ab0" strokeWidth=".5"/>;})}
                {Array.from({length:11},(_,i)=>{const x=30+i*(W-60)/10;return <line key={`v${i}`} x1={x} y1={TOP} x2={x} y2={BOT} stroke="#4a8ab0" strokeWidth=".5"/>;})}
            </g>

            {/* VESSEL */}
            <g filter="url(#fS)" opacity=".88">
                <rect x={VX} y={VY} width={VW} height={VH} rx="7" fill="url(#gVB)" stroke="#1e3d58" strokeWidth="1.8"/>
                <g clipPath="url(#cV)">
                    {hasTarget && vesLiqH > 0 && (<>
                        <rect x={VX+3} y={vesLiqTop} width={VW-6} height={vesLiqH} fill="url(#gVL)" style={{transition:'all .8s cubic-bezier(.34,1.2,.64,1)'}}/>
                        <rect x={VX+3} y={vesLiqTop} width={VW-6} height={vesLiqH} fill="url(#gVLS)" style={{transition:'all .8s cubic-bezier(.34,1.2,.64,1)'}}/>
                        <g className="w1"><ellipse cx={VCX} cy={vesLiqTop} rx={VW/2-4} ry="3.5" fill="#e1f5fe" fillOpacity=".32" style={{transition:'cy .8s cubic-bezier(.34,1.2,.64,1)'}}/></g>
                        <g className="w2"><ellipse cx={VCX+6} cy={vesLiqTop+1.5} rx={VW/2-14} ry="2" fill="#bbdefb" fillOpacity=".15" style={{transition:'cy .8s cubic-bezier(.34,1.2,.64,1)'}}/></g>
                    </>)}
                </g>
                <rect x={VX} y={VY} width="6" height={VH} rx="3" fill="url(#gSL)"/>
                <rect x={VX+VW-6} y={VY} width="6" height={VH} rx="3" fill="url(#gSR)"/>
                <rect x={VX-1} y={VY-1} width={VW+2} height="11" rx="5.5" fill="url(#gVC)"/>
                <rect x={VX-1} y={VBot-10} width={VW+2} height="11" rx="5.5" fill="#081620" fillOpacity=".92"/>
                <rect x={VCX-11} y={VY-13} width="22" height="15" rx="3.5" fill="#16304a" stroke="#1e3d58" strokeWidth="1"/>
                <rect x={VCX-7} y={VY-18} width="14" height="7" rx="2.5" fill="#0f2438" stroke="#1e3d58" strokeWidth=".8"/>
                <rect x={VCX-11} y={VBot} width="22" height="13" rx="3.5" fill="#081620" stroke="#142a3a" strokeWidth="1"/>
                {[URV_Y,LRV_Y].map((y,i)=>(<g key={`vL${i}`}><rect x={VX-12} y={y-7} width="14" height="14" rx="2.8" fill="url(#gFl)" stroke="#0c1d2c" strokeWidth=".8"/>{[-4.5,4.5].map((dy,j)=>(<circle key={j} cx={VX-5.5} cy={y+dy} r="1.2" fill="#0c1d2c" stroke="#2a5070" strokeWidth=".4"/>))}</g>))}
                {[URV_Y,LRV_Y].map((y,i)=>(<g key={`vR${i}`}><rect x={VX+VW-2} y={y-7} width="14" height="14" rx="2.8" fill="url(#gFl)" stroke="#0c1d2c" strokeWidth=".8"/>{[-4.5,4.5].map((dy,j)=>(<circle key={j} cx={VX+VW+5.5} cy={y+dy} r="1.2" fill="#0c1d2c" stroke="#2a5070" strokeWidth=".4"/>))}</g>))}
                <line x1={VX+5} y1={URV_Y} x2={VX+VW-5} y2={URV_Y} stroke="#4a90b8" strokeWidth=".6" strokeDasharray="3.5,2" strokeOpacity=".50"/>
                <text x={VX+VW-7} y={URV_Y-3.5} fontSize="5.5" fontFamily="'SF Mono','Courier New',monospace" fill="#4a90b8" fillOpacity=".6" textAnchor="end" fontWeight="bold">URV</text>
                <line x1={VX+5} y1={LRV_Y} x2={VX+VW-5} y2={LRV_Y} stroke="#4a90b8" strokeWidth=".6" strokeDasharray="3.5,2" strokeOpacity=".50"/>
                <text x={VX+VW-7} y={LRV_Y+8} fontSize="5.5" fontFamily="'SF Mono','Courier New',monospace" fill="#4a90b8" fillOpacity=".6" textAnchor="end" fontWeight="bold">LRV</text>
            </g>

            {/* CONNECTION PIPES */}
            {[URV_Y,LRV_Y].map((y,i)=>(<g key={`cp${i}`}>
                <rect x={PIPE_LEFT} y={y-3.5} width={PIPE_RIGHT-PIPE_LEFT} height="7" rx="2.8" fill="url(#gPH)" stroke="#0a1820" strokeWidth=".7"/>
                <rect x={PIPE_LEFT} y={y-2.8} width={PIPE_RIGHT-PIPE_LEFT} height="2.2" rx="1" fill="#4a8aaa" fillOpacity=".32"/>
                <rect x={LG_X-10} y={y-8} width="12" height="16" rx="2.8" fill="url(#gFl)" stroke="#0a1820" strokeWidth=".8"/>
                {[-5,5].map((dy,j)=>(<circle key={j} cx={LG_X-4.5} cy={y+dy} r="1.2" fill="#0c1d2c" stroke="#2a5070" strokeWidth=".4"/>))}
            </g>))}

            {/* LEVEL GAUGE */}
            <g filter="url(#fST)">
                {hasTarget && lgFillH > 0 && (
                    <rect x={LG_X-3} y={lgFillY} width={LG_W+6} height={lgActiveBot-lgFillY} fill="url(#gLG)" filter="url(#fLgG)" className="gp" style={{transition:'all .8s cubic-bezier(.34,1.2,.64,1)'}}/>
                )}
                <rect x={LG_X} y={LG_TOP} width={LG_W} height={LG_H} rx="5.5" fill="url(#gTB)" stroke="#1e3d58" strokeWidth="2"/>
                <g clipPath="url(#cL)">
                    {hasTarget && lgFillH > 0 && (<>
                        <rect x={LG_X+3} y={lgFillY} width={LG_W-6} height={lgActiveBot-lgFillY} fill="url(#gLL)" filter="url(#fG)" style={{transition:'all .8s cubic-bezier(.34,1.2,.64,1)'}}/>
                        <ellipse cx={LG_X+LG_W/2} cy={lgFillY} rx={LG_W/2-3} ry="3" fill="#86efac" fillOpacity=".78" style={{transition:'all .8s cubic-bezier(.34,1.2,.64,1)'}}/>
                        <rect x={LG_X+5} y={lgFillY+3} width="4" height={Math.max(lgActiveBot-lgFillY-6,0)} rx="2" fill="#86efac" fillOpacity=".10" style={{transition:'all .8s ease'}}/>
                    </>)}
                </g>
                <rect x={LG_X} y={LG_TOP} width={LG_W} height={LG_H} rx="5.5" fill="url(#gGS)" opacity=".82"/>
                <rect x={LG_X+3} y={LG_TOP+5} width="4.5" height={LG_H-10} rx="2.2" fill="#e0f2fe" fillOpacity=".14"/>
                <rect x={LG_X-5} y={LG_TOP-7} width={LG_W+10} height="11" rx="3.8" fill="url(#gFl)" stroke="#0c1d2c" strokeWidth="1"/>
                {[-7,7].map((dx,i)=>(<circle key={i} cx={LG_X+LG_W/2+dx} cy={LG_TOP-1.5} r="1.4" fill="#0c1d2c" stroke="#1e3d58" strokeWidth=".4"/>))}
                <rect x={LG_X-5} y={LG_BOT-4} width={LG_W+10} height="11" rx="3.8" fill="url(#gFl)" stroke="#0c1d2c" strokeWidth="1"/>
                {[-7,7].map((dx,i)=>(<circle key={i} cx={LG_X+LG_W/2+dx} cy={LG_BOT+1.5} r="1.4" fill="#0c1d2c" stroke="#1e3d58" strokeWidth=".4"/>))}
            </g>

            {/* SCALE */}
            {[0,25,50,75,100].map(pct=>{const ty=lgActiveBot-(pct/100)*lgActiveH;return(<g key={pct}><line x1={LG_X+LG_W+3} y1={ty} x2={LG_X+LG_W+10} y2={ty} stroke="#4a8aaa" strokeWidth="1.4"/><text x={LG_X+LG_W+14} y={ty+3.5} fontSize="10" fontFamily="'SF Mono','Courier New',monospace" fontWeight="bold" fill="#5a9aba">{pct}</text></g>);})}
            {Array.from({length:21},(_,i)=>{if([0,5,10,15,20].includes(i))return null;const ty=lgActiveBot-(i/20)*lgActiveH;return <line key={i} x1={LG_X+LG_W+3} y1={ty} x2={LG_X+LG_W+7} y2={ty} stroke="#1e3d58" strokeWidth=".7"/>;})}

            {/* DIFF INDICATOR */}
            {hasCurrent && hasTarget && Math.abs(ltPct-lgPct)>0.5 && (<g>
                <line x1={LG_X+LG_W+12} y1={ltLevelOnLG} x2={LG_X+LG_W+12} y2={lgLevelOnLG} stroke="#f59e0b" strokeWidth="1.4" strokeDasharray="2.5,1.5" filter="url(#fD)" opacity=".65"/>
                <line x1={LG_X+LG_W+3} y1={ltLevelOnLG} x2={LG_X+LG_W+16} y2={ltLevelOnLG} stroke="#22d3ee" strokeWidth="1" strokeDasharray="2,1.2"/>
                <polygon points={ltPct<lgPct?`${LG_X+LG_W+9},${ltLevelOnLG+2.5} ${LG_X+LG_W+12},${ltLevelOnLG+7} ${LG_X+LG_W+15},${ltLevelOnLG+2.5}`:`${LG_X+LG_W+9},${ltLevelOnLG-2.5} ${LG_X+LG_W+12},${ltLevelOnLG-7} ${LG_X+LG_W+15},${ltLevelOnLG-2.5}`} fill="#f59e0b" fillOpacity=".55"/>
            </g>)}

            {/* LEAD LINES — H (right/inner) */}
            <g>
                <rect x={PORT_RIGHT_X} y={H_PORT_Y-3.5} width={LEAD_H_VERT_X-PORT_RIGHT_X+3} height="7" rx="2.5" fill="url(#gPH)" stroke="#0a1820" strokeWidth=".7"/>
                <rect x={PORT_RIGHT_X} y={H_PORT_Y-2.8} width={LEAD_H_VERT_X-PORT_RIGHT_X+3} height="2.2" rx="1" fill="#4a8aaa" fillOpacity=".28"/>
                <rect x={LEAD_H_VERT_X} y={URV_Y} width="7" height={H_PORT_Y-URV_Y} rx="2.5" fill="url(#gPp)" stroke="#0a1820" strokeWidth=".7"/>
                <rect x={LEAD_H_VERT_X+.5} y={URV_Y} width="2.2" height={H_PORT_Y-URV_Y} rx="1" fill="#4a8aaa" fillOpacity=".28"/>
                <rect x={LEAD_H_VERT_X+4} y={URV_Y-3.5} width={VX-12-LEAD_H_VERT_X-4} height="7" rx="2.5" fill="url(#gPH)" stroke="#0a1820" strokeWidth=".7"/>
                <rect x={LEAD_H_VERT_X+4} y={URV_Y-2.8} width={VX-12-LEAD_H_VERT_X-4} height="2.2" rx="1" fill="#4a8aaa" fillOpacity=".28"/>
                <rect x={LEAD_H_VERT_X-2} y={H_PORT_Y-5} width="11" height="11" rx="3" fill="url(#gFl)" stroke="#0a1820" strokeWidth=".6"/>
                <rect x={LEAD_H_VERT_X-2} y={URV_Y-5} width="11" height="11" rx="3" fill="url(#gFl)" stroke="#0a1820" strokeWidth=".6"/>
                <text x={LEAD_H_VERT_X+3.5} y={(H_PORT_Y+URV_Y)/2+2} fontSize="6.5" fontFamily="'SF Mono','Courier New',monospace" fontWeight="bold" fill="#5a9aba" textAnchor="middle" fillOpacity=".70">H</text>
            </g>
            {/* LEAD LINES — L (left/outer) */}
            <g>
                <rect x={PORT_RIGHT_X} y={L_PORT_Y-3.5} width={LEAD_L_VERT_X-PORT_RIGHT_X+3} height="7" rx="2.5" fill="url(#gPH)" stroke="#0a1820" strokeWidth=".7"/>
                <rect x={PORT_RIGHT_X} y={L_PORT_Y-2.8} width={LEAD_L_VERT_X-PORT_RIGHT_X+3} height="2.2" rx="1" fill="#4a8aaa" fillOpacity=".28"/>
                <rect x={LEAD_L_VERT_X} y={L_PORT_Y} width="7" height={LRV_Y-L_PORT_Y} rx="2.5" fill="url(#gPp)" stroke="#0a1820" strokeWidth=".7"/>
                <rect x={LEAD_L_VERT_X+.5} y={L_PORT_Y} width="2.2" height={LRV_Y-L_PORT_Y} rx="1" fill="#4a8aaa" fillOpacity=".28"/>
                <rect x={LEAD_L_VERT_X+4} y={LRV_Y-3.5} width={VX-12-LEAD_L_VERT_X-4} height="7" rx="2.5" fill="url(#gPH)" stroke="#0a1820" strokeWidth=".7"/>
                <rect x={LEAD_L_VERT_X+4} y={LRV_Y-2.8} width={VX-12-LEAD_L_VERT_X-4} height="2.2" rx="1" fill="#4a8aaa" fillOpacity=".28"/>
                <rect x={LEAD_L_VERT_X-2} y={L_PORT_Y-5} width="11" height="11" rx="3" fill="url(#gFl)" stroke="#0a1820" strokeWidth=".6"/>
                <rect x={LEAD_L_VERT_X-2} y={LRV_Y-5} width="11" height="11" rx="3" fill="url(#gFl)" stroke="#0a1820" strokeWidth=".6"/>
                <text x={LEAD_L_VERT_X+3.5} y={(L_PORT_Y+LRV_Y)/2+2} fontSize="6.5" fontFamily="'SF Mono','Courier New',monospace" fontWeight="bold" fill="#5a9aba" textAnchor="middle" fillOpacity=".70">L</text>
            </g>

            {/* YOKOGAWA TRANSMITTER */}
            <g filter="url(#fSL)">
                {/* SENSOR (top, silver) */}
                <rect x={LT_LEFT} y={SENS_TOP} width={LT_W} height={SENS_H} rx="6" fill="url(#gSn)" stroke="#585858" strokeWidth="1.5"/>
                <rect x={LT_LEFT} y={SENS_TOP} width={LT_W} height={SENS_H} rx="6" fill="url(#gSnS)" opacity=".38"/>
                {[0,1,2,3].map(i=>(<rect key={i} x={LT_LEFT} y={SENS_TOP+6+i*10} width={LT_W} height="5.5" rx="1" fill="#909090" fillOpacity=".15"/>))}
                <rect x={LT_LEFT} y={SENS_TOP} width={LT_W} height="8" rx="5.5" fill="#c8c8c8" fillOpacity=".48"/>
                <rect x={LT_LEFT} y={SENS_BOT-8} width={LT_W} height="8" rx="5.5" fill="#606060" fillOpacity=".42"/>
                {/* H/L ports RIGHT */}
                {[{y:H_PORT_Y,l:'H'},{y:L_PORT_Y,l:'L'}].map(({y,l},i)=>(<g key={`p${i}`}>
                    <rect x={LT_RIGHT-2} y={y-8} width="18" height="16" rx="3.5" fill="url(#gSn)" stroke="#484848" strokeWidth="1"/>
                    <rect x={LT_RIGHT-2} y={y-8} width="18" height="16" rx="3.5" fill="url(#gSnS)" opacity=".22"/>
                    <circle cx={LT_RIGHT+12} cy={y} r="3.8" fill="#222" stroke="#383838" strokeWidth=".7"/><circle cx={LT_RIGHT+12} cy={y} r="2" fill="#111"/>
                    <text x={LT_RIGHT+4} y={y+3} fontSize="5.5" fontFamily="'SF Mono','Courier New',monospace" fontWeight="bold" fill="#909090" textAnchor="middle">{l}</text>
                    {[-5.5,5.5].map((dy,j)=>(<circle key={j} cx={LT_RIGHT+14} cy={y+dy} r="1" fill="#383838" stroke="#585858" strokeWidth=".4"/>))}
                </g>))}
                <rect x={LT_CX-5} y={SENS_BOT} width="10" height="6" rx="2" fill="#a8a8a8" stroke="#606060" strokeWidth=".7"/>
                <circle cx={LT_CX} cy={SENS_BOT+3} r="2" fill="#505050" stroke="#707070" strokeWidth=".4"/>

                {/* COUPLING */}
                <rect x={LT_LEFT-2} y={COUP_TOP} width={LT_W+4} height={COUP_H} rx="4" fill="url(#gCp)" stroke="#0c1d2c" strokeWidth="1.1"/>
                {[2,5,8].map(dy=>(<line key={dy} x1={LT_LEFT-2} y1={COUP_TOP+dy} x2={LT_RIGHT+2} y2={COUP_TOP+dy} stroke="#142a3c" strokeWidth=".6" strokeOpacity=".55"/>))}
                <rect x={LT_LEFT-2} y={COUP_TOP} width={LT_W+4} height="3.5" rx="2.5" fill="#4a7888" fillOpacity=".38"/>
                {[-16,-8,0,8,16].map((dx,i)=>(<circle key={i} cx={LT_CX+dx} cy={COUP_TOP+COUP_H/2} r="1.3" fill="#0c1d2c" stroke="#2a5060" strokeWidth=".4"/>))}

                {/* AMPLIFIER (green) */}
                {[0,1,2,3,4,5].map(i=>(<rect key={i} x={LT_LEFT-4} y={AMP_TOP+i*10} width={LT_W+8} height="6" rx="1" fill="#1e3a28" fillOpacity=".42"/>))}
                <rect x={LT_LEFT-2} y={AMP_TOP} width={LT_W+4} height={AMP_H} rx="8" fill="url(#gAm)" stroke="#284a30" strokeWidth="1.6"/>
                <rect x={LT_LEFT-2} y={AMP_TOP} width={LT_W+4} height={AMP_H} rx="8" fill="url(#gAmS)" opacity=".62"/>
                <rect x={LT_LEFT-2} y={AMP_TOP} width={LT_W+4} height="9" rx="7" fill="#3e6848" fillOpacity=".48"/>
                <rect x={LT_LEFT-2} y={AMP_BOT-9} width={LT_W+4} height="9" rx="7" fill="#0f1e14" fillOpacity=".58"/>
                {[[LT_LEFT+5,AMP_TOP+7],[LT_RIGHT-5,AMP_TOP+7],[LT_LEFT+5,AMP_BOT-7],[LT_RIGHT-5,AMP_BOT-7]].map(([bx,by],i)=>(<g key={i}><circle cx={bx} cy={by} r="4" fill="#142018" stroke="#3a5c38" strokeWidth="1"/><circle cx={bx} cy={by} r="1.8" fill="#0a1410" stroke="#2a4028" strokeWidth=".4"/><circle cx={bx} cy={by} r="3" fill="none" stroke="#203820" strokeWidth=".7" strokeDasharray="1.8,1.2"/></g>))}
                {/* LCD */}
                <rect x={LT_CX-19} y={AMP_TOP+13} width="38" height="32" rx="4.5" fill="#0c1c14" stroke="#264030" strokeWidth="1.1"/>
                <rect x={LT_CX-16} y={AMP_TOP+16} width="32" height="26" rx="3.5" fill="#060f0a" stroke="#182010" strokeWidth=".7"/>
                <rect x={LT_CX-14} y={AMP_TOP+18} width="28" height="22" rx="2.5" fill="url(#gLd)"/>
                {hasCurrent&&(<rect x={LT_CX-14} y={AMP_TOP+18} width="28" height="22" rx="2.5" fill="#00e5ff" fillOpacity=".04"/>)}
                <text x={LT_CX} y={AMP_TOP+33} fontSize="10" fontFamily="'SF Mono','Courier New',monospace" fontWeight="bold" textAnchor="middle" fill={hasCurrent?"#00e5ff":"#0a2a1a"}>{hasCurrent?`${parseFloat(currPct).toFixed(1)}%`:'---%'}</text>
                <text x={LT_CX} y={AMP_TOP+39} fontSize="4.5" fontFamily="'SF Mono','Courier New',monospace" textAnchor="middle" fill={hasCurrent?"#007a8a":"#061510"}>LEVEL %</text>
                <circle cx={LT_CX+15} cy={AMP_TOP+16} r="2.5" fill={hasCurrent?"#00e5ff":"#0a2020"} stroke="#081818" strokeWidth=".4" filter={hasCurrent?"url(#fC)":undefined} className={hasCurrent?"lb":""}/>
                <text x={LT_CX} y={AMP_TOP+11} fontSize="4.2" fontFamily="'SF Mono','Courier New',monospace" textAnchor="middle" fill="#265a34" letterSpacing="1.2">EJX910A</text>
                <rect x={LT_CX-19} y={AMP_BOT-13} width="38" height="9" rx="2" fill="#0c1c14" stroke="#1e3020" strokeWidth=".7"/>
                <text x={LT_CX} y={AMP_BOT-6.5} fontSize="4.8" fontFamily="'SF Mono','Courier New',monospace" textAnchor="middle" fill="#3a6844" letterSpacing="1.8">YOKOGAWA</text>

                {/* CONDUIT */}
                <rect x={LT_CX-7} y={COND_TOP} width="14" height="14" rx="3.5" fill="#182e20" stroke="#264030" strokeWidth="1"/>
                <rect x={LT_CX-4.5} y={COND_TOP+12} width="9" height="4" rx="2" fill="#0f1e16" stroke="#1e3028" strokeWidth=".8"/>
                <circle cx={LT_CX-3} cy={COND_TOP+6} r="1.3" fill="#0c1a10" stroke="#385040" strokeWidth=".4"/>
                <circle cx={LT_CX+3} cy={COND_TOP+6} r="1.3" fill="#0c1a10" stroke="#385040" strokeWidth=".4"/>
            </g>
        </svg>
    );
}


/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function LevelTransmitter() {
    const [lrv, setLrv] = useState('');
    const [urv, setUrv] = useState('');
    const [currPct, setCurrPct] = useState('');
    const [targetPct, setTargetPct] = useState('');
    const [activeField, setActiveField] = useState(null);
    const [selection, setSelection] = useState({ start: 0, end: 0 });
    const inputRefs = useRef({ lrv:null, urv:null, curr:null, target:null });

    const handleFullReset = () => {
        if (navigator.vibrate) navigator.vibrate(50);
        setLrv(''); setUrv(''); setCurrPct(''); setTargetPct('');
        setActiveField(null);
    };
    const handleAdditionalCorrection = () => {
        if (!calculation) return;
        if (navigator.vibrate) navigator.vibrate([30,20,30]);
        setLrv(calculation.newLrv.toFixed(2));
        setUrv(calculation.newUrv.toFixed(2));
        setCurrPct(''); setTargetPct('');
        setActiveField(null);
    };

    useEffect(() => {
        if (activeField && inputRefs.current[activeField]) {
            const inp = inputRefs.current[activeField];
            inp.focus();
            inp.setSelectionRange(selection.start, selection.end);
        }
    }, [lrv,urv,currPct,targetPct,activeField,selection]);

    const calculation = useMemo(() => {
        const l=parseFloat(lrv),u=parseFloat(urv);
        const c=parseFloat(currPct),t=parseFloat(targetPct);
        if(isNaN(l)||isNaN(u)||isNaN(c)||isNaN(t)) return null;
        const span=u-l;
        const newL=(l+span*(c/100))-span*(t/100);
        return {
            newLrv:newL, newUrv:newL+span,
            inverted:l>u, span,
            error:(c-t)*span/100,
            deltaLevel:t-c,
            deltaMmH2O:(t-c)*span/100
        };
    },[lrv,urv,currPct,targetPct]);

    const handleInputFocus=(field,e)=>{ setActiveField(field); e.target.select(); };
    const handleSelect=(e)=>setSelection({start:e.target.selectionStart,end:e.target.selectionEnd});

    const handleKeypad=(key)=>{
        if(navigator.vibrate) navigator.vibrate(30);
        if(!activeField) return;
        let val,setVal;
        switch(activeField){
            case 'lrv':    val=lrv;       setVal=setLrv;       break;
            case 'urv':    val=urv;       setVal=setUrv;       break;
            case 'curr':   val=currPct;   setVal=setCurrPct;   break;
            case 'target': val=targetPct; setVal=setTargetPct; break;
            default: return;
        }
        const s=selection.start,e2=selection.end;
        const up=(v,c)=>{ setVal(v); setSelection({start:c,end:c}); };
        if(key==='CLR') up('',0);
        else if(key==='DEL'){
            if(s===e2&&s>0) up(val.slice(0,s-1)+val.slice(s),s-1);
            else if(s!==e2) up(val.slice(0,s)+val.slice(e2),s);
        }else if(key==='-'){
            if(val.startsWith('-')) up(val.substring(1),Math.max(0,s-1));
            else up('-'+val,s+1);
        }else{
            if(key==='.'&&val.includes('.')) return;
            if(val==='0'&&key!=='.'&&s===1) up(key,1);
            else up(val.slice(0,s)+key+val.slice(e2),s+1);
        }
    };

    const hasCurrent=currPct!==''&&!isNaN(parseFloat(currPct));
    const hasTarget =targetPct!==''&&!isNaN(parseFloat(targetPct));

    return (
        <div className="flex flex-col gap-2 h-full">

            {/* TOP CARD */}
            <div className="bg-card rounded-2xl border border-slate-800 shadow-xl flex-shrink-0 overflow-hidden">
                <div className="flex items-center justify-between px-4 pt-3 pb-2">
                    <div className="flex items-center gap-2">
                        <Waves className="w-4 h-4 text-slate-500"/>
                        <span className="text-xs font-bold text-slate-500 tracking-widest uppercase">Transmitter Setup</span>
                    </div>
                    <button onClick={handleFullReset}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-red-950/40 border border-red-900/40 text-red-500 rounded-lg text-xs font-bold hover:bg-red-900/40 active:scale-95 transition-all touch-manipulation">
                        <RotateCcw className="w-3 h-3"/>초기화
                    </button>
                </div>

                <div className="px-3 pb-2">
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="text-[10px] font-bold text-slate-600 tracking-widest uppercase">Range</span>
                        <div className="flex-1 h-px bg-slate-800"/>
                        <span className="text-[10px] text-slate-700 font-mono">mmH₂O</span>
                    </div>
                    <div style={{display:'flex',borderRadius:'0.75rem',overflow:'hidden',border:'1px solid rgba(100,116,139,0.4)'}}>
                        <div style={{flex:1}} className={`flex flex-col px-3 py-2.5 cursor-pointer transition-colors ${activeField==='lrv'?'bg-blue-950/50':'bg-black/70'}`}
                            onClick={()=>inputRefs.current.lrv?.focus()}>
                            <span className={`text-[10px] font-black tracking-widest mb-1 ${activeField==='lrv'?'text-blue-400':'text-slate-600'}`}>LRV</span>
                            <input ref={el=>inputRefs.current.lrv=el} type="text" inputMode="none"
                                value={lrv} onChange={()=>{}} onFocus={e=>handleInputFocus('lrv',e)} onSelect={handleSelect}
                                className={`w-full bg-transparent font-mono text-xl font-black outline-none placeholder:text-slate-700 placeholder:text-sm ${activeField==='lrv'?'text-white':'text-slate-300'}`}
                                placeholder="—"/>
                        </div>
                        <div style={{width:'64px',flexShrink:0,borderLeft:'1px solid rgba(100,116,139,0.4)',borderRight:'1px solid rgba(100,116,139,0.4)'}}
                            className="flex flex-col items-center justify-center py-2.5 bg-slate-900/60">
                            <span className="text-[9px] font-bold text-slate-600 tracking-widest mb-1">SPAN</span>
                            <span className={`font-mono text-sm font-black ${lrv!==''&&urv!==''&&!isNaN(parseFloat(lrv))&&!isNaN(parseFloat(urv))?'text-blue-400':'text-slate-700'}`}>
                                {lrv!==''&&urv!==''&&!isNaN(parseFloat(lrv))&&!isNaN(parseFloat(urv))?(parseFloat(urv)-parseFloat(lrv)).toFixed(0):'—'}
                            </span>
                        </div>
                        <div style={{flex:1}} className={`flex flex-col px-3 py-2.5 cursor-pointer transition-colors ${activeField==='urv'?'bg-blue-950/50':'bg-black/70'}`}
                            onClick={()=>inputRefs.current.urv?.focus()}>
                            <span className={`text-[10px] font-black tracking-widest mb-1 ${activeField==='urv'?'text-blue-400':'text-slate-600'}`}>URV</span>
                            <input ref={el=>inputRefs.current.urv=el} type="text" inputMode="none"
                                value={urv} onChange={()=>{}} onFocus={e=>handleInputFocus('urv',e)} onSelect={handleSelect}
                                className={`w-full bg-transparent font-mono text-xl font-black outline-none placeholder:text-slate-700 placeholder:text-sm ${activeField==='urv'?'text-white':'text-slate-300'}`}
                                placeholder="—"/>
                        </div>
                    </div>
                    {calculation?.inverted && (
                        <div className="mt-1.5 flex items-center gap-2 text-orange-400 bg-orange-900/20 border border-orange-900/40 px-3 py-1.5 rounded-lg animate-pulse">
                            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0"/>
                            <span className="text-[11px] font-bold">H/L 라인 역설치 감지됨</span>
                        </div>
                    )}
                </div>

                <div className="mx-3 h-px bg-slate-800"/>

                <div className="px-3 pt-2 pb-3">
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="text-[10px] font-bold text-slate-600 tracking-widest uppercase">지시값</span>
                        <div className="flex-1 h-px bg-slate-800"/>
                        <span className="text-[10px] text-slate-700 font-mono">%</span>
                    </div>
                    <div className="grid grid-cols-2 gap-0 rounded-xl overflow-hidden border border-slate-700/80">
                        <div className={`flex flex-col px-3 py-2.5 cursor-pointer border-r border-slate-700/80 transition-colors ${activeField==='curr'?'bg-cyan-950/35':'bg-black/70'}`}
                            onClick={()=>inputRefs.current.curr?.focus()}>
                            <span className={`text-[10px] font-bold tracking-wide mb-1 ${activeField==='curr'?'text-cyan-400':'text-slate-600'}`}>현재 지시값</span>
                            <input ref={el=>inputRefs.current.curr=el} type="text" inputMode="none"
                                value={currPct} onChange={()=>{}} onFocus={e=>handleInputFocus('curr',e)} onSelect={handleSelect}
                                className="w-full bg-transparent font-mono text-xl font-black text-cyan-400 outline-none placeholder:text-slate-700 placeholder:text-sm"
                                placeholder="—"/>
                        </div>
                        <div className={`flex flex-col px-3 py-2.5 cursor-pointer transition-colors ${activeField==='target'?'bg-green-950/30':'bg-black/70'}`}
                            onClick={()=>inputRefs.current.target?.focus()}>
                            <span className={`text-[10px] font-bold tracking-wide mb-1 ${activeField==='target'?'text-green-400':'text-slate-600'}`}>LG 값</span>
                            <input ref={el=>inputRefs.current.target=el} type="text" inputMode="none"
                                value={targetPct} onChange={()=>{}} onFocus={e=>handleInputFocus('target',e)} onSelect={handleSelect}
                                className="w-full bg-transparent font-mono text-xl font-black text-green-400 outline-none placeholder:text-slate-700 placeholder:text-sm"
                                placeholder="—"/>
                        </div>
                    </div>
                </div>
            </div>

            {/* LIVE VIEW */}
            <div className="bg-card rounded-2xl border border-slate-800 shadow-2xl overflow-hidden"
                 style={{flex:'1 1 auto',minHeight:'200px',display:'flex',flexDirection:'column'}}>
                <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/60 flex-shrink-0">
                    <div className="flex items-center gap-2 text-cyan-500">
                        <Droplets className="w-3.5 h-3.5"/>
                        <span className="text-[10px] font-bold tracking-widest uppercase">Live View</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-cyan-400"
                                style={{boxShadow:hasCurrent?'0 0 6px #00e5ff':'none'}}/>
                            <span className="text-[10px] text-slate-500">LT</span>
                            {hasCurrent&&<span className="text-[10px] font-mono text-cyan-400 font-bold">{parseFloat(currPct).toFixed(1)}%</span>}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-sm bg-green-400"
                                style={{boxShadow:hasTarget?'0 0 6px #22c55e':'none'}}/>
                            <span className="text-[10px] text-slate-500">LG</span>
                            {hasTarget&&<span className="text-[10px] font-mono text-green-400 font-bold">{parseFloat(targetPct).toFixed(1)}%</span>}
                        </div>
                        {calculation&&(
                            <div className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                                calculation.deltaLevel>0?'bg-amber-950/40 border-amber-800/50 text-amber-400'
                                :calculation.deltaLevel<0?'bg-amber-950/40 border-amber-800/50 text-amber-400'
                                :'bg-emerald-950/40 border-emerald-800/50 text-emerald-400'
                            }`}>
                                {calculation.deltaLevel>0?`▲ +${calculation.deltaLevel.toFixed(1)}%p`
                                    :calculation.deltaLevel<0?`▼ ${calculation.deltaLevel.toFixed(1)}%p`
                                    :'✓ 정상'}
                            </div>
                        )}
                    </div>
                </div>
                <div style={{flex:'1 1 auto',padding:'8px 2px 6px 2px'}}>
                    <LiveViewSVG currPct={currPct} targetPct={targetPct}/>
                </div>
            </div>

            {/* RESULTS */}
            <div className="bg-yellow-900/10 rounded-2xl border border-yellow-700/50 px-2 py-1.5 shadow-xl flex-shrink-0">
                <div className="flex items-center gap-2 mb-1.5 text-yellow-400">
                    <ArrowRight className="w-4 h-4"/>
                    <span className="text-sm font-bold">보정 결과값</span>
                </div>
                <div className="flex gap-2">
                    <div className="flex-1 bg-black/50 p-3 rounded-xl border border-yellow-700/30 text-center">
                        <div className="text-xs text-yellow-500 font-bold mb-1">New LRV</div>
                        <div className="font-mono text-2xl font-bold text-white">{calculation?calculation.newLrv.toFixed(2):'--'}</div>
                        <span className="text-slate-500 text-[10px]">mmH₂O</span>
                    </div>
                    <div className="flex-1 bg-black/50 p-3 rounded-xl border border-yellow-700/30 text-center">
                        <div className="text-xs text-yellow-500 font-bold mb-1">New URV</div>
                        <div className="font-mono text-2xl font-bold text-white">{calculation?calculation.newUrv.toFixed(2):'--'}</div>
                        <span className="text-slate-500 text-[10px]">mmH₂O</span>
                    </div>
                </div>
                <div className="mt-1.5 p-2 bg-black/30 rounded-xl text-center">
                    <p className="text-[10px] text-slate-500 font-mono">
                        New LRV = {lrv||'0'} + ({calculation?.error?.toFixed(2)||'0'}) = {calculation?.newLrv?.toFixed(2)||'--'}
                    </p>
                </div>
                <button onClick={handleAdditionalCorrection} disabled={!calculation}
                    className={`mt-2 w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 touch-manipulation
                        ${calculation
                            ?'bg-cyan-900/40 border border-cyan-600/60 text-cyan-300 hover:bg-cyan-800/50 shadow-[0_0_12px_rgba(34,211,238,0.15)]'
                            :'bg-slate-800/30 border border-slate-700/40 text-slate-600 cursor-not-allowed'}`}>
                    <RefreshCw className={`w-4 h-4 ${calculation?'text-cyan-400':'text-slate-600'}`}/>
                    추가 오차보정하기
                </button>
            </div>

            {/* KEYPAD */}
            {activeField&&(
                <div className="fixed bottom-0 left-0 right-0 bg-slate-950 border-t border-slate-800 p-2 z-50 animate-in slide-in-from-bottom duration-200 shadow-[0_-5px_20px_rgba(0,0,0,0.8)]">
                    <div className="px-1 mb-1.5">
                        <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">
                            {activeField==='lrv'?'LRV':activeField==='urv'?'URV':activeField==='curr'?'현재 지시값':'LG 값'}
                        </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 max-w-sm mx-auto">
                        {['1','2','3','DEL'].map(k=>(
                            <button key={k} onClick={()=>handleKeypad(k)}
                                className={`aspect-[4/3] rounded-2xl font-black flex items-center justify-center transition-all active:scale-95 shadow-lg ${k==='DEL'?'bg-red-900/60 text-red-400 text-base':'bg-slate-800 text-white text-3xl'}`}>
                                {k==='DEL'?<Delete className="w-6 h-6"/>:k}
                            </button>
                        ))}
                        {['4','5','6','CLR'].map(k=>(
                            <button key={k} onClick={()=>handleKeypad(k)}
                                className={`aspect-[4/3] rounded-2xl font-black flex items-center justify-center transition-all active:scale-95 shadow-lg ${k==='CLR'?'bg-orange-900/60 text-orange-400 text-base':'bg-slate-800 text-white text-3xl'}`}>
                                {k}
                            </button>
                        ))}
                        {['7','8','9','.'].map(k=>(
                            <button key={k} onClick={()=>handleKeypad(k)}
                                className={`aspect-[4/3] rounded-2xl font-black flex items-center justify-center transition-all active:scale-95 shadow-lg ${k==='.'?'bg-slate-700 text-blue-300 text-3xl':'bg-slate-800 text-white text-3xl'}`}>
                                {k}
                            </button>
                        ))}
                        <button onClick={()=>handleKeypad('-')}
                            className="aspect-[4/3] rounded-2xl font-black flex items-center justify-center transition-all active:scale-95 shadow-lg bg-slate-700 text-blue-300 text-4xl">-</button>
                        <button onClick={()=>handleKeypad('0')}
                            className="aspect-[4/3] rounded-2xl font-black flex items-center justify-center transition-all active:scale-95 shadow-lg bg-slate-800 text-white text-3xl">0</button>
                        <button onClick={()=>setActiveField(null)}
                            className="col-span-2 aspect-[8/3] rounded-2xl font-black flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-lg bg-emerald-700 hover:bg-emerald-600 text-white text-base tracking-wide touch-manipulation">
                            ✓ 입력완료
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
