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
import UpdateToast, { checkForUpdate } from './components/UpdateToast';
import { version as appVersion } from '../package.json';
import { Activity, Database, Thermometer, Gauge, Cpu, Waves, Menu, ChevronDown, Check, Zap, Layers, Cog, ShieldAlert, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  try {
    return twMerge(clsx(inputs));
  } catch {
    return inputs.flat().filter(Boolean).join(' ');
  }
}

const TABS = [
  { id: 'lt', label: 'LT (Level)', icon: Waves, component: LevelTransmitter },
  { id: 'tc', label: 'Thermocouple', icon: Thermometer, component: ThermocoupleCalc },
  { id: 'rtd', label: 'RTD (Pt100)', icon: Cpu, component: RTDCalc },
  { id: 'valtek', label: 'Valtek Logix', icon: Activity, component: ValtekDiagnosis },
  { id: 'looptest', label: 'Loop Test', icon: Zap, component: LoopTest },
  { id: 'connector', label: 'Connector', icon: Layers, component: ConnectorStudio },
  { id: 'gasket', label: 'Gasket/Bolt', icon: Cog, component: GasketBoltCalc },
  { id: 'unit', label: 'Converter', icon: Gauge, component: UnitConverter },
  { id: 'transmitter', label: 'Transmitter DB', icon: Database, component: TransmitterDatabase },
  { id: 'alarm', label: 'Alarm Finder', icon: ShieldAlert, component: TransmitterAlarmFinder },
];

function App() {
  const [activeTab, setActiveTab] = useState('lt');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showStatusMessage, setShowStatusMessage] = useState(false);

  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();

        await checkForUpdate();

        // checkForUpdate 이후에 새로운 워커가 설치 대기 중인지 확인
        if (registration && registration.waiting) {
          // 업데이트가 있으면 새로고침 (기존 로직)
          window.location.reload();
        } else {
          // 업데이트가 없으면 상태 메시지 표시
          setShowStatusMessage(true);
          setTimeout(() => setShowStatusMessage(false), 3000);
        }
      } else {
        await checkForUpdate();
        window.location.reload();
      }
    } catch (err) {
      console.error('[Refresh] error:', err);
      // 에러 시에도 기본적으로는 새로고침 시도
      window.location.reload();
    } finally {
      setTimeout(() => setIsRefreshing(false), 800);
    }
  }, []);

  const ActiveComponent = TABS.find(t => t.id === activeTab)?.component || LevelTransmitter;
  const activeTabData = TABS.find(t => t.id === activeTab);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setIsMenuOpen(false);
  };

  return (
    <div className="h-screen bg-slate-950 text-white font-sans selection:bg-blue-500/30 overflow-hidden flex flex-col">
      {/* Header with Menu Left, Controls & Logo Right */}
      <header className="h-14 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-4 shadow-xl flex-shrink-0 z-50 relative gap-2">
        {/* Left: Menu Dropdown */}
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
              <span className="text-xs sm:text-sm font-bold tracking-tight text-white">
                메뉴
              </span>
            </div>
            <ChevronDown className={cn(
              "w-4 h-4 sm:w-5 sm:h-5 text-slate-400 transition-all duration-300",
              isMenuOpen ? "rotate-180 text-cyan-400" : ""
            )} />
          </button>
        </div>

        {/* Right: Controls & Logo Container */}
        <div className="flex items-center justify-end gap-2 h-full flex-1 min-w-0 pl-2">
          {/* App Install Button */}
          <InstallButton
            onClick={() => setActiveTab('install-guide')}
            className={cn(
              "flex items-center justify-center gap-1.5 h-10 px-3 sm:px-4 rounded-xl transition-all duration-200 touch-manipulation shrink-0",
              "bg-slate-800 border border-lime-500/50 text-lime-400 shadow-lg font-bold text-xs sm:text-sm whitespace-nowrap",
              "hover:bg-lime-500 hover:text-slate-950 hover:border-lime-500 hover:-translate-y-0.5",
              "active:scale-95 active:translate-y-0"
            )}
          />

          {/* Manual Refresh Button */}
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
            업데이트
          </button>

          {/* HD Hyundai Oilbank Logo */}
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

        {/* Global Dropdown Menu Overlay */}
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 top-14 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in duration-200"
              onClick={() => setIsMenuOpen(false)}
            />

            {/* Dropdown List */}
            <div className="absolute top-full left-0 w-full md:w-80 bg-slate-900/90 backdrop-blur-xl border-b border-r border-slate-800 rounded-br-2xl shadow-2xl z-50 animate-in slide-in-from-top-4 duration-300 origin-top">
              <nav className="p-2 flex flex-col gap-1">
                {TABS.map(tab => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all active:scale-[0.98] touch-manipulation text-left w-full",
                        isActive
                          ? "bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-lg shadow-blue-900/20"
                          : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent"
                      )}
                    >
                      <tab.icon className={cn("w-5 h-5", isActive ? "text-blue-400" : "text-slate-500 group-hover:text-white")} />
                      <span className={cn("font-bold text-base flex-1", isActive ? "text-blue-400" : "text-slate-300")}>
                        {tab.label}
                      </span>
                      {isActive && <Check className="w-4 h-4 text-blue-400" />}
                    </button>
                  );
                })}
              </nav>
            </div>
          </>
        )}
      </header>

      {/* Main Content Area - Full Height */}
      <main className="flex-1 overflow-auto px-4 py-4 w-full">
        <div className="h-full animate-in fade-in slide-in-from-bottom-2 duration-300">
          {activeTab === 'install-guide' ? (
            <InstallGuide setActiveTab={setActiveTab} />
          ) : (
            <ActiveComponent />
          )}
        </div>
      </main>

      {/* PWA 설치 버튼 (플로팅)이었던 자리 - 제거됨 (이제 헤더 내부에 렌더링됨) */}

      {/* SW 업데이트 토스트 */}
      <UpdateToast />

      {/* 최신 버전 확인 토스트 */}
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
