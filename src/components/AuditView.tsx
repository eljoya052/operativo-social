import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Clock, 
  User, 
  FileText, 
  Filter 
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AuditView: React.FC = () => {
  const { data } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  const auditLogs = useMemo(() => {
    if (!data) return [];
    return data.auditLogs;
  }, [data]);

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchUser = log.userName.toLowerCase().includes(term);
        const matchAction = log.action.toLowerCase().includes(term);
        const matchDetails = log.details.toLowerCase().includes(term);
        if (!matchUser && !matchAction && !matchDetails) return false;
      }

      if (entityFilter && log.entityType !== entityFilter) return false;

      return true;
    });
  }, [auditLogs, searchTerm, entityFilter]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight font-['Cabinet_Grotesk',sans-serif]">
            Registro de Auditoría y Seguridad
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Trazabilidad de todas las acciones: reservas, cambios de estado, profesionales y servicios
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
            {auditLogs.length} eventos registrados
          </span>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por usuario, acción o detalle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
        </div>

        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50 bg-white"
        >
          <option value="">Todas las entidades</option>
          <option value="appointment">Reservas / Citas</option>
          <option value="patient">Pacientes</option>
          <option value="professional">Profesionales</option>
          <option value="service">Servicios</option>
          <option value="operative">Operativos</option>
          <option value="waiting_list">Lista de espera</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">
            Eventos Recientes
          </h3>
          <span className="text-xs text-slate-400">Orden cronológico</span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No hay registros de auditoría que coincidan con la búsqueda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 uppercase text-[11px] tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Fecha y Hora</th>
                  <th className="py-3 px-4">Usuario Responsable</th>
                  <th className="py-3 px-4">Acción</th>
                  <th className="py-3 px-4">Entidad</th>
                  <th className="py-3 px-4">Detalles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredLogs.map(log => {
                  const dateObj = new Date(log.timestamp);
                  const formattedDate = dateObj.toLocaleDateString('es-CL');
                  const formattedTime = dateObj.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

                  return (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                        <span className="font-semibold text-slate-900">{formattedTime}</span>
                        <span className="text-[10px] text-slate-400 block">{formattedDate}</span>
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                        {log.userName}
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-800">
                          {log.action}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 uppercase">
                        {log.entityType}
                      </td>

                      <td className="py-3 px-4 text-slate-700 max-w-md">
                        {log.details}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
