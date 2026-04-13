import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, PerspectiveCamera, useTexture } from '@react-three/drei';
import * as THREE from 'three';

const BG_Z = -2.5, FG_Z = 1.0;
const LG_Z_OFFSET = 1.6; // Level Gauge 추가 전진량
const LT_Z_OFFSET = 0.7; // Transmitter 추가 전진량 — 이 값만 바꾸면 PNG+LCD 동시 이동

// VESSEL (월드 좌표)
const V_R = 0.70, V_H = 3.6, V_BOT = -V_H / 2;
const URV_Y = V_BOT + 0.80 * V_H, LRV_Y = V_BOT + 0.20 * V_H;
const MEAS = URV_Y - LRV_Y;

// TRANSMITTER
const LT_X = -1.25, LT_W = 0.82, LT_D = 0.55;
const AMP_H = 1.10, COUP_H = 0.10, SENS_H = 0.85, COND_H = 0.16;
const LT_BOT = V_BOT;
const COND_BOT = LT_BOT, SENS_BOT = COND_BOT + COND_H, SENS_TOP = SENS_BOT + SENS_H;
const COUP_BOT = SENS_TOP, AMP_BOT = COUP_BOT + COUP_H, AMP_TOP = AMP_BOT + AMP_H;
const H_PORT_Y = SENS_BOT + SENS_H * 0.30, L_PORT_Y = SENS_BOT + SENS_H * 0.70;
const LT_R = LT_X + LT_W / 2, PORT_TIP_X = LT_R + 0.25;
const ampCY = (AMP_BOT + AMP_TOP) / 2;

// Transmitter 전체 높이 (PNG가 커버하는 범위)
const TX_TOTAL_H = AMP_TOP - LT_BOT; // conduit 바닥 ~ 앰프 상단
const TX_CY = (LT_BOT + AMP_TOP) / 2 + 0.2;

// LEVEL GAUGE (월드 좌표)
const LG_X = 1.15, LG_W = 0.30, LG_D = 0.22;
const LG_MARGIN = MEAS * 0.04;
const LG_BOT_Y = LRV_Y - LG_MARGIN;
const LG_TOP_Y = URV_Y + LG_MARGIN;
const LG_H = LG_TOP_Y - LG_BOT_Y;
const LG_CY = (LG_BOT_Y + LG_TOP_Y) / 2;
const LG_LEFT = LG_X - LG_W / 2;

// 뷰글라스
const VG_W = LG_W * 0.40;
const VG_PAD = 0.02;
const VG_BOT_WORLD = LRV_Y;           // 액체 fill 시작점 = LRV_Y (0% 기준)
const VG_TOP_WORLD = URV_Y;           // 액체 fill 끝점   = URV_Y (100% 기준)
const VG_H_WORLD = MEAS;             // fill 높이 = URV_Y - LRV_Y
const VG_Z_WORLD = FG_Z + LG_D / 2 + 0.022;

// ── HELPERS ──
function Pipe({ from, to, radius = 0.035, color = '#4a6a78', roughness = 0.3, metalness = 0.85, emissive, emI = 0 }) {
    const g = useMemo(() => {
        const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to), l = a.distanceTo(b);
        if (l < 0.001) return null;
        return { mid: a.clone().add(b).multiplyScalar(0.5), q: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()), len: l };
    }, [from, to]);
    if (!g) return null;
    return <mesh position={g.mid} quaternion={g.q}><cylinderGeometry args={[radius, radius, g.len, 16]} /><meshStandardMaterial color={color} roughness={roughness} metalness={metalness} emissive={emissive || '#000'} emissiveIntensity={emI} /></mesh>;
}
function Elbow({ position, r = 0.05 }) {
    return <mesh position={position}><sphereGeometry args={[r, 12, 12]} /><meshStandardMaterial color="#3a5a70" roughness={0.25} metalness={0.88} /></mesh>;
}
function Flange({ position, rotation = [0, 0, 0], r = 0.075 }) {
    return <group position={position} rotation={rotation}>
        <mesh><cylinderGeometry args={[r, r, 0.03, 16]} /><meshStandardMaterial color="#3a5a70" roughness={0.22} metalness={0.88} /></mesh>
        {[0, 90, 180, 270].map(a => { const rd = a * Math.PI / 180; return <mesh key={a} position={[Math.cos(rd) * (r - 0.01), 0, Math.sin(rd) * (r - 0.01)]}><cylinderGeometry args={[0.008, 0.008, 0.035, 6]} /><meshStandardMaterial color="#0e1e2e" roughness={0.2} metalness={0.92} /></mesh>; })}
    </group>;
}

/* ══════════════════════════════════════════════════════════════
   AnimLiquid — 바닥(baseY) 고정, 위로만 차오름
══════════════════════════════════════════════════════════════ */
function AnimLiquid({ pct, baseY, maxH, radius, color, opacity = 0.6, isBox, boxW, boxD, posX = 0, posZ = 0 }) {
    const ref = useRef(), cur = useRef(0);
    useFrame((_, dt) => {
        if (!ref.current) return;
        cur.current += (Math.max(0, Math.min(100, pct)) - cur.current) * Math.min(dt * 3.5, 1);
        const f = Math.max(cur.current / 100, 0.001);
        ref.current.scale.y = f;
        ref.current.position.set(posX, baseY + (maxH * f) / 2, posZ);
    });
    if (isBox) return <mesh ref={ref}><boxGeometry args={[boxW, maxH, boxD]} /><meshStandardMaterial color={color} transparent opacity={opacity} roughness={0.10} emissive={color} emissiveIntensity={0.25} /></mesh>;
    return <mesh ref={ref}><cylinderGeometry args={[radius, radius, maxH, 32]} /><meshStandardMaterial color={color} transparent opacity={opacity} roughness={0.15} side={THREE.DoubleSide} /></mesh>;
}

