import React, { useMemo } from 'react';
import { 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  MapPin, 
  TrendingUp, 
  Activity, 
  Sparkles, 
  ArrowUpRight,
  UserX,
  Play,
  FileSpreadsheet
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { exportOperativeToExcel } from '../utils/exportToExcel';

interface DashboardViewProps {
  onNavigateTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateTab }) => {
  const { data, activeOperative, generateTimeSlots } = useApp();

  // Appointments for the active operative
  const appointments = useMemo(() => {
    if (!data || !activeOperative) return [];
    return data.appointments.filter(a => a.operativeId === activeOperative.id);
  }, [data, activeOperative]);

  // Overall statistics
  const stats = useMemo(() => {
    const totalReservas = appointments.length;
    const atendidos = appointments.filter(a => a.status === 'Atendido').length;
    const enAtencion = appointments.filter(a => a.status === 'En atención').length;
    const esperando = appointments.filter(a => a.status === 'Esperando' || a.status === 'Reservado' || a.status === 'Confirmado').length;
    const noAsistieron = appointments.filter(a => a.status === 'No asistió').length;
    const cancelados = appointments.filter(a => a.status === 'Cancelado').length;
    
    // Distinct patients
    const distinctPatientIds = new Set(appointments.map(a => a.patientId));
    const totalPacientes = distinctPatientIds.size;

    return {
      totalPacientes,
      totalReservas,
      atendidos,
      enAtencion,
      esperando,
      noAsistieron,
      cancelados
    };
  }, [appointments]);

  // Capacity calculations
  const capacityStats = useMemo(() => {
    if (!activeOperative || !data) return { totalCapacity: 0, bookedSlots: 0, availableSlots: 0, occupancyPercent: 0 };
    
    const slots = generateTimeSlots(
      activeOperative.startTime, 
      activeOperative.endTime, 
      activeOperative.slotDurationMinutes
    );
    const blocksPerProf = slots.length;

    const activeProfs = data.professionals.filter(p => p.active);
    const totalCapacity = activeProfs.length * blocksPerProf;

    const activeApts = appointments.filter(a => a.status !== 'Cancelado');
    const bookedSlots = activeApts.length;
    const availableSlots = Math.max(0, totalCapacity - bookedSlots);
    const occupancyPercent = totalCapacity > 0 ? Math.round((bookedSlots / totalCapacity) * 100) : 0;

    return {
      blocksPerProf,
      activeProfsCount: activeProfs.length,
      totalCapacity,
      bookedSlots,
      availableSlots,
      occupancyPercent
    };
  }, [activeOperative, data, appointments, generateTimeSlots]);

  // Services breakdown
  const servicesStats = useMemo(() => {
    if (!data || !activeOperative) return [];

    return data.services
      .filter(s => s.active)
      .map(service => {
        const srvApts = appointments.filter(a => a.serviceId === service.id);
        const activeSrvApts = srvApts.filter(a => a.status !== 'Cancelado');
        const atendidos = srvApts.filter(a => a.status === 'Atendido').length;
        const enAtencion = srvApts.filter(a => a.status === 'En atención').length;
        const esperando = srvApts.filter(a => a.status === 'Esperando' || a.status === 'Reservado' || a.status === 'Confirmado').length;
        const cancelados = srvApts.filter(a => a.status === 'Cancelado').length;
        const noAsistio = srvApts.filter(a => a.status === 'No asistió').length;

        const profsInService = data.professionals.filter(p => p.active && p.serviceIds.includes(service.id));
        const serviceCapacity = profsInService.length * (capacityStats.blocksPerProf || 18);
        const occupancy = serviceCapacity > 0 ? Math.round((activeSrvApts.length / serviceCapacity) * 100) : 0;

        return {
          service,
          total: activeSrvApts.length,
          atendidos,
          enAtencion,
          esperando,
          cancelados,
          noAsistio,
          profsCount: profsInService.length,
          capacity: serviceCapacity,
          occupancy
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [data, activeOperative, appointments, capacityStats]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Hero Operative Banner (Inspirado en Iglesia Bautista Millaray) */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-xl p-6 sm:p-8">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-400 text-slate-950">
              <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
              <span>{activeOperative?.organization || 'Iglesia Bautista Millaray — IBM'}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-['Cabinet_Grotesk',sans-serif]">
              {activeOperative?.name || 'OPERATIVO SOCIAL'}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
              <span className="flex items-center gap-1.5 font-medium">
                <Calendar className="w-4 h-4 text-amber-400" />
                {activeOperative?.date}
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="w-4 h-4 text-amber-400" />
                {activeOperative?.startTime} — {activeOperative?.endTime} hrs. ({activeOperative?.slotDurationMinutes} min / cita)
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <MapPin className="w-4 h-4 text-amber-400" />
                {activeOperative?.address}
              </span>
            </div>
          </div>

          {/* Quick Direct Actions */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => {
                if (data) exportOperativeToExcel(data, activeOperative);
              }}
              className="flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-md hover:shadow-lg transition-all"
              title="Descargar todos los datos del operativo y pacientes en Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-white" />
              <span>Descargar Excel</span>
            </button>

            <button
              onClick={() => onNavigateTab('reception')}
              className="px-5 py-3 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md hover:shadow-lg transition-all"
            >
              + Nueva Reserva en Recepción
            </button>
            <button
              onClick={() => onNavigateTab('agenda')}
              className="px-4 py-3 rounded-xl font-semibold text-xs bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors"
            >
              Ver Agenda General
            </button>
          </div>
        </div>

        {/* Global Key Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-8 pt-6 border-t border-slate-800">
          
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium">👥 Pacientes</span>
            </div>
            <div className="text-3xl font-black text-white font-mono tabular-nums">
              {stats.totalPacientes}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Registrados únicos</span>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium">📅 Reservas</span>
            </div>
            <div className="text-3xl font-black text-white font-mono tabular-nums">
              {stats.totalReservas}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Total agendadas</span>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
            <div className="flex items-center justify-between text-amber-300 mb-1">
              <span className="text-xs font-medium">⏳ Esperando</span>
            </div>
            <div className="text-3xl font-black text-amber-400 font-mono tabular-nums">
              {stats.esperando}
            </div>
            <span className="text-[11px] text-amber-300/80 mt-1 block">En sala de espera</span>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4">
            <div className="flex items-center justify-between text-blue-300 mb-1">
              <span className="text-xs font-medium">🔵 En atención</span>
            </div>
            <div className="text-3xl font-black text-blue-400 font-mono tabular-nums">
              {stats.enAtencion}
            </div>
            <span className="text-[11px] text-blue-300/80 mt-1 block">Con profesional</span>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4">
            <div className="flex items-center justify-between text-emerald-300 mb-1">
              <span className="text-xs font-medium">✅ Atendidos</span>
            </div>
            <div className="text-3xl font-black text-emerald-400 font-mono tabular-nums">
              {stats.atendidos}
            </div>
            <span className="text-[11px] text-emerald-300/80 mt-1 block">Finalizados</span>
          </div>

          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4">
            <div className="flex items-center justify-between text-rose-300 mb-1">
              <span className="text-xs font-medium">❌ Cancelados</span>
            </div>
            <div className="text-3xl font-black text-rose-400 font-mono tabular-nums">
              {stats.cancelados}
            </div>
            <span className="text-[11px] text-rose-300/80 mt-1 block">{stats.noAsistieron} no asistieron</span>
          </div>

        </div>
      </div>

      {/* Operational Capacity Gauge Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-600" />
              <span>Capacidad General</span>
            </h3>
            <span className="text-xs font-mono font-bold text-slate-600">
              {capacityStats.occupancyPercent}% ocupado
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 rounded-full ${
                capacityStats.occupancyPercent > 85 ? 'bg-rose-500' :
                capacityStats.occupancyPercent > 60 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, capacityStats.occupancyPercent)}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase">Capacidad</span>
              <span className="font-extrabold text-slate-800 text-sm font-mono tabular-nums">{capacityStats.totalCapacity}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase">Reservados</span>
              <span className="font-extrabold text-amber-700 text-sm font-mono tabular-nums">{capacityStats.bookedSlots}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase">Disponibles</span>
              <span className="font-extrabold text-emerald-700 text-sm font-mono tabular-nums">{capacityStats.availableSlots}</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/60">
            💡 Con bloque de {activeOperative?.slotDurationMinutes} min en horario {activeOperative?.startTime}-{activeOperative?.endTime}, cada profesional tiene exactamente {capacityStats.blocksPerProf} bloques de atención.
          </div>
        </div>

        {/* Quick Service Status Overview */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Desglose en Vivo por Servicio
              </h3>
              <p className="text-xs text-slate-500">
                Seguimiento de pacientes atendidos, en curso y pendientes por cada especialidad
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('stats')}
              className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
            >
              Ver análisis completo <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {servicesStats.slice(0, 6).map(({ service, total, atendidos, enAtencion, esperando, profsCount, occupancy }) => (
              <div 
                key={service.id} 
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: service.color }} />
                    <span className="font-bold text-slate-900 text-xs truncate">{service.name}</span>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                    {occupancy}%
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5">
                  <span>{total} pacientes</span>
                  <span className="text-[11px] text-slate-400">{profsCount} profs.</span>
                </div>

                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-emerald-700 font-medium">✓ {atendidos} atendidos</span>
                  <span className="text-amber-700 font-medium">⏳ {esperando} pendientes</span>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

      {/* Services Full Table with real-time stats */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">
            Estado de Todos los Servicios del Operativo
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            {servicesStats.length} servicios activos
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 uppercase text-[11px] tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Servicio</th>
                <th className="py-3 px-4">Profesionales</th>
                <th className="py-3 px-4">Capacidad Total</th>
                <th className="py-3 px-4">Pacientes</th>
                <th className="py-3 px-4">Atendidos</th>
                <th className="py-3 px-4">En Atención</th>
                <th className="py-3 px-4">Pendientes</th>
                <th className="py-3 px-4">Ocupación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {servicesStats.map(({ service, total, atendidos, enAtencion, esperando, profsCount, capacity, occupancy }) => (
                <tr key={service.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: service.color }} />
                    <span>{service.name}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-medium">{profsCount} profesional(es)</td>
                  <td className="py-3 px-4 font-mono text-slate-700">{capacity} cupos</td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{total}</td>
                  <td className="py-3 px-4 font-mono text-emerald-700 font-bold">{atendidos}</td>
                  <td className="py-3 px-4 font-mono text-blue-700 font-bold">{enAtencion}</td>
                  <td className="py-3 px-4 font-mono text-amber-700 font-bold">{esperando}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-full bg-amber-500 rounded-full" 
                          style={{ width: `${Math.min(100, occupancy)}%` }} 
                        />
                      </div>
                      <span className="text-[11px] font-mono text-slate-600">{occupancy}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
