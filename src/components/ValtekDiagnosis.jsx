import React, { useState } from 'react';
import { FileText, AlertTriangle, CheckCircle, Wrench, RefreshCw, Zap, AlertOctagon, Activity, Cpu, XCircle, Info, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

// Color Definitions
const COLOR_MAP = {
    'OFF': 'bg-gray-900 border-gray-700',
    'Y': 'bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)] border-yellow-500',
    'G': 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)] border-green-600',
    'R': 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)] border-red-600',
    'B': 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)] border-blue-600',
    'O': 'bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.6)] border-orange-600',
};

// 3200MD Database — Official IOM LGENIM0059-12 (11/24) Table X 기준
// 3200MD는 G/Y/R 3색만 사용 (Blue/Orange 없음)
const DB_3200 = [
    // ── 운전 / 정보 (Green 계열) ──────────────────────────────────────
    { pattern: "GGGG", type: "운전", status: "정상 작동 (Normal Operation)", action: "정상 운전 중입니다. 추가 조치가 필요하지 않습니다." },
    { pattern: "GGGY", type: "운전", status: "MPC 활성 모드 — 완전 폐쇄 (Tight Shut Off Mode)", action: "밸브가 완전 닫힘(MPC) 상태입니다. 공장 기본값은 1% 이하 신호에서 활성화됩니다. 원하지 않으면 DTM에서 Position Cutoff 한계를 조정하십시오." },
    { pattern: "GGYG", type: "운전", status: "로컬 인터페이스 잠금/해제 (Local Interface Disabled/Enabled)", action: "로컬 인터페이스가 소프트웨어로 잠겨 있습니다. Quick-Cal 버튼을 누르면 잠시 표시됩니다. 로컬 제어가 필요하면 DTM에서 Local Interface를 재활성화하십시오." },
    { pattern: "GGYY", type: "운전", status: "디지털 명령 모드 (Digital Command Mode)", action: "HART 디지털 신호로 명령 중이며 4-20mA는 무시됩니다. 아날로그 복귀가 필요하면 QUICK-CAL 진행 중 Jog 버튼 동시 누름(Command Source Reset)을 수행하십시오." },
    { pattern: "GGRR", type: "운전", status: "스쿼크 모드 (Squawk Mode)", action: "HART 명령으로 장치 식별을 위해 점멸 중입니다. QUICK-CAL 버튼을 누르거나 1시간이 경과하면 자동 해제됩니다." },
    { pattern: "GYGG", type: "경고", status: "포지션 리미트 알림 (Position Limit Alert)", action: "밸브가 사용자 설정 상한 또는 하한 위치 지시계에 도달했습니다. 더 넓은 범위가 필요하면 한계를 재설정하거나 명령 신호를 범위 내로 조정하십시오." },
    { pattern: "GYGY", type: "경고", status: "소프트 스톱 알림 (Soft Stop Limit Alert)", action: "Final Command가 소프트 스톱 한계에 도달하여 포지셔너가 위치를 한계에 고정하고 있습니다. 더 넓은 범위가 필요하면 소프트 스톱을 조정하십시오." },
    { pattern: "GRGG", type: "경고", status: "사이클/이동량 한계 알림 (Cycles or Travel Limit Alert)", action: "밸브 또는 스풀 밸브의 사이클/이동량 한계를 초과했습니다. 밸브 패킹 조임, 링키지 마모 등 유지보수를 수행하고 누산기를 초기화하십시오." },
    // ── 경고 (Yellow 계열) ────────────────────────────────────────────
    { pattern: "YGGY", type: "경고", status: "시그니처 진행 중 (Signature in Progress Mode)", action: "ValveSight로 시작된 진단 서명 테스트가 진행 중입니다. Flowserve 소프트웨어로만 취소 가능합니다." },
    { pattern: "YGGR", type: "운전", status: "초기화 중 (Initializing Mode)", action: "장치가 전원 투입 후 부팅 중입니다. 3회 점멸 시퀀스가 완료될 때까지 기다리십시오." },
    { pattern: "YGYG", type: "설정", status: "교정 진행 중 (Calibration in Progress)", action: "스트로크 교정이 진행 중입니다. QUICK-CAL 버튼을 짧게 눌러 취소할 수 있습니다. 원격 교정은 소프트웨어로만 취소 가능합니다." },
    { pattern: "YGYY", type: "설정", status: "조그 명령 상태 (Jog Command State)", action: "로컬 조그 모드로 진입했습니다. 조그 버튼으로 밸브를 제어하십시오. QUICK-CAL 버튼을 짧게 눌러 종료하십시오." },
    { pattern: "YGYR", type: "설정", status: "조그 교정 상태 (Jog Calibration State)", action: "조그 교정 중 100% 위치 설정을 기다리고 있습니다. 조그 버튼으로 밸브를 100% 위치로 이동 후 조그 버튼을 동시에 눌러 확정하십시오." },
    { pattern: "YYGG", type: "경고", status: "온도 경고 (Temperature Warning)", action: "전자부 온도가 허용 범위(-40°C~85°C)를 벗어났습니다. 포지셔너 온도를 조절하십시오. 온도값이 이상하면 메인 보드를 교체하십시오." },
    { pattern: "YYGY", type: "경고", status: "압력 범위 초과 경고 (Pressure Out of Range Warning)", action: "압력 센서 교정 시 Port 1에 인가된 압력 범위가 최적 성능을 위해 너무 작았습니다. 공급 압력을 적정값(30~150 PSI)으로 조정 후 재교정하십시오." },
    { pattern: "YYGR", type: "경고", status: "공급 압력 높음 경고 (Supply Pressure High Warning)", action: "공급 압력이 사용자 설정 경고 상한을 초과했습니다. 포지셔너에서 압력을 낮추고 압력 센서 보드를 점검하십시오." },
    { pattern: "YYYG", type: "경고", status: "공급 압력 낮음 경고 (Supply Pressure Low Warning)", action: "공급 압력이 경고 하한 미만입니다(최소 30 PSI/2.1 bar 권장). 공급 라인 누설·킹크를 점검하고 공급 압력을 높이십시오." },
    { pattern: "YYYY", type: "경고", status: "작동 비율 경고 (Actuation Ratio Warning)", action: "밸브 구동에 필요한 힘이 가용 힘에 근접했습니다. 공급 압력을 높이거나, 마찰을 줄이거나, 액추에이터 스프링을 점검하십시오." },
    { pattern: "YRGG", type: "경고", status: "파일럿 릴레이 응답 경고 (Pilot Relay Response Warning)", action: "파일럿 릴레이가 느리거나 고착 중입니다. 밸브 응답을 확인하고, 공급 압력과 스풀 밸브에 이물질·오일·부식·얼음이 있는지 점검하십시오. 드라이버 모듈을 교체하십시오." },
    { pattern: "YRGY", type: "경고", status: "마찰 낮음 경고 (Friction Low Warning)", action: "마찰이 경고 하한 미만입니다. 패킹 부하가 부적절하게 설정되어 있을 수 있습니다. 밸브 패킹 상태를 점검하십시오." },
    { pattern: "YRGR", type: "경고", status: "공압 누설 경고 (Pneumatic Leak Warning)", action: "액추에이터 어셈블리에서 누설이 감지되었습니다. 튜빙 연결부와 액추에이터 씰을 수리하고 공급 압력을 확인하십시오." },
    { pattern: "YRYG", type: "경고", status: "마찰 높음 경고 (Friction High Warning)", action: "마찰이 경고 상한을 초과했습니다. 이물질 퇴적, 과도한 패킹 조임, 베어링 이상 등을 점검하십시오. 마찰을 줄이기 위해 밸브를 스트로크하거나 패킹을 풀어주십시오." },
    { pattern: "YRRY", type: "경고", status: "전자적 페일 세이프 불가 경고 (Electronic Inability to Fail Safe Warning)", action: "피에조가 손상되어 신호/전원 차단 시 정상 페일 위치로 이동하지 못할 수 있습니다. 30분 이상 지속되면 피에조 어셈블리를 교체하십시오." },
    { pattern: "YRRR", type: "경고", status: "공압적 페일 세이프 불가 경고 (Pneumatic Inability to Fail Safe Warning)", action: "공기 차단 시 스프링만으로는 페일 세이프 위치 도달이 불가합니다. 스프링 불량 또는 공정 부하 증가가 원인입니다. 스프링을 교체하거나 공정 부하와 마찰을 줄이십시오." },
    // ── 알람 (Red 계열) ────────────────────────────────────────────────
    { pattern: "RGGY", type: "알람", status: "피드백 교정 오류 (Feedback Reading Problem During Calibration)", action: "교정 중 피드백 암 회전 범위가 너무 작거나(최소 15도 이상 필요) 위치 센서가 범위를 벗어났습니다. 피드백 핀을 피벗에서 멀리 이동하여 더 큰 회전 각도를 확보하십시오. QUICK-CAL 버튼을 짧게 누르면 마지막 유효 교정값으로 운전을 계속할 수 있습니다." },
    { pattern: "RGGR", type: "알람", status: "ILO 타임아웃 알람 (Inner Loop Offset Time Out)", action: "교정 중 Inner Loop Offset 값이 수렴하지 않았습니다. 스트로크 교정을 반복하십시오. 게인 설정을 낮추면 도움이 될 수 있습니다. QUICK-CAL 버튼을 짧게 누르면 현재 ILO 값으로 계속 진행할 수 있습니다." },
    { pattern: "RGYG", type: "알람", status: "안정화 시간 초과 알람 (Non-Settle Time Out)", action: "교정 중 위치 피드백 센서가 안정되지 않았습니다. 링키지 유격이나 센서 고정 상태를 점검하십시오. QUICK-CAL 버튼으로 마지막 유효 교정값으로 복구 가능합니다." },
    { pattern: "RGYY", type: "알람", status: "동작 없음 타임아웃 알람 (No Motion Time Out)", action: "교정 중 액추에이터 움직임이 감지되지 않았습니다. 링키지와 공급 압력을 확인하십시오. 액추에이터가 매우 크면 재시도하면 허용 시간이 두 배로 늘어납니다." },
    { pattern: "RGRR", type: "알람", status: "공장 초기화 상태 (Factory Reset State)", action: "공장 초기화 후 교정이 완료되지 않아 포지셔너가 페일 세이프 위치를 유지하며 명령에 응답하지 않습니다. QUICK-CAL(3초 유지)로 즉시 스트로크 교정을 수행하십시오." },
    { pattern: "RYYG", type: "알람", status: "공급 압력 낮음 알람 (Supply Pressure Low Alarm)", action: "공급 압력이 알람 하한(최소 30 PSI/2.1 bar) 미만입니다. 포지셔너는 약 17 PSI(1.2 bar) 이하에서 작동 중단합니다. 공급 라인 차단·누설·킹크를 즉시 점검하십시오." },
    { pattern: "RRGG", type: "알람", status: "파일럿 릴레이 응답 알람 (Pilot Relay Response Alarm)", action: "파일럿 릴레이가 매우 느리거나 고착되어 있습니다. 공급 압력을 확인하고 스풀 밸브에 이물질·오일·부식·얼음이 있는지 점검하십시오. 드라이버 모듈 어셈블리를 교체하십시오." },
    { pattern: "RRGY", type: "알람", status: "마찰 낮음 알람 (Friction Low Alarm)", action: "마찰이 알람 하한 미만입니다. 패킹 누설 가능성이 높습니다. 즉시 패킹을 점검하거나 교체하십시오." },
    { pattern: "RRGR", type: "알람", status: "마찰 높음 알람 (Friction High Alarm)", action: "마찰이 알람 상한을 초과했습니다. 이물질 퇴적, 베어링 고착, 과도한 패킹 조임 등이 원인입니다. 즉시 밸브를 점검하고 수리하십시오." },
    { pattern: "RRYG", type: "알람", status: "피에조 전압 알람 (Piezo Voltage Alarm)", action: "피에조를 구동하는 회로 보드 부분이 불량이거나 피에조 밸브 자체가 불량입니다. 포지셔너가 제어 중이면 피에조를 교체하고, 작동하지 않으면 메인 PCB를 교체하십시오." },
    { pattern: "RRYR", type: "알람", status: "파일럿 릴레이 위치 한계 알람 (Pilot Relay Position Limit Alarm)", action: "스풀 밸브(파일럿 릴레이)가 한계에 고착되어 응답하지 않습니다. 공급 압력을 확인하고 QUICK-CAL로 홀 센서 문제를 초기화하십시오. 내부 배선, 스풀 밸브 고착, 피에조 상태를 점검하십시오." },
    { pattern: "RRRY", type: "알람", status: "전자부 오류 또는 알람 (Electronics Error or Alarm)", action: "내부 데이터가 올바르게 업데이트되지 않았습니다. 시간이 지나면 자동 해제될 수 있습니다. 지속 시 전원 재투입 후 QUICK-CAL을 수행하십시오. 내부 배선과 커넥터를 점검하고 메인 PCB를 교체하십시오." },
    { pattern: "RRRR", type: "알람", status: "위치 편차 알람 (Position Deviation Alarm)", action: "지시값과 실제 위치 차이가 사용자 설정 한계를 사용자 설정 시간보다 오래 초과했습니다. 활성 알람/경고의 근본 원인을 파악하십시오." }
];

