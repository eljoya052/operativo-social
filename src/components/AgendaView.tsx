import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Plus, 
  CheckCircle2, 
  Phone, 
  Eye, 
  Sparkles,
  Users,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BookingModal } from './BookingModal';
import { VoucherModal } from './VoucherModal';
import type { Appointment, Professional, Service } from '../types';

export const AgendaView: React.FC = () => {
  const { data, activeOperative, generateTimeSlots } = useApp();

  // Selected service filter
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');

  // Modals
  const [bookingModalParams, setBookingModalParams] = useState<{
    isOpen: boolean;
    serviceId?: string;
    professionalId?: string;
    startTime?: string;
  }>({ isOpen: false });

  const [selectedVoucherApt, setSelectedVoucherApt] = useState<Appointment | null>(null);

  // Active services
  const activeServices = useMemo(() => {
    if (!data) return [];
    return data.services.filter(s => s.active);
  }, [data]);

  // Set default service
  React.useEffect(() => {
    if (!selectedServiceId && activeServices.length > 0) {
      setSelectedServiceId(activeServices[0].id);
    }
  }, [activeServices, selectedServiceId]);

  // Selected service object
  const currentService = useMemo(() => {
    return activeServices.find(s => s.id === selectedServiceId) || activeServices[0];
  }, [activeServices, selectedServiceId]);

  // Professionals for the selected service
  const serviceProfessionals = useMemo(() => {
    if (!data || !currentService) return [];
    return data.professionals.filter(p => p.active && p.serviceIds.includes(currentService.id));
  }, [data, currentService]);

  // Time slots for active operative
  const timeSlots = useMemo(() => {
    return generateTimeSlots(
      activeOperative?.startTime || '11:00',
      activeOperative?.endTime || '17:00',
      activeOperative?.slotDurationMinutes || 20
    );
  }, [generateTimeSlots, activeOperative]);

  // Map of appointments for quick lookup: [profId_startTime] => Appointment
  const appointmentMap = useMemo(() => {
    if (!data || !activeOperative) return new Map<string, Appointment>();
    const map = new Map<string, Appointment>();

    data.appointments.forEach(apt => {
      if (apt.operativeId === activeOperative.id && apt.date === activeOperative.date && apt.status !== 'Cancelado') {
        map.set(`${apt.professionalId}_${apt.startTime}`, apt);
      }
    });

    return map;
  }, [data, activeOperative]);

  const handleEmptySlotClick = (profId: string, slot: string) => {
    setBookingModalParams({
      isOpen: true,
      serviceId: currentService.id,
      professionalId: profId,
      startTime: slot
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight font-['Cabinet_Grotesk',sans-serif]">
            Agenda General Multi-Profesional
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Vista en matriz de horarios y profesionales en tiempo real
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            Bloques de {activeOperative?.slotDurationMinutes} minutos
          </span>
        </div>
      </div>

      {/* Services Selector Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1.5 min-w-max">
          {activeServices.map(srv => {
            const isSelected = srv.id === currentService?.id;
            return (
              <button
                key={srv.id}
                onClick={() => setSelectedServiceId(srv.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-sm ring-1 ring-slate-800'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span 
                  className="w-2.5 h-2.5 rounded-full" 
                  style={{ backgroundColor: srv.color }} 
                />
                <span>{srv.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-slate-800 text-amber-300' : 'bg-slate-200 text-slate-600'
                }`}>
                  {data?.professionals.filter(p => p.active && p.serviceIds.includes(srv.id)).length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Service Schedule Matrix */}
      {serviceProfessionals.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 text-sm">
          No hay profesionales activos asignados a este servicio actualmente.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: currentService?.color }} 
              />
              <h3 className="font-bold text-slate-900 text-sm">
                {currentService?.name} — {serviceProfessionals.length} profesional(es) asignado(s)
              </h3>
            </div>
            <span className="text-xs text-slate-500">
              Haga clic en cualquier horario libre para agendar inmediatamente
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700">
                  <th className="py-3 px-4 w-24 sticky left-0 bg-slate-100 font-bold uppercase tracking-wider text-[11px] border-r border-slate-200">
                    Hora
                  </th>
                  {serviceProfessionals.map(prof => (
                    <th key={prof.id} className="py-3 px-4 min-w-[200px] border-r border-slate-200 last:border-r-0">
                      <div className="font-bold text-slate-900 text-xs">{prof.specialty || prof.name}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {timeSlots.map(slot => (
                  <tr key={slot} className="hover:bg-slate-50/50 transition-colors">
                    {/* Time Column */}
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900 bg-slate-50/80 sticky left-0 border-r border-slate-200 tabular-nums">
                      {slot}
                    </td>

                    {/* Professionals Columns */}
                    {serviceProfessionals.map(prof => {
                      const apt = appointmentMap.get(`${prof.id}_${slot}`);

                      if (apt) {
                        const isAtendido = apt.status === 'Atendido';
                        const isInProgress = apt.status === 'En atención';
                        const isWaiting = apt.status === 'Esperando' || apt.status === 'Reservado';

                        return (
                          <td 
                            key={prof.id} 
                            className="py-1.5 px-2 border-r border-slate-200 last:border-r-0"
                          >
                            <div 
                              onClick={() => setSelectedVoucherApt(apt)}
                              className={`p-2 rounded-xl border text-xs cursor-pointer transition-all hover:shadow-xs ${
                                isInProgress ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-400' :
                                isAtendido ? 'bg-emerald-50 border-emerald-300' :
                                isWaiting ? 'bg-amber-50 border-amber-300' :
                                'bg-slate-100 border-slate-200'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold text-slate-900 truncate">
                                  {apt.patientName}
                                </span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold shrink-0 ${
                                  isAtendido ? 'bg-emerald-600 text-white' :
                                  isInProgress ? 'bg-blue-600 text-white' :
                                  isWaiting ? 'bg-amber-500 text-slate-950' :
                                  'bg-slate-700 text-white'
                                }`}>
                                  {apt.status}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 flex items-center justify-between mt-1">
                                <span>{apt.patientPhone}</span>
                                <span className="text-[9px] text-slate-400">Ver ficha →</span>
                              </div>
                            </div>
                          </td>
                        );
                      }

                      // Empty Slot: Click to book
                      return (
                        <td 
                          key={prof.id} 
                          className="py-1.5 px-2 border-r border-slate-200 last:border-r-0"
                        >
                          <button
                            onClick={() => handleEmptySlotClick(prof.id, slot)}
                            className="w-full h-full py-2 px-3 rounded-xl border border-dashed border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 text-slate-400 hover:text-amber-800 transition-all flex items-center justify-center gap-1 group text-[11px]"
                          >
                            <Plus className="w-3 h-3 group-hover:scale-125 transition-transform" />
                            <span>Disponible</span>
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* Booking Modal */}
      {bookingModalParams.isOpen && (
        <BookingModal
          initialServiceId={bookingModalParams.serviceId}
          initialProfessionalId={bookingModalParams.professionalId}
          initialStartTime={bookingModalParams.startTime}
          onClose={() => setBookingModalParams({ isOpen: false })}
          onSuccess={(newApt) => {
            setBookingModalParams({ isOpen: false });
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

    </div>
  );
};
