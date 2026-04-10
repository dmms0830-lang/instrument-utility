import React, { useState } from 'react';
import { AlertTriangle, Wrench, Info } from 'lucide-react';

// ── YOKOGAWA Alarm Data ──
const YOKOGAWA_ALARMS = [
    { id: "AL.01", name: "CAP.ERR", category: "Failure", cause: "캡슐(센서) 문제 / 온도 센서 오류 / EEPROM 오류", output: "설정된 신호 출력 (Hold, High, Low)", action: "재시작 후에도 지속되면 캡슐을 교체하십시오." },
    { id: "AL.02", name: "AMP.ERR", category: "Failure", cause: "앰프 회로 온도 센서 문제 / EEPROM 오류 / 앰프 자체 고장", output: "설정된 신호 출력 (Hold, High, Low)", action: "앰프 보드를 교체하십시오." },
    { id: "AL.10", name: "PRESS", category: "Out of Specification", cause: "입력값이 캡슐의 측정 범위를 벗어남", output: "상한값(High) 또는 하한값(Low) 출력", action: "입력을 점검하고 필요시 캡슐을 교체하십시오." },
    { id: "AL.11", name: "ST.PRSS", category: "Out of Specification", cause: "정압(Static Pressure)이 한계를 초과함", output: "작동 및 출력 유지", action: "정압 상태를 확인하십시오." },
    { id: "AL.12", name: "CAP.TMP", category: "Out of Specification", cause: "캡슐 온도가 범위를 벗어남 (-50 ~ 130°C)", output: "작동 유지", action: "단열재 보강 또는 래깅(Lagging)으로 온도를 유지하십시오." },
    { id: "AL.13", name: "AMP.TMP", category: "Out of Specification", cause: "앰프 온도가 범위를 벗어남 (-50 ~ 95°C)", output: "작동 유지", action: "단열재 보강 또는 래깅으로 온도를 유지하십시오." },
    { id: "AL.30", name: "RANGE", category: "Out of Specification", cause: "출력이 상한 또는 하한 레인지 한계를 벗어남", output: "상한값 또는 하한값 출력", action: "입력 및 레인지 설정을 점검하고 변경하십시오." },
    { id: "AL.31", name: "SP.RNG", category: "Out of Specification", cause: "정압이 규정된 범위를 초과함", output: "작동 및 출력 유지", action: "정압 설정을 확인하십시오." },
    { id: "AL.35", name: "P.HI", category: "Out of Specification", cause: "입력 압력이 설정된 상한 임계값을 초과함", output: "작동 유지", action: "입력 압력을 점검하십시오." },
    { id: "AL.36", name: "P.LO", category: "Out of Specification", cause: "입력 압력이 설정된 하한 임계값보다 낮음", output: "작동 유지", action: "입력 압력을 점검하십시오." },
    { id: "AL.37", name: "SP.HI", category: "Out of Specification", cause: "입력 정압이 설정된 상한 임계값을 초과함", output: "작동 유지", action: "입력 정압을 점검하십시오." },
    { id: "AL.38", name: "SP.LO", category: "Out of Specification", cause: "입력 정압이 설정된 하한 임계값보다 낮음", output: "작동 유지", action: "입력 정압을 점검하십시오." },
    { id: "AL.39", name: "TMP.HI", category: "Out of Specification", cause: "감지된 온도가 설정된 상한 임계값을 초과함", output: "작동 유지", action: "온도를 점검하십시오." },
    { id: "AL.40", name: "TMP.LO", category: "Out of Specification", cause: "감지된 온도가 설정된 하한 임계값보다 낮음", output: "작동 유지", action: "온도를 점검하십시오." },
    { id: "AL.50", name: "P.LRV", category: "Maintenance Required", cause: "설정된 LRV(하한값)가 범위를 벗어남", output: "에러 발생 직전 출력값 유지", action: "설정을 점검하고 적절한 값으로 변경하십시오." },
    { id: "AL.51", name: "P.URV", category: "Maintenance Required", cause: "설정된 URV(상한값)가 범위를 벗어남", output: "에러 발생 직전 출력값 유지", action: "설정을 점검하고 적절한 값으로 변경하십시오." },
    { id: "AL.52", name: "P.SPN", category: "Maintenance Required", cause: "설정된 스팬(Span)이 범위를 벗어남", output: "에러 발생 직전 출력값 유지", action: "설정을 점검하고 적절한 값으로 변경하십시오." },
    { id: "AL.53", name: "P.ADJ", category: "Maintenance Required", cause: "압력 조정 오류", output: "작동 및 출력 유지", action: "입력을 점검하십시오." },
    { id: "AL.54", name: "SP.RNG", category: "Maintenance Required", cause: "정압 레인지 설정 오류", output: "정압 %값 유지하며 작동", action: "설정을 점검하고 변경하십시오." },
    { id: "AL.55", name: "SP.ADJ", category: "Maintenance Required", cause: "정압 조정 오류", output: "작동 및 출력 유지", action: "입력을 점검하십시오." },
    { id: "AL.60", name: "SC.CFG", category: "Maintenance Required", cause: "신호 특성 설정 조건 미충족", output: "작동 유지", action: "설정을 점검하고 변경하십시오." },
    { id: "AL.79", name: "OV.DISP", category: "Out of Specification", cause: "표시값이 한계를 초과함", output: "디스플레이 한계 표시", action: "측정값 확인 및 레인지 조정을 검토하십시오." },
];

