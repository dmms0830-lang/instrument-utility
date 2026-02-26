import React, { useState } from 'react';
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
import { Activity, Database, Thermometer, Gauge, Cpu, Waves, Menu, ChevronDown, Check, Zap, Layers, Cog, ShieldAlert } from 'lucide-react';
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

  const ActiveComponent = TABS.find(t => t.id === activeTab)?.component || LevelTransmitter;
  const activeTabData = TABS.find(t => t.id === activeTab);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setIsMenuOpen(false);
  };

  return (
    <div className="h-screen bg-slate-950 text-white font-sans selection:bg-blue-500/30 overflow-hidden flex flex-col">
      {/* Header with Title Dropdown and Logo */}
      <header className="h-14 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center px-4 shadow-xl flex-shrink-0 z-50 relative">
        {/* Title Dropdown Button - Pill-shaped Design */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={cn(
            "flex items-center gap-3 px-4 py-2 rounded-full transition-all duration-200",
            "bg-slate-800/80 border border-slate-600 shadow-lg",
            "hover:bg-slate-700 hover:border-cyan-500 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-cyan-500/20",
            "active:scale-95 active:translate-y-0 touch-manipulation",
            isMenuOpen && "bg-slate-700 border-cyan-500 shadow-xl shadow-cyan-500/20"
          )}
        >
          {/* Menu Icon */}
          <Menu className="w-5 h-5 text-cyan-400" />

          {/* Tab Icon and Name */}
          <div className="flex items-center gap-2">
            {activeTabData && <activeTabData.icon className="w-5 h-5 text-blue-400" />}
            <span className="text-sm font-bold tracking-tight text-white">
              {activeTabData?.label || 'Industrial Utility'}
            </span>
          </div>

          {/* Chevron with rotation animation */}
          <ChevronDown className={cn(
            "w-5 h-5 text-slate-400 transition-all duration-300",
            isMenuOpen ? "rotate-180 text-cyan-400" : ""
          )} />
        </button>

        {/* HD Hyundai Oilbank Logo - Integrated Pure White */}
        <button
          onClick={() => setActiveTab('lt')}
          className="h-full flex items-center px-2 hover:opacity-80 transition-opacity ml-auto"
          aria-label="Go to Home"
        >
          <img
            src="/pic/HDO_new.png"
            alt="HD현대오일뱅크"
            className="h-full max-h-[28px] w-auto object-contain"
          />
        </button>

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
          <ActiveComponent />
        </div>
      </main>
    </div>
  );
}

export default App;
