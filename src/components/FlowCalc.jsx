import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Waves, Calculator, ChevronDown, AlertTriangle, Sparkles, Trash2, Play, Gauge } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  try { return twMerge(clsx(inputs)); }
  catch { return inputs.flat().filter(Boolean).join(' '); }
}

/* ═══════════════════════════════════════════════════════════
   DP METER CALCULATION ENGINE — ISO 5167 / L.K. Spink
   ═══════════════════════════════════════════════════════════ */

const EXP_COEFF_PIPE = { 'Carbon Steel': 11.7e-6, 'Stainless Steel': 17.2e-6, '316 SS': 17.2e-6, 'Monel': 13.5e-6 };
const DP_TO_PA = { mmH2O: 9.80665, inH2O: 249.089, mbar: 100, kPa: 1000, psi: 6894.757 };
const ATMOS_PA = 101325;

function toKelvin(val, unit) {
  if (unit === 'DEG C') return val + 273.15;
  if (unit === 'DEG F') return (val - 32) * 5/9 + 273.15;
  if (unit === 'K')     return val;
  if (unit === 'DEG R') return val * 5/9;
  return val + 273.15;
}

function toPascalAbs(val, unit) {
  const g = {
    'kgf/cm2g': val*98066.5 + ATMOS_PA, 'kgf/cm2a': val*98066.5,
    'barg': val*100000 + ATMOS_PA, 'bara': val*100000,
    'psig': val*6894.757 + ATMOS_PA, 'psia': val*6894.757,
    'mmHg': val*133.322, 'atm': val*101325
  };
  return g[unit] !== undefined ? g[unit] : val*98066.5 + ATMOS_PA;
}

function toDensityKgm3(val, unit) {
  if (unit === 'kg/m3')  return val;
  if (unit === 'g/cc')   return val * 1000;
  if (unit === 'lb/ft3') return val * 16.01846;
  if (unit === 'API')    return 141500 / (val + 131.5);
  return val;
}

function toViscosityPas(val, unit, rho_fc) {
  if (unit === 'cP')   return val / 1000;
  if (unit === 'cSt')  return (val / 1e6) * (rho_fc && rho_fc > 0 ? rho_fc : 1000);
  if (unit === 'Pa.s') return val;
  return val / 1000;
}

function toQmKgs(val, unit, rho_fc, rho_bc) {
  const vol = { 'm3/hr': 1/3600, 'Sm3/hr': 1/3600, 'Nm3/hr': 1/3600,
                'BPD': 0.158987/86400, 'BPH': 0.158987/3600,
                'l/min': 1e-3/60, 'l/hr': 1e-3/3600,
                'GPM': 6.30902e-5, 'GPH': 1.05150e-6, 'ft3/hr': 2.83168e-2/3600 };
  const mass = { 'kg/hr': 1/3600, 'ton/hr': 1000/3600, 'lb/hr': 0.453592/3600, 'ton/day': 1000/86400 };
  if (mass[unit] !== undefined) return val * mass[unit];
  const rho = (unit === 'Sm3/hr' || unit === 'Nm3/hr') ? (rho_bc || rho_fc) : rho_fc;
  return (vol[unit] || 1/3600) * val * rho;
}

function fromQmKgs(qm_kgs, unit, rho_fc, rho_bc) {
  const mass = { 'kg/hr': 3600, 'ton/hr': 3.6, 'lb/hr': 3600/0.453592, 'ton/day': 86400/1000 };
  const vol  = { 'm3/hr': 3600, 'Sm3/hr': 3600, 'Nm3/hr': 3600,
                 'BPD': 86400/0.158987, 'BPH': 3600/0.158987,
                 'l/min': 60000, 'l/hr': 3.6e6, 'GPM': 1/6.30902e-5,
                 'GPH': 1/1.05150e-6, 'ft3/hr': 3600/2.83168e-2 };
  if (mass[unit] !== undefined) return qm_kgs * mass[unit];
  const rho = (unit === 'Sm3/hr' || unit === 'Nm3/hr') ? (rho_bc || rho_fc) : rho_fc;
  return (vol[unit] || 3600) * qm_kgs / rho;
}

function calcCd_ISO(beta, Re, tapType, D_mm) {
  const b2 = beta*beta, b4 = b2*b2, b8 = b4*b4;
  let L1, L2p;
  if (tapType === 'Flange')         { L1 = 25.4/D_mm; L2p = 25.4/D_mm; }
  else if (tapType === 'Corner')    { L1 = 0;          L2p = 0; }
  else if (tapType === 'D and D/2') { L1 = 1.0;        L2p = 0.47; }
  else                              { L1 = 25.4/D_mm; L2p = 25.4/D_mm; }
  const M2p = 2*L2p/(1-beta);
  const A   = Math.pow(19000*beta/Re, 0.8);
  const Cd  = 0.5961
    + 0.0261*b2 - 0.216*b8
    + 0.000521*Math.pow(1e6*beta/Re, 0.7)
    + (0.0188 + 0.0063*A)*b8*Math.pow(1e6/Re, 0.3)
    + (0.043 + 0.080*Math.exp(-10*L1) - 0.123*Math.exp(-7*L1))*(1-0.11*A)*(b4/(1-b4))
    - 0.031*(M2p - 0.8*Math.pow(M2p,1.1))*Math.pow(beta,1.3);
  const sc = D_mm < 71.12 ? 0.011*(0.75-beta)*(2.8-D_mm/25.4) : 0;
  return Cd + sc;
}

function calcCd_Spink(beta, Re, tapType) {
  const b2 = beta*beta, b4 = b2*b2;
  let Cd;
  if (tapType === 'Pipe') {
    Cd = 0.5925 + 0.0182*b2 + 0.0310*b4 - 0.000125*Math.pow(1e6/Re, 0.7);
  } else {
    Cd = 0.5993 + 0.007*b2 + (0.364*b4 - 0.076*b2)*Math.exp(-1.5e5/Re)
       + 0.4*(0.07+0.5*Math.exp(-8*beta))*Math.exp(-1e5/Re);
  }
  return Math.max(0.55, Math.min(0.85, Cd));
}

function calcCd_Quadrant(beta) {
  return 0.73823 + 0.3309*beta - 1.1615*beta*beta + 1.5084*beta*beta*beta;
}