// ── EMERSON Rosemount 3051 Alarm Data ──
const EMERSON_ALARMS = [
    { id: "Press Limit", name: "PRESS LIM", category: "Operation", cause: "트랜스미터에서 읽은 공정 변수가 트랜스미터 범위를 벗어남", output: "경고 표시", action: "공정 압력 및 트랜스미터 레인지 설정을 확인하십시오." },
    { id: "Temp Limit", name: "TEMP LIM", category: "Operation", cause: "트랜스미터에서 읽은 2차 온도 변수가 트랜스미터 범위를 벗어남", output: "경고 표시", action: "온도 조건을 점검하십시오." },
    { id: "Curr Fixed", name: "CURR FIX", category: "Operation", cause: "트랜스미터가 멀티드롭 모드이며 아날로그 출력이 압력 변화를 추적하지 않음", output: "고정 전류 출력", action: "멀티드롭 모드 설정을 확인하십시오." },
    { id: "Curr Saturd", name: "CURR SAT", category: "Operation", cause: "모듈 압력이 범위를 벗어나 아날로그 출력이 포화 레벨로 구동됨", output: "포화 전류 출력", action: "공정 압력 및 레인지 설정을 점검하십시오." },
    { id: "Loop Test", name: "LOOP TEST", category: "Function Check", cause: "루프 테스트 또는 4~20mA 트림 동안 아날로그 출력이 고정값으로 설정됨", output: "고정 전류 출력", action: "루프 테스트 완료 후 정상 모드로 복귀하십시오." },
    { id: "Xmtr Info", name: "XMTR INFO", category: "Maintenance Required", cause: "메모리 확인 루틴에 의해 비활성 메모리 고장 감지", output: "작업에 영향 없음", action: "필드 커뮤니케이터로 메모리 조사 및 다시 구성하십시오." },
    { id: "Zero Pass", name: "ZERO PASS", category: "Operation", cause: "로컬 제로 조정 수용됨", output: "출력이 4mA(1Vdc)로 변경됨", action: "정상 동작입니다. 추가 조치가 필요하지 않습니다." },
    { id: "Zero Fail", name: "ZERO FAIL", category: "Maintenance Required", cause: "제로 조정이 최대 Rangedown을 초과하거나 센서 한계를 넘는 압력 감지", output: "출력 유지", action: "입력 압력을 확인하고 센서 한계 내에서 재조정하십시오." },
    { id: "Span Pass", name: "SPAN PASS", category: "Operation", cause: "로컬 스판 조정 수용됨", output: "출력이 20mA(5Vdc)로 변경됨", action: "정상 동작입니다. 추가 조치가 필요하지 않습니다." },
    { id: "Span Fail", name: "SPAN FAIL", category: "Maintenance Required", cause: "스판 조정이 최대 Rangedown을 초과하거나 센서 한계를 넘는 압력 감지", output: "출력 유지", action: "입력 압력을 확인하고 센서 한계 내에서 재조정하십시오." },
    { id: "Local Dsbld", name: "LOCL DSBLD", category: "Maintenance Required", cause: "보안 점퍼 설정 또는 소프트웨어 명령으로 로컬 제로 및 스판 조정 기능이 비활성화됨", output: "기능 제한", action: "보안 설정 및 점퍼 상태를 확인하십시오." },
    { id: "Write Prot", name: "WRITE PROT", category: "Operation", cause: "보안 점퍼가 ON인 상태에서 데이터 변경 시도", output: "변경 차단", action: "보안 점퍼를 해제하십시오." },
    { id: "FC.01", name: "1K.EEP.FAC", category: "Failure", cause: "1k snsr EEPROM error-factory ON", output: "고장 알람 출력", action: "트랜스미터를 교체하십시오." },
    { id: "FC.02", name: "1K.EEP.UNO", category: "Maintenance Required", cause: "1k snsr EEPROM error-user-no out ON", output: "출력 유지", action: "필드 커뮤니케이터를 사용하여 리모트 씰 차단기, 충진액, 플랜지 재질, O-링 재질 등 매개변수를 재설정하십시오." },
    { id: "FC.03", name: "1K.EEP.USR", category: "Maintenance Required", cause: "1k snsr EEPROM error-user ON", output: "고장 알람 출력", action: "전체 트림을 수행하여 트랜스미터를 다시 보정하십시오." },
    { id: "FC.04", name: "4K.MIC.FAC", category: "Failure", cause: "4k micro EEPROM error-factory ON", output: "고장 알람 출력", action: "전자장치 보드를 교체하십시오." },
    { id: "FC.05", name: "4K.MIC.UNO", category: "Maintenance Required", cause: "4k micro EEPROM error-user-no out ON", output: "출력 유지", action: "필드 커뮤니케이터를 사용하여 메시지 필드를 재설정하십시오." },
    { id: "FC.06", name: "4K.MIC.USR", category: "Maintenance Required", cause: "4k micro EEPROM error-user ON", output: "고장 알람 출력", action: "단위, 범위 값, 댐핑, 아날로그 출력 등 매개변수를 재설정하고 D/A 트림을 수행하십시오." },
    { id: "FC.07", name: "4K.SNS.FAC", category: "Failure", cause: "4k snsr EEPROM error-factory ON", output: "고장 알람 출력", action: "트랜스미터를 교체하십시오." },
    { id: "FC.08", name: "4K.SNS.USR", category: "Maintenance Required", cause: "4k snsr EEPROM error-user ON", output: "고장 알람 출력", action: "필드 커뮤니케이터를 사용하여 온도 단위와 보정 유형을 재설정하십시오." }
];

