import React, { useState, useMemo } from 'react';
import { 
  Play, 
  CheckCircle2, 
  UserX, 
  Clock, 
  Phone, 
  FileText, 
  Calendar, 
  AlertCircle, 
  ChevronRight, 
  User, 
  Heart,
  MessageSquare
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import type { Appointment, AppointmentStatus } from '../types';

export const ProfessionalView: React.FC = () => {
  const { data, activeOperative, currentUser, addToast } = useApp();

  const [clinicalNotes, setClinicalNotes] = useState<{ [aptId: string]: string }>({});
  const [activeNoteModalApt, setActiveNoteModalApt] = useState<Appointment | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Find the professional record associated with current logged-in user
  const currentProfessional = useMemo(() => {
    if (!data) return null;
    if (currentUser.professionalId) {
      return data.professionals.find(p => p.id === currentUser.professionalId) || null;
    }
    // Fallback search by email
    return data.professionals.find(p => p.email?.toLowerCase() === currentUser.email.toLowerCase()) || data.professionals[0];
  }, [data, currentUser]);

  // Associated service names
  const serviceNames = useMemo(() => {
    if (!data || !currentProfessional) return '';
    return currentProfessional.serviceIds
      .map(sId => data.services.find(s => s.id === sId)?.name)
      .filter(Boolean)
      .join(', ');
  }, [data, currentProfessional]);

  // Professional's appointments for active operative (STRICT PRIVACY: only their assigned patients!)
  const myAppointments = useMemo(() => {
    if (!data || !activeOperative || !currentProfessional) return [];
    return data.appointments
      .filter(a => a.operativeId === activeOperative.id && a.professionalId === currentProfessional.id && a.status !== 'Cancelado')
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [data, activeOperative, currentProfessional]);

  // Real-time Counters
  const counters = useMemo(() => {
    const total = myAppointments.length;
    const atendidos = myAppointments.filter(a => a.status === 'Atendido').length;
    const enAtencion = myAppointments.filter(a => a.status === 'En atención').length;
    const esperando = myAppointments.filter(a => a.status === 'Esperando' || a.status === 'Reservado' || a.status === 'Confirmado').length;
    const noAsistio = myAppointments.filter(a => a.status === 'No asistió').length;

    return { total, atendidos, enAtencion, esperando, noAsistio };
  }, [myAppointments]);

  // Identify currently "En atención" patient if any
  const currentInAttention = useMemo(() => {
    return myAppointments.find(a => a.status === 'En atención') || null;
  }, [myAppointments]);

  // Next Patient: first in "Esperando" or "Reservado"
  const nextPatient = useMemo(() => {
    if (currentInAttention) return null;
    return myAppointments.find(a => a.status === 'Esperando' || a.status === 'Reservado' || a.status === 'Confirmado') || null;
  }, [myAppointments, currentInAttention]);

  // Status changer handler
  const handleStatusChange = async (appointmentId: string, newStatus: AppointmentStatus, notes?: string) => {
    setUpdatingId(appointmentId);
    try {
      await api.updateAppointmentStatus(appointmentId, {
        status: newStatus,
        attentionNotes: notes || clinicalNotes[appointmentId],
        userId: currentUser.id,
        userName: currentUser.name
      });
      addToast(`Paciente marcado como: ${newStatus}`, 'success');
      setActiveNoteModalApt(null);
    } catch (err: any) {
      addToast(err.message || 'Error al actualizar el estado', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  if (!currentProfessional) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-800">No se encontró perfil profesional asignado</h2>
        <p className="text-sm text-slate-500 mt-1">
          Por favor inicie sesión como profesional o contacte al administrador.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-xl border border-slate-700/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20 mb-2">
              <Heart className="w-3.5 h-3.5 fill-amber-400" />
              <span>{serviceNames || currentProfessional.specialty || 'Profesión'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-['Cabinet_Grotesk',sans-serif]">
              Módulo de Atención: {currentProfessional.specialty || currentProfessional.name}
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Agenda de atención del {activeOperative?.name} · Chacay 1164, Temuco
            </p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-right">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Fecha del Operativo</span>
            <span className="text-sm font-bold text-white flex items-center justify-end gap-1.5">
              <Calendar className="w-4 h-4 text-amber-400" />
              {activeOperative?.date}
            </span>
          </div>
        </div>

        {/* Real-time Counters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60">
            <span className="text-xs text-slate-400 block">Atendidos</span>
            <span className="text-2xl font-black text-emerald-400 font-mono tabular-nums">
              {counters.atendidos}
            </span>
          </div>

          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60">
            <span className="text-xs text-slate-400 block">En atención</span>
            <span className="text-2xl font-black text-blue-400 font-mono tabular-nums">
              {counters.enAtencion}
            </span>
          </div>

          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60">
            <span className="text-xs text-slate-400 block">Pendientes</span>
            <span className="text-2xl font-black text-amber-400 font-mono tabular-nums">
              {counters.esperando}
            </span>
          </div>

          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60">
            <span className="text-xs text-slate-400 block">Total Asignados</span>
            <span className="text-2xl font-black text-white font-mono tabular-nums">
              {counters.total}
            </span>
          </div>
        </div>
      </div>

      {/* ACTIVE / NEXT PATIENT SPOTLIGHT */}
      {currentInAttention ? (
        <div className="bg-blue-50 border-2 border-blue-400 rounded-2xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-600 text-white animate-pulse">
              <Play className="w-3.5 h-3.5 fill-white" />
              PACIENTE ACTUALMENTE EN ATENCIÓN
            </span>
            <span className="text-xs font-mono font-bold text-blue-800">
              Inicio cita: {currentInAttention.startTime} hrs.
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                {currentInAttention.patientName}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-1">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  {currentInAttention.patientPhone}
                </span>
                {currentInAttention.patientRut && (
                  <span>· RUT: {currentInAttention.patientRut}</span>
                )}
                {currentInAttention.observations && (
                  <span className="italic text-slate-700">· "{currentInAttention.observations}"</span>
                )}
              </div>
            </div>

            {/* Giant Action Button: FINALIZAR ATENCIÓN */}
            <div className="flex items-center gap-2">
              <button
                disabled={updatingId === currentInAttention.id}
                onClick={() => setActiveNoteModalApt(currentInAttention)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg hover:shadow-xl transition-all"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>FINALIZAR ATENCIÓN</span>
              </button>
            </div>
          </div>
        </div>
      ) : nextPatient ? (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-slate-950">
              <Clock className="w-3.5 h-3.5" />
              PRÓXIMO PACIENTE
            </span>
            <span className="text-sm font-mono font-extrabold text-amber-900">
              {nextPatient.startTime} hrs.
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                {nextPatient.patientName}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-1">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  {nextPatient.patientPhone}
                </span>
                {nextPatient.patientRut && (
                  <span>· RUT: {nextPatient.patientRut}</span>
                )}
                {nextPatient.observations && (
                  <span className="italic text-slate-700">· "{nextPatient.observations}"</span>
                )}
              </div>
            </div>

            {/* Giant Action Button: INICIAR ATENCIÓN */}
            <div className="flex items-center gap-2">
              <button
                disabled={updatingId === nextPatient.id}
                onClick={() => handleStatusChange(nextPatient.id, 'En atención')}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-lg hover:shadow-xl transition-all"
              >
                <Play className="w-5 h-5 fill-white" />
                <span>INICIAR ATENCIÓN</span>
              </button>

              <button
                disabled={updatingId === nextPatient.id}
                onClick={() => handleStatusChange(nextPatient.id, 'No asistió')}
                className="px-3.5 py-3.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-300 transition-colors"
                title="Marcar como no asistió"
              >
                <UserX className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center text-emerald-800">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
          <h3 className="font-bold text-base">¡Al día! No tienes pacientes pendientes en espera</h3>
          <p className="text-xs text-emerald-700 mt-0.5">
            Las nuevas reservas de recepción aparecerán aquí automáticamente en tiempo real.
          </p>
        </div>
      )}

      {/* AGENDA DEL DÍA (CHRONOLOGICAL TIMELINE) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-['Cabinet_Grotesk',sans-serif]">
              Agenda Completa del Día
            </h3>
            <span className="text-xs text-slate-500">
              {myAppointments.length} atenciones programadas
            </span>
          </div>
          <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-md">
            {activeOperative?.slotDurationMinutes} min por bloque
          </span>
        </div>

        {myAppointments.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No tienes pacientes agendados aún para este operativo.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {myAppointments.map(apt => {
              const isAtendido = apt.status === 'Atendido';
              const isInProgress = apt.status === 'En atención';
              const isWaiting = apt.status === 'Esperando' || apt.status === 'Reservado';
              const isNoShow = apt.status === 'No asistió';

              return (
                <div 
                  key={apt.id} 
                  className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                    isInProgress 
                      ? 'bg-blue-50/70 border-l-4 border-blue-600' 
                      : isAtendido 
                        ? 'bg-slate-50/60 opacity-85' 
                        : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Time Badge */}
                    <div className="text-center font-mono shrink-0">
                      <span className="text-base font-extrabold text-slate-900 block tabular-nums">
                        {apt.startTime}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {apt.endTime}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-slate-900">
                          {apt.patientName}
                        </span>
                        
                        {/* Status Badge */}
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          isAtendido ? 'bg-emerald-100 text-emerald-800' :
                          isInProgress ? 'bg-blue-600 text-white' :
                          isWaiting ? 'bg-amber-100 text-amber-800' :
                          isNoShow ? 'bg-slate-800 text-slate-200' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {apt.status}
                        </span>
                      </div>

                      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2 mt-1">
                        <span>Tel: {apt.patientPhone}</span>
                        {apt.patientRut && <span>· RUT: {apt.patientRut}</span>}
                        {apt.observations && (
                          <span className="text-slate-600 italic">· Obs: {apt.observations}</span>
                        )}
                        {apt.attentionNotes && (
                          <span className="text-emerald-700 font-medium">· Nota clínica registrada</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions for this row */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {isWaiting && (
                      <button
                        onClick={() => handleStatusChange(apt.id, 'En atención')}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 transition-colors"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Atender</span>
                      </button>
                    )}

                    {isInProgress && (
                      <button
                        onClick={() => setActiveNoteModalApt(apt)}
                        className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Finalizar</span>
                      </button>
                    )}

                    {isAtendido && (
                      <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        Atención completada
                      </span>
                    )}

                    {isWaiting && (
                      <button
                        onClick={() => handleStatusChange(apt.id, 'No asistió')}
                        className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Marcar no asistió"
                      >
                        No asistió
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FINALIZAR ATENCIÓN & CLINICAL NOTES MODAL */}
      {activeNoteModalApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="bg-emerald-700 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Finalizar Atención Clínica</h3>
                <p className="text-xs text-emerald-100">
                  {activeNoteModalApt.patientName} · {activeNoteModalApt.serviceName}
                </p>
              </div>
              <button 
                onClick={() => setActiveNoteModalApt(null)}
                className="text-emerald-200 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Notas de la consulta / Indicaciones (opcional)
                </label>
                <textarea
                  rows={4}
                  placeholder="Ej. Se realiza evaluación fonoaudiológica, se entrega pauta de ejercicios vocales y derivación a ORL..."
                  value={clinicalNotes[activeNoteModalApt.id] || ''}
                  onChange={(e) => setClinicalNotes({
                    ...clinicalNotes,
                    [activeNoteModalApt.id]: e.target.value
                  })}
                  className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveNoteModalApt(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange(activeNoteModalApt.id, 'Atendido', clinicalNotes[activeNoteModalApt.id])}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmar Atendido</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
