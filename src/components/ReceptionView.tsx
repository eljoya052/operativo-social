import React, { useState, useMemo } from 'react';
import { 
  UserPlus, 
  Search, 
  Filter, 
  Printer, 
  Edit3, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRightLeft, 
  Users, 
  Calendar,
  XCircle,
  HelpCircle,
  Play,
  RotateCcw,
  FileSpreadsheet
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { BookingModal } from './BookingModal';
import { VoucherModal } from './VoucherModal';
import { exportOperativeToExcel } from '../utils/exportToExcel';
import type { Appointment, AppointmentStatus } from '../types';

export const ReceptionView: React.FC = () => {
  const { data, activeOperative, currentUser, addToast } = useApp();

  // Modals
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedVoucherApt, setSelectedVoucherApt] = useState<Appointment | null>(null);

  // Edit / Reschedule Modal state
  const [editingApt, setEditingApt] = useState<Appointment | null>(null);
  const [editStartTime, setEditStartTime] = useState('');
  const [editProfId, setEditProfId] = useState('');
  const [editObservations, setEditObservations] = useState('');

  // Cancel Modal state
  const [cancellingApt, setCancellingApt] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedServiceFilter, setSelectedServiceFilter] = useState('');
  const [selectedProfFilter, setSelectedProfFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('');

  // Filtered Appointments for the active operative
  const operativeAppointments = useMemo(() => {
    if (!data || !activeOperative) return [];
    return data.appointments.filter(a => a.operativeId === activeOperative.id);
  }, [data, activeOperative]);

  // Reception Stats Cards
  const stats = useMemo(() => {
    const totalReservas = operativeAppointments.length;
    const atendidos = operativeAppointments.filter(a => a.status === 'Atendido').length;
    const enAtencion = operativeAppointments.filter(a => a.status === 'En atención').length;
    const esperando = operativeAppointments.filter(a => a.status === 'Esperando' || a.status === 'Reservado' || a.status === 'Confirmado').length;
    const noAsistieron = operativeAppointments.filter(a => a.status === 'No asistió').length;
    const cancelados = operativeAppointments.filter(a => a.status === 'Cancelado').length;

    // Distinct patients registered
    const totalPacientes = new Set(operativeAppointments.map(a => a.patientId)).size;

    return {
      totalPacientes,
      totalReservas,
      atendidos,
      enAtencion,
      esperando,
      noAsistieron,
      cancelados
    };
  }, [operativeAppointments]);

  // Filtered Appointments list
  const filteredAppointments = useMemo(() => {
    return operativeAppointments.filter(apt => {
      // Search text
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchName = apt.patientName.toLowerCase().includes(term);
        const matchPhone = apt.patientPhone.includes(term);
        const matchRut = apt.patientRut?.toLowerCase().includes(term);
        const matchProf = apt.professionalName.toLowerCase().includes(term);
        const matchServ = apt.serviceName.toLowerCase().includes(term);
        if (!matchName && !matchPhone && !matchRut && !matchProf && !matchServ) return false;
      }

      // Service filter
      if (selectedServiceFilter && apt.serviceId !== selectedServiceFilter) return false;

      // Professional filter
      if (selectedProfFilter && apt.professionalId !== selectedProfFilter) return false;

      // Status filter
      if (selectedStatusFilter && apt.status !== selectedStatusFilter) return false;

      return true;
    }).sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [operativeAppointments, searchTerm, selectedServiceFilter, selectedProfFilter, selectedStatusFilter]);

  // Quick status changer from table
  const handleQuickStatus = async (appointmentId: string, status: AppointmentStatus) => {
    try {
      await api.updateAppointmentStatus(appointmentId, {
        status,
        userId: currentUser.id,
        userName: currentUser.name
      });
      addToast(`Estado cambiado a ${status}`, 'success');
    } catch (err: any) {
      addToast(err.message || 'Error al cambiar estado', 'error');
    }
  };

  // Open Edit Dialog
  const handleOpenEdit = (apt: Appointment) => {
    setEditingApt(apt);
    setEditStartTime(apt.startTime);
    setEditProfId(apt.professionalId);
    setEditObservations(apt.observations || '');
  };

  // Save Edit / Reschedule
  const handleSaveEdit = async () => {
    if (!editingApt) return;
    try {
      await api.updateAppointment(editingApt.id, {
        startTime: editStartTime,
        professionalId: editProfId,
        observations: editObservations,
        userId: currentUser.id,
        userName: currentUser.name
      });
      addToast('Reserva actualizada con éxito', 'success');
      setEditingApt(null);
    } catch (err: any) {
      addToast(err.message || 'Error al modificar reserva', 'error');
    }
  };

  // Confirm Deletion / Cancellation
  const handleConfirmDelete = async (hardDelete: boolean = true) => {
    if (!cancellingApt) return;
    try {
      await api.cancelAppointment(cancellingApt.id, currentUser.id, currentUser.name, cancelReason, hardDelete);
      addToast(hardDelete ? 'Cita borrada definitivamente de la agenda' : 'Cita marcada como cancelada', 'warning');
      setCancellingApt(null);
      setCancelReason('');
    } catch (err: any) {
      addToast(err.message || 'Error al eliminar cita', 'error');
    }
  };

  // Export to Excel
  const handleDownloadExcel = () => {
    if (!data) return;
    try {
      exportOperativeToExcel(data, activeOperative);
      addToast('Planilla Excel descargada exitosamente', 'success');
    } catch (err: any) {
      addToast('Error al generar archivo Excel', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight font-['Cabinet_Grotesk',sans-serif]">
            Panel de Recepción y Control
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro ágil de pacientes y asignación de citas en tiempo real
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadExcel}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-md hover:shadow-lg transition-all"
            title="Descargar planilla Excel (.xlsx) con todos los pacientes y atenciones"
          >
            <FileSpreadsheet className="w-4 h-4 text-white" />
            <span>Descargar Excel</span>
          </button>

          <button
            onClick={() => setIsBookingModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md hover:shadow-lg transition-all"
          >
            <UserPlus className="w-4 h-4 text-slate-950" />
            <span>+ Nueva Reserva / Paciente</span>
          </button>
        </div>
      </div>

      {/* Reception Live Counters Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Pacientes</span>
          <span className="text-2xl font-black text-slate-900 font-mono tabular-nums">{stats.totalPacientes}</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Reservas</span>
          <span className="text-2xl font-black text-slate-900 font-mono tabular-nums">{stats.totalReservas}</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 shadow-xs">
          <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">Esperando</span>
          <span className="text-2xl font-black text-amber-700 font-mono tabular-nums">{stats.esperando}</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 shadow-xs">
          <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider block">En Atención</span>
          <span className="text-2xl font-black text-blue-700 font-mono tabular-nums">{stats.enAtencion}</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">Atendidos</span>
          <span className="text-2xl font-black text-emerald-700 font-mono tabular-nums">{stats.atendidos}</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-rose-200 bg-rose-50/50 shadow-xs">
          <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider block">Cancelados</span>
          <span className="text-2xl font-black text-rose-700 font-mono tabular-nums">{stats.cancelados}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por paciente, teléfono, RUT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          {/* Service filter */}
          <div>
            <select
              value={selectedServiceFilter}
              onChange={(e) => setSelectedServiceFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50 bg-white"
            >
              <option value="">Todos los servicios ({data?.services.length})</option>
              {data?.services.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Professional / Specialty filter */}
          <div>
            <select
              value={selectedProfFilter}
              onChange={(e) => setSelectedProfFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50 bg-white"
            >
              <option value="">Todas las profesiones</option>
              {data?.professionals.map(p => (
                <option key={p.id} value={p.id}>{p.specialty || p.name}</option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50 bg-white"
            >
              <option value="">Todos los estados</option>
              <option value="Esperando">🟡 Esperando</option>
              <option value="En atención">🔵 En atención</option>
              <option value="Atendido">🟢 Atendido</option>
              <option value="No asistió">⚫ No asistió</option>
              <option value="Cancelado">🔴 Cancelado</option>
            </select>
          </div>

        </div>
      </div>

      {/* Real-time Appointments Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Cola de Atenciones del Operativo
            </h3>
            <span className="text-xs text-slate-500">
              {filteredAppointments.length} reservas registradas
            </span>
          </div>

          <div className="text-xs text-slate-400">
            Actualización automática instantánea
          </div>
        </div>

        {filteredAppointments.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No hay citas registradas que coincidan con los filtros actuales.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 uppercase text-[11px] tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Hora</th>
                  <th className="py-3 px-4">Paciente</th>
                  <th className="py-3 px-4">Servicio / Profesión</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAppointments.map(apt => {
                  const service = data?.services.find(s => s.id === apt.serviceId);
                  const isCancel = apt.status === 'Cancelado';

                  return (
                    <tr 
                      key={apt.id} 
                      className={`hover:bg-slate-50/80 transition-colors ${
                        apt.status === 'En atención' ? 'bg-blue-50/40' : 
                        apt.status === 'Atendido' ? 'bg-emerald-50/30' :
                        isCancel ? 'bg-rose-50/30 opacity-60' : ''
                      }`}
                    >
                      {/* Hora */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <span className="text-sm">{apt.startTime}</span>
                        <span className="text-[10px] text-slate-400 block">{apt.endTime}</span>
                      </td>

                      {/* Paciente */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{apt.patientName}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span>{apt.patientPhone}</span>
                          {apt.patientRut && <span>· {apt.patientRut}</span>}
                        </div>
                        {apt.observations && (
                          <div className="text-[10px] text-slate-600 italic mt-0.5 max-w-xs truncate">
                            {apt.observations}
                          </div>
                        )}
                      </td>

                      {/* Servicio / Profesión */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span 
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-slate-900 border"
                          style={{ 
                            backgroundColor: `${service?.color || '#2563eb'}15`,
                            borderColor: `${service?.color || '#2563eb'}40`
                          }}
                        >
                          <span 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: service?.color || '#2563eb' }}
                          />
                          {apt.serviceName}
                        </span>
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            apt.status === 'Atendido' ? 'bg-emerald-100 text-emerald-800' :
                            apt.status === 'En atención' ? 'bg-blue-100 text-blue-800' :
                            apt.status === 'Esperando' ? 'bg-amber-100 text-amber-800' :
                            apt.status === 'No asistió' ? 'bg-slate-800 text-slate-200' :
                            apt.status === 'Cancelado' ? 'bg-rose-100 text-rose-800' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {apt.status}
                          </span>
                        </div>
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* Quick voucher button */}
                          <button
                            onClick={() => setSelectedVoucherApt(apt)}
                            className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Ver / Imprimir Comprobante"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick change status (esperando -> en atención -> atendido) */}
                          {apt.status === 'Esperando' && (
                            <button
                              onClick={() => handleQuickStatus(apt.id, 'En atención')}
                              className="px-2 py-1 text-[11px] font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors"
                              title="Pasar a atención"
                            >
                              Atender
                            </button>
                          )}

                          {apt.status === 'En atención' && (
                            <button
                              onClick={() => handleQuickStatus(apt.id, 'Atendido')}
                              className="px-2 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-colors"
                              title="Marcar como atendido"
                            >
                              Finalizar
                            </button>
                          )}

                          {/* Edit / Reschedule */}
                          {!isCancel && (
                            <button
                              onClick={() => handleOpenEdit(apt)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Modificar / Reasignar"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Cancel */}
                          {!isCancel && (
                            <button
                              onClick={() => setCancellingApt(apt)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Cancelar Reserva"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Booking Modal */}
      {isBookingModalOpen && (
        <BookingModal
          onClose={() => setIsBookingModalOpen(false)}
          onSuccess={(newApt) => {
            setIsBookingModalOpen(false);
            setSelectedVoucherApt(newApt);
          }}
        />
      )}

      {/* Voucher Modal */}
      {selectedVoucherApt && (
        <VoucherModal
          appointment={selectedVoucherApt}
          operative={activeOperative}
          onClose={() => setSelectedVoucherApt(null)}
        />
      )}

      {/* Edit / Reschedule Modal */}
      {editingApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Modificar Reserva</h3>
                <p className="text-xs text-slate-400">{editingApt.patientName} · {editingApt.serviceName}</p>
              </div>
              <button onClick={() => setEditingApt(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Módulo / Profesión</label>
                <select
                  value={editProfId}
                  onChange={(e) => setEditProfId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl"
                >
                  {data?.professionals
                    .filter(p => p.active && p.serviceIds.includes(editingApt.serviceId))
                    .map(p => (
                      <option key={p.id} value={p.id}>{p.specialty || p.name}</option>
                    ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Horario de Atención (HH:MM)</label>
                <input
                  type="time"
                  value={editStartTime}
                  onChange={(e) => setEditStartTime(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Observaciones</label>
                <input
                  type="text"
                  value={editObservations}
                  onChange={(e) => setEditObservations(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditingApt(null)}
                  className="px-3 py-1.5 font-semibold text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-4 py-2 font-bold bg-amber-500 text-slate-950 rounded-xl shadow-xs"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel / Delete Confirmation Modal */}
      {cancellingApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200 overflow-hidden">
            <div className="bg-rose-700 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">Eliminar Cita</h3>
              <button onClick={() => setCancellingApt(null)} className="text-rose-200 hover:text-white">✕</button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <p className="text-slate-800 font-medium">
                ¿Qué desea hacer con la cita de <strong>{cancellingApt.patientName}</strong> en {cancellingApt.serviceName} a las {cancellingApt.startTime} hrs?
              </p>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Motivo (opcional)</label>
                <input
                  type="text"
                  placeholder="Ej. Paciente no asistirá, error al agendar..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex flex-col gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleConfirmDelete(true)}
                  className="w-full py-2.5 font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar Definitivamente de la Agenda</span>
                </button>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setCancellingApt(null)}
                    className="px-3 py-1.5 font-semibold text-slate-600 hover:text-slate-900"
                  >
                    Volver
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConfirmDelete(false)}
                    className="px-3 py-1.5 text-slate-500 hover:text-slate-800 text-[11px]"
                  >
                    Solo marcar como Cancelada
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
