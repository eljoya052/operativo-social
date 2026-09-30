import React, { useMemo } from 'react';
import { 
  Download, 
  BarChart3, 
  FileSpreadsheet, 
  CheckCircle2, 
  Clock, 
  Users, 
  Activity, 
  Sparkles,
  PieChart
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const StatisticsView: React.FC = () => {
  const { data, activeOperative, generateTimeSlots, addToast } = useApp();

  const operativeAppointments = useMemo(() => {
    if (!data || !activeOperative) return [];
    return data.appointments.filter(a => a.operativeId === activeOperative.id);
  }, [data, activeOperative]);

  // Capacity Stats
  const slots = useMemo(() => {
    if (!activeOperative) return [];
    return generateTimeSlots(activeOperative.startTime, activeOperative.endTime, activeOperative.slotDurationMinutes);
  }, [activeOperative, generateTimeSlots]);

  const blocksPerProf = slots.length;
  const activeProfs = useMemo(() => data?.professionals.filter(p => p.active) || [], [data]);
  const totalTheoreticalCapacity = activeProfs.length * blocksPerProf;
  const activeBookings = operativeAppointments.filter(a => a.status !== 'Cancelado');
  const atendidos = operativeAppointments.filter(a => a.status === 'Atendido');

  // Breakdown by Service
  const serviceStats = useMemo(() => {
    if (!data || !activeOperative) return [];

    return data.services.map(srv => {
      const apts = operativeAppointments.filter(a => a.serviceId === srv.id && a.status !== 'Cancelado');
      const attended = apts.filter(a => a.status === 'Atendido').length;
      const inProgress = apts.filter(a => a.status === 'En atención').length;
      const waiting = apts.filter(a => a.status === 'Esperando' || a.status === 'Reservado').length;
      const profs = data.professionals.filter(p => p.active && p.serviceIds.includes(srv.id));
      const capacity = profs.length * blocksPerProf;
      const occupancy = capacity > 0 ? Math.round((apts.length / capacity) * 100) : 0;

      return {
        service: srv,
        total: apts.length,
        attended,
        inProgress,
        waiting,
        profsCount: profs.length,
        capacity,
        occupancy
      };
    }).sort((a, b) => b.total - a.total);
  }, [data, activeOperative, operativeAppointments, blocksPerProf]);

  // Breakdown by Professional
  const profStats = useMemo(() => {
    if (!data || !activeOperative) return [];

    return data.professionals.map(prof => {
      const apts = operativeAppointments.filter(a => a.professionalId === prof.id && a.status !== 'Cancelado');
      const attended = apts.filter(a => a.status === 'Atendido').length;
      const inProgress = apts.filter(a => a.status === 'En atención').length;
      const waiting = apts.filter(a => a.status === 'Esperando' || a.status === 'Reservado').length;
      const occupancy = blocksPerProf > 0 ? Math.round((apts.length / blocksPerProf) * 100) : 0;

      return {
        prof,
        total: apts.length,
        attended,
        inProgress,
        waiting,
        capacity: blocksPerProf,
        occupancy
      };
    }).sort((a, b) => b.total - a.total);
  }, [data, activeOperative, operativeAppointments, blocksPerProf]);

  // CSV Exporters
  const downloadCSV = (content: string, filename: string) => {
    // Add UTF-8 BOM so Excel opens accented characters like ñ and tildes properly
    const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast(`Archivo ${filename} exportado exitosamente`, 'success');
  };

  const exportAppointments = () => {
    const headers = ['ID', 'Operativo', 'Fecha', 'Hora Inicio', 'Hora Fin', 'Paciente', 'Teléfono', 'RUT', 'Servicio', 'Profesional', 'Estado', 'Creado Por', 'Fecha Creación', 'Observaciones', 'Notas Clínicas'];
    const rows = operativeAppointments.map(a => [
      `"${a.id}"`,
      `"${activeOperative?.name || ''}"`,
      `"${a.date}"`,
      `"${a.startTime}"`,
      `"${a.endTime}"`,
      `"${a.patientName}"`,
      `"${a.patientPhone}"`,
      `"${a.patientRut || ''}"`,
      `"${a.serviceName}"`,
      `"${a.professionalName}"`,
      `"${a.status}"`,
      `"${a.createdByUserName}"`,
      `"${a.createdAt}"`,
      `"${(a.observations || '').replace(/"/g, '""')}"`,
      `"${(a.attentionNotes || '').replace(/"/g, '""')}"`
    ]);

    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    downloadCSV(csv, `Reservas_Operativo_${activeOperative?.date.replace(/\s+/g, '_')}.csv`);
  };

  const exportPatients = () => {
    if (!data) return;
    const headers = ['ID', 'Nombre', 'Apellido', 'Teléfono', 'RUT', 'Edad', 'Correo', 'Consentimiento', 'Observaciones', 'Fecha Registro'];
    const rows = data.patients.map(p => [
      `"${p.id}"`,
      `"${p.name}"`,
      `"${p.surname}"`,
      `"${p.phone}"`,
      `"${p.rut || ''}"`,
      `"${p.age || ''}"`,
      `"${p.email || ''}"`,
      `"${p.dataConsent ? 'Sí' : 'No'}"`,
      `"${(p.observations || '').replace(/"/g, '""')}"`,
      `"${p.createdAt}"`
    ]);

    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    downloadCSV(csv, `Pacientes_Operativo_Social_IBM.csv`);
  };

  const exportProfessionalsReport = () => {
    const headers = ['ID', 'Profesional', 'Especialidad', 'Estado', 'Teléfono', 'Email', 'Capacidad Bloques', 'Pacientes Asignados', 'Atendidos', 'En Atención', 'Pendientes', 'Porcentaje Ocupación'];
    const rows = profStats.map(item => [
      `"${item.prof.id}"`,
      `"${item.prof.name} ${item.prof.surname}"`,
      `"${item.prof.specialty}"`,
      `"${item.prof.active ? 'Activo' : 'Inactivo'}"`,
      `"${item.prof.phone || ''}"`,
      `"${item.prof.email || ''}"`,
      `"${item.capacity}"`,
      `"${item.total}"`,
      `"${item.attended}"`,
      `"${item.inProgress}"`,
      `"${item.waiting}"`,
      `"${item.occupancy}%"`
    ]);

    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    downloadCSV(csv, `Rendimiento_Profesionales_IBM.csv`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight font-['Cabinet_Grotesk',sans-serif]">
            Estadísticas y Capacidad Operativa
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Análisis de ocupación, rendimiento por especialidad y exportación para reportes oficiales
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportAppointments}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar Reservas (CSV)</span>
          </button>

          <button
            onClick={exportPatients}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Exportar Pacientes</span>
          </button>

          <button
            onClick={exportProfessionalsReport}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Reporte Profesionales</span>
          </button>
        </div>
      </div>

      {/* Capacity Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block uppercase">Capacidad Máxima Teórica</span>
          <span className="text-3xl font-black text-slate-900 font-mono tabular-nums mt-1 block">
            {totalTheoreticalCapacity}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {activeProfs.length} profesionales × {blocksPerProf} bloques
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block uppercase">Cupos Asignados</span>
          <span className="text-3xl font-black text-amber-600 font-mono tabular-nums mt-1 block">
            {activeBookings.length}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {totalTheoreticalCapacity > 0 ? Math.round((activeBookings.length / totalTheoreticalCapacity) * 100) : 0}% de ocupación
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block uppercase">Atenciones Finalizadas</span>
          <span className="text-3xl font-black text-emerald-600 font-mono tabular-nums mt-1 block">
            {atendidos.length}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {activeBookings.length > 0 ? Math.round((atendidos.length / activeBookings.length) * 100) : 0}% de avance
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block uppercase">Cupos Libres Restantes</span>
          <span className="text-3xl font-black text-blue-600 font-mono tabular-nums mt-1 block">
            {Math.max(0, totalTheoreticalCapacity - activeBookings.length)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Disponibles para nuevas reservas
          </span>
        </div>
      </div>

      {/* Services Performance Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">
            Rendimiento y Ocupación por Servicio
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 uppercase text-[11px] tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Servicio</th>
                <th className="py-3 px-4">Profesionales</th>
                <th className="py-3 px-4">Capacidad Total</th>
                <th className="py-3 px-4">Reservados</th>
                <th className="py-3 px-4">Atendidos</th>
                <th className="py-3 px-4">En Atención</th>
                <th className="py-3 px-4">Pendientes</th>
                <th className="py-3 px-4">Tasa de Ocupación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {serviceStats.map(item => (
                <tr key={item.service.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.service.color }} />
                    <span>{item.service.name}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{item.profsCount}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">{item.capacity} cupos</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{item.total}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">{item.attended}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-blue-700">{item.inProgress}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-amber-700">{item.waiting}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-full bg-amber-500 rounded-full" 
                          style={{ width: `${Math.min(100, item.occupancy)}%` }} 
                        />
                      </div>
                      <span className="font-mono text-slate-600 font-semibold">{item.occupancy}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Professionals Individual Load Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">
            Carga Individual por Profesional
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 uppercase text-[11px] tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Profesional</th>
                <th className="py-3 px-4">Especialidad</th>
                <th className="py-3 px-4">Capacidad Bloques</th>
                <th className="py-3 px-4">Pacientes Asignados</th>
                <th className="py-3 px-4">Atendidos</th>
                <th className="py-3 px-4">En Atención</th>
                <th className="py-3 px-4">Pendientes</th>
                <th className="py-3 px-4">% Ocupación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {profStats.map(item => (
                <tr key={item.prof.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {item.prof.name} {item.prof.surname}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{item.prof.specialty}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">{item.capacity}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{item.total}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">{item.attended}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-blue-700">{item.inProgress}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-amber-700">{item.waiting}</td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">{item.occupancy}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