function LiquidSurface({ pct, baseY, maxH, radius, color, isBox, boxW, boxD, posX = 0, posZ = 0 }) {
    const ref = useRef(), cur = useRef(0);
    useFrame((_, dt) => {
        if (!ref.current) return;
        cur.current += (pct - cur.current) * Math.min(dt * 3.5, 1);
        const topY = baseY + (Math.max(0, Math.min(100, cur.current)) / 100) * maxH;
        ref.current.position.set(posX, topY, posZ);
    });
    if (isBox) return <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[boxW * 0.9, boxD * 0.9]} /><meshStandardMaterial color={color} transparent opacity={0.85} roughness={0.04} emissive={color} emissiveIntensity={0.70} side={THREE.DoubleSide} /></mesh>;
    return <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[radius * 0.88, 32]} />
        <meshStandardMaterial color={color} transparent opacity={0.55} roughness={0.05} metalness={0.3} side={THREE.FrontSide} />
    </mesh>;
}

// ── VESSEL DEVIATION OVERLAY ──

/* 현재 LT 링 — 오렌지 */
function LTRing({ ltPct }) {
    const ref = useRef();
    const cur = useRef(ltPct ?? 0);
    useFrame((_, dt) => {
        cur.current += ((ltPct ?? 0) - cur.current) * Math.min(dt * 3.5, 1);
        if (ref.current) ref.current.position.y = LRV_Y + (Math.max(0, Math.min(100, cur.current)) / 100) * MEAS;
    });
    if (ltPct == null) return null;
    return (
        <group ref={ref} position={[0, LRV_Y, 0]}>
            {/* Vessel 외벽 밖으로 빼서 빗금 띠/액체에 가려지지 않게, 튜브도 굵게 */}
            <mesh rotation={[Math.PI / 2, 0, 0]} renderOrder={10}>
                <torusGeometry args={[V_R + 0.035, 0.022, 12, 64]} />
                <meshBasicMaterial color="#e0fbff" transparent opacity={0.98} depthWrite={false} depthTest={false} />
            </mesh>
            {/* 내부 코어 — 더 밝은 흰빛 */}
            <mesh rotation={[Math.PI / 2, 0, 0]} renderOrder={11}>
                <torusGeometry args={[V_R + 0.035, 0.010, 10, 64]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={1.0} depthWrite={false} depthTest={false} />
            </mesh>
        </group>
    );
}

/* 목표 링 — 방향에 따라 초록(올림) or 빨강(내림), pulse */
function TargetLTRing({ lgPct, isUp }) {
    const ref = useRef();
    const matRef = useRef();
    const cur = useRef(lgPct ?? 0);
    const t = useRef(0);
    useFrame((_, dt) => {
        cur.current += ((lgPct ?? 0) - cur.current) * Math.min(dt * 3.5, 1);
        t.current += dt;
        if (ref.current) ref.current.position.y = LRV_Y + (Math.max(0, Math.min(100, cur.current)) / 100) * MEAS;
        if (matRef.current) {
            matRef.current.opacity = 0.75 + Math.sin(t.current * 3.5) * 0.22;
        }
    });
    if (lgPct == null) return null;
    const col = isUp ? '#22c55e' : '#ef4444';
    return (
        <group ref={ref} position={[0, LRV_Y, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} renderOrder={10}>
                <torusGeometry args={[V_R + 0.035, 0.018, 10, 64]} />
                <meshBasicMaterial ref={matRef} color={col} transparent opacity={0.92} depthWrite={false} depthTest={false} />
            </mesh>
        </group>
    );
}

/* 편차 구간 — Vessel 외벽을 감싸는 원통형 빗금 띠
   핵심: CanvasTexture로 45도 빗금 패턴을 그려서 open-cylinder 외벽에 매핑.
         height=1 기준 cylinder를 scale.y로 편차 높이만큼 늘림.
         라디우스는 V_R보다 살짝 크게 → 외벽에 감긴 띠로 보임 */

// 빗금 패턴 canvas texture 생성 (색상별 캐시)
function makeHatchTexture(color) {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');
    // 반투명 배경
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.15;
    ctx.fillRect(0, 0, size, size);
    // 45도 빗금
    ctx.globalAlpha = 0.95;
    ctx.strokeStyle = color;
    ctx.lineWidth = 10;
    ctx.lineCap = 'square';
    for (let i = -size; i < size * 2; i += 22) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + size, size);
        ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6, 2); // 원주 방향 6번 반복 → 어느 각도에서 봐도 빗금 보임
    tex.needsUpdate = true;
    return tex;
}

