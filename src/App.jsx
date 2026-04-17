import React, { useState, useCallback } from 'react';
import LevelTransmitter from './components/LevelTransmitter';
import ValtekDiagnosis from './components/ValtekDiagnosis';
import TransmitterDatabase from './components/TransmitterDatabase';
import ThermocoupleCalc from './components/ThermocoupleCalc';
import RTDCalc from './components/RTDCalc';
import UnitConverter from './components/UnitConverter';
import LoopTest from './components/LoopTest';
import ConnectorStudio from './components/ConnectorStudio';
import GasketBoltCalc from './components/GasketBoltCalc';
import TransmitterAlarmFinder from './components/TransmitterAlarmFinder';
import InstallButton from './components/InstallButton';
import InstallGuide from './components/InstallGuide';
import FlowCalc from './components/FlowCalc';
import ResistorCalc from './components/ResistorCalc';
import UpdateToast, { checkForUpdate } from './components/UpdateToast';
import { version as appVersion } from '../package.json';
import {
  Activity, Database, Thermometer, Gauge, Cpu, Waves, Droplets,
  Menu, ChevronDown, Check, Zap, Layers, Cog, ShieldAlert, RefreshCw,
  CircuitBoard, Radio, Stethoscope, BookOpen, Wrench
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  try {
    return twMerge(clsx(inputs));
  } catch {
    return inputs.flat().filter(Boolean).join(' ');
  }
}

/**
 * 메뉴 구조: 그룹 기반
 * - group: 카테고리 라벨 (헤더용, non-clickable)
 * - groupIcon: 그룹 아이콘
 * - items: 하위 탭 목록
 *
 * 이름 개편 원칙:
 *  1) 한글 우선, 기술 약어는 괄호 보조
 *  2) 목적어 명시 ("Converter" → "단위 변환")
 *  3) 무엇을 찾는지 명시 ("Alarm Finder" → "TX 알람 코드")
 */
const MENU_GROUPS = [
  {
    group: '계측 신호 변환',
    groupIcon: Radio,
    items: [
      { id: 'lt', label: 'LT (레벨)', sub: 'Level Transmitter', icon: Waves, component: LevelTransmitter },
      { id: 'ft', label: 'FT (유량)', sub: 'DP Flow · ISO 5167', icon: Droplets, component: FlowCalc },
      { id: 'tc', label: 'T/C (열전대)', sub: 'Thermocouple mV ↔ °C', icon: Thermometer, component: ThermocoupleCalc },
      { id: 'rtd', label: 'RTD (측온저항)', sub: 'Pt100 Ω ↔ °C', icon: Cpu, component: RTDCalc },
    ],
  },
  {
    group: '계측 진단 · 점검',
    groupIcon: Stethoscope,
    items: [
      { id: 'looptest', label: 'Loop 변환기', sub: '4-20mA ↔ %', icon: Zap, component: LoopTest },
      { id: 'valtek', label: 'Valtek 포지셔너', sub: 'Logix 3200/3800 LED', icon: Activity, component: ValtekDiagnosis },
      { id: 'alarm', label: 'TX 알람 코드', sub: 'Yokogawa · Emerson · Azbil', icon: ShieldAlert, component: TransmitterAlarmFinder },
      { id: 'resistor', label: '저항 색띠', sub: 'Resistor Color Code', icon: CircuitBoard, component: ResistorCalc },
    ],
  },
  {
    group: '조회 · 참고',
    groupIcon: BookOpen,
    items: [
      { id: 'transmitter', label: 'TX 캡슐 DB', sub: '제조사별 스팬 범위', icon: Database, component: TransmitterDatabase },
      { id: 'unit', label: '단위 변환', sub: '압력 · 온도 · 길이', icon: Gauge, component: UnitConverter },
    ],
  },
  {
    group: '배관 · 기계',
    groupIcon: Wrench,
    items: [
      { id: 'gasket', label: '가스켓/볼트 조회', sub: 'Flange → PGA/PBN', icon: Cog, component: GasketBoltCalc },
      { id: 'connector', label: '피팅 사양', sub: 'Connector · Union · Elbow', icon: Layers, component: ConnectorStudio },
    ],
  },
];

// 평탄화된 탭 목록 (ID로 컴포넌트 찾을 때 사용)
const ALL_TABS = MENU_GROUPS.flatMap(g => g.items);