// 3800MD Database — Official IOM FCD LGENIM0112-10 (11/24) Appendix D + E 기준
const DB_3800 = [
    // ── 운전 / 정보 (Green 계열) ──────────────────────────────────────
    { pattern: "GGGG", type: "운전", status: "전원 켜짐 / 교정 성공 (Power ON / Calibration Succeeded)", action: "정상 작동 중입니다. 별도의 조치가 필요하지 않습니다." },
    { pattern: "GGGB", type: "운전", status: "연속 스트로크 테스트 모드 (Continuous Stroke Test Mode)", action: "CST 기능이 활성화되어 있습니다. 더 높은 안정성이 필요하면 DTM에서 CST 비율·한계를 조정하거나 기능을 해제하십시오." },
    { pattern: "GGGY", type: "운전", status: "완전 폐쇄 모드 (Tight Shut Off Mode)", action: "MPC 기능으로 밸브가 완전 폐쇄 중입니다. 폐쇄가 불필요하면 DTM에서 Tight Shutoff 한계값을 조정하십시오." },
    { pattern: "GGGO", type: "운전", status: "릴레이 교정 범위 내 (Relay Calibration in Range)", action: "릴레이 교정이 허용 범위 내에 있습니다. QUICK-CAL 버튼을 짧게 눌러 교정을 수락하십시오." },
    { pattern: "GGBB", type: "운전", status: "백업 제어 모드 (Backup Control Mode)", action: "피드백 링키지가 분리되었거나 센서 범위를 벗어나 압력 기반 제어 중입니다. 피드백 링키지 상태를 점검하고 필요 시 재교정하십시오." },
    { pattern: "GGYG", type: "운전", status: "로컬 인터페이스 잠금 (Local Interface Off)", action: "현장 버튼이 잠겨 있습니다. DTM에서 Local Interface 잠금을 해제하거나 PIN을 입력하십시오." },
    { pattern: "GGYY", type: "운전", status: "디지털 명령 모드 (Digital Command Mode)", action: "HART 디지털 명령으로 제어 중입니다. 아날로그(4-20mA)로 복귀하려면 I버튼을 3초 유지하거나 DTM을 사용하십시오." },
    { pattern: "GGYR", type: "운전", status: "초기화 중 (Initializing)", action: "장치가 부팅 중입니다. 3회 점멸 시퀀스가 완료될 때까지 기다리십시오." },
    { pattern: "GGOO", type: "운전", status: "DI 활성 알림 (DI Active Alert)", action: "이산 입력(DI) 전압이 변경되어 사용자 정의 동작이 실행 중입니다. DI 기능 설정을 DTM에서 확인하십시오." },
    { pattern: "GGRR", type: "운전", status: "테스트 모드 (Test Mode)", action: "테스트 모드가 활성화되어 있습니다. 전원을 재투입하여 정상 모드로 복귀하십시오." },
    { pattern: "GBBB", type: "운전", status: "장치 식별 모드 (Squawk Mode)", action: "HART 명령으로 장치 식별 점멸 중입니다. QUICK-CAL 버튼을 짧게 누르거나 1시간 경과 시 자동 해제됩니다." },
    { pattern: "GBYO", type: "설정", status: "릴레이 교정 - 시계 방향 조정 (Relay Calibration Adjust Clockwise)", action: "릴레이 조정 나사를 시계 방향으로 미세 조정하십시오. 조정 각도는 통상 10도 미만입니다." },
    { pattern: "GYGY", type: "경고", status: "소프트 스톱 상한/하한 알림 (Soft Stop High/Low Limit Alert)", action: "Final Command가 소프트 스톱 한계에 도달했습니다. 더 넓은 범위가 필요하면 소프트 스톱 설정을 조정하십시오." },
    { pattern: "GYYG", type: "설정", status: "압력 교정 필요 (Pressure Calibration Required)", action: "Factory Pressure Calibration이 미수행 상태입니다. Flowserve 담당자에게 연락하여 교정을 받으십시오." },
    { pattern: "GYYR", type: "운전", status: "부분 스트로크 테스트 예약됨 (Partial Stroke Test Scheduled)", action: "PST 예약 시간이 도래했습니다. 절차에 따라 PST를 실행하거나 DTM에서 일정을 확인하십시오." },
    { pattern: "GYOG", type: "설정", status: "AO 출력 0% 설정 대기 (AO Input Set 0%)", action: "아날로그 출력 교정 중입니다. 출력 전류를 0%로 조정 후 QUICK-CAL 버튼을 누르십시오." },
    { pattern: "GYOO", type: "설정", status: "AO 출력 100% 설정 대기 (AO Input Set 100%)", action: "아날로그 출력 교정 중입니다. 출력 전류를 100%로 조정 후 QUICK-CAL 버튼을 누르십시오." },
    { pattern: "GOYY", type: "설정", status: "교정 유형 선택 대기 (Calibration Type Set)", action: "Hot Key로 교정이 시작되었습니다. Appendix F를 참조하여 교정 유형을 선택하십시오." },
    { pattern: "GRGG", type: "운전", status: "시그니처/PST 진행 중 (Signature or PST in Progress)", action: "오프라인 진단(Step/Ramp/PST 등) 실행 중입니다. DTM의 Off-Line Diagnostics 화면에서 취소 가능합니다." },
    { pattern: "GRGR", type: "운전", status: "DI 명령 우선 제어 (DI Command Override)", action: "DI 신호가 활성화되어 사전 설정 위치로 제어 중입니다. DI 기능과 설정값을 DTM에서 확인하십시오." },
    { pattern: "GRYG", type: "설정", status: "명령 입력 0% 설정 대기 (Command Input Set 0%)", action: "커맨드 입력 교정 중입니다. 루프 전류를 0%로 조정 후 QUICK-CAL 버튼을 누르십시오." },
    { pattern: "GRYY", type: "설정", status: "명령 입력 100% 설정 대기 (Command Input Set 100%)", action: "커맨드 입력 교정 중입니다. 루프 전류를 100%로 조정 후 QUICK-CAL 버튼을 누르십시오." },
    { pattern: "GROY", type: "설정", status: "아날로그 입력 0% 설정 대기 (Analog In Set 0%)", action: "아날로그 입력 교정 중입니다. 입력 루프 전류를 0%로 조정 후 QUICK-CAL 버튼을 누르십시오." },
    { pattern: "GROO", type: "설정", status: "아날로그 입력 100% 설정 대기 (Analog In Set 100%)", action: "아날로그 입력 교정 중입니다. 입력 루프 전류를 100%로 조정 후 QUICK-CAL 버튼을 누르십시오." },
    { pattern: "GRRY", type: "운전", status: "조그 명령 모드 (Jog Command Mode)", action: "로컬 조그 모드로 밸브를 수동 제어 중입니다. QUICK-CAL 버튼을 짧게 눌러 정상 모드로 복귀하십시오." },
    // ── 시스템 (Blue 계열 — SW Download) ──────────────────────────────
    { pattern: "BBBG", type: "시스템", status: "소프트웨어 다운로드 완료 (Software Download Complete)", action: "새 소프트웨어가 준비되었습니다. 장치를 재시작하여 소프트웨어를 활성화하십시오." },
    { pattern: "BBBB", type: "시스템", status: "소프트웨어 다운로드 중 (Software Download in Progress)", action: "펌웨어 다운로드 중입니다. 통신이 끊기지 않도록 주의하며 완료를 기다리십시오." },
    { pattern: "BBBY", type: "시스템", status: "소프트웨어 다운로드 대기 (Software Download Waiting)", action: "다운로드 중 통신이 일시 중단되었습니다. 신호 라인 상태를 점검하십시오." },
    { pattern: "BBBO", type: "시스템", status: "소프트웨어 다운로드 일시 중지 (Software Download Paused)", action: "사용자에 의해 다운로드가 일시 정지되었습니다. 다운로드를 재개하십시오." },
    { pattern: "BBBR", type: "시스템", status: "소프트웨어 다운로드 실패 경고 (Software Download Fail Warning)", action: "다운로드 중 통신 오류가 발생했습니다. 통신 케이블과 루프 전류를 확인 후 재시도하십시오. 지속 시 Flowserve에 문의하십시오." },
    // ── 경고 (Yellow 계열) ─────────────────────────────────────────────
    { pattern: "YGGG", type: "경고", status: "위치 상한/하한 알림 (Position High/Low Limit Alert)", action: "밸브가 사용자 정의 위치 한계에 도달했습니다. 한계값을 높이거나 명령 신호를 범위 내로 조정하십시오." },
    { pattern: "YGGY", type: "경고", status: "구동부/밸브 사이클/이동 경고 (Valve/Actuator Cycles Warning)", action: "사용자 설정 사이클/이동량 한계를 초과했습니다. 패킹 조임, 링키지 마모 등을 점검하고 누산기를 초기화하십시오." },
    { pattern: "YGGR", type: "설정", status: "조그 교정 100% 위치 설정 (Jog Calibration Set 100% Position)", action: "조그 교정 모드입니다. I·III 버튼으로 밸브를 100% 위치로 이동 후 QUICK-CAL 버튼을 눌러 수락하십시오." },
    { pattern: "YGBB", type: "설정", status: "릴레이 교정 안정화 대기 (Relay Calibration Settle)", action: "릴레이 교정 중 압력이 균형을 이루기를 기다리고 있습니다. 압력이 안정될 때까지 대기하십시오." },
    { pattern: "YGYG", type: "운전", status: "위치 복구 모드 (Position Recovery Mode)", action: "교정 범위를 벗어난 위치에서 복구 중입니다. 밸브 링키지 구성을 확인하고 필요 시 재교정하십시오." },
    { pattern: "YGRY", type: "경고", status: "연속 스트로크 테스트 실패 경고 (Continuous Stroke Test Failed Warning)", action: "5회 연속 시도 후 밸브가 움직이지 않았습니다. 마찰, 공급 압력, 공압 관련 경고를 확인하십시오." },
    { pattern: "YGRR", type: "경고", status: "부분 스트로크 테스트 실패 경고 (PST Failed Warning)", action: "PST 판정 기준을 통과하지 못했습니다. PST 완료 후 경고가 자동 해제됩니다. 밸브 고착 여부를 점검하십시오." },
    { pattern: "YYGG", type: "경고", status: "온도 높음/낮음 경고 (Temperature High/Low Warning)", action: "내부 전자부 온도가 허용 범위(-40°C~85°C)를 벗어났습니다. 차열·단열 조치를 취하십시오. 온도 값이 이상하면 메인 보드를 교체하십시오." },
    { pattern: "YYGY", type: "경고", status: "밸브 과도 개방/폐쇄 경고 (Valve Opened/Closed Too Far Warning)", action: "밸브가 마지막 교정 대비 0.5% 이상 더 열리거나 닫혔습니다. 피드백 링키지와 스템 연결 상태를 확인하고 재교정하십시오." },
    { pattern: "YYGR", type: "경고", status: "공급 압력 높음 경고 (Supply Pressure High Warning)", action: "공급 압력이 사용자 설정 상한을 초과했습니다. 레귤레이터를 조정하고 압력 센서 보드를 점검하십시오." },
    { pattern: "YYYG", type: "경고", status: "공급 압력 낮음 경고 (Supply Pressure Low Warning)", action: "공급 압력이 사용자 설정 하한(최소 1.3bar/19PSI) 미만입니다. 공급 라인 누설 및 공기 공급 상태를 점검하십시오." },
    { pattern: "YYYY", type: "경고", status: "작동 비율 경고 (Actuation Ratio Warning)", action: "제어에 필요한 힘이 가용 최대 힘에 근접했습니다. 공급 압력을 높이거나, 마찰을 줄이거나, 액추에이터 스프링을 점검하십시오." },
    { pattern: "YYYO", type: "경고", status: "시스템 예외/CPU 사용량/RAM CRC 오류 경고 (System Exception / CPU / RAM Warning)", action: "시스템 내부 오류 또는 CPU 과부하입니다. 펌웨어를 업데이트하거나 전원을 재투입하십시오. 지속 시 메인 보드를 교체하십시오." },
    { pattern: "YYYR", type: "경고", status: "NVMEM CRC / Flash CRC 오류 경고 (NVMEM/Flash CRC Error Warning)", action: "메모리 데이터가 손상되었습니다. 오류가 지속되면 전원 재투입 및 Quick-Cal을 수행하거나, 공장 초기화 후 재교정하십시오." },
    { pattern: "YYOG", type: "경고", status: "버튼 눌림 고정 경고 (Button Stuck On)", action: "내·외부 버튼 중 하나가 ON 상태에 고착되었습니다. 버튼을 조작하여 해제하고, 이물질이 있으면 부드러운 천으로 청소하십시오." },
    { pattern: "YYOY", type: "경고", status: "명령 주파수/진폭 경고 (Command Frequency/Amplitude Warning)", action: "명령 신호의 진동 주파수 또는 진폭이 경고 한계를 초과했습니다. 게인 설정과 제어 루프 장비를 점검하십시오." },
    { pattern: "YYOO", type: "경고", status: "위치 주파수/진폭 경고 (Position Frequency/Amplitude Warning)", action: "위치 신호의 진동 주파수 또는 진폭이 경고 한계를 초과했습니다. Hi Friction 설정 적용 또는 게인을 낮추고 패킹 상태를 점검하십시오." },
    { pattern: "YRGY", type: "경고", status: "마찰 낮음 경고 (Friction Low Warning)", action: "마찰이 경고 하한 미만입니다. 패킹 누설 가능성이 있으니 패킹을 점검하고 필요 시 조이십시오." },
    { pattern: "YRGR", type: "경고", status: "마찰 높음 경고 (Friction High Warning)", action: "마찰이 경고 상한을 초과했습니다. 이물질 퇴적, 과도한 패킹 조임, 베어링 이상 등을 점검하고 마찰을 줄이십시오." },
    { pattern: "YRYG", type: "설정", status: "교정 진행 중 (Stroke/Feedback/Pressure/Full Calibration in Progress)", action: "교정 시퀀스가 진행 중입니다. DTM, 핸드헬드 또는 버튼 동시 누름으로 취소 가능합니다. 완료될 때까지 대기하십시오." },
    { pattern: "YRYY", type: "경고", status: "백래시 경고 (Backlash Warning)", action: "감지된 백래시가 경고 한계를 초과했습니다. 스템 및 액추에이터 연결 부품의 유격을 점검하고 고정하십시오." },
    { pattern: "YRYO", type: "경고", status: "밸런스 압력 경고 (Balance Pressure Warning)", action: "공압 누설이 감지되거나 릴레이 밸런스 압력 교정 값이 부정확합니다. 튜빙 연결부와 액추에이터 씰을 점검하고 릴레이 밸런스 압력을 재교정하십시오." },
    { pattern: "YRYR", type: "경고", status: "공압 누설 경고 (Pneumatic Leak Warning)", action: "액추에이터 어셈블리에서 누설이 감지되었습니다. 튜빙 연결부와 액추에이터 씰을 수리하고 릴레이 마모를 점검하십시오." },
    { pattern: "YRRG", type: "경고", status: "배터리 부족 경고 (Low Battery Warning)", action: "RTC 배터리 전압이 낮습니다. 배터리는 교체 불가이므로 전자 어셈블리를 교체하십시오. 날짜/시간을 재설정하십시오." },
    { pattern: "YRRY", type: "경고", status: "피에조 전압 높음/낮음 경고 (Piezo Voltage High/Low Warning)", action: "피에조 구동 전압이 경고 한계를 벗어났습니다. 공급 압력이 낮지 않은지 확인하십시오. 30분 이상 지속되면 파일럿 릴레이를 교체하십시오." },
    { pattern: "YRRO", type: "경고", status: "벤트 막힘 경고 (Vent Blocked Warning)", action: "하우징 내 압력이 높습니다. 벤트 포트 덮개를 제거하고 이물질을 청소하십시오. 하우징에 수분 침투 여부도 확인하십시오." },
    { pattern: "YRRR", type: "경고", status: "스프링 페일 세이프 불가 경고 (Spring Unable to Fail Safe Warning)", action: "스프링만으로는 공기/전원 차단 시 페일 세이프 위치 도달이 불가합니다. 스프링을 교체하거나 공정 부하·마찰을 줄이십시오." },
    // ── 알람 (Red 계열) ────────────────────────────────────────────────
    { pattern: "RGGG", type: "알람", status: "명령 입력 ADC 범위 오류 (Command Input Range Too Small / Above / Below ADC Range)", action: "명령 루프 교정 시 신호 범위 차이가 5mA 미만이거나 ADC 범위를 벗어났습니다. 신호 차이가 5mA 이상이 되도록 재교정하거나 전자 어셈블리를 교체하십시오." },
    { pattern: "RGGB", type: "알람", status: "아날로그 입력 ADC 범위 오류 (Analog Input Range Too Small / Above / Below ADC Range)", action: "아날로그 입력 교정 시 신호 범위가 너무 작거나 ADC 범위를 벗어났습니다. 더 넓은 신호 범위로 재교정하거나 전자 어셈블리를 교체하십시오." },
    { pattern: "RGGY", type: "알람", status: "위치 피드백 범위 너무 작음 (Position Range Too Small)", action: "교정 시 피드백 암의 회전 각도가 너무 작습니다(최소 15도 이상 필요). 피드백 핀 위치를 피벗에서 멀리 이동하여 더 큰 회전 각도를 확보하고 재교정하십시오." },
    { pattern: "RGGO", type: "알람", status: "압력 레귤레이터 오류 (Pressure Regulator Error)", action: "교정 중 레귤레이터 압력이 너무 높거나 낮았습니다. 서비스 기술자를 통해 레귤레이터 압력을 18.8 PSI로 조정하십시오." },
    { pattern: "RGGR", type: "알람", status: "ILO 타임아웃 알람 (Inner Loop Offset Time Out)", action: "교정 중 ILO 값이 수렴하지 않았습니다. 스트로크 교정을 반복하십시오. QUICK-CAL 버튼을 짧게 누르면 이전 ILO 값으로 진행할 수 있습니다. 게인 스위치를 낮추면 도움이 될 수 있습니다." },
    { pattern: "RGBG", type: "알람", status: "원격 마운트 범위 이탈 (Remote Mount Out of Range)", action: "스트로크 교정 시 원격 마운트 ADC 값이 허용 범위를 벗어났습니다. 원격 마운트 POT를 조정하고 재교정하십시오." },
    { pattern: "RGYG", type: "알람", status: "안정화 시간 초과 (Settle Time Out)", action: "교정 중 위치 피드백 또는 공급 압력이 움직임 후 안정되지 않았습니다. 공급 압력 조절 여부를 확인하고 QUICK-CAL 버튼으로 오류를 해제 후 재교정하십시오." },
    { pattern: "RGYY", type: "알람", status: "동작 없음 타임아웃 (No Motion Time Out)", action: "스트로크 교정 중 밸브 움직임이 감지되지 않았습니다. 공기 공급과 링키지 연결을 확인하십시오. 액추에이터가 매우 크면 재시도하면 자동으로 대기 시간이 늘어납니다." },
    { pattern: "RGYR", type: "알람", status: "아날로그 출력 범위 너무 작음 (Analog Output Range Too Small)", action: "AO 교정 시 0%와 100% 전류 차이가 너무 작습니다. 더 넓은 차이로 재교정하거나 QUICK-CAL 버튼으로 알림을 해제하십시오." },
    { pattern: "RGOG", type: "알람", status: "페일 세이프 위치 오류 (Fail Safe Position Error)", action: "선택된 Air-to-Open/Close 설정이 포지셔너가 감지한 실제 작동 방향과 다릅니다. DIP 스위치 ATO/ATC 설정과 액추에이터 튜빙 방향을 확인하십시오." },
    { pattern: "RGOO", type: "알람", status: "릴레이 교정 오류 (Relay Calibration Error)", action: "릴레이가 충분히 움직이지 않았습니다. 릴레이 설치 상태, 정렬, O링, 자석을 점검하고 릴레이 교정을 다시 수행하십시오." },
    { pattern: "RGOR", type: "알람", status: "온도 교정 필요 (Temperature Calibration Required)", action: "온도 교정이 수행되지 않았습니다. Flowserve 담당자에게 연락하십시오." },
    { pattern: "RGRG", type: "알람", status: "교정 필요 (Calibration Required)", action: "공장 초기화 후 교정이 완료되지 않아 포지셔너가 페일 세이프 위치를 유지합니다. QUICK-CAL(3초 유지)로 스트로크 교정을 즉시 수행하십시오." },
    { pattern: "RGRB", type: "알람", status: "위치 피드백 교정 필요 (Position Feedback Calibration Required)", action: "위치 피드백 교정이 필요합니다. Appendix F Hot Keys를 참조하여 피드백 교정을 수행하십시오." },
    { pattern: "RGRY", type: "알람", status: "스트로크 이동/변화 (Stroke Shift / Stroke Span Increase / Decrease)", action: "0%·100% 위치가 마지막 교정 이후 이동했습니다. 피드백 링키지와 포지셔너 마운팅이 느슨하지 않은지 확인하십시오. QUICK-CAL 버튼으로 알림을 해제할 수 있습니다." },
    { pattern: "RGRR", type: "알람", status: "공장 초기화 상태 (Factory Reset State)", action: "포지셔너가 공장 초기화 상태입니다. QUICK-CAL(3초 유지)로 스트로크 교정을 즉시 수행하십시오." },
    { pattern: "RYGG", type: "알람", status: "밸브 열림/닫힘 불가 알람 (Valve Can't Open / Can't Shut Alarm)", action: "공압이 적용되었으나 밸브가 열리거나 닫히지 않습니다. 피드백 링키지 연결 상태를 확인하고 마찰 트렌드를 검토하십시오. 기계적 장애물 제거, 패킹 윤활 또는 액추에이터를 점검하십시오." },
    { pattern: "RYYG", type: "알람", status: "공급 압력 낮음 알람 (Supply Pressure Low Alarm)", action: "공급 압력이 최소 권장치(1.3bar/19PSI) 미만입니다. 공급 라인 차단·누설·킹크를 점검하고 공기 공급을 복구하십시오." },
    { pattern: "RYYY", type: "알람", status: "아날로그 출력 전원 없음 (Analog Output No Loop Power)", action: "AO 단자에 루프 전원이 없습니다. AO 루프 배선과 전원 공급 장치를 점검하십시오. 회로가 사용되지 않으면 알람을 마스킹하십시오." },
    { pattern: "RYYO", type: "알람", status: "아날로그 출력 오류 (Analog Output Error)", action: "AO 회로가 예상 출력 전류를 생성하지 못합니다. AO 루프 배선과 컴플라이언스 전압을 확인하고 전자 어셈블리를 교체하십시오." },
    { pattern: "RYYR", type: "알람", status: "아날로그 입력 전원 없음 (Analog Input No Loop Power)", action: "AI 단자에 루프 전원이 없습니다. AI 루프 배선과 전원 공급 장치를 점검하십시오. 회로가 사용되지 않으면 알람을 마스킹하십시오." },
    { pattern: "RYOY", type: "알람", status: "명령 주파수/진폭 알람 (Command Frequency/Amplitude Alarm)", action: "명령 신호의 진동이 알람 한계를 초과했습니다. 게인 레벨을 검토하고 제어 루프 장비를 점검하십시오." },
    { pattern: "RYOO", type: "알람", status: "위치 주파수/진폭 알람 (Position Frequency/Amplitude Alarm)", action: "위치 신호의 진동이 알람 한계를 초과했습니다. Hi Friction 설정 적용 또는 게인을 낮추고 마찰 상태를 점검하십시오. 릴레이 교체를 검토하십시오." },
    { pattern: "RYRG", type: "알람", status: "위치 센서 고장 알람 (Position Sensor Failure Alarm)", action: "피드백 암이 밸브 어셈블리에서 분리되었거나 센서가 고장났습니다. 피드백 암 링키지를 확인하고 재교정하십시오. 문제가 지속되면 수리를 위해 반납하십시오." },
    { pattern: "RYRY", type: "알람", status: "포트 압력 범위 오류 (Port Out of Range / Range Too Small)", action: "압력 센서(포트 A/B/C/R/S)가 포화 상태이거나 고장났습니다. 공급 압력(최대 10.3bar/150PSI)을 확인하고 압력 센서를 재교정하십시오. 지속 시 전자 어셈블리를 교체하십시오." },
    { pattern: "RYRR", type: "알람", status: "전압 오류 (Supply Voltage / Reference Voltage / Voltage ADC / Piezo Voltage / Shunt Voltage/Current Error)", action: "내부 회로 전압 또는 전류 값이 허용 범위를 벗어났습니다. 알람이 지속되면 전자 어셈블리를 교체하십시오." },
    { pattern: "ROYB", type: "설정", status: "릴레이 교정 - 반시계 방향 조정 (Relay Calibration Adjust Counter-Clockwise)", action: "릴레이 조정 나사를 반시계 방향으로 미세 조정하십시오. 조정 각도는 통상 10도 미만입니다." },
    { pattern: "RRGY", type: "알람", status: "마찰 낮음 알람 (Friction Low Alarm)", action: "마찰이 알람 하한 미만입니다. 패킹이 완전히 마모되었거나 공정 유체가 스템에서 누설될 수 있습니다. 즉시 패킹을 점검하거나 교체하십시오." },
    { pattern: "RRGR", type: "알람", status: "마찰 높음 알람 (Friction High Alarm)", action: "마찰이 알람 상한을 초과했습니다. 이물질 퇴적, 과도한 패킹 조임, 베어링 고착 등이 원인일 수 있습니다. 즉시 밸브를 점검하고 수리하십시오." },
    { pattern: "RRYG", type: "알람", status: "피드백 링키지 알람 (Feedback Linkage Alarm)", action: "피드백 링키지가 분리되었거나 위치 피드백 센서가 범위를 벗어났습니다. 피드백 암을 고정하고 재교정하십시오." },
    { pattern: "RRYY", type: "알람", status: "백래시 알람 (Backlash Alarm)", action: "감지된 백래시가 알람 한계를 초과했습니다. 밸브 안정성에 영향을 줄 수 있습니다. 스템 및 액추에이터 연결 부품의 유격을 즉시 수리하십시오." },
    { pattern: "RRYR", type: "알람", status: "릴레이 작동 불능 (Relay Can't Open / Can't Shut / Sensor Failure / Type Unknown)", action: "파일럿 릴레이가 가압 또는 감압 방향으로 움직이지 않습니다. 내부 배선 연결과 릴레이 고착 여부를 확인하십시오. 피에조 및 릴레이 어셈블리를 교체하십시오." },
    { pattern: "RRRB", type: "알람", status: "호환되지 않는 소프트웨어 알람 (Incompatible Software Alarm)", action: "보드에 통신 유형(FF, HART 등)을 변경하는 소프트웨어가 프로그래밍되었습니다. 올바른 소프트웨어로 보드를 재프로그래밍하십시오." },
    { pattern: "RRRY", type: "알람", status: "피에조 전압 높음/낮음 알람 (Piezo Voltage High/Low Alarm)", action: "피에조 구동 전압이 알람 한계를 벗어났습니다. 공급 압력을 확인하십시오. 30분 이상 지속되면 파일럿 릴레이를 교체하십시오." },
    { pattern: "RRRO", type: "알람", status: "릴레이 ILO 범위 이탈 경고 (Relay Inner Loop Offset Out-of-Range Warning)", action: "Inner Loop Offset이 예상 값에서 크게 벗어났습니다. 릴레이 자석이 느슨하지 않은지 확인하고 릴레이 및 메인 보드를 교체하십시오." },
    { pattern: "RRRR", type: "알람", status: "위치 편차 알람 (Position Deviation Alarm)", action: "명령과 실제 위치의 차이가 허용 시간 이상 지속되었습니다. 활성 경고·알람의 근본 원인을 파악하십시오. DTM의 Valve Health 페이지에서 편차 설정을 조정할 수 있습니다." }
];