function DeviationZone({ ltPct, lgPct }) {
    const bandRef = useRef();
    const shaftRef = useRef();
    const headRef = useRef();
    const matRef = useRef();
    const ltCur = useRef(ltPct ?? 0);
    const lgCur = useRef(lgPct ?? 0);
    const t = useRef(0);

    // 빗금 텍스처 — 색상별로 한 번씩만 생성
    const hatchRed   = useMemo(() => makeHatchTexture('#ef4444'), []);
    const hatchGreen = useMemo(() => makeHatchTexture('#22c55e'), []);

    useFrame((_, dt) => {
        ltCur.current += ((ltPct ?? 0) - ltCur.current) * Math.min(dt * 3.5, 1);
        lgCur.current += ((lgPct ?? 0) - lgCur.current) * Math.min(dt * 3.5, 1);
        t.current += dt;

        const lo = Math.min(ltCur.current, lgCur.current);
        const hi = Math.max(ltCur.current, lgCur.current);
        const botY = LRV_Y + (Math.max(0, lo) / 100) * MEAS;
        const topY = LRV_Y + (Math.min(100, hi) / 100) * MEAS;
        const h = topY - botY;
        const cy = botY + h / 2;
        const show = h > 0.04;
        const isUp = lgCur.current > ltCur.current;

        // 외벽 띠 — position + scale.y
        const band = bandRef.current;
        if (band) {
            band.visible = show;
            band.position.set(0, cy, 0);
            band.scale.set(1, Math.max(h, 0.001), 1);
        }
        // 색상(빗금 텍스처) 방향 분기
        if (matRef.current) {
            const wantTex = isUp ? hatchGreen : hatchRed;
            if (matRef.current.map !== wantTex) {
                matRef.current.map = wantTex;
                matRef.current.color.set(isUp ? '#22c55e' : '#ef4444');
                matRef.current.needsUpdate = true;
            }
        }

        // 화살표 — Vessel 앞쪽(FG_Z 방향)에 부양, bounce
        const bounce = Math.sin(t.current * 2.8) * 0.06;
        const arrowCY = cy + (isUp ? bounce : -bounce);
        if (shaftRef.current) {
            shaftRef.current.visible = show;
            shaftRef.current.position.set(0, arrowCY + (isUp ? -0.10 : 0.10), V_R + 0.05);
        }
        if (headRef.current) {
            headRef.current.visible = show;
            headRef.current.position.set(0, arrowCY + (isUp ? 0.06 : -0.06), V_R + 0.05);
            headRef.current.rotation.set(isUp ? 0 : Math.PI, 0, 0);
        }
    });

    if (ltPct == null || lgPct == null) return null;

    return <>
        {/* Vessel 외벽을 감싸는 원통형 빗금 띠 — open-ended, 양면 렌더 */}
        <mesh ref={bandRef} position={[0, LRV_Y, 0]}>
            <cylinderGeometry args={[V_R + 0.015, V_R + 0.015, 1, 48, 1, true]} />
            <meshBasicMaterial
                ref={matRef}
                map={hatchRed}
                color="#ef4444"
                transparent
                opacity={0.85}
                side={THREE.DoubleSide}
                depthWrite={false}
                alphaTest={0.02}
            />
        </mesh>
        {/* 화살표 shaft — Vessel 앞에 떠 있음 */}
        <mesh ref={shaftRef}>
            <cylinderGeometry args={[0.028, 0.028, 0.24, 12]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1.2} transparent opacity={0.98} depthWrite={false} />
        </mesh>
        {/* 화살표 head */}
        <mesh ref={headRef}>
            <coneGeometry args={[0.07, 0.16, 12]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1.2} transparent opacity={0.98} depthWrite={false} />
        </mesh>
    </>;
}

