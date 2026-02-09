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

// 3200MD Database (Legacy)
const DB_3200 = [
    { pattern: "GGGG", type: "운전", status: "정상 작동 (Normal Operation)", action: "모든 시스템이 정상입니다. 추가 조치가 필요하지 않습니다." },
    { pattern: "GGGY", type: "운전", status: "MPC 활성 모드 (MPC Active)", action: "밸브가 완전 닫힘(Tight Shutoff) 상태이거나 1% 이하 제어 중입니다. 정상입니다." },
    { pattern: "GGYG", type: "운전", status: "로컬 설정 변경됨 (Local Adjusted)", action: "현장 버튼(Quick-Cal 등)으로 설정이 변경되었습니다. 의도하지 않았다면 설정을 확인하세요." },
    { pattern: "GGYY", type: "정보", status: "디지털 명령 상태 (Digital Command)", action: "4-20mA 신호를 무시하고 HART 디지털 명령으로 제어 중입니다." },
    { pattern: "GGRR", type: "운전", status: "스쿼크 모드 (Squawk/Identify)", action: "장치 위치 확인을 위해 LED가 점멸 중입니다. (HART 명령)" },
    { pattern: "GYGG", type: "경고", status: "포지션 리미트 (Position Limit)", action: "밸브가 설정된 상한 또는 하한 위치에 도달했습니다." },
    { pattern: "GYGY", type: "경고", status: "소프트 스톱 제한 (Soft Stop)", action: "소프트웨어 설정에 의해 밸브 이동이 제한되고 있습니다." },
    { pattern: "YYGG", type: "경고", status: "내부 온도 경고 (Temperature)", action: "전자부 온도가 -40°C 미만이거나 85°C를 초과했습니다. 보온/단열 조치하세요." },
    { pattern: "YYGR", type: "경고", status: "공급 압력 높음 (High Supply)", action: "공급 압력이 액추에이터 권장치를 초과했습니다. 레귤레이터를 점검하세요." },
    { pattern: "YYYG", type: "경고", status: "공급 압력 낮음 (Low Supply)", action: "공급 압력이 낮습니다. 30 PSI (2.1 bar) 이상으로 조절하십시오." },
    { pattern: "YYYY", type: "경고", status: "구동 비율 저하 (Low Ratio)", action: "마찰력이 높거나 압력이 부족합니다. 기구부를 점검하십시오." },
    { pattern: "YRGG", type: "경고", status: "릴레이 응답 저하 (Slow Relay)", action: "파일럿 릴레이 반응이 느립니다. 피에조나 스풀 오염을 확인하세요." },
    { pattern: "YRGR", type: "경고", status: "공기 누설 감지 (Pneumatic Leak)", action: "튜브 피팅, 다이어프램, 씰링 부위의 에어 누설을 점검하십시오." },
    { pattern: "YRYG", type: "경고", status: "고마찰 경고 (High Friction)", action: "밸브 스템의 움직임이 뻑뻑합니다. 글랜드 패킹 조임을 확인하거나 윤활하십시오." },
    { pattern: "RGGY", type: "알람", status: "피드백 읽기 오류 (Feedback)", action: "캘리브레이션 중 위치 센서 오류입니다. 링키지 유격이나 자석 위치를 점검하세요." },
    { pattern: "RGRR", type: "알람", status: "공장 초기화됨 (Reset)", action: "모든 설정이 초기화되었습니다. 캘리브레이션(Quick-Cal)을 다시 수행하십시오." },
    { pattern: "RYYG", type: "알람", status: "공급 압력 부족 (Supply Alarm)", action: "압력이 17 PSI 미만입니다. 밸브가 작동할 수 없습니다. 공기 공급을 확인하세요." },
    { pattern: "RRGG", type: "알람", status: "릴레이 응답 실패 (Relay Alarm)", action: "파일럿 릴레이가 스턱(Stuck)되었거나 피에조 손상입니다. 부품 교체가 필요합니다." },
    { pattern: "RRGR", type: "알람", status: "고마찰 알람 (Friction Alarm)", action: "밸브가 고착(Stuck)될 위험이 큽니다. 즉시 밸브를 점검하고 수리하십시오." },
    { pattern: "RRYG", type: "알람", status: "피에조 전압 오류 (Piezo)", action: "피에조 회로 전압이 비정상입니다. 회로 기판 또는 I/P 모듈을 교체하십시오." },
    { pattern: "RRRR", type: "알람", status: "위치 편차 알람 (Deviation)", action: "지시치와 실제 위치가 다릅니다. 에어 공급, 튜빙, 기구적 연결을 즉시 확인하십시오." }
];