// Helper to get style based on Type/Category
const getStyleByType = (type) => {
    switch (type) {
        case '운전': return { icon: CheckCircle, color: 'text-green-400', badge: 'bg-green-900/80 text-green-300 border-green-700', bg: 'bg-green-950/30' };
        case '정보': return { icon: Info, color: 'text-blue-400', badge: 'bg-blue-900/80 text-blue-300 border-blue-700', bg: 'bg-blue-950/30' };
        case '설정': return { icon: Wrench, color: 'text-orange-400', badge: 'bg-orange-900/80 text-orange-300 border-orange-700', bg: 'bg-orange-950/30' };
        case '경고': return { icon: AlertTriangle, color: 'text-yellow-400', badge: 'bg-yellow-900/80 text-yellow-300 border-yellow-700', bg: 'bg-yellow-950/30' };
        case '알람': return { icon: AlertOctagon, color: 'text-red-500', badge: 'bg-red-900/80 text-red-200 border-red-700', bg: 'bg-red-950/40' };
        case '시스템': return { icon: Cpu, color: 'text-blue-400', badge: 'bg-blue-900/80 text-blue-300 border-blue-700', bg: 'bg-blue-950/40' };
        default: return { icon: Info, color: 'text-slate-400', badge: 'bg-slate-800 text-slate-400 border-slate-700', bg: 'bg-transparent' };
    }
};