// ── AZBIL Alarm Data ──
const AZBIL_ALARMS = [
    { id: "Err.01", name: "A-D CNV", category: "Failure", cause: "아날로그/디지털 변환 실패 — A/D 변환 중 오류 발생", output: "고장 알람 출력", action: "센서에 문제가 있습니다. 고객 서비스에 문의하십시오." },
    { id: "Err.02", name: "PROM", category: "Failure", cause: "센서 특성 데이터 실패 — 센서 특성 데이터에서 오류 감지", output: "고장 알람 출력", action: "고객 서비스에 문의하십시오." },
    { id: "Err.03", name: "INPUT", category: "Failure", cause: "의심스러운 입력 — 입력 데이터 오류", output: "고장 알람 출력", action: "입력 신호 및 배선 상태를 점검하십시오." },
    { id: "Err.04", name: "CPU", category: "Failure", cause: "CPU 실패 — CPU 동작 불량", output: "고장 알람 출력", action: "인쇄 회로 기판에 문제가 있습니다. 고객 서비스에 문의하십시오." },
    { id: "Err.05", name: "NVM", category: "Failure", cause: "비휘발성 메모리 오류", output: "고장 알람 출력", action: "고객 서비스에 문의하십시오." },
    { id: "Err.06", name: "RAM", category: "Failure", cause: "RAM 오류", output: "고장 알람 출력", action: "고객 서비스에 문의하십시오." },
    { id: "Err.07", name: "ROM", category: "Failure", cause: "ROM 오류", output: "고장 알람 출력", action: "고객 서비스에 문의하십시오." },
    { id: "Err.08", name: "OUTPUT", category: "Failure", cause: "출력 회로 실패", output: "고장 알람 출력", action: "고객 서비스에 문의하십시오." },
    { id: "Err.09", name: "CONFIG", category: "Failure", cause: "잘못된 데이터베이스 — 구성 또는 보정 데이터 유효하지 않음", output: "고장 알람 출력", action: "고객 서비스에 문의하십시오." },
    { id: "OUTPUT%", name: "OUTMODE", category: "Function Check", cause: "출력 모드 중 — 장치가 출력 모드로 동작 중", output: "출력값 고정", action: "출력 모드에서 정상 모드로 복귀하십시오." },
    { id: "F/A SIM", name: "FA SIM", category: "Function Check", cause: "고장 알람 시뮬레이션 모드로 동작 중", output: "고장 알람 시뮬레이션 출력", action: "고장 알람 시뮬레이션 모드에서 정상 모드로 복귀하십시오." },
    { id: "AL.20", name: "M/B.TEMP", category: "Out of Specification", cause: "계량기 본체 과온도 — 미터 바디 온도 초과", output: "작동 유지", action: "계량기 본체 온도가 규정 범위에 들어오도록 설치 조건을 변경하십시오. 공정 유체 온도 이상 여부도 확인하십시오." },
    { id: "AL.24", name: "OVRLOAD", category: "Out of Specification", cause: "계량기 본체 과부하 또는 고장 — 입력 압력 초과 또는 내부 고장", output: "작동 유지", action: "입력 압력이 규정 범위 내인지 확인하십시오. 압력이 높으면 낮추거나, 필요 시 더 큰 레인지 기기로 교체하십시오." },
    { id: "AL.53", name: "OUT%.HI", category: "Out of Specification", cause: "출력 상한 알람 — 출력값이 상한값 초과", output: "작동 유지", action: "출력값을 점검하십시오." },
    { id: "AL.54", name: "OUT%.LO", category: "Out of Specification", cause: "출력 하한 알람 — 출력값이 하한값 미만", output: "작동 유지", action: "출력값을 점검하십시오." },
    { id: "AL.55", name: "TEMP.HI", category: "Out of Specification", cause: "센서 온도 상한 알람", output: "작동 유지", action: "센서 온도를 점검하십시오." },
    { id: "AL.56", name: "TEMP.LO", category: "Out of Specification", cause: "센서 온도 하한 알람", output: "작동 유지", action: "센서 온도를 점검하십시오." },
    { id: "AL.21", name: "ZERO.CAL", category: "Maintenance Required", cause: "과도한 제로 보정값 — 제로 보정값이 허용 범위 초과", output: "작동 유지", action: "보정에 적합한 입력 압력인지 확인하고 재보정하십시오." },
    { id: "AL.22", name: "SPAN.CAL", category: "Maintenance Required", cause: "과도한 스팬 보정값 — 스팬 보정값이 허용 범위 초과", output: "작동 유지", action: "보정에 적합한 입력 압력인지 확인하고 재보정하십시오." },
    { id: "AL.26", name: "NO.CALIB", category: "Maintenance Required", cause: "보정되지 않음 — 출하 시 보정값으로 복원 필요", output: "작동 유지", action: "출하 시 보정값으로 재시작하거나 레인지 상하한을 보정하십시오." },
    { id: "AL.28", name: "SWITCH", category: "Maintenance Required", cause: "외부 제로/스팬 조정 실패 — 외부 제로 조정 스위치 또는 PCB 문제", output: "작동 유지", action: "외부 제로 조정 스위치 또는 인쇄 회로 기판에 문제가 있습니다. 고객 서비스에 문의하십시오." },
    { id: "AL.61", name: "PRESS.FQ", category: "Maintenance Required", cause: "압력 주파수 인덱스 알람", output: "작동 유지", action: "운전 조건을 점검하십시오." },
    { id: "AL.62", name: "STD.DEV", category: "Maintenance Required", cause: "표준 편차 알람", output: "작동 유지", action: "운전 조건을 점검하십시오." },
    { id: "AL.63", name: "OOR.CNT", category: "Maintenance Required", cause: "범위 초과 카운트 알람", output: "작동 유지", action: "운전 조건을 점검하십시오." },
];

