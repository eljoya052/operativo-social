import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  UserPlus, 
  Edit, 
  Calendar, 
  Phone, 
  Clock, 
  FileText, 
  CheckCircle2, 
  AlertTriangle,
  History,
  X,
  Trash2,
  FileSpreadsheet
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { exportOperativeToExcel } from '../utils/exportToExcel';
import type { Patient, Appointment } from '../types';

export const PatientsView: React.FC = () => {
  const { data, activeOperative, currentUser, addToast } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientForHistory, setSelectedPatientForHistory] = useState<Patient | null>(null);

  // Patient deletion confirmation states
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit / Create Patient state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    phone: '',
    rut: '',
    age: '',
    email: '',
    observations: '',
    dataConsent: true
  });

  const filteredPatients = useMemo(() => {
    if (!data) return [];
    if (!searchTerm.trim()) return data.patients;

    const term = searchTerm.toLowerCase().trim();
    return data.patients.filter(p => 
      p.name.toLowerCase().includes(term) ||
      p.surname.toLowerCase().includes(term) ||
      p.phone.includes(term) ||
      (p.rut && p.rut.toLowerCase().includes(term)) ||
      (p.email && p.email.toLowerCase().includes(term))
    );
  }, [data, searchTerm]);

  // Appointments for the selected patient
  const patientAppointments = useMemo(() => {
    if (!data || !selectedPatientForHistory) return [];
    return data.appointments.filter(a => a.patientId === selectedPatientForHistory.id);
  }, [data, selectedPatientForHistory]);

  const handleOpenCreate = () => {
    setEditingPatient(null);
    setFormData({
      name: '',
      surname: '',
      phone: '+56 9 ',
      rut: '',
      age: '',
      email: '',
      observations: '',
      dataConsent: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (patient: Patient) => {
    setEditingPatient(patient);
    setFormData({
      name: patient.name,
      surname: patient.surname,
      phone: patient.phone,
      rut: patient.rut || '',
      age: patient.age ? String(patient.age) : '',
      email: patient.email || '',
      observations: patient.observations || '',
      dataConsent: patient.dataConsent ?? true
    });
    setIsModalOpen(true);
  };

  const handleDeletePatient = (patient: Patient) => {
    setPatientToDelete(patient);
  };

  const confirmDeletePatient = async () => {
    if (!patientToDelete) return;
    setIsDeleting(true);
    try {
      await api.deletePatient(patientToDelete.id, currentUser.id, currentUser.name);
      addToast(`Paciente ${patientToDelete.name} ${patientToDelete.surname} eliminado exitosamente`, 'info');
      setPatientToDelete(null);
    } catch (err: any) {
      addToast(err.message || 'Error al eliminar paciente', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmClearAllPatients = async () => {
    setIsDeleting(true);
    try {
      await api.clearOperationalData(currentUser.id, currentUser.name);
      addToast('Se han eliminado todos los pacientes y citas correctamente', 'success');
      setIsClearAllModalOpen(false);
    } catch (err: any) {
      addToast(err.message || 'Error al vaciar pacientes', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSavePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.surname.trim() || !formData.phone.trim()) {
      addToast('Nombre, apellido y teléfono son obligatorios', 'error');
      return;
    }

    try {
      if (editingPatient) {
        await api.updatePatient(editingPatient.id, {
          ...formData,
          age: formData.age ? Number(formData.age) : undefined,
          userId: currentUser.id,
          userName: currentUser.name
        });
        addToast('Paciente actualizado correctamente', 'success');
      } else {
        await api.createPatient({
          ...formData,
          age: formData.age ? Number(formData.age) : undefined,
          userId: currentUser.id,
          userName: currentUser.name
        });
        addToast('Paciente registrado con éxito', 'success');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      addToast(err.message || 'Error al guardar paciente', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight font-['Cabinet_Grotesk',sans-serif]">
            Directorio de Pacientes
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro, historial de atenciones y gestión de datos de beneficiarios
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {data && data.patients.length > 0 && (
            <button
              onClick={() => setIsClearAllModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-xs bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-all shadow-xs"
              title="Borrar todos los pacientes registrados y dejar en cero"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Vaciar Pacientes</span>
            </button>
          )}

          <button
            onClick={() => {
              if (!data) return;
              try {
                exportOperativeToExcel(data, activeOperative);
                addToast('Planilla Excel descargada exitosamente', 'success');
              } catch (err) {
                addToast('Error al generar Excel', 'error');
              }
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all"
            title="Descargar todos los pacientes y atenciones en Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-white" />
            <span>Descargar Excel</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition-all"
          >
            <UserPlus className="w-4 h-4 text-slate-950" />
            <span>+ Registrar Nuevo Paciente</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar paciente por nombre, apellido, teléfono o RUT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
        </div>
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">
            Pacientes Registrados ({filteredPatients.length})
          </h3>
          <span className="text-xs text-slate-500">
            Total en la base de datos
          </span>
        </div>

        {filteredPatients.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No se encontraron pacientes registrados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 uppercase text-[11px] tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Nombre y Apellido</th>
                  <th className="py-3 px-4">Teléfono</th>
                  <th className="py-3 px-4">RUT</th>
                  <th className="py-3 px-4">Edad</th>
                  <th className="py-3 px-4">Observaciones</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPatients.map(pat => {
                  return (
                    <tr key={pat.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{pat.name} {pat.surname}</div>
                        {pat.email && <div className="text-[11px] text-slate-400">{pat.email}</div>}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-700 whitespace-nowrap">
                        {pat.phone}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                        {pat.rut || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {pat.age ? `${pat.age} años` : '—'}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs truncate text-slate-600">
                        {pat.observations || 'Sin observaciones'}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedPatientForHistory(pat)}
                            className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors flex items-center gap-1"
                            title="Ver historial de citas"
                          >
                            <History className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-semibold">Historial</span>
                          </button>
                          <button
                            onClick={() => handleOpenEdit(pat)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar paciente"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePatient(pat)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Eliminar paciente"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* Patient History Modal */}
      {selectedPatientForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Historial del Paciente</h3>
                <p className="text-xs text-slate-300">
                  {selectedPatientForHistory.name} {selectedPatientForHistory.surname} · {selectedPatientForHistory.phone}
                </p>
              </div>
              <button 
                onClick={() => setSelectedPatientForHistory(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {patientAppointments.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Este paciente aún no tiene atenciones registradas.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {patientAppointments.map(apt => (
                    <div key={apt.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs">
                          {apt.serviceName}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          apt.status === 'Atendido' ? 'bg-emerald-100 text-emerald-800' :
                          apt.status === 'En atención' ? 'bg-blue-100 text-blue-800' :
                          apt.status === 'Esperando' ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {apt.status}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-600 flex items-center gap-3">
                        <span>👨‍⚕️ {apt.professionalName}</span>
                        <span>⏰ {apt.date} a las {apt.startTime} hrs.</span>
                      </div>

                      {apt.attentionNotes && (
                        <div className="text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded-lg mt-1">
                          <strong>Nota de atención:</strong> {apt.attentionNotes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
              <button
                onClick={() => setSelectedPatientForHistory(null)}
                className="px-4 py-1.5 text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Create Patient Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingPatient ? 'Editar Datos del Paciente' : 'Registrar Nuevo Paciente'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSavePatient} className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Nombre *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Apellido *</label>
                  <input
                    type="text"
                    required
                    value={formData.surname}
                    onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Teléfono *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">RUT (opcional)</label>
                  <input
                    type="text"
                    value={formData.rut}
                    onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Edad (opcional)</label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Correo (opcional)</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Observaciones</label>
                <textarea
                  rows={2}
                  value={formData.observations}
                  onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl"
                  placeholder="Condiciones médicas, notas especiales..."
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="consent"
                  checked={formData.dataConsent}
                  onChange={(e) => setFormData({ ...formData, dataConsent: e.target.checked })}
                  className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="consent" className="text-[11px] text-slate-600">
                  Consentimiento de tratamiento de datos personales para la atención
                </label>
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
                  Guardar Paciente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmación Eliminar Un Paciente */}
      {patientToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4 border border-slate-200">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <Trash2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 font-['Cabinet_Grotesk',sans-serif]">
                ¿Eliminar este paciente?
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Se eliminará el registro de <strong>{patientToDelete.name} {patientToDelete.surname}</strong> y todas las atenciones asociadas.
              </p>
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={() => setPatientToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeletePatient}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition-colors"
              >
                {isDeleting ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmación Vaciar Todos los Pacientes */}
      {isClearAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 text-center space-y-4 border border-slate-200">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 font-['Cabinet_Grotesk',sans-serif]">
                ¿Vaciar todos los pacientes?
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Esta acción eliminará a los <strong>{data?.patients.length} pacientes</strong> registrados y todas sus reservas, dejando el sistema completamente en cero para el operativo.
              </p>
              <p className="text-[11px] text-amber-700 font-semibold bg-amber-50 p-2 rounded-xl mt-3 border border-amber-200">
                Tip: Si necesitas guardar los datos antes de vaciar, puedes hacer clic en "Descargar Excel".
              </p>
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={() => setIsClearAllModalOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmClearAllPatients}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition-colors"
              >
                {isDeleting ? 'Vaciando...' : 'Sí, Vaciar Todo'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