export default function ValtekDiagnosis() {
    const [model, setModel] = useState('3200MD');
    const [leds, setLeds] = useState(['OFF', 'OFF', 'OFF', 'OFF']);

    // Model specific colors - 3800MD automatically adds Blue and Orange
    const availableColors = model === '3800MD'
        ? ['OFF', 'G', 'Y', 'R', 'B', 'O']
        : ['OFF', 'G', 'Y', 'R'];

    const activeDB = model === '3800MD' ? DB_3800 : DB_3200;

    const cycleColor = (index) => {
        setLeds(prev => {
            const newLeds = [...prev];
            const currentIndex = availableColors.indexOf(newLeds[index]);
            const nextIndex = (currentIndex + 1) % availableColors.length;
            newLeds[index] = availableColors[nextIndex];
            return newLeds;
        });
    };

    const handleModelChange = (newModel) => {
        setModel(newModel);
        setLeds(['OFF', 'OFF', 'OFF', 'OFF']);
    };

    const patternKey = leds.join('');
    const result = activeDB.find(item => item.pattern === patternKey);
    const style = result ? getStyleByType(result.type) : null;

    return (
        <div className="flex flex-col gap-3 h-full">
            {/* Visual Model Selector Cards - Always Side by Side */}
            <div className="grid grid-cols-2 gap-2">
                {/* 3200MD Card */}
                <button
                    onClick={() => handleModelChange('3200MD')}
                    className={cn(
                        "flex-1 rounded-2xl border-2 p-3 transition-all active:scale-[0.98] touch-manipulation overflow-hidden relative shadow-lg",
                        model === '3200MD'
                            ? "border-blue-500 bg-blue-600/20 ring-2 ring-blue-500/40 shadow-blue-900/40"
                            : "border-slate-800 bg-card hover:bg-slate-800/50"
                    )}
                >
                    {model === '3200MD' && (
                        <div className="absolute top-2 right-2 w-7 h-7 bg-[#0066B3] rounded-full flex items-center justify-center z-10 shadow-lg">
                            <Check className="w-5 h-5 text-white" strokeWidth={3} />
                        </div>
                    )}
                    <img
                        src="/pic/Logix 3200MD.png"
                        alt="Logix 3200MD 디지털 포지셔너"
                        className="w-full aspect-video object-contain rounded bg-white/5"
                    />
                    <div className="text-center">
                        <div className="text-sm font-bold text-white">Logix 3200MD</div>
                        <div className="text-[10px] text-gray-500">Legacy (G/Y/R)</div>
                    </div>
                </button>

                {/* 3800MD Card */}
                <button
                    onClick={() => handleModelChange('3800MD')}
                    className={cn(
                        "flex-1 rounded-2xl border-2 p-3 transition-all active:scale-[0.98] touch-manipulation overflow-hidden relative shadow-lg",
                        model === '3800MD'
                            ? "border-blue-500 bg-blue-600/20 ring-2 ring-blue-500/40 shadow-blue-900/40"
                            : "border-slate-800 bg-card hover:bg-slate-800/50"
                    )}
                >
                    {model === '3800MD' && (
                        <div className="absolute top-2 right-2 w-7 h-7 bg-[#0066B3] rounded-full flex items-center justify-center z-10 shadow-lg">
                            <Check className="w-5 h-5 text-white" strokeWidth={3} />
                        </div>
                    )}
                    <img
                        src="/pic/Logix 3800MD.png"
                        alt="Logix 3800MD 스마트 포지셔너"
                        className="w-full aspect-video object-contain rounded bg-white/5"
                    />
                    <div className="text-center">
                        <div className="text-sm font-bold text-white">Logix 3800MD</div>
                        <div className="text-[10px] text-gray-500">Advanced (+B/O)</div>
                    </div>
                </button>
            </div>

            {/* LED Selector - Compact */}
            <div className="flex items-center justify-between gap-2 px-3">
                <span className="text-xs text-gray-500 font-bold">LED 상태 입력</span>
                <button
                    onClick={() => setLeds(['OFF', 'OFF', 'OFF', 'OFF'])}
                    className="text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 bg-gray-800 rounded border border-gray-700 hover:bg-gray-700"
                >
                    초기화
                </button>
            </div>

            <div className="grid grid-cols-4 gap-2 p-4 bg-slate-900/50 rounded-2xl border border-slate-800 shadow-inner place-items-center">
                {leds.map((color, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1 w-full">
                        <button
                            onClick={() => cycleColor(idx)}
                            className={cn(
                                "w-full aspect-square max-w-[60px] rounded-full border-4 transition-all duration-200 focus:outline-none overflow-hidden relative shadow-lg active:scale-95 touch-manipulation",
                                COLOR_MAP[color],
                                color === 'OFF' ? 'ring-0 border-gray-700 bg-gray-900' : `border-transparent ring-2 ring-offset-2 ring-offset-black ${color === 'Y' ? 'ring-yellow-600' :
                                    color === 'G' ? 'ring-green-600' :
                                        color === 'R' ? 'ring-red-600' :
                                            color === 'B' ? 'ring-blue-600' :
                                                'ring-orange-600'
                                    }`
                            )}
                            aria-label={`LED ${idx + 1}: ${color}`}
                        >
                            {color !== 'OFF' && <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-white/40 to-transparent rounded-bl-full pointer-events-none" />}
                        </button>
                        <span className="text-[10px] text-gray-500 font-mono font-bold">LED{idx + 1}</span>
                    </div>
                ))}
            </div>

            {/* Result Display - Compact */}
            <div className={cn(
                "rounded-2xl border flex-1 min-h-[180px] flex flex-col justify-center items-center text-center relative overflow-hidden shadow-2xl transition-all duration-300 p-1",
                result ? `${style.bg} border-${style.color.split('-')[1]}-900/50` : "bg-card border-slate-800"
            )}>
                {result && style ? (
                    <div className="w-full h-full p-4 animate-in slide-in-from-bottom-2 fade-in duration-300 flex flex-col items-center">
                        <div className={`px-3 py-1 rounded-full text-xs font-bold mb-3 border ${style.badge}`}>
                            {result.type}
                        </div>

                        <div className={cn("flex flex-col items-center justify-center gap-2 mb-4", style.color)}>
                            <style.icon className="w-12 h-12 drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]" strokeWidth={2} />
                            <span className="text-xl font-bold tracking-tight text-white leading-tight break-keep text-center">
                                {result.status}
                            </span>
                        </div>

                        <div className="w-full bg-black/40 border border-white/10 p-3 rounded-lg text-left">
                            <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1 block flex items-center gap-1">
                                <Wrench className="w-3 h-3" /> 조치 권고
                            </span>
                            <p className="text-white text-sm font-medium leading-relaxed break-keep">
                                {result.action}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="text-slate-600 flex flex-col items-center py-6 opacity-60">
                        <Activity className="w-16 h-16 mb-3 opacity-20" />
                        <p className="text-lg font-bold text-gray-500 mb-1">LED 상태를 입력하세요</p>
                        <p className="text-xs text-gray-600">
                            현재: <span className="text-blue-400 font-bold">Logix {model}</span>
                            {model === '3800MD' && <span className="text-orange-400 ml-1">(+Blue/Orange)</span>}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