// ── Brand Themes ──
const THEMES = {
    yokogawa: {
        selectedBorder: 'border-lime-500',
        selectedShadow: 'shadow-lime-900/30',
        dropdownFocus: 'focus:border-lime-500',
        actionBg: 'bg-emerald-950/40',
        actionBorder: 'border-emerald-800/30',
        actionIcon: 'text-lime-400',
        actionLabel: 'text-lime-500',
        actionText: 'text-lime-400',
        codeColor: 'text-lime-400',
        chevronColor: '%2384cc16',
        categoryBadge: {
            'Failure': 'bg-red-950/60 text-red-400 border-red-800/40',
            'Function Check': 'bg-amber-950/60 text-amber-400 border-amber-800/40',
            'Out of Specification': 'bg-sky-950/60 text-sky-400 border-sky-800/40',
            'Maintenance Required': 'bg-purple-950/60 text-purple-400 border-purple-800/40',
            'Operation': 'bg-lime-950/60 text-lime-400 border-lime-800/40',
        },
    },
    emerson: {
        selectedBorder: 'border-blue-500',
        selectedShadow: 'shadow-blue-900/30',
        dropdownFocus: 'focus:border-blue-500',
        actionBg: 'bg-blue-950/40',
        actionBorder: 'border-blue-800/30',
        actionIcon: 'text-blue-400',
        actionLabel: 'text-blue-400',
        actionText: 'text-blue-300',
        codeColor: 'text-blue-400',
        chevronColor: '%2360a5fa',
        categoryBadge: {
            'Failure': 'bg-red-950/60 text-red-400 border-red-800/40',
            'Function Check': 'bg-amber-950/60 text-amber-400 border-amber-800/40',
            'Out of Specification': 'bg-cyan-950/60 text-cyan-400 border-cyan-800/40',
            'Maintenance Required': 'bg-blue-950/60 text-blue-400 border-blue-800/40',
            'Operation': 'bg-sky-950/60 text-sky-300 border-sky-800/40',
        },
    },
    azbil: {
        selectedBorder: 'border-red-700',
        selectedShadow: 'shadow-red-900/40',
        dropdownFocus: 'focus:border-red-600',
        actionBg: 'bg-red-950/40',
        actionBorder: 'border-red-900/50',
        actionIcon: 'text-red-400',
        actionLabel: 'text-red-500',
        actionText: 'text-red-300',
        codeColor: 'text-red-400',
        chevronColor: '%23f87171',
        categoryBadge: {
            'Failure': 'bg-red-950/80 text-red-400 border-red-800/60',
            'Function Check': 'bg-orange-950/60 text-orange-400 border-orange-800/40',
            'Out of Specification': 'bg-rose-950/60 text-rose-400 border-rose-800/40',
            'Maintenance Required': 'bg-red-950/60 text-red-500 border-red-900/60',
            'Operation': 'bg-pink-950/60 text-pink-400 border-pink-800/40',
        },
    },
};

