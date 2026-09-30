import React, { useState, useMemo } from 'react';
import { 
  UserCheck, 
  UserPlus, 
  Edit, 
  Power, 
  Mail, 
  Phone, 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Shield,
  Search,
  Trash2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import type { Professional } from '../types';

export const ProfessionalsView: React.FC = () => {
  const { data, activeOperative, currentUser, addToast } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProf, setEditingProf] = useState<Professional | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    specialty: '',
    phone: '',
    email: '',
    serviceIds: [] as string[],
    availabilityNote: ''
  });

  const filteredProfessionals = useMemo(() => {
    if (!data) return [];
    if (!searchTerm.trim()) return data.professionals;

    const term = searchTerm.toLowerCase().trim();
    return data.professionals.filter(p => 
      p.name.toLowerCase().includes(term) ||
      p.surname.toLowerCase().includes(term) ||
      p.specialty.toLowerCase().includes(term) ||
      (p.email && p.email.toLowerCase().includes(term))
    );
  }, [data, searchTerm]);

  // Compute metrics per professional in current operative
  const professionalMetrics = useMemo(() => {
    if (!data || !activeOperative) return new Map();
    const map = new Map<string, { atendidos: number; enAtencion: number; esperando: number; total: number }>();

    data.professionals.forEach(p => {
      const profApts = data.appointments.filter(
        a => a.operativeId === activeOperative.id && a.professionalId === p.id && a.status !== 'Cancelado'
      );
      const atendidos = profApts.filter(a => a.status === 'Atendido').length;
      const enAtencion = profApts.filter(a => a.status === 'En atención').length;
      const esperando = profApts.filter(a => a.status === 'Esperando' || a.status === 'Reservado' || a.status === 'Confirmado').length;
      map.set(p.id, { atendidos, enAtencion, esperando, total: profApts.length });
    });

    return map;
  }, [data, activeOperative]);

  const handleOpenCreate = () => {
    setEditingProf(null);
    setFormData({
      name: '',
      surname: '',
      specialty: '',
      phone: '+56 9 ',
      email: '',
      serviceIds: data?.services[0] ? [data.services[0].id] : [],
      availabilityNote: 'Disponible durante todo el operativo'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (prof: Professional) => {
    setEditingProf(prof);
    setFormData({
      name: prof.name,
      surname: prof.surname,
      specialty: prof.specialty,
      phone: prof.phone || '',
      email: prof.email || '',
      serviceIds: prof.serviceIds || [],
      availabilityNote: prof.availabilityNote || ''
    });
    setIsModalOpen(true);
  };

  const handleToggleActive = async (prof: Professional) => {
    const nextState = !prof.active;
    try {
      await api.updateProfessional(prof.id, {
        active: nextState,
        userId: currentUser.id,
        userName: currentUser.name
      });
      addToast(
        nextState 
          ? `Profesional ${prof.name} ${prof.surname} reactivado` 
          : `Profesional ${prof.name} ${prof.surname} desactivado para nuevas reservas`,
        nextState ? 'success' : 'warning'
      );
    } catch (err: any) {
      addToast(err.message || 'Error al actualizar estado', 'error');
    }
  };

  const handleDeleteProfessional = async (prof: Professional) => {
    try {
      await api.deleteProfessional(prof.id, currentUser.id, currentUser.name);
      addToast(`Puesto ${prof.specialty || prof.name} eliminado`, 'info');
    } catch (err: any) {
      addToast(err.message || 'Error al eliminar profesional', 'error');
    }
  };

  const handleSaveProfessional = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.surname.trim() || !formData.specialty.trim() || !formData.serviceIds.length) {
      addToast('Nombre, apellido, especialidad y al menos un servicio son obligatorios', 'error');
      return;
    }

    try {
      if (editingProf) {
        await api.updateProfessional(editingProf.id, {
          ...formData,
          userId: currentUser.id,
          userName: currentUser.name
        });
        addToast('Profesional actualizado con éxito', 'success');
      } else {
        await api.createProfessional({
          ...formData,
          userId: currentUser.id,
          userName: currentUser.name
        });
        addToast('Profesional creado y habilitado en tiempo real', 'success');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      addToast(err.message || 'Error al guardar profesional', 'error');
    }
  };

  const toggleServiceCheckbox = (serviceId: string) => {
    setFormData(prev => {
      const exists = prev.serviceIds.includes(serviceId);
      if (exists) {
        return { ...prev, serviceIds: prev.serviceIds.filter(id => id !== serviceId) };
      } else {
        return { ...prev, serviceIds: [...prev.serviceIds, serviceId] };
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight font-['Cabinet_Grotesk',sans-serif]">
            Gestión de Profesionales
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Administración de especialistas, servicios asignados y disponibilidad en tiempo real
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition-all self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4 text-slate-950" />
          <span>+ Agregar Profesional</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar profesional por nombre, especialidad o correo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
        </div>
      </div>

      {/* Grid of Professionals */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProfessionals.map(prof => {
          const metrics = professionalMetrics.get(prof.id) || { atendidos: 0, enAtencion: 0, esperando: 0, total: 0 };
          const assignedServices = data?.services.filter(s => prof.serviceIds.includes(s.id)) || [];

          return (
            <div 
              key={prof.id} 
              className={`bg-white rounded-2xl border p-5 transition-all shadow-xs flex flex-col justify-between ${
                prof.active ? 'border-slate-200 hover:border-slate-300' : 'border-slate-200 bg-slate-50/70 opacity-60'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-extrabold text-slate-900 text-base">
                        {prof.name} {prof.surname}
                      </h3>
                      {!prof.active && (
                        <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded">
                          Inactivo
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-amber-700 mt-0.5">
                      {prof.specialty}
                    </p>
                  </div>

                  {/* Toggle Active Button */}
                  <button
                    onClick={() => handleToggleActive(prof)}
                    className={`p-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      prof.active 
                        ? 'text-emerald-700 bg-emerald-50 hover:bg-rose-50 hover:text-rose-700' 
                        : 'text-slate-400 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700'
                    }`}
                    title={prof.active ? 'Desactivar profesional' : 'Reactivar profesional'}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                </div>

                {/* Assigned Services */}
                <div className="mb-4">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1.5">
                    Servicios Asignados
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {assignedServices.map(srv => (
                      <span
                        key={srv.id}
                        className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border"
                        style={{
                          backgroundColor: `${srv.color}10`,
                          borderColor: `${srv.color}30`,
                          color: '#0f172a'
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: srv.color }} />
                        {srv.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Contact info */}
                <div className="text-xs text-slate-600 space-y-1 mb-4 border-t border-slate-100 pt-3">
                  {prof.email && (
                    <div className="flex items-center gap-1.5 text-[11px] truncate">
                      <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{prof.email}</span>
                    </div>
                  )}
                  {prof.phone && (
                    <div className="flex items-center gap-1.5 text-[11px] font-mono">
                      <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{prof.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Metrics & Actions Footer */}
              <div className="border-t border-slate-100 pt-3">
                <div className="grid grid-cols-4 gap-1 text-center mb-3">
                  <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                    <span className="text-[9px] text-slate-400 block uppercase">Total</span>
                    <span className="font-bold text-xs font-mono">{metrics.total}</span>
                  </div>
                  <div className="bg-emerald-50 p-1.5 rounded-lg border border-emerald-100">
                    <span className="text-[9px] text-emerald-600 block uppercase">Atend.</span>
                    <span className="font-bold text-xs font-mono text-emerald-700">{metrics.atendidos}</span>
                  </div>
                  <div className="bg-blue-50 p-1.5 rounded-lg border border-blue-100">
                    <span className="text-[9px] text-blue-600 block uppercase">Curso</span>
                    <span className="font-bold text-xs font-mono text-blue-700">{metrics.enAtencion}</span>
                  </div>
                  <div className="bg-amber-50 p-1.5 rounded-lg border border-amber-100">
                    <span className="text-[9px] text-amber-600 block uppercase">Pend.</span>
                    <span className="font-bold text-xs font-mono text-amber-700">{metrics.esperando}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleOpenEdit(prof)}
                    className="flex-1 py-1.5 px-3 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => handleDeleteProfessional(prof)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-slate-200"
                    title="Eliminar profesional"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Edit / Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingProf ? 'Editar Profesional' : 'Agregar Nuevo Profesional'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveProfessional} className="p-5 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nombre *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                    placeholder="Ej. María"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Apellido *</label>
                  <input
                    type="text"
                    required
                    value={formData.surname}
                    onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                    placeholder="Ej. González"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Especialidad / Título *</label>
                <input
                  type="text"
                  required
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl"
                  placeholder="Ej. Psicóloga Clínica, Enfermero Universitario..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Teléfono</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-mono"
                    placeholder="+56 9 ..."
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Correo Electrónico (para login)</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                    placeholder="maria.gonzalez@ibm.cl"
                  />
                </div>
              </div>

              {/* Service Assignment (Multi-Service supported!) */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">
                  Servicios Asignados (puede pertenecer a más de uno) *
                </label>
                <div className="grid grid-cols-2 gap-2 border border-slate-200 p-3 rounded-xl max-h-40 overflow-y-auto">
                  {data?.services.map(srv => {
                    const isChecked = formData.serviceIds.includes(srv.id);
                    return (
                      <label 
                        key={srv.id}
                        className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition-colors ${
                          isChecked ? 'bg-amber-50 font-bold text-slate-900' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleServiceCheckbox(srv.id)}
                          className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                        />
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: srv.color }} />
                        <span className="truncate">{srv.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nota de Disponibilidad</label>
                <input
                  type="text"
                  value={formData.availabilityNote}
                  onChange={(e) => setFormData({ ...formData, availabilityNote: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl"
                  placeholder="Ej. Disponible de 11:00 a 15:00 hrs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 font-semibold text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold bg-amber-500 text-slate-950 rounded-xl shadow-xs"
                >
                  Guardar Profesional
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