// 3800MD Database (New - 74 items)
const DB_3800 = [
    { pattern: "GGGG", type: "운전", status: "전원 켜짐 / 교정 성공", action: "정상 작동 중이므로 별도의 조치가 필요 없습니다." },
    { pattern: "GGGB", type: "운전", status: "연속 스트로크 테스트 모드", action: "테스트가 완료될 때까지 기다리거나 필요 시 중단하십시오." },
    { pattern: "GGGY", type: "운전", status: "완전 폐쇄 모드 (Tight Shut Off)", action: "폐쇄 설정값이 정상인지 확인하고 필요 시 조정하십시오." },
    { pattern: "GGGO", type: "운전", status: "릴레이 교정 범위 내", action: "교정이 정상 범위에 있으므로 작업을 계속 진행하십시오." },
    { pattern: "GGBG", type: "운전", status: "압력 제어 잠금", action: "제어 상태를 확인하고 필요한 경우 잠금을 해제하십시오." },
    { pattern: "GGBB", type: "운전", status: "백업 제어 모드", action: "주 제어 시스템을 점검하고 백업 모드 진입 원인을 파악하십시오." },
    { pattern: "GGYG", type: "운전", status: "로컬 인터페이스 꺼짐", action: "현장 조작이 필요한 경우 인터페이스를 다시 활성화하십시오." },
    { pattern: "GGYY", type: "운전", status: "디지털 명령 모드", action: "디지털 통신 상태를 확인하고 명령값이 정확한지 점검하십시오." },
    { pattern: "GGYR", type: "운전", status: "초기화 중", action: "장치가 부팅 중이므로 초기화가 완료될 때까지 기다리십시오." },
    { pattern: "GGOO", type: "운전", status: "DI 활성 알림", action: "이산 입력(Digital Input) 접점 상태와 연결 기기를 점검하십시오." },
    { pattern: "GGRR", type: "운전", status: "테스트 모드", action: "테스트 완료 후 장치를 정상 운전 모드로 복귀시키십시오." },
    { pattern: "GBBB", type: "운전", status: "장치 식별 모드 (Squawk)", action: "장치 식별이 끝나면 해당 모드를 해제하십시오." },
    { pattern: "GBYO", type: "설정", status: "릴레이 교정 - 반시계 방향 조정", action: "안내에 따라 릴레이 나사를 반시계 방향으로 미세 조정하십시오." },
    { pattern: "GYGY", type: "경고", status: "소프트 스탑 상한/하한 알림", action: "밸브 위치가 소프트 스탑 설정치에 도달했는지 확인하십시오." },
    { pattern: "GYYG", type: "설정", status: "압력 교정 필요", action: "압력 센서의 영점 및 범위를 재교정하십시오." },
    { pattern: "GYYR", type: "운전", status: "부분 스트로크 테스트 예약됨", action: "예약된 시간에 테스트가 정상 실행되는지 모니터링하십시오." },
    { pattern: "GYOG", type: "설정", status: "AO 입력 0% 설정", action: "아날로그 출력이 0% 기준점에 정확히 맞는지 확인하십시오." },
    { pattern: "GYOO", type: "설정", status: "AO 입력 100% 설정", action: "아날로그 출력이 100% 기준점에 정확히 맞는지 확인하십시오." },
    { pattern: "GOYY", type: "설정", status: "교정 유형 설정됨", action: "선택된 교정 유형이 실제 밸브 사양과 맞는지 확인하십시오." },
    { pattern: "GRGG", type: "운전", status: "시그니처/PST 진행 중", action: "진단 테스트 중이므로 프로세스 변동에 주의하며 기다리십시오." },
    { pattern: "GRGR", type: "운전", status: "DI 명령 우선 제어", action: "우선 제어 신호의 원인을 확인하고 해제 여부를 결정하십시오." },
    { pattern: "GRYG", type: "설정", status: "명령 입력 0% 설정", action: "입력 신호 소스의 0% 출력값이 정확한지 점검하십시오." },
    { pattern: "GRYY", type: "설정", status: "명령 입력 100% 설정", action: "입력 신호 소스의 100% 출력값이 정확한지 점검하십시오." },
    { pattern: "GROY", type: "설정", status: "아날로그 입력 0% 설정", action: "아날로그 입력 신호 회로의 0% 지점을 보정하십시오." },
    { pattern: "GROO", type: "설정", status: "아날로그 입력 100% 설정", action: "아날로그 입력 신호 회로의 100% 지점을 보정하십시오." },
    { pattern: "GRRY", type: "운전", status: "조그 명령 모드", action: "수동 조작 완료 후 명령 모드를 정상으로 돌리십시오." },
    { pattern: "BBBG", type: "시스템", status: "소프트웨어 다운로드 완료", action: "장치를 재시작하여 새 소프트웨어를 적용하십시오." },
    { pattern: "BBBB", type: "시스템", status: "소프트웨어 다운로드 중", action: "통신이 끊기지 않도록 주의하며 완료를 기다리십시오." },
    { pattern: "BBBY", type: "시스템", status: "소프트웨어 다운로드 대기", action: "통신 회선 상태를 점검하고 전송을 시작하십시오." },
    { pattern: "BBBO", type: "시스템", status: "소프트웨어 다운로드 일시 중지", action: "중단 원인을 해결한 뒤 다운로드를 재개하십시오." },
    { pattern: "BBBR", type: "시스템", status: "소프트웨어 다운로드 실패 경고", action: "통신 케이블과 소프트웨어 버전을 확인한 뒤 재시도하십시오." },
    { pattern: "YGGG", type: "경고", status: "위치 상한/하한 알림", action: "밸브가 기계적 한계에 도달했는지 점검하고 설정을 확인하십시오." },
    { pattern: "YGGY", type: "경고", status: "각 구성품 경고", action: "해당 부품(밸브, 벨로우즈 등)의 마모나 이상을 육안 점검하십시오." },
    { pattern: "YGGR", type: "설정", status: "조그 교정 100% 설정", action: "실제 밸브 위치가 100%인지 확인 후 설정을 확정하십시오." },
    { pattern: "YGBB", type: "설정", status: "릴레이 교정 안정화", action: "릴레이 압력이 안정될 때까지 잠시 기다리십시오." },
    { pattern: "YGYG", type: "운전", status: "위치 복구 모드", action: "장치가 위치를 복구하는 동안 공기 공급이 원활한지 확인하십시오." },
    { pattern: "YGRY", type: "경고", status: "연속 스트로크 테스트 실패", action: "테스트 실패 원인(공압 부족 등)을 확인하고 재테스트하십시오." },
    { pattern: "YGRR", type: "경고", status: "부분 스트로크 테스트 실패", action: "밸브 고착 여부를 점검하고 PST 설정을 재확인하십시오." },
    { pattern: "YYGG", type: "경고", status: "온도 높음/낮음 경고", action: "주변 온도를 낮추거나 단열 조치를 취해 허용 범위를 유지하십시오." },
    { pattern: "YYGY", type: "경고", status: "밸브 과도 개방/폐쇄 경고", action: "리미트 스위치나 포지셔너 피드백 링크의 정렬을 점검하십시오." },
    { pattern: "YYGR", type: "경고", status: "공급 압력 높음 경고", action: "레귤레이터를 조정하여 공급 압력을 사양 이내로 낮추십시오." },
    { pattern: "YYYG", type: "경고", status: "공급 압력 낮음 경고", action: "공급 라인의 누설을 점검하거나 콤프레셔 압력을 확인하십시오." },
    { pattern: "YYYY", type: "경고", status: "작동 비율 경고", action: "공압 시스템의 효율을 점검하고 필요 시 소모품을 교체하십시오." },
    { pattern: "YYYO", type: "경고", status: "시스템 관련 오류 경고", action: "장치를 재부팅해 보고 증상이 지속되면 기술 지원을 받으십시오." },
    { pattern: "YYYR", type: "경고", status: "메모리 CRC 오류", action: "데이터 저장 오류이므로 설정을 다시 저장하거나 초기화하십시오." },
    { pattern: "YYOG", type: "경고", status: "버튼 눌림 고정", action: "현장 조작 버튼에 이물질이 끼었는지 확인하고 청소하십시오." },
    { pattern: "YYOY", type: "경고", status: "명령 주파수/진폭 경고", action: "입력 신호의 노이즈나 제어 시스템의 루프 게인을 확인하십시오." },
    { pattern: "YYOO", type: "경고", status: "위치 주파수/진폭 경고", action: "밸브 헌팅 여부를 점검하고 패킹 마찰력을 확인하십시오." },
    { pattern: "YRGY", type: "경고", status: "마찰 낮음 경고", action: "패킹 누설 여부를 확인하고 필요 시 패킹을 조이십시오." },
    { pattern: "YRGR", type: "경고", status: "마찰 높음 경고", action: "패킹 윤활 상태를 점검하거나 과도하게 조여졌는지 확인하십시오." },
    { pattern: "YRYG", type: "운전", status: "교정 진행 중", action: "교정 작업이 완료될 때까지 다른 조작을 삼가십시오." },
    { pattern: "YRYY", type: "경고", status: "백래시 경고", action: "피드백 링크와 커플링의 유격(유동)을 점검하고 고정하십시오." },
    { pattern: "YRYO", type: "경고", status: "밸런스 압력 경고", action: "액추에이터 내부 씰 손상이나 공압 균형을 점검하십시오." },
    { pattern: "YRYR", type: "경고", status: "공압 누설 경고", action: "튜빙 연결부와 피팅에 비눗물을 뿌려 누설 지점을 수리하십시오." },
    { pattern: "YRRG", type: "경고", status: "배터리 부족 경고", action: "전원을 점검하거나 배터리가 있는 모델의 경우 교체하십시오." },
    { pattern: "YRRY", type: "경고", status: "피에조 전압 이상 경고", action: "피에조 소자 연결 상태를 점검하고 필요 시 부품을 교체하십시오." },
    { pattern: "YRRO", type: "경고", status: "벤트(배기구) 막힘 경고", action: "장치 배기구의 먼지나 이물질을 제거하여 통기성을 확보하십시오." },
    { pattern: "YRRR", type: "경고", status: "스프링 페일 세이프 불가", action: "스프링의 파손이나 기계적 걸림 현상을 즉시 점검하십시오." },
    { pattern: "RGGG", type: "알람", status: "명령 범위/ADC 오류", action: "입력 전류(4-20mA) 범위를 측정하고 회로 보드를 점검하십시오." },
    { pattern: "RGGB", type: "알람", status: "아날로그 입력 범위 오류", action: "외부 아날로그 신호 선로의 단선이나 단락 여부를 점검하십시오." },
    { pattern: "RGGY", type: "알람", status: "위치 범위 너무 작음", action: "피드백 자석이나 링크의 설치 각도가 적절한지 재조정하십시오." },
    { pattern: "RGGO", type: "알람", status: "압력 레귤레이터 오류", action: "내부 압력 조절기의 고장을 점검하고 필요 시 교체하십시오." },
    { pattern: "RGGR", type: "알람", status: "내부 루프 오프셋 타임아웃", action: "릴레이 자가 진단을 실시하고 공압 응답 속도를 확인하십시오." },
    { pattern: "RGBG", type: "알람", status: "원격 장착 범위 벗어남", action: "원격 센서와 본체 사이의 배선 및 거리를 확인하십시오." },
    { pattern: "RGYG", type: "알람", status: "안정화 시간 초과", action: "밸브 움직임을 방해하는 요소가 있는지 확인하고 게인을 조정하십시오." },
    { pattern: "RGYY", type: "알람", status: "동작 없음 타임아웃", action: "공압 공급 유무와 액추에이터 고착 여부를 즉시 점검하십시오." },
    { pattern: "RGYR", type: "알람", status: "아날로그 출력 범위 작음", action: "출력 설정값을 확인하고 피드백 범위를 다시 설정하십시오." },
    { pattern: "RGOG", type: "알람", status: "페일 세이프 위치 오류", action: "장치가 안전 위치로 이동하지 못하고 있으므로 기계적 점검을 실시하십시오." },
    { pattern: "RGOO", type: "알람", status: "릴레이 교정 오류", action: "릴레이 교정 절차를 다시 수행하거나 릴레이를 교체하십시오." },
    { pattern: "RGOR", type: "알람", status: "온도 교정 필요", action: "온도 센서의 정확도를 위해 전문가의 교정 지원을 받으십시오." },
    { pattern: "RGRG", type: "알람", status: "교정 필요", action: "시스템 안전을 위해 즉시 스트로크 및 압력 교정을 수행하십시오." },
    { pattern: "RGRB", type: "알람", status: "위치 피드백 교정 필요", action: "위치 피드백 센서의 영점을 다시 잡고 교정하십시오." },
    { pattern: "RGRY", type: "알람", status: "스트로크 이동/변화", action: "밸브 스템의 풀림이나 링크 이탈 여부를 점검하십시오." },
    { pattern: "RGRR", type: "알람", status: "공장 초기화 상태", action: "초기 설정 및 모든 교정 절차를 처음부터 다시 진행하십시오." },
    { pattern: "RYGG", type: "알람", status: "밸브 개폐 불가 알람", action: "심각한 기계적 고착입니다. 공정 차단 후 밸브를 분해 점검하십시오." },
    { pattern: "RYYG", type: "알람", status: "공급 압력 낮음 알람", action: "공압 공급이 차단되었습니다. 메인 밸브와 공급 라인을 즉시 확인하십시오." },
    { pattern: "RYYY", type: "알람", status: "아날로그 출력 전원 없음", action: "출력 루프 배선의 전원 공급 장치와 단선 여부를 확인하십시오." },
    { pattern: "RYYO", type: "알람", status: "아날로그 출력 오류", action: "출력 회로 보드의 결함이 의심되므로 보드를 점검/교체하십시오." },
    { pattern: "RYYR", type: "알람", status: "아날로그 입력 전원 없음", action: "입력 루프에 24VDC 등 필요한 전원이 공급되는지 확인하십시오." },
    { pattern: "RYOY", type: "알람", status: "명령 주파수/진폭 알람", action: "제어 신호에 심각한 간섭이 발생하고 있으니 차폐 배선을 점검하십시오." },
    { pattern: "RYOO", type: "알람", status: "위치 주파수/진폭 알람", action: "밸브의 격렬한 진동(Hunting)을 멈추기 위해 게인을 낮추십시오." },
    { pattern: "RYRG", type: "알람", status: "위치 센서 고장 알람", action: "센서 모듈 연결을 확인하고 고장 시 센서를 교체하십시오." },
    { pattern: "RYRY", type: "알람", status: "각 포트 압력 범위 오류", action: "해당 포트의 튜빙 파손이나 막힘, 센서 고장을 점검하십시오." },
    { pattern: "RYRR", type: "알람", status: "각종 전압 및 소자 오류", action: "내부 회로 부품의 치명적 오류이므로 보드 교체가 필요할 수 있습니다. " },
    { pattern: "ROYB", type: "설정", status: "릴레이 교정 - 시계 방향 조정", action: "안내에 따라 릴레이 나사를 시계 방향으로 미세 조정하십시오." },
    { pattern: "RRGY", type: "알람", status: "마찰 낮음 알람", action: "패킹이 완전히 마모되었거나 파손되었을 수 있으니 즉시 교체하십시오." },
    { pattern: "RRGR", type: "알람", status: "마찰 높음 알람", action: "밸브 스템에 이물질이 끼었거나 패킹이 고착되었는지 확인하십시오." },
    { pattern: "RRYG", type: "알람", status: "피드백 연결 장치 알람", action: "피드백 암(Arm)이 빠졌거나 부러졌는지 확인하고 재장착하십시오." },
    { pattern: "RRYY", type: "알람", status: "백래시 알람", action: "구동부의 기어 마모나 연결부 유격을 찾아 수리하십시오." },
    { pattern: "RRYR", type: "알람", status: "릴레이 작동 불능", action: "릴레이 내부 밸브의 고착이 의심되므로 릴레이를 교체하십시오." },
    { pattern: "RRRB", type: "알람", status: "호환되지 않는 SW 알람", action: "장치 하드웨어에 맞는 올바른 버전의 펌웨어를 설치하십시오." },
    { pattern: "RRRY", type: "알람", status: "피에조 전압 알람", action: "피에조 부품의 전기적 고장이므로 해당 모듈을 교체하십시오." },
    { pattern: "RRRO", type: "알람", status: "내부 루프 범위 이탈", action: "공압 릴레이의 기계적 영점이 크게 벗어났으므로 정밀 조정을 실시하십시오." },
    { pattern: "RRRR", type: "알람", status: "위치 편차 알람", action: "설정값과 실제 위치의 차이가 너무 큽니다. 공압과 마찰력을 점검하십시오." }
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