function calcEpsilon(beta, dp_Pa, p1_Pa, kappa) {
  if (p1_Pa <= 0) return 1.0;
  const tau = (p1_Pa - dp_Pa)/p1_Pa;
  const b4 = Math.pow(beta,4);
  return 1 - (0.351 + 0.256*b4 + 0.93*b4*b4)*(1-Math.pow(tau, 1/kappa));
}

function calcCd(beta, Re, calcRef, tapType, D_mm, fmType2) {
  if (fmType2 === 'Orifice-Quadrant') return calcCd_Quadrant(beta);
  if (calcRef === 'L.K. Spink' || calcRef === 'AGA 3') return calcCd_Spink(beta, Re, tapType);
  return calcCd_ISO(beta, Re, tapType, D_mm);
}

function solveExactFlow(D_m, D_mm, d_m, beta, rho_fc, mu_Pas, dp_Pa, p1_Pa, kappa, service, calcRef, tapType, fmType2) {
  const area = Math.PI/4*d_m*d_m;
  const Ev   = 1/Math.sqrt(1-Math.pow(beta,4));
  let Cd = (fmType2 === 'Orifice-Quadrant') ? calcCd_Quadrant(beta) : 0.606;
  let eps = 1.0, qm = 0, Re = 1e5;
  for (let i = 0; i < 60; i++) {
    if (service !== 'Liquid') eps = calcEpsilon(beta, dp_Pa, p1_Pa, kappa);
    qm = Cd*Ev*eps*area*Math.sqrt(2*dp_Pa*rho_fc);
    Re = 4*qm/(Math.PI*D_m*mu_Pas);
    if (Re <= 0) throw new Error('Reynolds 수가 0 이하');
    const newCd = calcCd(beta, Re, calcRef, tapType, D_mm, fmType2);
    if (Math.abs(newCd-Cd) < 1e-7) { Cd = newCd; break; }
    Cd = newCd;
  }
  return { qm, Cd, Re, eps };
}

function solveExactDP(D_m, D_mm, d_m, beta, rho_fc, mu_Pas, qm_kgs, p1_Pa, kappa, service, calcRef, tapType, fmType2) {
  const area = Math.PI/4*d_m*d_m;
  const Ev   = 1/Math.sqrt(1-Math.pow(beta,4));
  const Re   = 4*qm_kgs/(Math.PI*D_m*mu_Pas);
  if (Re <= 0) throw new Error('Reynolds 수가 0 이하');
  const Cd   = calcCd(beta, Re, calcRef, tapType, D_mm, fmType2);
  let eps = 1.0;
  let dp = Math.pow(qm_kgs/(Cd*Ev*eps*area), 2)/(2*rho_fc);
  if (service !== 'Liquid') {
    for (let i = 0; i < 30; i++) {
      const epsNew = calcEpsilon(beta, dp, p1_Pa, kappa);
      const dpNew  = Math.pow(qm_kgs/(Cd*Ev*epsNew*area), 2)/(2*rho_fc);
      if (Math.abs(dpNew-dp) < 0.01) { dp = dpNew; eps = epsNew; break; }
      dp = dpNew; eps = epsNew;
    }
  }
  return { dp, Cd, Re, eps };
}

function solveExactBore(D_m, D_mm, rho_fc, mu_Pas, dp_Pa, qm_kgs, p1_Pa, kappa, service, calcRef, tapType, fmType2) {
  function residual(beta) {
    const d_m = beta*D_m;
    const area = Math.PI/4*d_m*d_m;
    const Ev   = 1/Math.sqrt(1-Math.pow(beta,4));
    const Re   = 4*qm_kgs/(Math.PI*D_m*mu_Pas);
    if (Re <= 0) return -1;
    const Cd  = calcCd(beta, Re, calcRef, tapType, D_mm, fmType2);
    const eps = service !== 'Liquid' ? calcEpsilon(beta, dp_Pa, p1_Pa, kappa) : 1.0;
    return Cd*Ev*eps*area*Math.sqrt(2*dp_Pa*rho_fc) - qm_kgs;
  }
  let lo = 0.10, hi = 0.75;
  const r_lo = residual(lo), r_hi = residual(hi);
  if (r_lo * r_hi > 0) throw new Error('β 해가 [0.10~0.75] 범위 밖. DP 또는 유량 조정 필요.');
  let beta = 0.5;
  for (let i = 0; i < 80; i++) {
    beta = (lo+hi)/2;
    const r = residual(beta);
    if (Math.abs(r) < 1e-8*qm_kgs) break;
    if (r_lo * r > 0) lo = beta; else hi = beta;
  }
  const d_m = beta*D_m;
  const area = Math.PI/4*d_m*d_m;
  const Ev   = 1/Math.sqrt(1-Math.pow(beta,4));
  const Re   = 4*qm_kgs/(Math.PI*D_m*mu_Pas);
  const Cd   = calcCd(beta, Re, calcRef, tapType, D_mm, fmType2);
  const eps  = service !== 'Liquid' ? calcEpsilon(beta, dp_Pa, p1_Pa, kappa) : 1.0;
  return { beta, d_m, Cd, Re, eps };
}

/* ═══════════════════════════════════════════════════════════
   재사용 UI 컴포넌트 — 적응형 (반응형 완전 지원)
   ═══════════════════════════════════════════════════════════ */

const Section = ({ icon, title, isOpen, onToggle, children }) => (
  <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl overflow-hidden">
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between px-4 py-3 text-left active:bg-slate-700/40 transition-colors touch-manipulation"
    >
      <span className="flex items-center gap-2 text-sm font-bold text-slate-200">
        <span className="text-base">{icon}</span>{title}
      </span>
      <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0", isOpen && "rotate-180")} />
    </button>
    {isOpen && <div className="px-4 pb-4 pt-1 flex flex-col gap-3">{children}</div>}
  </div>
);

const Field = ({ label, children, hint }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">{label}</label>
    {children}
    {hint && <span className="text-[10px] text-slate-500">{hint}</span>}
  </div>
);

const TextInput = ({ value, onChange, placeholder, readOnly, type = "number" }) => (
  <input
    type={type}
    inputMode={type === "number" ? "decimal" : undefined}
    value={value}
    onChange={e => onChange(e.target.value)}
    readOnly={readOnly}
    placeholder={placeholder}
    className={cn(
      "w-full h-11 bg-black border border-slate-700 rounded-lg px-3 font-mono text-sm text-white outline-none",
      "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all",
      readOnly && "bg-slate-900/60 text-slate-400 cursor-not-allowed"
    )}
  />
);

