import React, { useState } from 'react';
import { 
  Settings, 
  Calendar, 
  Clock, 
  MapPin, 
  Save, 
  Plus, 
  RotateCcw, 
  Check, 
  AlertTriangle,
  Building,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import type { Operative } from '../types';

export const SettingsView: React.FC = () => {
  const { data, activeOperative, currentUser, setActiveOperativeId, addToast, refreshData } = useApp();

  // Current Operative Edit Form
  const [activeFormData, setActiveFormData] = useState({
    name: activeOperative?.name || 'OPERATIVO SOCIAL IBM',
    organization: activeOperative?.organization || 'Iglesia Bautista Millaray — IBM',
    address: activeOperative?.address || 'Chacay 1164, Temuco, Chile',
    date: activeOperative?.date || '2026-10-17',
    startTime: activeOperative?.startTime || '11:00',
    endTime: activeOperative?.endTime || '17:00',
    slotDurationMinutes: activeOperative?.slotDurationMinutes || 20
  });

  // Sync when activeOperative changes
  React.useEffect(() => {
    if (activeOperative) {
      setActiveFormData({
        name: activeOperative.name,
        organization: activeOperative.organization,
        address: activeOperative.address,
        date: activeOperative.date,
        startTime: activeOperative.startTime,
        endTime: activeOperative.endTime,
        slotDurationMinutes: activeOperative.slotDurationMinutes
      });
    }
  }, [activeOperative]);

  // New Operative Modal
  const [isNewOpModalOpen, setIsNewOpModalOpen] = useState(false);
  const [newOpData, setNewOpData] = useState({
    name: 'Operativo Social Noviembre 2026',
    organization: 'Iglesia Bautista Millaray — IBM',
    address: 'Chacay 1164, Temuco, Chile',
    date: '2026-11-21',
    startTime: '11:00',
    endTime: '17:00',
    slotDurationMinutes: 20
  });

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isClearOperationalConfirmOpen, setIsClearOperationalConfirmOpen] = useState(false);

  // Clear operational data for real live event
  const handleClearOperationalData = async () => {
    try {
      await api.clearOperationalData(currentUser.id, currentUser.name);
      await refreshData();
      setIsClearOperationalConfirmOpen(false);
      addToast('Sistema vaciado en cero. ¡Listo para el Operativo Social real!', 'success');
    } catch (err: any) {
      addToast(err.message || 'Error al vaciar datos', 'error');
    }
  };

  // Save changes to current operative
  const handleSaveActiveOperative = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOperative) return;

    try {
      await api.updateOperative(activeOperative.id, {
        ...activeFormData,
        slotDurationMinutes: Number(activeFormData.slotDurationMinutes),
        userId: currentUser.id,
        userName: currentUser.name
      });
      addToast('Configuración del operativo actualizada con éxito', 'success');
    } catch (err: any) {
      addToast(err.message || 'Error al guardar configuración', 'error');
    }
  };

  // Create brand new operative
  const handleCreateNewOperative = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.createOperative({
        ...newOpData,
        slotDurationMinutes: Number(newOpData.slotDurationMinutes),
        userId: currentUser.id,
        userName: currentUser.name
      });
      addToast(`Nuevo operativo "${created.name}" creado exitosamente`, 'success');
      setIsNewOpModalOpen(false);
      await setActiveOperativeId(created.id);
    } catch (err: any) {
      addToast(err.message || 'Error al crear nuevo operativo', 'error');
    }
  };

  // Reset database to seed
  const handleResetData = async () => {
    try {
      await api.resetData();
      await refreshData();
      setIsResetConfirmOpen(false);
      addToast('Base de datos reiniciada a los valores de prueba', 'success');
    } catch (err: any) {
      addToast(err.message || 'Error al reiniciar datos', 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight font-['Cabinet_Grotesk',sans-serif]">
            Configuración del Operativo
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestión de parámetros del operativo, horarios, duración de citas y futuros eventos
          </p>
        </div>

        <button
          onClick={() => setIsNewOpModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>+ Crear Futuro Operativo</span>
        </button>
      </div>

      {/* Operative Selector Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
          Operativo Activo Actualmente en el Sistema
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {data?.operatives.map(op => {
            const isSelected = op.id === activeOperative?.id;
            return (
              <button
                key={op.id}
                type="button"
                onClick={() => setActiveOperativeId(op.id)}
                className={`p-3.5 rounded-xl border text-left transition-all text-xs flex flex-col justify-between ${
                  isSelected 
                    ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20 shadow-xs' 
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div>
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span>{op.name}</span>
                    {isSelected && (
                      <span className="text-[10px] bg-amber-500 text-slate-950 font-bold px-1.5 py-0.5 rounded">
                        Activo
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-amber-600" />
                    <span>{op.date}</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 mt-2 font-mono">
                  {op.startTime} - {op.endTime} ({op.slotDurationMinutes} min)
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Operative Parameters Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-4 font-['Cabinet_Grotesk',sans-serif]">
          Parámetros de "{activeOperative?.name}"
        </h3>

        <form onSubmit={handleSaveActiveOperative} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Nombre del Operativo *</label>
              <input
                type="text"
                required
                value={activeFormData.name}
                onChange={(e) => setActiveFormData({ ...activeFormData, name: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-medium"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Organización / Entidad *</label>
              <input
                type="text"
                required
                value={activeFormData.organization}
                onChange={(e) => setActiveFormData({ ...activeFormData, organization: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Dirección del Operativo *</label>
              <input
                type="text"
                required
                value={activeFormData.address}
                onChange={(e) => setActiveFormData({ ...activeFormData, address: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Fecha del Operativo *</label>
              <input
                type="text"
                required
                value={activeFormData.date}
                onChange={(e) => setActiveFormData({ ...activeFormData, date: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
                placeholder="17 de octubre"
              />
            </div>
          </div>

          {/* Times and Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-100 pt-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Hora de Inicio (11:00) *</label>
              <input
                type="text"
                required
                value={activeFormData.startTime}
                onChange={(e) => setActiveFormData({ ...activeFormData, startTime: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Hora de Término (17:00) *</label>
              <input
                type="text"
                required
                value={activeFormData.endTime}
                onChange={(e) => setActiveFormData({ ...activeFormData, endTime: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Duración de Cada Cita *</label>
              <select
                value={activeFormData.slotDurationMinutes}
                onChange={(e) => setActiveFormData({ ...activeFormData, slotDurationMinutes: Number(e.target.value) })}
                className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-medium"
              >
                <option value={20}>20 minutos (18 bloques / profesional)</option>
                <option value={25}>25 minutos (14 bloques / profesional)</option>
                <option value={30}>30 minutos (12 bloques / profesional)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Configuración</span>
            </button>
          </div>
        </form>
      </div>

      {/* Puesta en marcha Operativo Real */}
      <div className="bg-amber-500/10 border-2 border-amber-500/40 p-6 rounded-2xl shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-amber-900 font-extrabold text-base font-['Cabinet_Grotesk',sans-serif]">
          <CheckCircle2 className="w-5 h-5 text-amber-600" />
          <span>Puesta en Marcha: Operativo Real en Vivo</span>
        </div>
        <p className="text-xs text-slate-700 leading-relaxed">
          Usa esta opción para dejar el sistema <strong>completamente limpio en cero</strong> (0 pacientes, 0 reservas, 0 lista de espera). Conserva intacto el operativo (17 de octubre, Chacay 1164), los 11 servicios y tus profesionales listos para registrar las atenciones reales en el mesón de bienvenida.
        </p>

        {isClearOperationalConfirmOpen ? (
          <div className="p-4 bg-white border border-amber-300 rounded-xl space-y-2 text-xs">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              ¿Confirmar vaciado completo de pacientes y reservas?
            </div>
            <p className="text-slate-600 text-[11px]">
              Esta acción borrará todas las reservas y pacientes ficticios de prueba, dejando la agenda 100% libre.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleClearOperationalData}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold transition-colors"
              >
                Sí, dejar sistema en cero para Operativo Real
              </button>
              <button
                type="button"
                onClick={() => setIsClearOperationalConfirmOpen(false)}
                className="px-3 py-2 text-slate-600 font-semibold"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsClearOperationalConfirmOpen(true)}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Limpiar Pacientes y Citas (Listo para Operativo Real)</span>
          </button>
        )}
      </div>

      {/* Modal: Create Future Operative */}
      {isNewOpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <h3 className="font-bold text-sm">Crear Nuevo Operativo Social</h3>
              <button onClick={() => setIsNewOpModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateNewOperative} className="p-5 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nombre del Operativo *</label>
                <input
                  type="text"
                  required
                  value={newOpData.name}
                  onChange={(e) => setNewOpData({ ...newOpData, name: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl"
                  placeholder="Ej. Operativo Social Noviembre 2026"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Fecha *</label>
                <input
                  type="text"
                  required
                  value={newOpData.date}
                  onChange={(e) => setNewOpData({ ...newOpData, date: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl"
                  placeholder="21 de noviembre 2026"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Dirección</label>
                <input
                  type="text"
                  value={newOpData.address}
                  onChange={(e) => setNewOpData({ ...newOpData, address: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl"
                  placeholder="Chacay 1164, Temuco, Chile"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Hora Inicio</label>
                  <input
                    type="text"
                    value={newOpData.startTime}
                    onChange={(e) => setNewOpData({ ...newOpData, startTime: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Hora Término</label>
                  <input
                    type="text"
                    value={newOpData.endTime}
                    onChange={(e) => setNewOpData({ ...newOpData, endTime: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Duración de Cita</label>
                <select
                  value={newOpData.slotDurationMinutes}
                  onChange={(e) => setNewOpData({ ...newOpData, slotDurationMinutes: Number(e.target.value) })}
                  className="w-full p-2 border border-slate-300 rounded-xl bg-white"
                >
                  <option value={20}>20 minutos (18 bloques)</option>
                  <option value={25}>25 minutos (14 bloques)</option>
                  <option value={30}>30 minutos (12 bloques)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsNewOpModalOpen(false)}
                  className="px-3 py-1.5 font-semibold text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold bg-amber-500 text-slate-950 rounded-xl shadow-xs"
                >
                  Crear Operativo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
