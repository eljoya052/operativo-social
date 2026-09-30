import React, { useState } from 'react';
import { 
  HeartHandshake, 
  Wifi, 
  WifiOff, 
  UserCheck, 
  ChevronDown, 
  Calendar, 
  ShieldCheck, 
  User, 
  Clock, 
  MapPin,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface HeaderProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onTabChange }) => {
  const { 
    data, 
    activeOperative, 
    currentUser, 
    isConnected, 
    setActiveOperativeId 
  } = useApp();

  const [isOpMenuOpen, setIsOpMenuOpen] = useState(false);

  // Navigation tabs for unique Recepción Central
  const tabs = [
    { id: 'reception', label: 'Recepción y Reservas' },
    { id: 'agenda', label: 'Agenda General' },
    { id: 'patients', label: 'Pacientes' },
    { id: 'waiting', label: 'Lista de Espera' },
    { id: 'dashboard', label: 'Dashboard' }
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 shadow-md text-white">
      {/* Top Banner Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Zone */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-bold">
              <HeartHandshake className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold tracking-tight text-white font-['Cabinet_Grotesk',sans-serif]">
                  OPERATIVO SOCIAL IBM
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Temuco, Chile
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium hidden sm:block">
                Iglesia Bautista Millaray · Chacay 1164
              </p>
            </div>
          </div>

          {/* Center Operative Picker */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setIsOpMenuOpen(!isOpMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-xs text-slate-200 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold text-white">{activeOperative?.name || 'Operativo Activo'}</span>
              <span className="text-slate-400">({activeOperative?.date})</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isOpMenuOpen && data && (
              <div className="absolute left-0 mt-1 w-72 rounded-xl bg-slate-800 border border-slate-700 shadow-xl py-2 z-50">
                <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Operativos Registrados
                </div>
                {data.operatives.map(op => (
                  <button
                    key={op.id}
                    onClick={() => {
                      setActiveOperativeId(op.id);
                      setIsOpMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-700/60 ${op.id === activeOperative?.id ? 'bg-amber-500/10 text-amber-300 font-semibold' : 'text-slate-200'}`}
                  >
                    <div>
                      <div className="font-medium text-slate-100">{op.name}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" /> {op.date} · {op.startTime} - {op.endTime} ({op.slotDurationMinutes} min)
                      </div>
                    </div>
                    {op.id === activeOperative?.id && (
                      <span className="text-[10px] bg-amber-400 text-slate-950 font-bold px-1.5 py-0.5 rounded">
                        Activo
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Actions: Real-time Indicator & User Switcher */}
          <div className="flex items-center gap-3">
            {/* Live SSE Pulse */}
            <div 
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                isConnected 
                  ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-400' 
                  : 'bg-rose-950/60 border-rose-500/30 text-rose-400'
              }`}
              title={isConnected ? 'Conectado al servidor en tiempo real (SSE)' : 'Reconectando al servidor...'}
            >
              {isConnected ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="hidden sm:inline">En Tiempo Real</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3" />
                  <span className="hidden sm:inline">Reconectando</span>
                </>
              )}
            </div>

            {/* Fixed Unique Recepción Central Badge */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-md">
              <UserCheck className="w-4 h-4 text-slate-950" />
              <span>Recepción Central</span>
              <span className="hidden sm:inline text-[9px] uppercase tracking-wider font-extrabold bg-slate-950/20 text-slate-950 px-1.5 py-0.5 rounded-md">
                Único
              </span>
            </div>

          </div>

        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="bg-slate-950/70 border-t border-slate-800/80 px-4 sm:px-6 lg:px-8 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto flex items-center gap-1 py-1.5">
          {tabs.map(tab => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
