import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { ReceptionView } from './components/ReceptionView';
import { AgendaView } from './components/AgendaView';
import { ProfessionalView } from './components/ProfessionalView';
import { PatientsView } from './components/PatientsView';
import { ProfessionalsView } from './components/ProfessionalsView';
import { ServicesView } from './components/ServicesView';
import { WaitingListView } from './components/WaitingListView';
import { StatisticsView } from './components/StatisticsView';
import { AuditView } from './components/AuditView';
import { SettingsView } from './components/SettingsView';
import { 
  HeartHandshake, 
  AlertCircle, 
  X, 
  CheckCircle2, 
  Info, 
  AlertTriangle 
} from 'lucide-react';

const MainLayout: React.FC = () => {
  const { data, loading, error, currentUser, toasts, removeToast } = useApp();
  
  // Active navigation tab
  const [currentTab, setCurrentTab] = useState<string>(
    currentUser.role === 'PROFESIONAL' ? 'professional' : 'reception'
  );

  // Sync tab if user role changes
  React.useEffect(() => {
    if (currentUser.role === 'PROFESIONAL') {
      setCurrentTab('professional');
    } else if (currentUser.role === 'RECEPCION' && (currentTab === 'professional' || currentTab === 'settings' || currentTab === 'audit' || currentTab === 'stats')) {
      setCurrentTab('reception');
    }
  }, [currentUser.role]);

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
        <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-bold font-['Cabinet_Grotesk',sans-serif]">OPERATIVO SOCIAL IBM</h2>
        <p className="text-xs text-slate-400 mt-1">Conectando con el servidor en tiempo real...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl shadow-xl max-w-md w-full border border-rose-200 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Error de conexión</h2>
          <p className="text-xs text-slate-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      
      {/* Top Header */}
      <Header currentTab={currentTab} onTabChange={setCurrentTab} />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {currentTab === 'dashboard' && <DashboardView onNavigateTab={setCurrentTab} />}
        {currentTab === 'reception' && <ReceptionView />}
        {currentTab === 'agenda' && <AgendaView />}
        {currentTab === 'professional' && <ProfessionalView />}
        {currentTab === 'patients' && <PatientsView />}
        {currentTab === 'professionals' && <ProfessionalsView />}
        {currentTab === 'services' && <ServicesView />}
        {currentTab === 'waiting' && <WaitingListView />}
        {currentTab === 'stats' && <StatisticsView />}
        {currentTab === 'audit' && <AuditView />}
        {currentTab === 'settings' && <SettingsView />}
      </main>

      {/* Real-time Toasts Overlay */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3 rounded-xl shadow-lg border flex items-start gap-2.5 text-xs font-medium transition-all transform translate-y-0 ${
              toast.type === 'success' ? 'bg-emerald-950 text-emerald-100 border-emerald-600/40' :
              toast.type === 'error' ? 'bg-rose-950 text-rose-100 border-rose-600/40' :
              toast.type === 'warning' ? 'bg-amber-950 text-amber-100 border-amber-600/40' :
              'bg-slate-900 text-slate-100 border-slate-700'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
            {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
            
            <div className="flex-1">{toast.message}</div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white p-0.5 shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Quiet Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-4 px-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>OPERATIVO SOCIAL IBM · Iglesia Bautista Millaray, Chacay 1164, Temuco, Chile</span>
          <span className="text-[11px] text-slate-500">Sistema en Tiempo Real con Prevención Atómica de Doble Reserva</span>
        </div>
      </footer>

    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
