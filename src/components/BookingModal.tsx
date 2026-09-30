import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Search, 
  UserPlus, 
  UserCheck, 
  AlertTriangle, 
  Check, 
  Clock, 
  Calendar, 
  Sparkles, 
  ShieldAlert, 
  Phone, 
  FileText,
  CheckCircle2,
  Edit3
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import type { Patient, Service, Professional, Appointment } from '../types';

interface BookingModalProps {
  initialServiceId?: string;
  initialProfessionalId?: string;
  initialStartTime?: string;
  initialPatientId?: string;
  onClose: () => void;
  onSuccess: (appointment: Appointment) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  initialServiceId,
  initialProfessionalId,
  initialStartTime,
  initialPatientId,
  onClose,
  onSuccess
}) => {
  const { data, activeOperative, currentUser, generateTimeSlots, addToast } = useApp();

  // Mode: existing patient search vs new patient
  const [patientMode, setPatientMode] = useState<'search' | 'new'>(initialPatientId ? 'search' : 'new');
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // New patient form fields
  const [newPatient, setNewPatient] = useState({
    name: '',
    surname: '',
    phone: '+56 9 ',
    rut: '',
    age: '',
    observations: '',
    dataConsent: true
  });

  // Duplicate warning state
  const [duplicateWarning, setDuplicateWarning] = useState<Patient | null>(null);

  // Booking selections
  const [selectedServiceId, setSelectedServiceId] = useState<string>(initialServiceId || '');
  
  // Schedule Mode: 'auto' (pick from free blocks) vs 'manual' (type or pick exact hour)
  const [scheduleMode, setScheduleMode] = useState<'auto' | 'manual'>('auto');
  const [manualTime, setManualTime] = useState<string>(initialStartTime || '11:00');
  const [selectedSlot, setSelectedSlot] = useState<string>(initialStartTime || '');
  
  const [observations, setObservations] = useState('');

  // State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);

  // If initialPatientId is passed, select it
  useEffect(() => {
    if (initialPatientId && data) {
      const p = data.patients.find(pat => pat.id === initialPatientId);
      if (p) {
        setSelectedPatient(p);
        setPatientMode('search');
      }
    }
  }, [initialPatientId, data]);

  // If initialServiceId is passed, default it
  useEffect(() => {
    if (initialServiceId) setSelectedServiceId(initialServiceId);
  }, [initialServiceId]);

  // Live duplicate detection when typing phone or name
  useEffect(() => {
    if (patientMode !== 'new' || !data) {
      setDuplicateWarning(null);
      return;
    }

    const cleanPhone = newPatient.phone.replace(/[^\d]/g, '');
    const cleanName = newPatient.name.trim().toLowerCase();
    const cleanSurname = newPatient.surname.trim().toLowerCase();

    if (cleanPhone.length >= 8 || (cleanName.length >= 3 && cleanSurname.length >= 3)) {
      const match = data.patients.find(p => {
        const pPhone = p.phone.replace(/[^\d]/g, '');
        const phoneMatch = cleanPhone.length >= 8 && pPhone && (pPhone.includes(cleanPhone) || cleanPhone.includes(pPhone));
        const nameMatch = cleanName.length >= 3 && cleanSurname.length >= 3 &&
          p.name.toLowerCase().includes(cleanName) &&
          p.surname.toLowerCase().includes(cleanSurname);
        return phoneMatch || nameMatch;
      });

      setDuplicateWarning(match || null);
    } else {
      setDuplicateWarning(null);
    }
  }, [newPatient.phone, newPatient.name, newPatient.surname, patientMode, data]);

  // Filtered patients for search mode
  const filteredPatients = useMemo(() => {
    if (!data || !patientSearchTerm.trim()) return [];
    const term = patientSearchTerm.toLowerCase().trim();
    return data.patients.filter(p => 
      p.name.toLowerCase().includes(term) ||
      p.surname.toLowerCase().includes(term) ||
      p.phone.includes(term) ||
      (p.rut && p.rut.toLowerCase().includes(term))
    ).slice(0, 6);
  }, [data, patientSearchTerm]);

  // Active services
  const activeServices = useMemo(() => {
    if (!data) return [];
    return data.services.filter(s => s.active);
  }, [data]);

  // Auto pick first service if none selected
  useEffect(() => {
    if (!selectedServiceId && activeServices.length > 0) {
      setSelectedServiceId(activeServices[0].id);
    }
  }, [activeServices, selectedServiceId]);

  // Selected service object
  const currentService = useMemo(() => {
    return activeServices.find(s => s.id === selectedServiceId) || null;
  }, [activeServices, selectedServiceId]);

  // All time slots configured for operative
  const allTimeSlots = useMemo(() => {
    return generateTimeSlots(
      activeOperative?.startTime || '11:00',
      activeOperative?.endTime || '17:00',
      activeOperative?.slotDurationMinutes || 20
    );
  }, [generateTimeSlots, activeOperative]);

  // Appointments for the active operative and date that are not cancelled
  const operativeAppointments = useMemo(() => {
    if (!data || !activeOperative) return [];
    return data.appointments.filter(
      a => a.operativeId === activeOperative.id && 
           a.date === activeOperative.date && 
           a.status !== 'Cancelado'
    );
  }, [data, activeOperative]);

  // Set of occupied hours for the selected service
  const occupiedHoursForService = useMemo(() => {
    if (!selectedServiceId) return new Set<string>();
    const hours = new Set<string>();
    operativeAppointments.forEach(apt => {
      if (apt.serviceId === selectedServiceId) {
        hours.add(apt.startTime);
      }
    });
    return hours;
  }, [selectedServiceId, operativeAppointments]);

  // FREE TIME SLOTS: Completely removes any hour that is already taken!
  // If 11:00 is taken, 11:00 is eliminated from the list!
  const freeTimeSlots = useMemo(() => {
    return allTimeSlots.filter(slot => !occupiedHoursForService.has(slot));
  }, [allTimeSlots, occupiedHoursForService]);

  // In auto mode, if selectedSlot is now occupied, clear it
  useEffect(() => {
    if (scheduleMode === 'auto' && selectedSlot && occupiedHoursForService.has(selectedSlot)) {
      setSelectedSlot('');
    }
  }, [scheduleMode, selectedSlot, occupiedHoursForService]);

  // Check if manually typed hour is occupied
  const isManualTimeOccupied = useMemo(() => {
    if (!manualTime) return false;
    return occupiedHoursForService.has(manualTime);
  }, [manualTime, occupiedHoursForService]);

  // When manualTime changes in manual mode, update selectedSlot if free
  useEffect(() => {
    if (scheduleMode === 'manual') {
      if (manualTime && !isManualTimeOccupied) {
        setSelectedSlot(manualTime);
      } else {
        setSelectedSlot('');
      }
    }
  }, [scheduleMode, manualTime, isManualTimeOccupied]);

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setConflictError(null);

    if (!activeOperative) {
      setConflictError('No hay un operativo activo seleccionado');
      return;
    }

    if (!selectedServiceId) {
      setConflictError('Debe seleccionar un servicio o profesión');
      return;
    }

    const finalSlot = scheduleMode === 'manual' ? manualTime : selectedSlot;

    if (!finalSlot) {
      setConflictError('Debe ingresar o seleccionar un horario válido');
      return;
    }

    // Double check availability
    if (occupiedHoursForService.has(finalSlot)) {
      setConflictError(`El horario ${finalSlot} ya está ocupado para ${currentService?.name || 'este servicio'}. Seleccione otra hora.`);
      return;
    }

    setIsSubmitting(true);

    try {
      let patientId = selectedPatient?.id;

      // 1. If in new patient mode, register patient first
      if (patientMode === 'new') {
        if (!newPatient.name.trim() || !newPatient.surname.trim() || !newPatient.phone.trim()) {
          throw new Error('Nombre, apellido y teléfono son obligatorios');
        }

        const createdPatient = await api.createPatient({
          name: newPatient.name,
          surname: newPatient.surname,
          phone: newPatient.phone,
          rut: newPatient.rut || undefined,
          age: newPatient.age ? Number(newPatient.age) : undefined,
          observations: newPatient.observations || undefined,
          dataConsent: newPatient.dataConsent,
          userId: currentUser.id,
          userName: currentUser.name
        });

        patientId = createdPatient.id;
      }

      if (!patientId) {
        throw new Error('Debe seleccionar o registrar un paciente');
      }

      // 2. Find professional station for this service (uses profession name)
      const prof = data?.professionals.find(p => p.active && p.serviceIds.includes(selectedServiceId)) || data?.professionals[0];

      // 3. Create Appointment with concurrency & double-booking protection
      const newApt = await api.createAppointment({
        operativeId: activeOperative.id,
        patientId,
        serviceId: selectedServiceId,
        professionalId: prof?.id,
        autoAssign: true,
        date: activeOperative.date,
        startTime: finalSlot,
        observations: observations.trim() || undefined,
        userId: currentUser.id,
        userName: currentUser.name
      });

      addToast(`¡Reserva confirmada a las ${newApt.startTime} hrs para ${newApt.serviceName}!`, 'success');
      onSuccess(newApt);
    } catch (err: any) {
      console.error('Booking error:', err);
      setConflictError(err.message || 'Error al procesar la reserva. Intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add to Waiting List fallback
  const handleAddToWaitingList = async () => {
    if (!activeOperative || !selectedServiceId) return;

    try {
      let patientId = selectedPatient?.id;
      if (patientMode === 'new') {
        const p = await api.createPatient({
          name: newPatient.name,
          surname: newPatient.surname,
          phone: newPatient.phone,
          rut: newPatient.rut,
          observations: newPatient.observations,
          userId: currentUser.id,
          userName: currentUser.name
        });
        patientId = p.id;
      }

      if (!patientId) return;

      await api.addToWaitingList({
        operativeId: activeOperative.id,
        patientId,
        serviceId: selectedServiceId,
        priority: 'Media',
        observations: 'Agregado desde modal por falta de cupo inmediato',
        userId: currentUser.id,
        userName: currentUser.name
      });

      addToast('Paciente agregado a la lista de espera', 'info');
      onClose();
    } catch (err: any) {
      addToast(err.message || 'Error al agregar a lista de espera', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Modal Top Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div>
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">
              Operativo Social IBM · Temuco
            </span>
            <h2 className="text-lg font-black tracking-tight font-['Cabinet_Grotesk',sans-serif]">
              Nueva Reserva de Atención
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-6 text-slate-800 text-xs">
          
          {/* Conflict / General Error Banner */}
          {conflictError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-rose-800 text-xs">
              <ShieldAlert className="w-5 h-5 shrink-0 text-rose-600" />
              <div>
                <span className="font-bold">No fue posible completar la reserva:</span>
                <p className="text-[11px] mt-0.5">{conflictError}</p>
              </div>
            </div>
          )}

          {/* STEP 1: PACIENTE */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">1</span>
                <span>Identificación del Paciente</span>
              </label>

              {/* Mode Toggle */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setPatientMode('new');
                    setSelectedPatient(null);
                  }}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    patientMode === 'new'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5 inline mr-1" />
                  Nuevo Paciente
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPatientMode('search');
                  }}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    patientMode === 'search'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Search className="w-3.5 h-3.5 inline mr-1" />
                  Buscar Existente
                </button>
              </div>
            </div>

            {/* Existing Search Mode */}
            {patientMode === 'search' && (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Escriba nombre, apellido o teléfono del paciente..."
                    value={patientSearchTerm}
                    onChange={(e) => setPatientSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>

                {selectedPatient ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 text-xs block">
                        {selectedPatient.name} {selectedPatient.surname}
                      </span>
                      <span className="text-[11px] text-slate-600 font-mono">
                        {selectedPatient.phone} {selectedPatient.rut && `· RUT: ${selectedPatient.rut}`}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedPatient(null)}
                      className="text-xs text-rose-600 hover:underline font-semibold"
                    >
                      Cambiar
                    </button>
                  </div>
                ) : (
                  filteredPatients.length > 0 && (
                    <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-40 overflow-y-auto bg-white shadow-xs">
                      {filteredPatients.map(p => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setSelectedPatient(p);
                            setPatientSearchTerm('');
                          }}
                          className="p-2.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between"
                        >
                          <div>
                            <div className="font-semibold text-slate-900">{p.name} {p.surname}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{p.phone}</div>
                          </div>
                          <button
                            type="button"
                            className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-[10px] font-bold"
                          >
                            Seleccionar
                          </button>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            )}

            {/* New Patient Registration Form */}
            {patientMode === 'new' && (
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3">
                
                {/* Live duplicate detected warning */}
                {duplicateWarning && (
                  <div className="p-3 bg-amber-100/70 border border-amber-300 rounded-xl flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <div className="text-[11px] text-amber-900 leading-tight">
                        <span className="font-bold">Posible duplicado detectado: </span>
                        <span>"{duplicateWarning.name} {duplicateWarning.surname}" ({duplicateWarning.phone}).</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPatient(duplicateWarning);
                        setPatientMode('search');
                        setDuplicateWarning(null);
                      }}
                      className="px-2 py-1 bg-amber-600 text-white rounded-lg text-[10px] font-bold shrink-0 hover:bg-amber-700"
                    >
                      Usar este
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 block mb-1">Nombre *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Juan"
                      value={newPatient.name}
                      onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 block mb-1">Apellido *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Pérez"
                      value={newPatient.surname}
                      onChange={(e) => setNewPatient({ ...newPatient, surname: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 block mb-1">Teléfono *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+56 9 1234 5678"
                      value={newPatient.phone}
                      onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 block mb-1">RUT (opcional)</label>
                    <input
                      type="text"
                      placeholder="Ej. 12.345.678-9"
                      value={newPatient.rut}
                      onChange={(e) => setNewPatient({ ...newPatient, rut: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 block mb-1">Edad (opcional)</label>
                    <input
                      type="number"
                      min="0"
                      max="120"
                      placeholder="Ej. 35"
                      value={newPatient.age}
                      onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* STEP 2: PROFESIÓN / SERVICIO */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">2</span>
              <span>Seleccionar Profesión / Servicio</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {activeServices.map(srv => {
                const isSelected = selectedServiceId === srv.id;
                return (
                  <button
                    key={srv.id}
                    type="button"
                    onClick={() => {
                      setSelectedServiceId(srv.id);
                      setSelectedSlot('');
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all text-xs flex flex-col justify-between ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/80 shadow-xs ring-2 ring-amber-500/30'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span 
                        className="w-2.5 h-2.5 rounded-full shrink-0" 
                        style={{ backgroundColor: srv.color }} 
                      />
                      <span className={`font-bold truncate ${isSelected ? 'text-slate-950 font-extrabold' : 'text-slate-700'}`}>
                        {srv.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 truncate">
                      {srv.description?.slice(0, 32)}...
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 3: HORARIO (AUTOMÁTICO CON HORAS LIBRES O MANUAL) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">3</span>
                <span>Horario de Atención</span>
              </label>

              {/* Selector entre Automático (bloques libres) y Manual */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setScheduleMode('auto')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 ${
                    scheduleMode === 'auto'
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Bloques Libres</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setScheduleMode('manual');
                    if (manualTime && !isManualTimeOccupied) {
                      setSelectedSlot(manualTime);
                    }
                  }}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 ${
                    scheduleMode === 'manual'
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Edit3 className="w-3 h-3 text-blue-500" />
                  <span>Ingreso Manual</span>
                </button>
              </div>
            </div>

            {/* MODO AUTOMÁTICO: Solo muestra las horas que están libres */}
            {scheduleMode === 'auto' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Horas disponibles para <strong>{currentService?.name}</strong>:</span>
                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {freeTimeSlots.length} horas libres (las ocupadas se ocultan)
                  </span>
                </div>

                {freeTimeSlots.length === 0 ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <span className="text-amber-800 font-medium">
                      Todas las horas habituales para {currentService?.name} están ocupadas.
                    </span>
                    <button
                      type="button"
                      onClick={handleAddToWaitingList}
                      className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shrink-0 transition-colors"
                    >
                      Agregar a Lista de Espera
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                    {freeTimeSlots.map(slot => {
                      const isSelected = selectedSlot === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`py-2 px-1 text-center rounded-xl text-xs font-mono font-bold transition-all flex flex-col items-center justify-center ${
                            isSelected
                              ? 'bg-amber-500 text-slate-950 shadow-md scale-105 ring-2 ring-amber-600'
                              : 'bg-emerald-50/90 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400'
                          }`}
                        >
                          <span className="text-xs">{slot}</span>
                          <span className="text-[9px] font-sans font-normal opacity-75">Libre</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* MODO MANUAL: Ingreso directo de hora */}
            {scheduleMode === 'manual' && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Escriba o elija la hora de atención (Formato HH:MM)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={manualTime}
                      onChange={(e) => {
                        setManualTime(e.target.value);
                      }}
                      className="px-3 py-2 text-sm font-mono font-bold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />

                    {/* Presets rápidos */}
                    <div className="flex flex-wrap gap-1">
                      {['11:00', '11:20', '11:40', '12:00', '14:00', '15:00', '16:00'].map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setManualTime(t)}
                          className={`px-2 py-1 rounded-lg text-[11px] font-mono border ${
                            manualTime === t
                              ? 'bg-blue-600 text-white border-blue-600 font-bold'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Validations for manual time */}
                {isManualTimeOccupied ? (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px] flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>
                      ⚠️ La hora <strong>{manualTime}</strong> ya está ocupada para <strong>{currentService?.name}</strong>. Por favor escriba o elija otra hora.
                    </span>
                  </div>
                ) : (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[11px] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      ✓ Horario <strong>{manualTime} hrs</strong> está libre y disponible para <strong>{currentService?.name}</strong>.
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Observations */}
          <div>
            <label className="text-[11px] font-medium text-slate-600 block mb-1">
              Observaciones / Motivo de consulta (opcional)
            </label>
            <input
              type="text"
              placeholder="Ej. Primera consulta, control de rutina, solicitud de certificado..."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          {/* Footer Submit Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !selectedSlot}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all ${
                isSubmitting || !selectedSlot
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 hover:shadow-lg'
              }`}
            >
              {isSubmitting ? (
                <span>Confirmando Reserva...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>
                    Confirmar Reserva {selectedSlot ? `(${selectedSlot} hrs · ${currentService?.name})` : ''}
                  </span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