const Select = ({ value, onChange, options, disabled }) => (
  <select
    value={value}
    onChange={e => onChange(e.target.value)}
    disabled={disabled}
    className={cn(
      "w-full h-11 bg-black border border-slate-700 rounded-lg px-3 font-mono text-sm text-white outline-none",
      "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none",
      "bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 24 24%22 stroke=%22%2394a3b8%22><path stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%222%22 d=%22M19 9l-7 7-7-7%22/></svg>')] bg-no-repeat bg-[length:16px_16px] bg-[right_10px_center] pr-9",
      disabled && "bg-slate-900/60 text-slate-500 cursor-not-allowed"
    )}
  >
    {options.map(o => <option key={o} value={o}>{o}</option>)}
  </select>
);

const InputWithUnit = ({ value, onChange, unit, onUnitChange, units, placeholder, readOnly }) => (
  <div className="flex gap-1.5">
    <div className="flex-1 min-w-0">
      <TextInput value={value} onChange={onChange} placeholder={placeholder} readOnly={readOnly} />
    </div>
    <div className="w-[90px] shrink-0">
      <Select value={unit} onChange={onUnitChange} options={units} />
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   결과 디스플레이
   ═══════════════════════════════════════════════════════════ */

function ResultDisplay({ result, diffPressUnit, maxFlowUnit, sizingMode }) {
  const dp_disp = result.dp_Pa / DP_TO_PA[diffPressUnit];
  const dp_mmH2O = result.dp_Pa / DP_TO_PA.mmH2O;

  const mainLabel = sizingMode === 'Exact Flow' ? '계산된 유량'
                  : sizingMode === 'Exact DP' ? '계산된 차압'
                  : '계산된 보어';
  const mainValue = sizingMode === 'Exact Flow' ? result.qm_disp.toFixed(2)
                  : sizingMode === 'Exact DP' ? dp_disp.toFixed(2)
                  : result.d_mm.toFixed(3);
  const mainUnit  = sizingMode === 'Exact Flow' ? maxFlowUnit
                  : sizingMode === 'Exact DP' ? diffPressUnit
                  : 'mm';

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold">
        <Waves className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate">계산 완료 · {result.calcRef} · {result.tapType}</span>
      </div>

      <div className="bg-black/60 rounded-xl border border-emerald-700/40 p-4 flex flex-col items-center">
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">{mainLabel}</span>
        <div className="flex items-baseline gap-1.5 flex-wrap justify-center">
          <span className="font-mono text-4xl font-black text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.3)] tracking-tighter">
            {mainValue}
          </span>
          <span className="text-slate-400 text-sm font-bold">{mainUnit}</span>
        </div>
        {sizingMode === 'Exact DP' && diffPressUnit !== 'mmH2O' && (
          <span className="text-[10px] text-slate-500 font-mono mt-1">
            = {dp_mmH2O.toFixed(2)} mmH₂O
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        {[
          { label: 'β (beta)', val: result.beta.toFixed(4) },
          { label: 'Cd', val: result.Cd.toFixed(4) },
          { label: 'Reynolds', val: result.Re.toExponential(2) },
          { label: 'ε (eps)', val: result.eps.toFixed(4) },
        ].map(({ label, val }) => (
          <div key={label} className="bg-black/40 rounded-lg p-2.5 border border-slate-800">
            <div className="text-[9px] text-slate-500 font-bold uppercase">{label}</div>
            <div className="font-mono text-sm text-slate-200 font-bold truncate">{val}</div>
          </div>
        ))}
      </div>

      {(result.beta < 0.20 || result.beta > 0.75) && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-2.5 flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
          <span className="text-[11px] text-orange-300 leading-relaxed">
            β = {result.beta.toFixed(4)} — ISO 5167 권장 범위(0.20~0.75) 벗어남. 참고값으로만 사용.
          </span>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   메인 컴포넌트
   ═══════════════════════════════════════════════════════════ */

export default function FlowCalc() {
  const [tab, setTab] = useState('field'); // 'field' | 'simple' | 'detail'

  const tabs = [
    { id: 'field',  icon: <Gauge  className="w-4 h-4 shrink-0" />, label: '현장 FLOW' },
    { id: 'simple', icon: <Sparkles className="w-4 h-4 shrink-0" />, label: '간편 FMS' },
    { id: 'detail', icon: <Calculator className="w-4 h-4 shrink-0" />, label: '디테일 FMS' },
  ];

  return (
    <div
      className="flex flex-col gap-3 w-full pb-6"
      style={{ maxWidth: '100%', boxSizing: 'border-box' }}
    >
      {/* ── 탭 셀렉터 — 3탭 sticky ── */}
      <div className="grid grid-cols-3 bg-slate-900 rounded-2xl p-1 border border-slate-800 shrink-0 sticky top-0 z-20 gap-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "py-2.5 rounded-xl font-bold text-xs transition-all active:scale-[0.97] touch-manipulation",
              "flex items-center justify-center gap-1 leading-tight",
              tab === t.id
                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50"
                : "bg-transparent text-slate-400"
            )}
          >
            {t.icon}
            <span className="truncate">{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── 탭 콘텐츠 ── */}
      {tab === 'field'  && <FieldMode />}
      {tab === 'simple' && <SimpleMode />}
      {tab === 'detail' && <DetailMode />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB 1: 현장 FLOW 계산기
   DP → 실시간 유량 역산 (현장 계기판독값으로 즉시 확인)
   공식: Q_current = Q_max × √(DP_current / DP_max)
   ═══════════════════════════════════════════════════════════ */

function FieldMode() {
  const [dpMax,  setDpMax]  = useState('');
  const [qMax,   setQMax]   = useState('');
  const [qUnit,  setQUnit]  = useState('m³/h');
  const [dpCurr, setDpCurr] = useState('');
  const [dpUnit, setDpUnit] = useState('mmH2O');

  // DP 단위 변환 (사용자가 같은 단위로 입력하는 것이 일반적이지만 혼용 지원)
  const dpUnitOptions = ['mmH2O', 'inH2O', 'mbar', 'kPa', 'psi'];
  const flowUnitOptions = ['m³/h', 'Nm³/h', 'Sm³/h', 't/h', 'kg/h', 'BPD', 'GPM', 'l/min'];

  const result = useMemo(() => {
    const dm = parseFloat(dpMax);
    const qm = parseFloat(qMax);
    const dc = parseFloat(dpCurr);
    if (!dm || !qm || !dc || dm <= 0 || qm <= 0 || dc < 0) return null;

    const ratio = dc / dm;
    if (ratio > 1.5) return { warn: 'DP가 MAX의 150% 초과 — 계기 이상 확인 필요', ratio, qCurr: null };

    const qCurr = qm * Math.sqrt(ratio);
    const pct   = (qCurr / qm) * 100;
    return { qCurr, pct, ratio, warn: null };
  }, [dpMax, qMax, dpCurr]);

  // 게이지 퍼센트 (0~100 클램프)
  const gaugePct = result?.pct != null ? Math.min(100, Math.max(0, result.pct)) : 0;
  const gaugeColor = gaugePct > 90 ? '#f97316'
                   : gaugePct > 70 ? '#3b82f6'
                   : '#10b981';

  const clearAll = () => { setDpMax(''); setQMax(''); setDpCurr(''); };
  const loadExample = () => { setDpMax('5000'); setQMax('400'); setQUnit('m³/h'); setDpCurr('3200'); setDpUnit('mmH2O'); };

  return (
    <div className="flex flex-col gap-3">
      {/* 결과 카드 */}
      <div className="bg-black/80 rounded-2xl border border-slate-700 p-5 flex flex-col items-center min-h-[200px] justify-center gap-3">
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">현재 유량</span>

        {result && result.qCurr != null ? (
          <>
            {/* 숫자 */}
            <div className="flex items-baseline gap-1.5 flex-wrap justify-center">
              <span className="font-mono font-black text-blue-400 drop-shadow-[0_0_20px_rgba(59,130,246,0.35)] tracking-tighter"
                    style={{ fontSize: 'clamp(2rem, 10vw, 3.5rem)' }}>
                {result.qCurr.toFixed(1)}
              </span>
              <span className="text-slate-400 text-base font-bold">{qUnit}</span>
            </div>

            {/* 게이지 바 */}
            <div className="w-full">
              <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                <span>0%</span>
                <span className="font-bold" style={{ color: gaugeColor }}>{result.pct.toFixed(1)}%</span>
                <span>100%</span>
              </div>
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${gaugePct}%`,
                    background: `linear-gradient(90deg, ${gaugeColor}88, ${gaugeColor})`,
                    boxShadow: `0 0 12px ${gaugeColor}66`
                  }}
                />
              </div>
            </div>

            <div className="text-[11px] text-slate-500 font-mono">
              DP 비율: {(result.ratio * 100).toFixed(1)}% &nbsp;|&nbsp; Q = Q_max × √(DP / DP_max)
            </div>
          </>
        ) : result?.warn ? (
          <div className="flex items-start gap-2 text-orange-300 text-xs font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-orange-400" />
            {result.warn}
          </div>
        ) : (
          <span className="text-sm text-slate-600 text-center px-4">DP 값을 입력하면 현재 유량이 자동 계산됩니다</span>
        )}
      </div>

      {/* 경고 — 90% 초과 */}
      {result?.pct != null && result.pct > 90 && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
          <span className="text-xs text-orange-300 font-medium leading-relaxed">
            유량이 MAX의 90% 초과 — 운전 한계 접근 중. 현장 확인 필요.
          </span>
        </div>
      )}

      {/* 입력 카드 */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex flex-col gap-3">
        <div className="text-sm font-bold text-slate-200 mb-1">📟 현장 입력값</div>

        <Field label="① 설계 MAX DP (DP_max)">
          <InputWithUnit
            value={dpMax} onChange={setDpMax}
            unit={dpUnit} onUnitChange={setDpUnit}
            units={dpUnitOptions} placeholder="예) 5000"
          />
        </Field>

        <Field label="② 설계 MAX 유량 (Q_max)">
          <InputWithUnit
            value={qMax} onChange={setQMax}
            unit={qUnit} onUnitChange={setQUnit}
            units={flowUnitOptions} placeholder="예) 400"
          />
        </Field>

        <Field label={`③ 현재 계기 DP (${dpUnit})`}>
          <TextInput value={dpCurr} onChange={setDpCurr} placeholder="예) 3200" />
          <span className="text-[10px] text-slate-500">현장 DP 계기 판독값 입력</span>
        </Field>
      </div>

      {/* 액션 */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={loadExample}
          className="bg-slate-800 hover:bg-slate-700 active:scale-[0.97] border border-slate-700 rounded-xl py-3 px-3 text-left transition-all touch-manipulation"
        >
          <div className="text-xs font-bold text-blue-400 mb-0.5">📋 예시 불러오기</div>
          <div className="text-[10px] text-slate-500 leading-tight">DP_max:5000 / Q:400<br/>현재DP:3200 → 319.4 m³/h</div>
        </button>
        <button
          onClick={clearAll}
          className="bg-slate-800 hover:bg-slate-700 active:scale-[0.97] border border-slate-700 rounded-xl py-3 px-3 text-left transition-all touch-manipulation"
        >
          <div className="text-xs font-bold text-rose-400 mb-0.5 flex items-center gap-1">
            <Trash2 className="w-3 h-3" />초기화
          </div>
          <div className="text-[10px] text-slate-500 leading-tight">입력값 전체 삭제</div>
        </button>
      </div>

      {/* 공식 설명 박스 */}
      <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-3">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">📌 현장 활용 공식</div>
        <div className="font-mono text-xs text-slate-300 leading-loose">
          Q_current = Q_max × √(DP_current / DP_max)
        </div>
        <div className="text-[10px] text-slate-500 mt-1 leading-relaxed">
          오리피스/벤투리 DP 계기 판독값으로 현재 유량을 즉시 역산.<br/>
          Rangeability: DP_min ≥ 10% DP_max 권장 (정확도 유지)
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB 2: 간편 FMS 계산기
   DP_new = DP_design × (Q_new / Q_design)²
   ═══════════════════════════════════════════════════════════ */

function SimpleMode() {
  const [Qd, setQd] = useState('');
  const [Qunit, setQunit] = useState('m³/h');
  const [DPd, setDPd] = useState('');
  const [Qn, setQn] = useState('');

  const result = useMemo(() => {
    const a = parseFloat(Qd), b = parseFloat(DPd), c = parseFloat(Qn);
    if (!a || !b || !c || a <= 0 || b <= 0 || c <= 0) return null;
    const DPnew = b * Math.pow(c/a, 2);
    const changePct = ((DPnew - b) / b) * 100;
    return { DPnew, changePct };
  }, [Qd, DPd, Qn]);

  const loadExample = () => { setQd('410'); setDPd('2800'); setQn('450'); setQunit('m³/h'); };
  const clearAll = () => { setQd(''); setDPd(''); setQn(''); setQunit('m³/h'); };

  return (
    <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-4 shadow-2xl flex flex-col gap-4">
      {/* 결과 카드 */}
      <div className="bg-black/80 rounded-2xl border border-slate-700 p-4 flex flex-col items-center min-h-[140px] justify-center">
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">새로운 DP URV</span>
        {result ? (
          <>
            <div className="flex items-baseline gap-1.5 flex-wrap justify-center">
              <span className="font-mono font-black text-blue-400 drop-shadow-[0_0_20px_rgba(59,130,246,0.3)] tracking-tighter"
                    style={{ fontSize: 'clamp(2rem, 10vw, 3rem)' }}>
                {Math.round(result.DPnew).toLocaleString('ko-KR')}
              </span>
              <span className="text-slate-400 text-base font-bold">mmH₂O</span>
            </div>
            <span className={cn(
              "mt-2 text-xs font-bold px-2.5 py-0.5 rounded-full",
              result.changePct >= 0 ? "bg-orange-500/20 text-orange-400" : "bg-emerald-500/20 text-emerald-400"
            )}>
              변화율: {result.changePct >= 0 ? '+' : ''}{result.changePct.toFixed(1)}%
            </span>
          </>
        ) : (
          <span className="text-sm text-slate-600 text-center">유량 값을 입력하면 자동 계산됩니다</span>
        )}
        <span className="text-[10px] text-slate-600 font-mono mt-2">DP_new = DP_design × (Q_new / Q_design)²</span>
      </div>

      {result && Math.abs(result.changePct) > 30 && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
          <span className="text-xs text-orange-300 font-medium leading-relaxed">
            오리피스 설계 한계 초과 가능 — EPC 검토 필요
          </span>
        </div>
      )}

      {/* 입력 카드 */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex flex-col gap-3">
        <div className="text-sm font-bold text-slate-200 mb-1">🔧 입력값</div>

        <Field label="① 설계 MAX 유량 (Q_design)">
          <InputWithUnit
            value={Qd} onChange={setQd}
            unit={Qunit} onUnitChange={setQunit}
            units={['m³/h', 'Nm³/h', 'Sm³/h', 't/h', 'kg/h']}
            placeholder="예) 410"
          />
        </Field>

        <Field label="② 설계 MAX DP (DP_design)">
          <div className="flex gap-1.5">
            <div className="flex-1 min-w-0">
              <TextInput value={DPd} onChange={setDPd} placeholder="예) 2800" />
            </div>
            <div className="w-[90px] h-11 shrink-0 bg-slate-900 border border-slate-700 rounded-lg flex items-center justify-center text-sm text-slate-400 font-mono">
              mmH₂O
            </div>
          </div>
        </Field>

        <Field label={`③ 새 MAX 유량 (Q_new)${Qunit ? ` · ${Qunit}` : ''}`}>
          <TextInput value={Qn} onChange={setQn} placeholder="예) 450" />
        </Field>
      </div>

      {/* 액션 버튼 */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={loadExample}
          className="bg-slate-800 hover:bg-slate-700 active:scale-[0.97] border border-slate-700 rounded-xl py-3 px-3 text-left transition-all touch-manipulation"
        >
          <div className="text-xs font-bold text-blue-400 mb-0.5">📋 예시 불러오기</div>
          <div className="text-[10px] text-slate-500 leading-tight">410 / 2800 / 450<br/>→ 3,373 mmH₂O</div>
        </button>
        <button
          onClick={clearAll}
          className="bg-slate-800 hover:bg-slate-700 active:scale-[0.97] border border-slate-700 rounded-xl py-3 px-3 text-left transition-all touch-manipulation"
        >
          <div className="text-xs font-bold text-rose-400 mb-0.5 flex items-center gap-1">
            <Trash2 className="w-3 h-3" />초기화
          </div>
          <div className="text-[10px] text-slate-500 leading-tight">입력값 전체 삭제</div>
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB 3: 디테일 FMS 계산기 — ISO 5167 / L.K. Spink
   ═══════════════════════════════════════════════════════════ */

function DetailMode() {
  const [open, setOpen] = useState({ ft: true, design: true, process: true, trans: true });
  const toggle = k => setOpen(s => ({ ...s, [k]: !s[k] }));

  const [fmType2, setFmType2] = useState('Orifice-Standard');
  const [serviceType, setServiceType] = useState('Liquid');
  const [acType, setAcType] = useState('Base Volume');
  const [sizingMode, setSizingMode] = useState('Exact DP');
  const [calcRef, setCalcRef] = useState('L.K. Spink');

  const [pipeId, setPipeId] = useState('');
  const [pipeUnit, setPipeUnit] = useState('mm');
  const [pipeMaterial, setPipeMaterial] = useState('Carbon Steel');
  const [boreSize, setBoreSize] = useState('');
  const [boreUnit, setBoreUnit] = useState('mm');
  const [elementMaterial, setElementMaterial] = useState('316 SS');
  const [tapType, setTapType] = useState('Flange');
  const [tapLoc, setTapLoc] = useState('Up Stream');

  const [bcTemp, setBcTemp] = useState('15');
  const [bcPress, setBcPress] = useState('0');
  const [bcDensity, setBcDensity] = useState('');
  const [bcDensityUnit, setBcDensityUnit] = useState('kg/m3');

  const [fcTemp, setFcTemp] = useState('');
  const [fcTempUnit, setFcTempUnit] = useState('DEG C');
  const [fcPress, setFcPress] = useState('');
  const [fcPressUnit, setFcPressUnit] = useState('kgf/cm2g');
  const [fcDensity, setFcDensity] = useState('');
  const [fcDensityUnit, setFcDensityUnit] = useState('kg/m3');
  const [fcViscosity, setFcViscosity] = useState('');
  const [fcViscosityUnit, setFcViscosityUnit] = useState('cP');
  const [fcKFactor, setFcKFactor] = useState('1.4');

  const [normalFlow, setNormalFlow] = useState('');
  const [normalFlowUnit, setNormalFlowUnit] = useState('Sm3/hr');
  const [diffPress, setDiffPress] = useState('');
  const [diffPressUnit, setDiffPressUnit] = useState('mmH2O');
  const [maxFlow, setMaxFlow] = useState('');
  const [maxFlowUnit, setMaxFlowUnit] = useState('Sm3/hr');

  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const holeType = useMemo(() => ({
    'Orifice-Standard': 'Concentric Square Edge',
    'Orifice-Quadrant': 'Quadrant Edge',
    'Venturi-Welded': 'Venturi Tube',
    'Venturi-Machined': 'Venturi Tube',
    'Nozzle': 'Nozzle'
  }[fmType2] || ''), [fmType2]);

  const calcRefOptions = useMemo(() => {
    if (fmType2.startsWith('Orifice')) return ['L.K. Spink', 'ISO 5167', 'AGA 3'];
    if (fmType2 === 'Nozzle') return ['ISO 5167', 'ASME'];
    return ['ISO 5167'];
  }, [fmType2]);

  useEffect(() => {
    if (!calcRefOptions.includes(calcRef)) setCalcRef(calcRefOptions[0]);
  }, [calcRefOptions]); // eslint-disable-line

  const tapTypeOptions = useMemo(() => ({
    'L.K. Spink': ['Flange', 'Corner', 'D and D/2', 'Pipe'],
    'ISO 5167':   ['Flange', 'Corner', 'D and D/2'],
    'AGA 3':      ['Flange'],
    'ASME':       ['Pipe', 'Flange']
  }[calcRef] || ['Flange']), [calcRef]);

  useEffect(() => {
    if (!tapTypeOptions.includes(tapType)) setTapType(tapTypeOptions[0]);
  }, [tapTypeOptions]); // eslint-disable-line

  const acTypeOptions = useMemo(() =>
    (serviceType === 'Liquid' || serviceType === 'Gas')
      ? ['Base Volume', 'Actual Volume', 'Mass']
      : ['Actual Volume', 'Mass'],
  [serviceType]);

  useEffect(() => {
    if (!acTypeOptions.includes(acType)) setAcType(acTypeOptions[0]);
  }, [acTypeOptions]); // eslint-disable-line

  const showKFactor = serviceType !== 'Liquid';
  const showViscosity = serviceType === 'Liquid';
  const showBaseCondition = acType === 'Base Volume';

  const flowUnitOptions = useMemo(() => {
    if (acType === 'Mass') return ['kg/hr', 'ton/hr', 'lb/hr', 'ton/day'];
    if (acType === 'Base Volume') return ['Sm3/hr', 'Nm3/hr', 'm3/hr', 'BPD', 'BPH', 'l/min', 'l/hr', 'GPM', 'GPH', 'ft3/hr'];
    return ['m3/hr', 'BPD', 'BPH', 'l/min', 'l/hr', 'GPM', 'GPH', 'ft3/hr'];
  }, [acType]);

  useEffect(() => {
    if (!flowUnitOptions.includes(maxFlowUnit)) setMaxFlowUnit(flowUnitOptions[0]);
    if (!flowUnitOptions.includes(normalFlowUnit)) setNormalFlowUnit(flowUnitOptions[0]);
  }, [flowUnitOptions]); // eslint-disable-line

  useEffect(() => {
    if (acType === 'Base Volume') {
      if (serviceType === 'Liquid') { setBcTemp('15'); setBcPress('0'); }
      else if (serviceType === 'Gas') { setBcTemp('0'); setBcPress('0'); }
    }
  }, [serviceType, acType]);

  const isBoreReadonly = sizingMode === 'Exact Bore';
  const isMaxFlowReadonly = sizingMode === 'Exact Flow';
  const isDiffPressReadonly = sizingMode === 'Exact DP';

  const loadExample = () => {
    setFmType2('Orifice-Quadrant'); setServiceType('Liquid'); setAcType('Base Volume');
    setSizingMode('Exact DP'); setCalcRef('L.K. Spink');
    setPipeId('303.23'); setPipeUnit('mm'); setPipeMaterial('Carbon Steel');
    setBoreSize('132.873'); setBoreUnit('mm'); setElementMaterial('316 SS');
    setTapType('Flange');
    setBcTemp('15'); setBcPress('0'); setBcDensity('983.8'); setBcDensityUnit('kg/m3');
    setFcTemp('94'); setFcTempUnit('DEG C');
    setFcPress('16.5'); setFcPressUnit('kgf/cm2g');
    setFcDensity('924.4'); setFcDensityUnit('kg/m3');
    setFcViscosity('70'); setFcViscosityUnit('cP');
    setNormalFlow('375'); setNormalFlowUnit('Sm3/hr');
    setMaxFlow('550'); setMaxFlowUnit('Sm3/hr');
    setDiffPress(''); setDiffPressUnit('mmH2O');
    setResult(null); setError('');
  };

  const calculate = () => {
    setError(''); setResult(null);
    try {
      if (!pipeId) throw new Error('Pipe ID 필수');
      if (!fcTemp) throw new Error('Flow Temperature 필수');
      if (!fcPress) throw new Error('Flow Pressure 필수');
      if (!fcDensity) throw new Error('Flow Density 필수');
      if (serviceType === 'Liquid' && !fcViscosity) throw new Error('Flow Viscosity 필수');
      if ((sizingMode === 'Exact DP' || sizingMode === 'Exact Bore') && !maxFlow) throw new Error('Max Flow 필수');
      if ((sizingMode === 'Exact Flow' || sizingMode === 'Exact Bore') && !diffPress) throw new Error('Diff. Press 필수');
      if (sizingMode !== 'Exact Bore' && !boreSize) throw new Error('Bore Size 필수');

      const D_mm_in = pipeUnit === 'inch' ? parseFloat(pipeId) * 25.4 : parseFloat(pipeId);
      const T_fc_K = toKelvin(parseFloat(fcTemp), fcTempUnit);
      const T_fc_C = T_fc_K - 273.15;
      const p1_Pa  = toPascalAbs(parseFloat(fcPress), fcPressUnit);
      const rho_fc = toDensityKgm3(parseFloat(fcDensity), fcDensityUnit);

      let mu_Pas;
      if (serviceType === 'Liquid' && fcViscosity) {
        mu_Pas = toViscosityPas(parseFloat(fcViscosity), fcViscosityUnit, rho_fc);
      } else {
        mu_Pas = 0.015e-3;
      }

      const kappa = parseFloat(fcKFactor) || 1.4;
      const rho_bc = bcDensity ? toDensityKgm3(parseFloat(bcDensity), bcDensityUnit) : rho_fc;
      const alphaP = EXP_COEFF_PIPE[pipeMaterial] || 11.7e-6;
      const alphaE = EXP_COEFF_PIPE[elementMaterial] || 17.2e-6;
      const D_mm = D_mm_in * (1 + alphaP * (T_fc_C - 15));
      const D_m = D_mm / 1000;

      let d_mm = 0, d_m = 0;
      if (sizingMode !== 'Exact Bore') {
        const boreRaw = parseFloat(boreSize);
        const d_mm_nom = boreUnit === 'inch' ? boreRaw * 25.4 : boreRaw;
        d_mm = d_mm_nom * (1 + alphaE * (T_fc_C - 15));
        d_m = d_mm / 1000;
      }

      let dp_Pa = 0;
      if (sizingMode === 'Exact Flow' || sizingMode === 'Exact Bore') {
        dp_Pa = parseFloat(diffPress) * DP_TO_PA[diffPressUnit];
      }

      let qm_kgs_max = 0;
      if (sizingMode === 'Exact DP' || sizingMode === 'Exact Bore') {
        qm_kgs_max = toQmKgs(parseFloat(maxFlow), maxFlowUnit, rho_fc, rho_bc);
      }

      if (D_mm <= 0) throw new Error('Pipe ID가 0 이하');
      if (rho_fc <= 0) throw new Error('Flow Density가 0 이하');
      if (mu_Pas <= 0) throw new Error('Viscosity가 0 이하');
      if (p1_Pa <= 0) throw new Error('Flow Pressure(절대압)가 0 이하 — 단위 확인');

      let r, beta;
      if (sizingMode === 'Exact Flow') {
        beta = d_m / D_m;
        if (beta < 0.10 || beta > 0.80) throw new Error(`β = ${beta.toFixed(4)} — 범위(0.10~0.80) 초과`);
        r = solveExactFlow(D_m, D_mm, d_m, beta, rho_fc, mu_Pas, dp_Pa, p1_Pa, kappa, serviceType, calcRef, tapType, fmType2);
        const qm_disp = fromQmKgs(r.qm, maxFlowUnit, rho_fc, rho_bc);
        setMaxFlow(qm_disp.toFixed(4));
        setResult({ mode: sizingMode, beta, Cd: r.Cd, Re: r.Re, eps: r.eps, dp_Pa, qm_disp, d_mm, calcRef, tapType });

      } else if (sizingMode === 'Exact DP') {
        beta = d_m / D_m;
        if (beta < 0.10 || beta > 0.80) throw new Error(`β = ${beta.toFixed(4)} — 범위(0.10~0.80) 초과`);
        r = solveExactDP(D_m, D_mm, d_m, beta, rho_fc, mu_Pas, qm_kgs_max, p1_Pa, kappa, serviceType, calcRef, tapType, fmType2);
        const dp_disp = r.dp / DP_TO_PA[diffPressUnit];
        setDiffPress(dp_disp.toFixed(4));
        setResult({ mode: sizingMode, beta, Cd: r.Cd, Re: r.Re, eps: r.eps, dp_Pa: r.dp, qm_disp: parseFloat(maxFlow), d_mm, calcRef, tapType });

      } else {
        r = solveExactBore(D_m, D_mm, rho_fc, mu_Pas, dp_Pa, qm_kgs_max, p1_Pa, kappa, serviceType, calcRef, tapType, fmType2);
        const bore_out = boreUnit === 'inch' ? r.d_m * 1000 / 25.4 : r.d_m * 1000;
        setBoreSize(bore_out.toFixed(4));
        beta = r.beta;
        setResult({ mode: sizingMode, beta, Cd: r.Cd, Re: r.Re, eps: r.eps, dp_Pa, qm_disp: parseFloat(maxFlow), d_mm: r.d_m * 1000, calcRef, tapType });
      }

    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* 결과 박스 */}
      {(result || error) && (
        <div className={cn(
          "rounded-2xl border p-4 shadow-xl",
          error ? "bg-rose-950/40 border-rose-700/60" : "bg-emerald-950/40 border-emerald-700/60"
        )}>
          {error ? (
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-rose-400 mb-1">계산 오류</div>
                <div className="text-xs text-rose-200 break-words">{error}</div>
              </div>
            </div>
          ) : (
            <ResultDisplay result={result} diffPressUnit={diffPressUnit} maxFlowUnit={maxFlowUnit} sizingMode={sizingMode} />
          )}
        </div>
      )}

      {/* Calculate 버튼 */}
      <button
        onClick={calculate}
        className="bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-blue-900/50 flex items-center justify-center gap-2 transition-all touch-manipulation"
      >
        <Play className="w-4 h-4 fill-white shrink-0" />Calculate
      </button>

      {/* 예시 불러오기 */}
      <button
        onClick={loadExample}
        className="bg-slate-800 hover:bg-slate-700 active:scale-[0.98] border border-slate-700 rounded-xl py-2.5 px-4 text-xs text-slate-300 font-medium transition-all touch-manipulation"
      >
        📋 예시 불러오기 (Quadrant Edge / 70cP / 550 Sm³/hr)
      </button>

      {/* ═══ Flowmeter Type ═══ */}
      <Section icon="📐" title="Flowmeter Type" isOpen={open.ft} onToggle={() => toggle('ft')}>
        <Field label="F/T Type2">
          <Select value={fmType2} onChange={setFmType2}
            options={['Orifice-Standard', 'Orifice-Quadrant', 'Venturi-Welded', 'Venturi-Machined', 'Nozzle']} />
        </Field>
        <Field label="Service Type">
          <Select value={serviceType} onChange={setServiceType} options={['Liquid', 'Gas', 'Steam']} />
        </Field>
        <Field label="Act./Base/Mass">
          <Select value={acType} onChange={setAcType} options={acTypeOptions} />
        </Field>
        <Field label="Hole Type (자동)">
          <input type="text" value={holeType} readOnly
            className="w-full h-11 bg-slate-900/60 border border-slate-700 rounded-lg px-3 font-mono text-sm text-slate-400 outline-none cursor-not-allowed" />
        </Field>
      </Section>

      {/* ═══ Design Data ═══ */}
      <Section icon="📋" title="Design Data" isOpen={open.design} onToggle={() => toggle('design')}>
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-1">🎯 Calculation Criteria</div>
        <Field label="Sizing Mode">
          <Select value={sizingMode} onChange={setSizingMode} options={['Exact Flow', 'Exact DP', 'Exact Bore']} />
        </Field>
        <Field label="Calc.Reference">
          <Select value={calcRef} onChange={setCalcRef} options={calcRefOptions} />
        </Field>

        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-2">📏 Piping Data</div>
        <Field label="Pipe ID">
          <InputWithUnit value={pipeId} onChange={setPipeId} unit={pipeUnit} onUnitChange={setPipeUnit}
            units={['mm', 'inch']} placeholder="예) 303.23" />
        </Field>
        <Field label="Pipe Material">
          <Select value={pipeMaterial} onChange={setPipeMaterial}
            options={['Carbon Steel', 'Stainless Steel', '316 SS', 'Monel']} />
        </Field>

        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-2">⚙ Element Data</div>
        <Field label="Bore Size">
          <InputWithUnit value={boreSize} onChange={setBoreSize} unit={boreUnit} onUnitChange={setBoreUnit}
            units={['mm', 'inch']} placeholder="예) 132.873" readOnly={isBoreReadonly} />
        </Field>
        <Field label="Element Material">
          <Select value={elementMaterial} onChange={setElementMaterial}
            options={['316 SS', 'Carbon Steel', 'Stainless Steel', 'Monel']} />
        </Field>
        <Field label="Tap Type">
          <Select value={tapType} onChange={setTapType} options={tapTypeOptions} />
        </Field>
        <Field label="Tap Location">
          <Select value={tapLoc} onChange={setTapLoc} options={['Up Stream', 'Down Stream']} />
        </Field>
      </Section>

      {/* ═══ Process Data ═══ */}
      <Section icon="🌡" title="Process Data" isOpen={open.process} onToggle={() => toggle('process')}>
        {showBaseCondition && (
          <>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Base Condition</div>
            <Field label="Base Temp">
              <div className="flex gap-1.5">
                <div className="flex-1 min-w-0"><TextInput value={bcTemp} onChange={setBcTemp} readOnly /></div>
                <div className="w-[90px] h-11 shrink-0 bg-slate-900 border border-slate-700 rounded-lg flex items-center justify-center text-sm text-slate-400 font-mono">DEG C</div>
              </div>
            </Field>
            <Field label="Base Press">
              <div className="flex gap-1.5">
                <div className="flex-1 min-w-0"><TextInput value={bcPress} onChange={setBcPress} readOnly /></div>
                <div className="w-[90px] h-11 shrink-0 bg-slate-900 border border-slate-700 rounded-lg flex items-center justify-center text-sm text-slate-400 font-mono truncate px-1">kgf/cm²g</div>
              </div>
            </Field>
            <Field label="Base Density">
              <InputWithUnit value={bcDensity} onChange={setBcDensity} unit={bcDensityUnit} onUnitChange={setBcDensityUnit}
                units={['kg/m3', 'g/cc', 'lb/ft3', 'API']} placeholder="예) 983.8" />
            </Field>
          </>
        )}

        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-2">Flow Condition</div>
        <Field label="Flow Temp">
          <InputWithUnit value={fcTemp} onChange={setFcTemp} unit={fcTempUnit} onUnitChange={setFcTempUnit}
            units={['DEG C', 'DEG F', 'K', 'DEG R']} placeholder="예) 94" />
        </Field>
        <Field label="Flow Press">
          <InputWithUnit value={fcPress} onChange={setFcPress} unit={fcPressUnit} onUnitChange={setFcPressUnit}
            units={['kgf/cm2g', 'kgf/cm2a', 'barg', 'bara', 'psig', 'psia', 'mmHg', 'atm']} placeholder="예) 16.5" />
        </Field>
        <Field label="Flow Density">
          <InputWithUnit value={fcDensity} onChange={setFcDensity} unit={fcDensityUnit} onUnitChange={setFcDensityUnit}
            units={['kg/m3', 'g/cc', 'lb/ft3', 'API']} placeholder="예) 924.4" />
        </Field>
        {showViscosity && (
          <Field label="Flow Viscosity">
            <InputWithUnit value={fcViscosity} onChange={setFcViscosity} unit={fcViscosityUnit} onUnitChange={setFcViscosityUnit}
              units={['cP', 'cSt', 'Pa.s']} placeholder="예) 70" />
          </Field>
        )}
        {showKFactor && (
          <Field label="K-Factor (Cp/Cv)">
            <TextInput value={fcKFactor} onChange={setFcKFactor} placeholder="예) 1.4" />
          </Field>
        )}
      </Section>

      {/* ═══ Transmitter / Qm ═══ */}
      <Section icon="📡" title="Transmitter / Qm" isOpen={open.trans} onToggle={() => toggle('trans')}>
        <Field label="Normal Flow">
          <InputWithUnit value={normalFlow} onChange={setNormalFlow} unit={normalFlowUnit} onUnitChange={setNormalFlowUnit}
            units={flowUnitOptions} placeholder="예) 375" />
        </Field>
        <Field label="Diff. Press (DP)" hint={isDiffPressReadonly ? "← 자동 계산" : null}>
          <InputWithUnit value={diffPress} onChange={setDiffPress} unit={diffPressUnit} onUnitChange={setDiffPressUnit}
            units={['mmH2O', 'inH2O', 'mbar', 'kPa', 'psi']} placeholder="예) 10160" readOnly={isDiffPressReadonly} />
        </Field>
        <Field label={acType === 'Mass' ? "Max Flow (Wm)" : "Max Flow (Qm)"} hint={isMaxFlowReadonly ? "← 자동 계산" : null}>
          <InputWithUnit value={maxFlow} onChange={setMaxFlow} unit={maxFlowUnit} onUnitChange={setMaxFlowUnit}
            units={flowUnitOptions} placeholder="예) 550" readOnly={isMaxFlowReadonly} />
        </Field>
      </Section>
    </div>
  );
}
