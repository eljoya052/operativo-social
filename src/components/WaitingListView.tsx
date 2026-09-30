import React, { useState, useMemo } from 'react';
import { 
  Clock, 
  UserPlus, 
  ArrowRight, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Filter, 
  Phone,
  User,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { BookingModal } from './BookingModal';
import { VoucherModal } from './VoucherModal';
import type { WaitingListItem, Appointment } from '../types';

export const WaitingListView: React.FC = () => {
  const { data, activeOperative, currentUser, addToast } = useApp();

  const [selectedServiceFilter, setSelectedServiceFilter] = useState('');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState('');

  // Booking from waiting list modal
  const [assigningItem, setAssigningItem] = useState<WaitingListItem | null>(null);
  const [completedApt, setCompletedApt] = useState<Appointment | null>(null);

  const waitingList = useMemo(() => {
    if (!data || !activeOperative) return [];
    return data.waitingList.filter(item => item.operativeId === activeOperative.id);
  }, [data, activeOperative]);

  const filteredItems = useMemo(() => {
    return waitingList.filter(item => {
      if (selectedServiceFilter && item.serviceId !== selectedServiceFilter) return false;
      if (selectedPriorityFilter && item.priority !== selectedPriorityFilter) return false;
      return true;
    });
  }, [waitingList, selectedServiceFilter, selectedPriorityFilter]);

  const handleUpdateStatus = async (id: string, status: 'Pendiente' | 'Asignado' | 'Cancelado') => {
    try {
      await api.updateWaitingListItem(id, {
        status,
        userId: currentUser.id,
        userName: currentUser.name
      });
      addToast(`Registro de lista de espera: ${status}`, 'info');
    } catch (err: any) {
      addToast(err.message || 'Error al actualizar', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight font-['Cabinet_Grotesk',sans-serif]">
            Lista de Espera
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestión de pacientes en espera para servicios sin cupos inmediatos
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-amber-800 bg-amber-100 px-3 py-1.5 rounded-xl">
            {waitingList.filter(w => w.status === 'Pendiente').length} pendientes por asignar
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-3">
        <select
          value={selectedServiceFilter}
          onChange={(e) => setSelectedServiceFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50 bg-white"
        >
          <option value="">Todos los servicios</option>
          {data?.services.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <select
          value={selectedPriorityFilter}
          onChange={(e) => setSelectedPriorityFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50 bg-white"
        >
          <option value="">Todas las prioridades</option>
          <option value="Alta">Prioridad Alta</option>
          <option value="Media">Prioridad Media</option>
          <option value="Baja">Prioridad Baja</option>
        </select>
      </div>

      {/* Waiting List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">
            Pacientes en Lista de Espera ({filteredItems.length})
          </h3>
        </div>

        {filteredItems.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No hay pacientes en la lista de espera con los filtros seleccionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 uppercase text-[11px] tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Paciente</th>
                  <th className="py-3 px-4">Servicio Solicitado</th>
                  <th className="py-3 px-4">Teléfono</th>
                  <th className="py-3 px-4">Prioridad</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4">Observaciones</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map(item => {
                  const service = data?.services.find(s => s.id === item.serviceId);
                  const isPending = item.status === 'Pendiente';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {item.patientName}
                      </td>

                      <td className="py-3.5 px-4">
                        <span 
                          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold text-slate-900 border"
                          style={{
                            backgroundColor: `${service?.color || '#2563eb'}15`,
                            borderColor: `${service?.color || '#2563eb'}40`
                          }}
                        >
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: service?.color }} />
                          {item.serviceName}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                        {item.patientPhone}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          item.priority === 'Alta' ? 'bg-rose-100 text-rose-800' :
                          item.priority === 'Media' ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {item.priority}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          item.status === 'Asignado' ? 'bg-emerald-100 text-emerald-800' :
                          item.status === 'Pendiente' ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-200 text-slate-600'
                        }`}>
                          {item.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                        {item.observations || '—'}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setAssigningItem(item)}
                              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-xs transition-colors"
                            >
                              <span>Asignar Cupo</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(item.id, 'Cancelado')}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Descartar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-emerald-700 font-semibold flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {item.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assignment Booking Modal */}
      {assigningItem && (
        <BookingModal
          initialServiceId={assigningItem.serviceId}
          initialPatientId={assigningItem.patientId}
          onClose={() => setAssigningItem(null)}
          onSuccess={(apt) => {
            handleUpdateStatus(assigningItem.id, 'Asignado');
            setAssigningItem(null);
            setCompletedApt(apt);
          }}
        />
      )}

      {/* Voucher Modal */}
      {completedApt && (
        <VoucherModal
          appointment={completedApt}
          operative={activeOperative}
          onClose={() => setCompletedApt(null)}
        />
      )}

    </div>
  );
};