// ── VESSEL ──
function Vessel({ lgPct, ltPct }) {
    const liqPct = lgPct > 0 ? (LRV_Y - V_BOT + (lgPct / 100) * MEAS) / V_H * 100 : 0;
    return <group position={[0, 0, BG_Z]}>
        <mesh><cylinderGeometry args={[V_R, V_R, V_H, 32, 1, true]} /><meshStandardMaterial color="#1a3848" roughness={0.35} metalness={0.75} transparent opacity={0.45} side={THREE.DoubleSide} /></mesh>
        <mesh position={[0, V_H / 2, 0]}><cylinderGeometry args={[V_R + 0.02, V_R + 0.02, 0.06, 32]} /><meshStandardMaterial color="#2a5268" roughness={0.25} metalness={0.85} transparent opacity={0.55} /></mesh>
        <mesh position={[0, V_H / 2, 0]} rotation={[Math.PI / 2, 0, 0]}><circleGeometry args={[V_R, 32]} /><meshStandardMaterial color="#1a3848" roughness={0.3} metalness={0.8} transparent opacity={0.4} side={THREE.DoubleSide} /></mesh>
        <mesh position={[0, -V_H / 2, 0]}><cylinderGeometry args={[V_R + 0.02, V_R + 0.02, 0.06, 32]} /><meshStandardMaterial color="#0c1e2e" roughness={0.28} metalness={0.85} transparent opacity={0.55} /></mesh>
        <mesh position={[0, V_H / 2 + 0.1, 0]}><cylinderGeometry args={[0.09, 0.09, 0.22, 12]} /><meshStandardMaterial color="#16304a" roughness={0.3} metalness={0.82} transparent opacity={0.5} /></mesh>
        {lgPct > 0 && <>
            <AnimLiquid pct={liqPct} baseY={V_BOT} maxH={V_H} radius={V_R - 0.02} color="#1565c0" opacity={0.30} />
            <LiquidSurface pct={liqPct} baseY={V_BOT} maxH={V_H} radius={V_R - 0.02} color="#42a5f5" />
        </>}
        {ltPct != null && lgPct > 0 && <>
            <DeviationZone ltPct={ltPct} lgPct={lgPct} />
            <TargetLTRing lgPct={lgPct} isUp={lgPct > ltPct} />
            <LTRing ltPct={ltPct} />
        </>}
        <mesh position={[0, URV_Y, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[V_R + 0.01, 0.005, 8, 48]} /><meshStandardMaterial color="#4a90b8" transparent opacity={0.3} /></mesh>
        <mesh position={[0, LRV_Y, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[V_R + 0.01, 0.005, 8, 48]} /><meshStandardMaterial color="#4a90b8" transparent opacity={0.3} /></mesh>
        <Text position={[0, V_BOT + V_H + 0.3, 0]} fontSize={0.10} color="#4a80a8" anchorX="center" anchorY="middle" font={undefined} outlineWidth={0.002} outlineColor="#000" fillOpacity={0.4}>VESSEL</Text>
    </group>;
}

/* ══════════════════════════════════════════════════════════════
   LEVEL GAUGE
══════════════════════════════════════════════════════════════ */
function LevelGaugeBody() {
    const NUM_BOLTS = 8;
    const VG_W_L = LG_W * 0.40;
    const VG_PAD_L = 0.02;
    const SIDE_W = (LG_W - VG_W_L) / 2 - 0.002;
    const SIDE_X = VG_W_L / 2 + SIDE_W / 2 + 0.001;
    const COVER_Z = LG_D / 2 + 0.014;
    const CHAN_Z = COVER_Z + 0.008;
    const GLASS_Z = CHAN_Z + 0.016;
    const VG_H_L = LG_H - VG_PAD_L * 2;

    return <group position={[LG_X, LG_CY, FG_Z + LG_Z_OFFSET]}>
        <mesh><boxGeometry args={[LG_W, LG_H, LG_D]} /><meshStandardMaterial color="#3e484e" roughness={0.30} metalness={0.90} emissive="#0d1518" emissiveIntensity={0.18} /></mesh>
        <mesh position={[0, 0, -(LG_D / 2 + 0.014)]}><boxGeometry args={[LG_W + 0.06, LG_H + 0.02, 0.026]} /><meshStandardMaterial color="#555f66" roughness={0.26} metalness={0.92} emissive="#181e22" emissiveIntensity={0.10} /></mesh>
        {[-1, 1].map(s => <mesh key={`sc${s}`} position={[s * SIDE_X, 0, COVER_Z]}><boxGeometry args={[SIDE_W, LG_H + 0.02, 0.026]} /><meshStandardMaterial color="#555f66" roughness={0.26} metalness={0.92} emissive="#181e22" emissiveIntensity={0.10} /></mesh>)}
        {[-1, 1].map(s => <mesh key={`tc${s}`} position={[0, s * (LG_H / 2 - VG_PAD_L / 2), COVER_Z]}><boxGeometry args={[VG_W_L + 0.002, VG_PAD_L + 0.008, 0.026]} /><meshStandardMaterial color="#555f66" roughness={0.26} metalness={0.92} /></mesh>)}
        <mesh position={[0, 0, CHAN_Z]}><boxGeometry args={[VG_W_L, VG_H_L, 0.020]} /><meshStandardMaterial color="#050507" roughness={0.95} metalness={0.02} /></mesh>
        <mesh position={[0, 0, GLASS_Z]}><boxGeometry args={[VG_W_L + 0.002, VG_H_L, 0.005]} /><meshStandardMaterial color="#aaddcc" transparent opacity={0.0} roughness={0.02} metalness={0.08} depthWrite={false} /></mesh>
        <mesh position={[-VG_W_L * 0.28, 0, GLASS_Z + 0.003]}><boxGeometry args={[VG_W_L * 0.04, VG_H_L - 0.10, 0.002]} /><meshStandardMaterial color="#ffffff" transparent opacity={0.04} roughness={0.01} /></mesh>
        {[-1, 1].map(s => <mesh key={`seal${s}`} position={[s * (VG_W_L / 2 + 0.003), 0, CHAN_Z + 0.008]}><boxGeometry args={[0.006, VG_H_L, 0.012]} /><meshStandardMaterial color="#111" roughness={0.7} metalness={0.3} /></mesh>)}
        {Array.from({ length: NUM_BOLTS + 1 }, (_, i) => {
            const y = -LG_H / 2 + i * (LG_H / NUM_BOLTS);
            return <group key={i} position={[0, y, 0]}>
                <mesh position={[0, 0, COVER_Z + 0.001]}><boxGeometry args={[LG_W + 0.08, 0.018, 0.007]} /><meshStandardMaterial color="#2c3236" roughness={0.18} metalness={0.96} /></mesh>
                {[-1, 1].map(s => <mesh key={s} position={[s * (LG_W / 2 + 0.046), 0, COVER_Z + 0.001]}><cylinderGeometry args={[0.013, 0.013, 0.010, 6]} /><meshStandardMaterial color="#222629" roughness={0.18} metalness={0.97} /></mesh>)}
            </group>;
        })}
        {[LG_H / 2 + 0.04, -LG_H / 2 - 0.04].map((y, idx) => <group key={idx} position={[0, y, 0]}>
            <mesh><boxGeometry args={[LG_W + 0.055, 0.052, LG_D + 0.028]} /><meshStandardMaterial color="#464d54" roughness={0.23} metalness={0.93} emissive="#0c1216" emissiveIntensity={0.07} /></mesh>
            {[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([sx, sz], j) => <mesh key={j} position={[sx * (LG_W / 2), 0, sz * (LG_D / 2 - 0.008)]}><cylinderGeometry args={[0.010, 0.010, 0.064, 6]} /><meshStandardMaterial color="#1c2024" roughness={0.18} metalness={0.97} /></mesh>)}
        </group>)}
        <group position={[0, LG_H / 2 + 0.090, 0]}>
            <mesh><cylinderGeometry args={[0.022, 0.022, 0.055, 12]} /><meshStandardMaterial color="#383e44" roughness={0.3} metalness={0.88} /></mesh>
            <mesh position={[0, 0.033, 0]}><sphereGeometry args={[0.018, 10, 8]} /><meshStandardMaterial color="#2c3238" roughness={0.35} metalness={0.85} /></mesh>
        </group>
        <mesh position={[0, -LG_H / 2 + 0.09, LG_D / 2 + 0.032]}><boxGeometry args={[LG_W * 0.40 + 0.008, 0.060, 0.003]} /><meshStandardMaterial color="#adadad" roughness={0.18} metalness={0.95} /></mesh>
        <Text position={[0, -LG_H / 2 + 0.09, LG_D / 2 + 0.035]} fontSize={0.022} color="#333" anchorX="center" anchorY="middle" font={undefined}>LEVEL GAUGE</Text>
    </group>;
}

/* ══════════════════════════════════════════════════════════════
   VIEW GLASS LIQUID FILL
══════════════════════════════════════════════════════════════ */
const VG_CHAN_Z = FG_Z + LG_Z_OFFSET + LG_D / 2 + 0.014 + 0.008 + 0.020 / 2 + 0.004;

function VGFillBar({ pct }) {
    const litRef = useRef();
    const unlitRef = useRef();
    const cur = useRef(0);

    useFrame((_, dt) => {
        cur.current += (Math.max(0, Math.min(100, pct)) - cur.current) * Math.min(dt * 3.5, 1);
        const f = Math.max(Math.min(cur.current / 100, 1), 0.0001);
        if (litRef.current) {
            litRef.current.scale.y = f;
            litRef.current.position.y = VG_BOT_WORLD + VG_H_WORLD * f / 2;
        }
        if (unlitRef.current) {
            const uf = Math.max(1 - f, 0.0001);
            unlitRef.current.scale.y = uf;
            unlitRef.current.position.y = VG_BOT_WORLD + VG_H_WORLD * f + VG_H_WORLD * uf / 2;
        }
    });

    const barW = VG_W - 0.010;
    const barD = 0.006;

    return <>
        <mesh ref={litRef} position={[LG_X, VG_BOT_WORLD + VG_H_WORLD * 0.0001 / 2, VG_CHAN_Z]}>
            <boxGeometry args={[barW, VG_H_WORLD, barD]} />
            <meshStandardMaterial color="#e8a000" emissive="#b86000" emissiveIntensity={0.50} roughness={0.45} metalness={0.05} />
        </mesh>
        <mesh ref={unlitRef} position={[LG_X, VG_BOT_WORLD + VG_H_WORLD / 2, VG_CHAN_Z]}>
            <boxGeometry args={[barW, VG_H_WORLD, barD]} />
            <meshStandardMaterial color="#0a0a0a" roughness={0.90} metalness={0.05} />
        </mesh>
        <VGLevelLine pct={pct} />
    </>;
}

function VGLevelLine({ pct }) {
    const ref = useRef();
    const cur = useRef(0);
    useFrame((_, dt) => {
        cur.current += (Math.max(0, Math.min(100, pct)) - cur.current) * Math.min(dt * 3.5, 1);
        if (ref.current) {
            const y = VG_BOT_WORLD + (cur.current / 100) * VG_H_WORLD;
            ref.current.position.set(LG_X, y, VG_CHAN_Z + 0.001);
            ref.current.visible = pct > 0;
        }
    });
    return (
        <mesh ref={ref} position={[LG_X, VG_BOT_WORLD, VG_CHAN_Z + 0.001]}>
            <boxGeometry args={[VG_W - 0.008, 0.008, 0.004]} />
            <meshStandardMaterial color="#ffe066" emissive="#ffe066" emissiveIntensity={1.2} roughness={0.3} />
        </mesh>
    );
}

function VGLight({ pct }) { return null; }
function VGLiquid({ pct }) { return <VGFillBar pct={pct} />; }

/* 눈금 옆 마커 — LT(오렌지) + 목표(초록/빨강), 숫자와 겹치지 않게 좌측 배치 */
function LTScaleMarkers({ ltPct, lgPct }) {
    const ltRef = useRef();
    const tgtRef = useRef();
    const tgtMatRef = useRef();
    const ltCur = useRef(ltPct ?? 0);
    const lgCur = useRef(lgPct ?? 0);
    const tick = useRef(0);

    useFrame((_, dt) => {
        ltCur.current  += ((ltPct ?? 0) - ltCur.current)  * Math.min(dt * 3.5, 1);
        lgCur.current  += ((lgPct ?? 0) - lgCur.current)  * Math.min(dt * 3.5, 1);
        tick.current   += dt;
        if (ltRef.current) {
            ltRef.current.position.y  = LRV_Y + (Math.max(0, Math.min(100, ltCur.current))  / 100) * MEAS;
            ltRef.current.visible     = ltPct != null;
        }
        if (tgtRef.current) {
            tgtRef.current.position.y = LRV_Y + (Math.max(0, Math.min(100, lgCur.current)) / 100) * MEAS;
            tgtRef.current.visible    = lgPct != null && ltPct != null;
        }
        if (tgtMatRef.current) {
            tgtMatRef.current.opacity = 0.75 + Math.sin(tick.current * 3.5) * 0.22;
        }
    });

    const isUp  = (lgPct ?? 0) > (ltPct ?? 0);
    const tgtCol = isUp ? '#22c55e' : '#ef4444';
    const tgtOut = isUp ? '#001a00' : '#1a0000';

    return <>
        {/* LT 현재 (흰/시안) — Level Gauge 왼쪽 */}
        <group ref={ltRef} position={[0, LRV_Y, 0]}>
            {/* 마커 바 — 두껍게, basic material로 깨짐 방지 */}
            <mesh position={[0.05, 0, 0.05]}>
                <boxGeometry args={[0.12, 0.022, 0.025]} />
                <meshBasicMaterial color="#e0fbff" />
            </mesh>
            {/* 라벨 — 마커 왼쪽으로 */}
            <Text position={[-0.02, 0, 0.08]} fontSize={0.10} color="#e0fbff" anchorX="right" anchorY="middle" font={undefined} outlineWidth={0.004} outlineColor="#002030">LT {Math.round(ltPct ?? 0)}</Text>
        </group>
        {/* 목표 (초록/빨강) */}
        <group ref={tgtRef} position={[0, LRV_Y, 0]}>
            <mesh position={[0.05, 0, 0.05]}>
                <boxGeometry args={[0.12, 0.022, 0.025]} />
                <meshBasicMaterial ref={tgtMatRef} color={tgtCol} transparent opacity={0.95} />
            </mesh>
            <Text position={[-0.02, 0, 0.08]} fontSize={0.10} color={tgtCol} anchorX="right" anchorY="middle" font={undefined} outlineWidth={0.004} outlineColor={tgtOut}>{isUp ? '▲' : '▼'}목표 {Math.round(lgPct ?? 0)}</Text>
        </group>
    </>;
}

// ── SCALE MARKS ──
function ScaleMarks({ ltPct, lgPct }) {
    return <>
        {/* 0~100 눈금자 — Level Gauge 오른쪽 (기존 위치) */}
        <group position={[LG_X + LG_W / 2 + 0.12, 0, FG_Z + LG_Z_OFFSET]}>
            {[0, 25, 50, 75, 100].map(p => { const y = LRV_Y + (p / 100) * MEAS; return <group key={p} position={[0, y, 0]}><mesh position={[0.04, 0, 0]}><boxGeometry args={[0.07, 0.010, 0.010]} /><meshStandardMaterial color="#5a9aba" roughness={0.3} metalness={0.7} emissive="#2a5a7a" emissiveIntensity={0.15} /></mesh><Text position={[0.14, 0, 0.02]} fontSize={0.11} color="#6ab0d0" anchorX="left" anchorY="middle" font={undefined} outlineWidth={0.004} outlineColor="#050e18">{p}</Text></group>; })}
            {Array.from({ length: 21 }, (_, i) => { if ([0, 5, 10, 15, 20].includes(i)) return null; const y = LRV_Y + (i / 20) * MEAS; return <mesh key={i} position={[0.025, y, 0]}><boxGeometry args={[0.035, 0.006, 0.006]} /><meshStandardMaterial color="#1e3d58" roughness={0.3} metalness={0.6} /></mesh>; })}
        </group>
        {/* LT/목표 마커 — Level Gauge 왼쪽 (분리) */}
        {ltPct != null && (
            <group position={[LG_X - LG_W / 2 - 0.08, 0, FG_Z + LG_Z_OFFSET]}>
                <LTScaleMarkers ltPct={ltPct} lgPct={lgPct} />
            </group>
        )}
    </>;
}

/* ══════════════════════════════════════════════════════════════
   TRANSMITTER — PNG 텍스처 PlaneGeometry
   ★ YKO Transmitter.png 를 /pic/ 에서 로드
   ★ PNG 비율: 임의로 portrait (예: 약 0.9:1.8 = 1:2 세로형)
     → planeW = LT_W + 0.12, planeH = TX_TOTAL_H
   ★ 실제 PNG 비율에 따라 planeW/H 조정 가능
══════════════════════════════════════════════════════════════ */

// PNG Plane 치수 — Transmitter 외곽을 살짝 여유있게 커버
const TX_PLANE_W = LT_W + 2.00;   // 좌우 약간 여유
const TX_PLANE_H = TX_TOTAL_H + 0.30; // 상하 약간 여유
const TX_PLANE_Z = FG_Z + LT_Z_OFFSET + 0.01;   // Three.js 오브젝트 바로 앞

function TransmitterPlane() {
    const texture = useTexture('/pic/YKO Transmitter.png');

    // PNG가 로드되면 필터 품질 설정
    useEffect(() => {
        if (texture) {
            texture.minFilter = THREE.LinearMipmapLinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.anisotropy = 8;
        }
    }, [texture]);

    return (
        <mesh position={[LT_X + 0.1, TX_CY, TX_PLANE_Z]}>
            <planeGeometry args={[TX_PLANE_W, TX_PLANE_H]} />
            <meshStandardMaterial
                map={texture}
                transparent={true}
                alphaTest={0.05}
                roughness={0.4}
                metalness={0.1}
                side={THREE.FrontSide}
            />
        </mesh>
    );
}

/* ══════════════════════════════════════════════════════════════
   TransmitterScreenPoint — LCD 오버레이 위치 계산용
   Canvas 내부에서 3D 좌표 → 화면 픽셀 좌표 변환 후 콜백으로 전달
══════════════════════════════════════════════════════════════ */

// LCD 중심 3D 좌표 (PNG 기준 앰프 헤드 중앙쯤)
const LCD_3D_X = LT_X + 0.06;
const LCD_3D_Y = ampCY + 0.34;
const LCD_3D_Z = TX_PLANE_Z + 0.005;

function LCDProjector({ onProject }) {
    const { camera, size } = useThree();
    const vec = useMemo(() => new THREE.Vector3(LCD_3D_X, LCD_3D_Y, LCD_3D_Z), []);

    useFrame(() => {
        const projected = vec.clone().project(camera);
        const x = ((projected.x + 1) / 2) * size.width;
        const y = ((-projected.y + 1) / 2) * size.height;
        onProject(x, y, size.width, size.height);
    });
    return null;
}

/* ══════════════════════════════════════════════════════════════
   TRANSMITTER (구 Three.js 컴포넌트) → PNG Plane으로 대체
   파이프 연결점(H/L 포트)은 기존 상수 그대로 유지
   실제 Three.js 바디는 제거, PlaneGeometry만 렌더
══════════════════════════════════════════════════════════════ */
function Transmitter() {
    return <TransmitterPlane />;
}

// ── CAMERA RIG ── (scene bounding box auto-fit)
function CameraRig() {
    const { camera, size } = useThree();
    useEffect(() => {
        if (!size.width || !size.height) return;
        const a = size.width / size.height;

        // Scene world bounding box (측정값 + 여유)
        // x: Transmitter 왼쪽(-1.72) ~ ScaleMarks 오른쪽(1.62)
        // y: Vessel 돔/VESSEL 라벨 위쪽(2.0) ~ Vessel 바닥(-1.9)
        const halfW = 1.85;   // 좌우 여유 포함
        const halfH = 2.15;   // 상하 여유 포함
        const cx = -0.05;     // scene 수평 중심
        const cy = 0.0;

        const fov = 38;
        const fovRad = (fov * Math.PI) / 180;
        const tanHalfFov = Math.tan(fovRad / 2);

        // 세로 fit vs 가로 fit 중 더 멀리 필요한 쪽 채택
        const distForHeight = halfH / tanHalfFov;
        const distForWidth = halfW / (tanHalfFov * a);
        const dist = Math.max(distForHeight, distForWidth) * 1.08; // 8% 여유

        camera.position.set(cx, cy + 0.5, dist);
        camera.fov = fov;
        camera.lookAt(cx, cy - 0.2, 0);
        camera.updateProjectionMatrix();
    }, [camera, size.width, size.height]);
    return null;
}

/* ══════════════════════════════════════════════════════════════
   LCD HTML 오버레이 — Canvas 외부 position:absolute
   3D 투영 좌표를 받아 정확히 PNG 위에 float
══════════════════════════════════════════════════════════════ */
function LCDOverlay({ displayValue, hasValue, screenPos }) {
    if (!screenPos) return null;
    const { x, y, canvasW } = screenPos;

    const scale = Math.min(canvasW / 700, 1.4);
    const boxW = Math.round(89 * scale);
    const boxH = Math.round(64 * scale);
    const fontSize = Math.round(45 * scale);

    return (
        <div style={{
            position: 'absolute',
            left: x,
            top: y,
            transform: 'translate(-50%, -50%)',
            width: boxW,
            height: boxH,
            pointerEvents: 'none',
            userSelect: 'none',
            zIndex: 10,
            background: '#020f12',
            borderRadius: '45% 45% 6px 6px / 30% 30% 6px 6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxSizing: 'border-box',
        }}>
            <span style={{
                fontFamily: '"Courier New", monospace',
                fontSize: fontSize,
                fontWeight: 700,
                color: hasValue ? '#ffffff' : '#071210',
                textShadow: hasValue
                    ? '0 0 8px rgba(0,229,255,0.9), 0 0 18px rgba(0,180,220,0.5)'
                    : 'none',
                letterSpacing: '0.04em',
                lineHeight: 1,
            }}>
                {hasValue ? `${displayValue}%` : '---%'}
            </span>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════
   SCENE
══════════════════════════════════════════════════════════════ */
function Scene({ currPct, targetPct, onLCDProject }) {
    const hasCurr = currPct !== '' && !isNaN(parseFloat(currPct));
    const hasTgt = targetPct !== '' && !isNaN(parseFloat(targetPct));
    const lgP = hasTgt ? Math.min(Math.max(parseFloat(targetPct), 0), 100) : 0;
    const ltP = hasCurr ? Math.min(Math.max(parseFloat(currPct), 0), 100) : null;
    const dVal = hasCurr ? (Number.isInteger(parseFloat(currPct)) ? String(parseInt(currPct)) : String(parseFloat(currPct))) : null;

    const IR = 0.025, PR = 0.055;
    const hP0 = [PORT_TIP_X, H_PORT_Y, FG_Z], hP1 = [PORT_TIP_X, H_PORT_Y, BG_Z], hP2 = [PORT_TIP_X, URV_Y, BG_Z], hP3 = [-V_R, URV_Y, BG_Z];
    const lP0 = [PORT_TIP_X, L_PORT_Y, FG_Z], lP1 = [PORT_TIP_X, L_PORT_Y, BG_Z], lP2 = [PORT_TIP_X, LRV_Y, BG_Z], lP3 = [-V_R, LRV_Y, BG_Z];
    const lgConnX = LG_LEFT - 0.02;
    const uP0 = [lgConnX, URV_Y, FG_Z + LG_Z_OFFSET], uP1 = [lgConnX, URV_Y, BG_Z], uP2 = [V_R, URV_Y, BG_Z];
    const dP0 = [lgConnX, LRV_Y, FG_Z + LG_Z_OFFSET], dP1 = [lgConnX, LRV_Y, BG_Z], dP2 = [V_R, LRV_Y, BG_Z];

    return <>
        <PerspectiveCamera makeDefault position={[0.2, 1.0, 8.0]} fov={38} />
        <CameraRig />
        <ambientLight intensity={0.55} color="#c0d4e8" />
        <directionalLight position={[3, 5, 8]} intensity={1.1} />
        <directionalLight position={[-4, 3, 6]} intensity={0.35} color="#90c0e0" />
        <directionalLight position={[0, -1, 5]} intensity={0.25} color="#5a8aa0" />
        <pointLight position={[LT_X, ampCY, FG_Z + 1.0]} intensity={0.5} color="#00e5ff" distance={3} />
        <VGLight pct={lgP} />

        <Vessel lgPct={lgP} ltPct={ltP} />
        <LevelGaugeBody />
        <VGLiquid pct={lgP} />
        <ScaleMarks ltPct={ltP} lgPct={lgP > 0 ? lgP : null} />

        {/* ★ 트랜스미터: PNG PlaneGeometry */}
        <Transmitter />

        {/* ★ LCD 3D→2D 투영 — 오버레이 위치 실시간 계산 */}
        <LCDProjector onProject={(x, y, cw, ch) => onLCDProject({ x, y, canvasW: cw, canvasH: ch })} />

        <Pipe from={hP0} to={hP1} radius={IR} color="#5a8a9a" emissive="#2a4a5a" emI={0.1} />
        <Pipe from={hP1} to={hP2} radius={IR} color="#5a8a9a" emissive="#2a4a5a" emI={0.1} />
        <Pipe from={hP2} to={hP3} radius={IR} color="#5a8a9a" emissive="#2a4a5a" emI={0.1} />
        <Elbow position={hP1} r={IR * 1.4} /><Elbow position={hP2} r={IR * 1.4} />
        <Pipe from={lP0} to={lP1} radius={IR} color="#5a8a9a" emissive="#2a4a5a" emI={0.1} />
        <Pipe from={lP1} to={lP2} radius={IR} color="#5a8a9a" emissive="#2a4a5a" emI={0.1} />
        <Pipe from={lP2} to={lP3} radius={IR} color="#5a8a9a" emissive="#2a4a5a" emI={0.1} />
        <Elbow position={lP1} r={IR * 1.4} /><Elbow position={lP2} r={IR * 1.4} />
        <Text position={[PORT_TIP_X - 0.12, (H_PORT_Y + URV_Y) / 2, (FG_Z + BG_Z) / 2]} fontSize={0.09} color="#6ab0d0" anchorX="center" anchorY="middle" font={undefined} outlineWidth={0.003} outlineColor="#050e18">H</Text>
        <Text position={[PORT_TIP_X - 0.12, (L_PORT_Y + LRV_Y) / 2, (FG_Z + BG_Z) / 2]} fontSize={0.09} color="#6ab0d0" anchorX="center" anchorY="middle" font={undefined} outlineWidth={0.003} outlineColor="#050e18">L</Text>
        <Pipe from={uP0} to={uP1} radius={PR} color="#4a6a78" emissive="#1a3040" emI={0.08} />
        <Pipe from={uP1} to={uP2} radius={PR} color="#4a6a78" emissive="#1a3040" emI={0.08} />
        <Elbow position={uP1} r={PR * 1.3} />
        <Pipe from={dP0} to={dP1} radius={PR} color="#4a6a78" emissive="#1a3040" emI={0.08} />
        <Pipe from={dP1} to={dP2} radius={PR} color="#4a6a78" emissive="#1a3040" emI={0.08} />
        <Elbow position={dP1} r={PR * 1.3} />
        {[URV_Y, LRV_Y].map((y, i) => <React.Fragment key={i}><Flange position={[-V_R, y, BG_Z]} rotation={[0, 0, Math.PI / 2]} r={0.08} /><Flange position={[V_R, y, BG_Z]} rotation={[0, 0, Math.PI / 2]} r={0.09} /></React.Fragment>)}
        <Flange position={[PORT_TIP_X + 0.02, H_PORT_Y, FG_Z]} rotation={[0, 0, Math.PI / 2]} r={0.06} />
        <Flange position={[PORT_TIP_X + 0.02, L_PORT_Y, FG_Z]} rotation={[0, 0, Math.PI / 2]} r={0.06} />
        <Flange position={[lgConnX - 0.02, URV_Y, FG_Z + LG_Z_OFFSET]} rotation={[0, 0, Math.PI / 2]} r={0.08} />
        <Flange position={[lgConnX - 0.02, LRV_Y, FG_Z + LG_Z_OFFSET]} rotation={[0, 0, Math.PI / 2]} r={0.08} />
        <Text position={[V_R - 0.1, URV_Y + 0.12, BG_Z + V_R]} fontSize={0.07} color="#4a90b8" anchorX="end" anchorY="bottom" font={undefined} outlineWidth={0.002} outlineColor="#000" fillOpacity={0.45}>URV</Text>
        <Text position={[V_R - 0.1, LRV_Y - 0.06, BG_Z + V_R]} fontSize={0.07} color="#4a90b8" anchorX="end" anchorY="top" font={undefined} outlineWidth={0.002} outlineColor="#000" fillOpacity={0.45}>LRV</Text>
    </>;
}

/* ══════════════════════════════════════════════════════════════
   EXPORT — Canvas + LCD HTML 오버레이 wrapper
══════════════════════════════════════════════════════════════ */
export default function LiveView3D({ currPct, targetPct }) {
    const [lcdPos, setLcdPos] = useState(null);
    const canvasRef = useRef(null);

    const hasCurr = currPct !== '' && !isNaN(parseFloat(currPct));
    const dVal = hasCurr ? (Number.isInteger(parseFloat(currPct)) ? String(parseInt(currPct)) : String(parseFloat(currPct))) : null;

    // onLCDProject 콜백: useFrame에서 매 프레임 호출 → React state 갱신은 throttle
    const frameCount = useRef(0);
    const handleLCDProject = (pos) => {
        frameCount.current++;
        // 6프레임마다 한 번만 state 업데이트 (성능 최적화)
        if (frameCount.current % 6 === 0) {
            setLcdPos(pos);
        }
    };

    return (
        <div
            ref={canvasRef}
            style={{ position: 'relative', width: '100%', height: '100%' }}
        >
            <Canvas
                gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
                dpr={[1, 2]}
                style={{ width: '100%', height: '100%', background: 'transparent' }}
            >
                <Scene
                    currPct={currPct}
                    targetPct={targetPct}
                    onLCDProject={handleLCDProject}
                />
            </Canvas>

            {/* LCD HTML 오버레이 */}
            <LCDOverlay
                displayValue={dVal}
                hasValue={hasCurr}
                screenPos={lcdPos}
            />
        </div>
    );
}
