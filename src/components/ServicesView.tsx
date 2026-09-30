import React, { useState } from 'react';
import { 
  HeartHandshake, 
  Plus, 
  Edit, 
  Power, 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Sparkles 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import type { Service } from '../types';

export const ServicesView: React.FC = () => {
  const { data, currentUser, addToast } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#2563eb'
  });

  const presetColors = [
    '#0284c7', // Sky
    '#7c3aed', // Violet
    '#059669', // Emerald
    '#dc2626', // Red
    '#d97706', // Amber
    '#2563eb', // Blue
    '#16a34a', // Green
    '#ea580c', // Orange
    '#db2777', // Pink
    '#4f46e5', // Indigo
    '#9333ea', // Purple
    '#0d9488'  // Teal
  ];

  const handleOpenCreate = () => {
    setEditingService(null);
    setFormData({
      name: '',
      description: '',
      color: presetColors[Math.floor(Math.random() * presetColors.length)]
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (srv: Service) => {
    setEditingService(srv);
    setFormData({
      name: srv.name,
      description: srv.description || '',
      color: srv.color
    });
    setIsModalOpen(true);
  };

  const handleToggleActive = async (srv: Service) => {
    const nextState = !srv.active;
    try {
      await api.updateService(srv.id, {
        active: nextState,
        userId: currentUser.id,
        userName: currentUser.name
      });
      addToast(
        nextState ? `Servicio ${srv.name} reactivado` : `Servicio ${srv.name} desactivado para nuevas reservas`,
        nextState ? 'success' : 'warning'
      );
    } catch (err: any) {
      addToast(err.message || 'Error al actualizar servicio', 'error');
    }
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      addToast('El nombre del servicio es obligatorio', 'error');
      return;
    }

    try {
      if (editingService) {
        await api.updateService(editingService.id, {
          name: formData.name.trim(),
          description: formData.description.trim(),
          color: formData.color,
          userId: currentUser.id,
          userName: currentUser.name
        });
        addToast('Servicio actualizado con éxito', 'success');
      } else {
        await api.createService({
          name: formData.name.trim(),
          description: formData.description.trim(),
          color: formData.color,
          userId: currentUser.id,
          userName: currentUser.name
        });
        addToast('Servicio creado en tiempo real', 'success');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      addToast(err.message || 'Error al guardar servicio', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight font-['Cabinet_Grotesk',sans-serif]">
            Servicios del Operativo Social
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configuración dinámica de especialidades comunitarias y áreas de atención
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-slate-950" />
          <span>+ Agregar Nuevo Servicio</span>
        </button>
      </div>

      {/* Grid of Services */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.services.map(srv => {
          const profsInService = data.professionals.filter(p => p.active && p.serviceIds.includes(srv.id));

          return (
            <div 
              key={srv.id}
              className={`bg-white rounded-2xl border p-5 transition-all shadow-xs flex flex-col justify-between ${
                srv.active ? 'border-slate-200 hover:border-slate-300' : 'border-slate-200 bg-slate-50/70 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs" 
                      style={{ backgroundColor: srv.color }} 
                    />
                    <h3 className="font-extrabold text-slate-900 text-base">
                      {srv.name}
                    </h3>
                  </div>

                  <button
                    onClick={() => handleToggleActive(srv)}
                    className={`p-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      srv.active 
                        ? 'text-emerald-700 bg-emerald-50 hover:bg-rose-50 hover:text-rose-700' 
                        : 'text-slate-400 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700'
                    }`}
                    title={srv.active ? 'Desactivar servicio' : 'Reactivar servicio'}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-500 min-h-[32px] line-clamp-2 mb-3">
                  {srv.description || 'Sin descripción detallada ingresada.'}
                </p>

                <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-4">
                  <Users className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="font-medium">
                    {profsInService.length} profesional{profsInService.length === 1 ? '' : 'es'} asignado{profsInService.length === 1 ? '' : 's'}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  srv.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                }`}>
                  {srv.active ? 'Activo para reservas' : 'Inactivo'}
                </span>

                <button
                  onClick={() => handleOpenEdit(srv)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Editar</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* Modal create / edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingService ? 'Editar Servicio' : 'Agregar Nuevo Servicio'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveService} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nombre del Servicio *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl"
                  placeholder="Ej. Nutrición y Dietética"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Descripción</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl"
                  placeholder="Orientación alimentaria, evaluación nutricional..."
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">Color Identificador</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {presetColors.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        formData.color === color ? 'scale-125 border-slate-900 shadow-sm' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-8 h-8 rounded border cursor-pointer"
                  />
                  <span className="font-mono text-slate-500">{formData.color}</span>
                </div>
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
                  Guardar Servicio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
