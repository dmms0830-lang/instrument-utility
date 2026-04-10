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

    /* ═══════════════════════════════════════════════════════
       HORIZONTAL CENTERED LAYOUT — viewBox 480×300
       [LT]  ╲Lead Lines╲  [Vessel]  ─Pipes─  [LG│Scale]
       
       LT order (top→bottom):
         Amplifier (green/Head) → Coupling → Sensor (silver/Body, H/L ports)
       
       Lead lines: DIAGONAL, no bends (self-draining, anti-plugging)
       LRV = 1/5 vessel height, URV = 4/5 vessel height
       LG height spans LRV~URV
       All bottom-aligned at y=282
    ═══════════════════════════════════════════════════════ */
    const W = 480, HH = 300;
    const BOT = 282, TOP = 12;

    // ── VESSEL ──
    const VX = 190, VW = 118, VY = TOP, VH = BOT - VY, VBot = BOT;
    const VCX = VX + VW / 2;

    // ── Taps: URV at 4/5, LRV at 1/5 from bottom ──
    const URV_Y = VBot - 0.80 * VH;
    const LRV_Y = VBot - 0.20 * VH;

    // ── LEVEL GAUGE ──
    const lgM = (LRV_Y - URV_Y) * 0.05;
    const LG_X = 362, LG_W = 26;
    const LG_TOP = URV_Y - lgM;
    const LG_BOT = LRV_Y + lgM;
    const LG_H = LG_BOT - LG_TOP;
    const lgAT = URV_Y, lgAB = LRV_Y, lgAH = lgAB - lgAT;
    const lgFH = (lgPct / 100) * lgAH;
    const lgFY = lgAB - lgFH;

    // ── TRANSMITTER (left, bottom-aligned) ──
    // Order top→bottom: Amplifier(head) → Coupling → Sensor(body) → Conduit
    const LT_W = 56, LT_CX = 82;
    const LT_L = LT_CX - LT_W / 2, LT_R = LT_CX + LT_W / 2;

    const AMP_H = 68, COUP_H = 10, SENS_H = 58, COND_H = 12;
    const LT_TOTAL = AMP_H + COUP_H + SENS_H + COND_H;
    const LT_TOP = BOT - LT_TOTAL;

    const AMP_TOP = LT_TOP, AMP_BOT = AMP_TOP + AMP_H;
    const COUP_TOP = AMP_BOT, COUP_BOT = COUP_TOP + COUP_H;
    const SENS_TOP = COUP_BOT, SENS_BOT = SENS_TOP + SENS_H;
    const COND_TOP = SENS_BOT;

    // H/L ports on sensor RIGHT side
    const H_PORT_Y = SENS_TOP + 14;
    const L_PORT_Y = SENS_BOT - 14;
    const PORT_EX = LT_R + 16; // port tip X

    // ── DIAGONAL LEAD LINES (vessel tap → sensor port, straight, no bends) ──
    // H: from vessel LEFT upper tap straight diagonal to sensor H port
    // L: from vessel LEFT lower tap straight diagonal to sensor L port

    // ── Vessel liquid ──
    const mR = LRV_Y - URV_Y;
    const vLT = LRV_Y - (lgPct / 100) * mR;
    const vLH = VBot - vLT;

    // ── Connection pipes (vessel right → LG) ──
    const PP_L = VX + VW + 7, PP_R = LG_X - 2;

    // ── Level diff indicator ──
    const ltOnLG = lgAB - (ltPct / 100) * lgAH;
    const lgOnLG = lgFY;

    return (
        <svg viewBox={`0 0 ${W} ${HH}`} xmlns="http://www.w3.org/2000/svg"
             preserveAspectRatio="xMidYMid meet"
             style={{ width:'100%', height:'100%', display:'block' }}>
            <defs>
                <style>{`
                    @keyframes wv1{0%,100%{transform:translateX(0)}50%{transform:translateX(4px)}}
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
                <linearGradient id="gPH" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#3a6a88"/><stop offset="50%" stopColor="#1e4460"/><stop offset="100%" stopColor="#0e2438"/></linearGradient>
                <linearGradient id="gFl" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4a7a9a"/><stop offset="50%" stopColor="#2a5870"/><stop offset="100%" stopColor="#163848"/></linearGradient>
                <linearGradient id="gSn" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#787878"/><stop offset="35%" stopColor="#b0b0b0"/><stop offset="60%" stopColor="#c8c8c8"/><stop offset="100%" stopColor="#808080"/></linearGradient>
                <linearGradient id="gSnS" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#fff" stopOpacity=".42"/><stop offset="100%" stopColor="#fff" stopOpacity="0"/></linearGradient>
                <linearGradient id="gAm" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#1a3320"/><stop offset="40%" stopColor="#2d5035"/><stop offset="70%" stopColor="#2a4a30"/><stop offset="100%" stopColor="#182e1e"/></linearGradient>
                <linearGradient id="gAmS" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#6ab87a" stopOpacity=".52"/><stop offset="50%" stopColor="#8ad09a" stopOpacity=".22"/><stop offset="100%" stopColor="#6ab87a" stopOpacity="0"/></linearGradient>
                <linearGradient id="gCp" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4a7888"/><stop offset="50%" stopColor="#244a5a"/><stop offset="100%" stopColor="#122838"/></linearGradient>
                <linearGradient id="gLd" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#091a0c"/><stop offset="100%" stopColor="#040e06"/></linearGradient>
                <linearGradient id="gPipe" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3a6a88"/><stop offset="50%" stopColor="#1e4460"/><stop offset="100%" stopColor="#0e2438"/></linearGradient>
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
            <g opacity=".04">
                {Array.from({length:11},(_,i)=>{const y=TOP+i*(BOT-TOP)/10;return <line key={`h${i}`} x1={20} y1={y} x2={W-20} y2={y} stroke="#4a8ab0" strokeWidth=".5"/>;})}
                {Array.from({length:10},(_,i)=>{const x=40+i*(W-80)/9;return <line key={`v${i}`} x1={x} y1={TOP} x2={x} y2={BOT} stroke="#4a8ab0" strokeWidth=".5"/>;})}
            </g>

            {/* ═══════ VESSEL ═══════ */}
            <g filter="url(#fS)" opacity=".88">
                <rect x={VX} y={VY} width={VW} height={VH} rx="7" fill="url(#gVB)" stroke="#1e3d58" strokeWidth="1.8"/>
                <g clipPath="url(#cV)">
                    {hasTarget && vLH > 0 && (<>
                        <rect x={VX+3} y={vLT} width={VW-6} height={vLH} fill="url(#gVL)" style={{transition:'all .8s cubic-bezier(.34,1.2,.64,1)'}}/>
                        <rect x={VX+3} y={vLT} width={VW-6} height={vLH} fill="url(#gVLS)" style={{transition:'all .8s cubic-bezier(.34,1.2,.64,1)'}}/>
                        <g className="w1"><ellipse cx={VCX} cy={vLT} rx={VW/2-4} ry="3.5" fill="#e1f5fe" fillOpacity=".30" style={{transition:'cy .8s cubic-bezier(.34,1.2,.64,1)'}}/></g>
                        <g className="w2"><ellipse cx={VCX+5} cy={vLT+1.5} rx={VW/2-14} ry="2" fill="#bbdefb" fillOpacity=".14" style={{transition:'cy .8s cubic-bezier(.34,1.2,.64,1)'}}/></g>
                    </>)}
                </g>
                <rect x={VX} y={VY} width="6" height={VH} rx="3" fill="url(#gSL)"/>
                <rect x={VX+VW-6} y={VY} width="6" height={VH} rx="3" fill="url(#gSR)"/>
                <rect x={VX-1} y={VY-1} width={VW+2} height="10" rx="5" fill="url(#gVC)"/>
                <rect x={VX-1} y={VBot-9} width={VW+2} height="10" rx="5" fill="#081620" fillOpacity=".92"/>
                <rect x={VCX-10} y={VY-12} width="20" height="14" rx="3" fill="#16304a" stroke="#1e3d58" strokeWidth="1"/>
                <rect x={VCX-6} y={VY-17} width="12" height="7" rx="2.5" fill="#0f2438" stroke="#1e3d58" strokeWidth=".8"/>
                <rect x={VCX-10} y={VBot} width="20" height="12" rx="3" fill="#081620" stroke="#142a3a" strokeWidth="1"/>
                {/* LEFT taps */}
                {[URV_Y,LRV_Y].map((y,i)=>(<g key={`vL${i}`}><rect x={VX-11} y={y-6.5} width="13" height="13" rx="2.5" fill="url(#gFl)" stroke="#0c1d2c" strokeWidth=".8"/>{[-4,4].map((dy,j)=>(<circle key={j} cx={VX-5} cy={y+dy} r="1.1" fill="#0c1d2c" stroke="#2a5070" strokeWidth=".4"/>))}</g>))}
                {/* RIGHT taps */}
                {[URV_Y,LRV_Y].map((y,i)=>(<g key={`vR${i}`}><rect x={VX+VW-2} y={y-6.5} width="13" height="13" rx="2.5" fill="url(#gFl)" stroke="#0c1d2c" strokeWidth=".8"/>{[-4,4].map((dy,j)=>(<circle key={j} cx={VX+VW+5} cy={y+dy} r="1.1" fill="#0c1d2c" stroke="#2a5070" strokeWidth=".4"/>))}</g>))}
                <line x1={VX+5} y1={URV_Y} x2={VX+VW-5} y2={URV_Y} stroke="#4a90b8" strokeWidth=".6" strokeDasharray="3,2" strokeOpacity=".50"/>
                <text x={VX+VW-6} y={URV_Y-3} fontSize="5" fontFamily="'SF Mono',monospace" fill="#4a90b8" fillOpacity=".6" textAnchor="end" fontWeight="bold">URV</text>
                <line x1={VX+5} y1={LRV_Y} x2={VX+VW-5} y2={LRV_Y} stroke="#4a90b8" strokeWidth=".6" strokeDasharray="3,2" strokeOpacity=".50"/>
                <text x={VX+VW-6} y={LRV_Y+7.5} fontSize="5" fontFamily="'SF Mono',monospace" fill="#4a90b8" fillOpacity=".6" textAnchor="end" fontWeight="bold">LRV</text>
            </g>

            {/* ═══════ PIPES Vessel→LG ═══════ */}
            {[URV_Y,LRV_Y].map((y,i)=>(<g key={`cp${i}`}>
                <rect x={PP_L} y={y-3} width={PP_R-PP_L} height="6" rx="2.5" fill="url(#gPH)" stroke="#0a1820" strokeWidth=".7"/>
                <rect x={PP_L} y={y-2.2} width={PP_R-PP_L} height="2" rx="1" fill="#4a8aaa" fillOpacity=".30"/>
                <rect x={LG_X-9} y={y-7} width="11" height="14" rx="2.5" fill="url(#gFl)" stroke="#0a1820" strokeWidth=".8"/>
                {[-4.5,4.5].map((dy,j)=>(<circle key={j} cx={LG_X-4} cy={y+dy} r="1.1" fill="#0c1d2c" stroke="#2a5070" strokeWidth=".4"/>))}
            </g>))}

            {/* ═══════ LEVEL GAUGE ═══════ */}
            <g filter="url(#fST)">
                {hasTarget && lgFH > 0 && (
                    <rect x={LG_X-3} y={lgFY} width={LG_W+6} height={lgAB-lgFY} fill="url(#gLG)" filter="url(#fLgG)" className="gp" style={{transition:'all .8s cubic-bezier(.34,1.2,.64,1)'}}/>
                )}
                <rect x={LG_X} y={LG_TOP} width={LG_W} height={LG_H} rx="5" fill="url(#gTB)" stroke="#1e3d58" strokeWidth="2"/>
                <g clipPath="url(#cL)">
                    {hasTarget && lgFH > 0 && (<>
                        <rect x={LG_X+3} y={lgFY} width={LG_W-6} height={lgAB-lgFY} fill="url(#gLL)" filter="url(#fG)" style={{transition:'all .8s cubic-bezier(.34,1.2,.64,1)'}}/>
                        <ellipse cx={LG_X+LG_W/2} cy={lgFY} rx={LG_W/2-3} ry="2.8" fill="#86efac" fillOpacity=".78" style={{transition:'all .8s cubic-bezier(.34,1.2,.64,1)'}}/>
                        <rect x={LG_X+4.5} y={lgFY+3} width="3.5" height={Math.max(lgAB-lgFY-6,0)} rx="1.8" fill="#86efac" fillOpacity=".10" style={{transition:'all .8s ease'}}/>
                    </>)}
                </g>
                <rect x={LG_X} y={LG_TOP} width={LG_W} height={LG_H} rx="5" fill="url(#gGS)" opacity=".82"/>
                <rect x={LG_X+3} y={LG_TOP+4} width="4" height={LG_H-8} rx="2" fill="#e0f2fe" fillOpacity=".13"/>
                <rect x={LG_X-5} y={LG_TOP-6} width={LG_W+10} height="10" rx="3.5" fill="url(#gFl)" stroke="#0c1d2c" strokeWidth="1"/>
                {[-7,7].map((dx,i)=>(<circle key={i} cx={LG_X+LG_W/2+dx} cy={LG_TOP-1} r="1.3" fill="#0c1d2c" stroke="#1e3d58" strokeWidth=".4"/>))}
                <rect x={LG_X-5} y={LG_BOT-4} width={LG_W+10} height="10" rx="3.5" fill="url(#gFl)" stroke="#0c1d2c" strokeWidth="1"/>
                {[-7,7].map((dx,i)=>(<circle key={i} cx={LG_X+LG_W/2+dx} cy={LG_BOT+1} r="1.3" fill="#0c1d2c" stroke="#1e3d58" strokeWidth=".4"/>))}
            </g>

            {/* ═══════ SCALE ═══════ */}
            {[0,25,50,75,100].map(pct=>{const ty=lgAB-(pct/100)*lgAH;return(<g key={pct}><line x1={LG_X+LG_W+3} y1={ty} x2={LG_X+LG_W+9} y2={ty} stroke="#4a8aaa" strokeWidth="1.3"/><text x={LG_X+LG_W+13} y={ty+3.5} fontSize="9.5" fontFamily="'SF Mono',monospace" fontWeight="bold" fill="#5a9aba">{pct}</text></g>);})}
            {Array.from({length:21},(_,i)=>{if([0,5,10,15,20].includes(i))return null;const ty=lgAB-(i/20)*lgAH;return <line key={i} x1={LG_X+LG_W+3} y1={ty} x2={LG_X+LG_W+6.5} y2={ty} stroke="#1e3d58" strokeWidth=".6"/>;})}

            {/* ═══════ DIFF INDICATOR ═══════ */}
            {hasCurrent && hasTarget && Math.abs(ltPct-lgPct)>0.5 && (<g>
                <line x1={LG_X+LG_W+11} y1={ltOnLG} x2={LG_X+LG_W+11} y2={lgOnLG} stroke="#f59e0b" strokeWidth="1.3" strokeDasharray="2.5,1.5" filter="url(#fD)" opacity=".60"/>
                <line x1={LG_X+LG_W+3} y1={ltOnLG} x2={LG_X+LG_W+15} y2={ltOnLG} stroke="#22d3ee" strokeWidth="1" strokeDasharray="2,1"/>
                <polygon points={ltPct<lgPct?`${LG_X+LG_W+8},${ltOnLG+2} ${LG_X+LG_W+11},${ltOnLG+6} ${LG_X+LG_W+14},${ltOnLG+2}`:`${LG_X+LG_W+8},${ltOnLG-2} ${LG_X+LG_W+11},${ltOnLG-6} ${LG_X+LG_W+14},${ltOnLG-2}`} fill="#f59e0b" fillOpacity=".55"/>
            </g>)}

            {/* ═══════ DIAGONAL LEAD LINES (no bends, self-draining slope) ═══════ */}
            {/* H lead: vessel upper tap → sensor H port (diagonal down-left) */}
            <line x1={VX-11} y1={URV_Y} x2={PORT_EX} y2={H_PORT_Y}
                stroke="#1e4460" strokeWidth="6" strokeLinecap="round"/>
            <line x1={VX-11} y1={URV_Y} x2={PORT_EX} y2={H_PORT_Y}
                stroke="#3a7a9a" strokeWidth="2.5" strokeLinecap="round" strokeOpacity=".35"/>
            {/* H label */}
            <text x={(VX-11+PORT_EX)/2-8} y={(URV_Y+H_PORT_Y)/2+3}
                fontSize="7" fontFamily="'SF Mono',monospace" fontWeight="bold"
                fill="#5a9aba" fillOpacity=".70">H</text>

            {/* L lead: vessel lower tap → sensor L port (diagonal down-left) */}
            <line x1={VX-11} y1={LRV_Y} x2={PORT_EX} y2={L_PORT_Y}
                stroke="#1e4460" strokeWidth="6" strokeLinecap="round"/>
            <line x1={VX-11} y1={LRV_Y} x2={PORT_EX} y2={L_PORT_Y}
                stroke="#3a7a9a" strokeWidth="2.5" strokeLinecap="round" strokeOpacity=".35"/>
            {/* L label */}
            <text x={(VX-11+PORT_EX)/2-8} y={(LRV_Y+L_PORT_Y)/2+3}
                fontSize="7" fontFamily="'SF Mono',monospace" fontWeight="bold"
                fill="#5a9aba" fillOpacity=".70">L</text>

            {/* Vessel-side flanges on lead lines */}
            {[URV_Y,LRV_Y].map((y,i)=>(<rect key={`lf${i}`} x={VX-16} y={y-5} width="7" height="10" rx="2" fill="url(#gFl)" stroke="#0a1820" strokeWidth=".6"/>))}
            {/* Sensor-side flanges on lead lines */}
            {[H_PORT_Y,L_PORT_Y].map((y,i)=>(<rect key={`sf${i}`} x={PORT_EX-2} y={y-5} width="7" height="10" rx="2" fill="url(#gFl)" stroke="#0a1820" strokeWidth=".6"/>))}

            {/* ═══════ YOKOGAWA TRANSMITTER ═══════ */}
            <g filter="url(#fSL)">

                {/* ── AMPLIFIER HOUSING (green/Head) — TOP ── */}
                {[0,1,2,3,4,5,6].map(i=>(<rect key={i} x={LT_L-4} y={AMP_TOP+i*9} width={LT_W+8} height="5.5" rx="1" fill="#1e3a28" fillOpacity=".38"/>))}
                <rect x={LT_L-2} y={AMP_TOP} width={LT_W+4} height={AMP_H} rx="8" fill="url(#gAm)" stroke="#284a30" strokeWidth="1.6"/>
                <rect x={LT_L-2} y={AMP_TOP} width={LT_W+4} height={AMP_H} rx="8" fill="url(#gAmS)" opacity=".60"/>
                <rect x={LT_L-2} y={AMP_TOP} width={LT_W+4} height="9" rx="7" fill="#3e6848" fillOpacity=".48"/>
                <rect x={LT_L-2} y={AMP_BOT-9} width={LT_W+4} height="9" rx="7" fill="#0f1e14" fillOpacity=".55"/>
                {/* Corner bolts */}
                {[[LT_L+5,AMP_TOP+7],[LT_R-5,AMP_TOP+7],[LT_L+5,AMP_BOT-7],[LT_R-5,AMP_BOT-7]].map(([bx,by],i)=>(<g key={i}><circle cx={bx} cy={by} r="3.8" fill="#142018" stroke="#3a5c38" strokeWidth="1"/><circle cx={bx} cy={by} r="1.7" fill="#0a1410" stroke="#2a4028" strokeWidth=".4"/><circle cx={bx} cy={by} r="2.8" fill="none" stroke="#203820" strokeWidth=".6" strokeDasharray="1.6,1"/></g>))}
                {/* LCD — LARGER, less bezel */}
                <rect x={LT_CX-22} y={AMP_TOP+10} width="44" height="42" rx="5" fill="#0c1c14" stroke="#264030" strokeWidth="1"/>
                <rect x={LT_CX-20} y={AMP_TOP+12} width="40" height="38" rx="4" fill="url(#gLd)"/>
                {hasCurrent&&(<rect x={LT_CX-20} y={AMP_TOP+12} width="40" height="38" rx="4" fill="#00e5ff" fillOpacity=".04"/>)}
                <text x={LT_CX} y={AMP_TOP+38} fontSize="14" fontFamily="'SF Mono',monospace" fontWeight="bold" textAnchor="middle" fill={hasCurrent?"#00e5ff":"#0a2a1a"}>{hasCurrent?`${parseFloat(currPct).toFixed(1)}%`:'---%'}</text>
                <text x={LT_CX} y={AMP_TOP+46} fontSize="5" fontFamily="'SF Mono',monospace" textAnchor="middle" fill={hasCurrent?"#007a8a":"#061510"}>LEVEL %</text>
                {/* LED */}
                <circle cx={LT_CX+18} cy={AMP_TOP+14} r="2.5" fill={hasCurrent?"#00e5ff":"#0a2020"} stroke="#081818" strokeWidth=".4" filter={hasCurrent?"url(#fC)":undefined} className={hasCurrent?"lb":""}/>
                {/* Model */}
                <text x={LT_CX-18} y={AMP_TOP+17} fontSize="3.8" fontFamily="'SF Mono',monospace" fill="#265a34" letterSpacing="1">EJX910A</text>
                {/* Nameplate */}
                <rect x={LT_CX-18} y={AMP_BOT-15} width="36" height="9" rx="2" fill="#0c1c14" stroke="#1e3020" strokeWidth=".6"/>
                <text x={LT_CX} y={AMP_BOT-8.5} fontSize="4.5" fontFamily="'SF Mono',monospace" textAnchor="middle" fill="#3a6844" letterSpacing="1.8">YOKOGAWA</text>

                {/* ── COUPLING RING ── */}
                <rect x={LT_L-2} y={COUP_TOP} width={LT_W+4} height={COUP_H} rx="3.5" fill="url(#gCp)" stroke="#0c1d2c" strokeWidth="1"/>
                {[2,5,8].map(dy=>(<line key={dy} x1={LT_L-2} y1={COUP_TOP+dy} x2={LT_R+2} y2={COUP_TOP+dy} stroke="#142a3c" strokeWidth=".5" strokeOpacity=".5"/>))}
                <rect x={LT_L-2} y={COUP_TOP} width={LT_W+4} height="3" rx="2" fill="#4a7888" fillOpacity=".35"/>
                {[-14,-7,0,7,14].map((dx,i)=>(<circle key={i} cx={LT_CX+dx} cy={COUP_TOP+COUP_H/2} r="1.2" fill="#0c1d2c" stroke="#2a5060" strokeWidth=".4"/>))}

                {/* ── SENSOR CAPSULE (silver/Body) — BOTTOM, with H/L ports ── */}
                <rect x={LT_L} y={SENS_TOP} width={LT_W} height={SENS_H} rx="6" fill="url(#gSn)" stroke="#585858" strokeWidth="1.5"/>
                <rect x={LT_L} y={SENS_TOP} width={LT_W} height={SENS_H} rx="6" fill="url(#gSnS)" opacity=".35"/>
                {[0,1,2,3,4].map(i=>(<rect key={i} x={LT_L} y={SENS_TOP+5+i*10} width={LT_W} height="5" rx="1" fill="#909090" fillOpacity=".14"/>))}
                <rect x={LT_L} y={SENS_TOP} width={LT_W} height="7" rx="5" fill="#c8c8c8" fillOpacity=".45"/>
                <rect x={LT_L} y={SENS_BOT-7} width={LT_W} height="7" rx="5" fill="#606060" fillOpacity=".40"/>
                {/* H/L ports RIGHT */}
                {[{y:H_PORT_Y,l:'H'},{y:L_PORT_Y,l:'L'}].map(({y,l},i)=>(<g key={`p${i}`}>
                    <rect x={LT_R-2} y={y-7} width="16" height="14" rx="3" fill="url(#gSn)" stroke="#484848" strokeWidth=".9"/>
                    <rect x={LT_R-2} y={y-7} width="16" height="14" rx="3" fill="url(#gSnS)" opacity=".20"/>
                    <circle cx={LT_R+10} cy={y} r="3.5" fill="#222" stroke="#383838" strokeWidth=".6"/><circle cx={LT_R+10} cy={y} r="1.8" fill="#111"/>
                    <text x={LT_R+3} y={y+2.5} fontSize="5" fontFamily="'SF Mono',monospace" fontWeight="bold" fill="#909090" textAnchor="middle">{l}</text>
                    {[-5,5].map((dy,j)=>(<circle key={j} cx={LT_R+12} cy={y+dy} r=".9" fill="#383838" stroke="#585858" strokeWidth=".3"/>))}
                </g>))}
                {/* Drain */}
                <rect x={LT_CX-4.5} y={SENS_BOT} width="9" height="5" rx="2" fill="#a8a8a8" stroke="#606060" strokeWidth=".6"/>
                <circle cx={LT_CX} cy={SENS_BOT+2.5} r="1.8" fill="#505050" stroke="#707070" strokeWidth=".4"/>

                {/* ── CONDUIT ── */}
                <rect x={LT_CX-6} y={COND_TOP} width="12" height="12" rx="3" fill="#182e20" stroke="#264030" strokeWidth=".9"/>
                <rect x={LT_CX-4} y={COND_TOP+10} width="8" height="4" rx="2" fill="#0f1e16" stroke="#1e3028" strokeWidth=".7"/>
                <circle cx={LT_CX-2.5} cy={COND_TOP+5} r="1.2" fill="#0c1a10" stroke="#385040" strokeWidth=".3"/>
                <circle cx={LT_CX+2.5} cy={COND_TOP+5} r="1.2" fill="#0c1a10" stroke="#385040" strokeWidth=".3"/>
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
                 style={{flex:'1 1 auto',minHeight:'180px',display:'flex',flexDirection:'column'}}>
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