const CATEGORY_ORDER = ['Failure', 'Function Check', 'Out of Specification', 'Maintenance Required', 'Operation'];
const CATEGORY_KO = {
    'Failure': '고장 (Failure)',
    'Function Check': '기능 점검 (Function Check)',
    'Out of Specification': '스펙 이탈 (Out of Specification)',
    'Maintenance Required': '정비 필요 (Maintenance Required)',
    'Operation': '운전 정보 (Operation)',
};

const BRANDS = [
    { key: 'yokogawa', label: '요꼬가와', sub: 'Yokogawa', img: '/pic/yokogawa.png', alarms: YOKOGAWA_ALARMS },
    { key: 'emerson', label: '에머슨', sub: 'Emerson', img: '/pic/emerson.png', alarms: EMERSON_ALARMS },
    { key: 'azbil', label: '아즈빌', sub: 'Azbil', img: '/pic/azbil.png', alarms: AZBIL_ALARMS },
];

export default function TransmitterAlarmFinder() {
    const [brand, setBrand] = useState('yokogawa');
    const [selectedId, setSelectedId] = useState('');

    const activeBrand = BRANDS.find(b => b.key === brand);
    const alarms = activeBrand?.alarms ?? [];
    const selected = alarms.find(a => a.id === selectedId);
    const theme = THEMES[brand];

    const grouped = CATEGORY_ORDER.reduce((acc, cat) => {
        const items = alarms.filter(a => a.category === cat);
        if (items.length) acc[cat] = items;
        return acc;
    }, {});

    const handleBrandChange = (key) => {
        setBrand(key);
        setSelectedId('');
    };

    // ★ 핵심 수정: backgroundRepeat을 'no-repeat'으로 명시 + style 객체로 분리
    const chevronStyle = {
        backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='${theme.chevronColor}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
        backgroundPosition: 'right 1rem center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: '1.2em 1.2em',
    };

    const badgeClass = (cat) =>
        `inline-block text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${theme.categoryBadge[cat] || 'bg-slate-800 text-slate-400 border-slate-700'}`;

    return (
        <div className="h-full w-full flex flex-col px-4 py-4 min-h-0">
            <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-lg w-full flex flex-col overflow-hidden flex-1">

                {/* ── STEP 1: Brand Image Buttons (원본 유지) ── */}
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
                                        ? `border-4 ${THEMES[b.key].selectedBorder} shadow-xl ${THEMES[b.key].selectedShadow} opacity-100`
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
                            className={`w-full h-12 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-base px-4 pr-10 outline-none cursor-pointer appearance-none ${theme.dropdownFocus} transition-colors duration-200 hover:bg-slate-700`}
                            style={chevronStyle}
                        >
                            <option value="" className="bg-slate-900">— 알람 코드를 선택하세요 —</option>
                            {Object.entries(grouped).map(([cat, items]) => (
                                <optgroup key={cat} label={`▸ ${CATEGORY_KO[cat]}`} className="bg-slate-900">
                                    {items.map(a => (
                                        <option key={a.id} value={a.id} className="bg-slate-900">
                                            {a.id} — {a.name}
                                        </option>
                                    ))}
                                </optgroup>
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

                            {/* Category Badge + Error Name */}
                            <div className="flex flex-col gap-2">
                                <div>
                                    <span className={badgeClass(selected.category)}>
                                        {CATEGORY_KO[selected.category] || selected.category}
                                    </span>
                                </div>
                                <span className={`font-mono text-2xl font-bold ${theme.codeColor}`}>
                                    {selected.id}
                                    <span className="text-slate-500 font-normal mx-2">—</span>
                                    <span className="text-slate-200">{selected.name}</span>
                                </span>
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
                                <Info className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">에러 시 출력</span>
                                    <p className="text-base text-slate-400 leading-relaxed break-words">{selected.output}</p>
                                </div>
                            </div>

                            {/* Action */}
                            <div className={`${theme.actionBg} border ${theme.actionBorder} rounded-xl p-4 flex gap-3 items-start`}>
                                <Wrench className={`w-5 h-5 ${theme.actionIcon} mt-0.5 flex-shrink-0`} />
                                <div className="flex flex-col gap-1">
                                    <span className={`text-xs ${theme.actionLabel} font-bold uppercase tracking-wider`}>조치 방법</span>
                                    <p className={`text-base ${theme.actionText} leading-relaxed font-medium break-words`}>{selected.action}</p>
                                </div>
                            </div>

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