function App() {
  const [activeTab, setActiveTab] = useState('lt');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showStatusMessage, setShowStatusMessage] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        await checkForUpdate();

        if (registration && registration.waiting) {
          window.location.reload();
        } else {
          setShowStatusMessage(true);
          setTimeout(() => setShowStatusMessage(false), 3000);
        }
      } else {
        await checkForUpdate();
        window.location.reload();
      }
    } catch (err) {
      console.error('[Refresh] error:', err);
      window.location.reload();
    } finally {
      setTimeout(() => setIsRefreshing(false), 800);
    }
  }, []);

  const activeTabData = ALL_TABS.find(t => t.id === activeTab);
  const ActiveComponent = activeTabData?.component || LevelTransmitter;

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setIsMenuOpen(false);
  };

  return (
    <div className="h-screen bg-slate-950 text-white font-sans selection:bg-blue-500/30 overflow-hidden flex flex-col">
      {/* Header */}
      <header className="h-14 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-4 shadow-xl flex-shrink-0 z-50 relative gap-2">
        {/* Left: Menu Dropdown Trigger */}
        <div className="flex items-center h-full flex-shrink-0">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={cn(
              "flex items-center gap-2 h-10 px-3 sm:px-4 rounded-xl transition-all duration-200",
              "bg-slate-800 border border-slate-700 shadow-lg",
              "hover:bg-slate-700 hover:border-cyan-500 hover:-translate-y-0.5",
              "active:scale-95 active:translate-y-0 touch-manipulation shrink-0",
              isMenuOpen && "bg-slate-700 border-cyan-500"
            )}
          >
            <Menu className="w-[18px] h-[18px] sm:w-5 sm:h-5 text-cyan-400" />
            <div className="flex items-center gap-2">
              {/* 현재 활성 탭 라벨을 메뉴 버튼에 표시 — 공간 활용 + 현재 위치 상기 */}
              <span className="text-xs sm:text-sm font-bold tracking-tight text-white truncate max-w-[100px] sm:max-w-none">
                {activeTabData?.label ?? '메뉴'}
              </span>
            </div>
            <ChevronDown className={cn(
              "w-4 h-4 sm:w-5 sm:h-5 text-slate-400 transition-all duration-300",
              isMenuOpen ? "rotate-180 text-cyan-400" : ""
            )} />
          </button>
        </div>

        {/* Right: Controls & Logo */}
        <div className="flex items-center justify-end gap-2 h-full flex-1 min-w-0 pl-2">
          <InstallButton
            onClick={() => setActiveTab('install-guide')}
            deferredPrompt={deferredPrompt}
            setDeferredPrompt={setDeferredPrompt}
            className={cn(
              "flex items-center justify-center gap-1.5 h-10 px-3 sm:px-4 rounded-xl transition-all duration-200 touch-manipulation shrink-0",
              "bg-slate-800 border border-lime-500/50 text-lime-400 shadow-lg font-bold text-xs sm:text-sm whitespace-nowrap",
              "hover:bg-lime-500 hover:text-slate-950 hover:border-lime-500 hover:-translate-y-0.5",
              "active:scale-95 active:translate-y-0"
            )}
          />

          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className={cn(
              "flex shrink-0 items-center justify-center gap-1.5 h-10 px-3 rounded-xl transition-all duration-200 touch-manipulation",
              "bg-slate-800 border border-slate-700 text-lime-400 shadow-lg font-bold text-xs sm:text-sm whitespace-nowrap",
              "hover:bg-slate-700 hover:border-lime-500/50 hover:-translate-y-0.5",
              "active:scale-95 active:translate-y-0",
              isRefreshing && "border-lime-500/50 opacity-80"
            )}
            aria-label="업데이트"
          >
            <RefreshCw className={cn("w-[16px] h-[16px] sm:w-[18px] sm:h-[18px]", isRefreshing && "animate-spin")} />
            <span className="hidden sm:inline">업데이트</span>
          </button>

          <button
            onClick={() => setActiveTab('lt')}
            className="h-full py-3 flex items-center justify-end hover:opacity-80 transition-opacity shrink min-w-[60px]"
            aria-label="Go to Home"
          >
            <img
              src="/pic/HDO_new.png"
              alt="HD현대오일뱅크"
              className="h-full w-auto object-contain max-w-full object-right"
            />
          </button>
        </div>

        {/* Grouped Dropdown Menu */}
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 top-14 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in duration-200"
              onClick={() => setIsMenuOpen(false)}
            />

            {/* Dropdown Panel */}
            <div className="absolute top-full left-0 w-full md:w-96 max-h-[calc(100vh-4rem)] overflow-y-auto bg-slate-900/95 backdrop-blur-xl border-b border-r border-slate-800 rounded-br-2xl shadow-2xl z-50 animate-in slide-in-from-top-4 duration-300 origin-top">
              <nav className="p-2 flex flex-col gap-3">
                {MENU_GROUPS.map((group) => {
                  const GroupIcon = group.groupIcon;
                  return (
                    <div key={group.group} className="flex flex-col gap-0.5">
                      {/* Group Header (non-clickable) */}
                      <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-800/60 mb-1">
                        <GroupIcon className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-500">
                          {group.group}
                        </span>
                      </div>

                      {/* Group Items */}
                      {group.items.map(tab => {
                        const isActive = activeTab === tab.id;
                        const ItemIcon = tab.icon;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all active:scale-[0.98] touch-manipulation text-left w-full",
                              isActive
                                ? "bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-lg shadow-blue-900/20"
                                : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent"
                            )}
                          >
                            <ItemIcon className={cn(
                              "w-5 h-5 flex-shrink-0",
                              isActive ? "text-blue-400" : "text-slate-500"
                            )} />
                            <div className="flex-1 min-w-0">
                              <div className={cn(
                                "font-bold text-[15px] leading-tight truncate",
                                isActive ? "text-blue-400" : "text-slate-200"
                              )}>
                                {tab.label}
                              </div>
                              {tab.sub && (
                                <div className="text-[11px] text-slate-500 font-mono truncate mt-0.5">
                                  {tab.sub}
                                </div>
                              )}
                            </div>
                            {isActive && <Check className="w-4 h-4 text-blue-400 flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </nav>
            </div>
          </>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto px-4 py-4 w-full">
        <div className="h-full animate-in fade-in slide-in-from-bottom-2 duration-300">
          {activeTab === 'install-guide' ? (
            <InstallGuide
              setActiveTab={setActiveTab}
              deferredPrompt={deferredPrompt}
              setDeferredPrompt={setDeferredPrompt}
            />
          ) : (
            <ActiveComponent />
          )}
        </div>
      </main>

      {/* SW Update Toast */}
      <UpdateToast />

      {/* Already Latest Toast */}
      {showStatusMessage && (
        <div className="fixed bottom-20 left-4 right-4 z-[998] flex justify-center animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="bg-slate-800 text-lime-400 border border-lime-500/30 rounded-xl px-4 py-3 shadow-lg flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span className="text-sm font-medium">이미 최신 버전(v{appVersion})을 사용 중입니다</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
