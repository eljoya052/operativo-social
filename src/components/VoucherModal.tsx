import React from 'react';
import { Printer, Download, Share2, CheckCircle2, MapPin, Calendar, Clock, User, X } from 'lucide-react';
import type { Appointment, Operative } from '../types';

interface VoucherModalProps {
  appointment: Appointment | null;
  operative: Operative | null;
  onClose: () => void;
}

export const VoucherModal: React.FC<VoucherModalProps> = ({ appointment, operative, onClose }) => {
  if (!appointment) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const textContent = `
=============================================
OPERATIVO SOCIAL IBM — COMPROBANTE DE ATENCIÓN
Iglesia Bautista Millaray
=============================================
Código Reserva: ${appointment.id}
Paciente:       ${appointment.patientName}
Teléfono:       ${appointment.patientPhone}
${appointment.patientRut ? `RUT:            ${appointment.patientRut}\n` : ''}
Servicio:       ${appointment.serviceName}
Profesional:    ${appointment.professionalName}
Fecha:          ${appointment.date}
Horario:        ${appointment.startTime} - ${appointment.endTime} hrs.
Lugar:          ${operative?.address || 'Chacay 1164, Temuco, Chile'}
Estado:         ${appointment.status.toUpperCase()}
Registrado por: ${appointment.createdByUserName}
Fecha emisión:  ${new Date().toLocaleString('es-CL')}
=============================================
Por favor presentarse 10 minutos antes en recepción.
¡Que Dios le bendiga!
`;
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Comprobante_${appointment.patientName.replace(/\s+/g, '_')}_${appointment.startTime.replace(':', '')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleWhatsApp = () => {
    const cleanPhone = appointment.patientPhone.replace(/[^\d]/g, '');
    const message = encodeURIComponent(
      `*OPERATIVO SOCIAL IBM*\n` +
      `¡Hola ${appointment.patientName}! Tu atención ha sido agendada con éxito:\n\n` +
      `🩺 *Servicio / Profesión:* ${appointment.serviceName}\n` +
      `📅 *Fecha:* ${appointment.date}\n` +
      `⏰ *Hora:* ${appointment.startTime} hrs.\n` +
      `📍 *Lugar:* ${operative?.address || 'Chacay 1164, Temuco'}\n` +
      `📌 *Estado:* ${appointment.status}\n\n` +
      `Por favor llegar 10 minutos antes. ¡Te esperamos!`
    );

    const waUrl = cleanPhone 
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${message}`
      : `https://api.whatsapp.com/send?text=${message}`;
    
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden print:border-none print:shadow-none">
        
        {/* Header with Navy & Gold theme */}
        <div className="bg-slate-900 text-white p-6 relative print:bg-slate-900 print:text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg print:hidden"
            aria-label="Cerrar comprobante"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/30 mb-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Reserva Confirmada</span>
          </div>

          <h3 className="text-xl font-extrabold tracking-tight font-['Cabinet_Grotesk',sans-serif]">
            OPERATIVO SOCIAL IBM
          </h3>
          <p className="text-xs text-slate-300 mt-0.5">
            Iglesia Bautista Millaray · Temuco
          </p>
        </div>

        {/* Voucher Content */}
        <div className="p-6 space-y-4">
          
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Paciente</span>
              <span className="text-sm font-bold text-slate-900">{appointment.patientName}</span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Atención / Profesión</span>
              <span className="text-sm font-semibold text-slate-900">{appointment.serviceName}</span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Horario</span>
              <span className="text-base font-extrabold text-amber-700 font-mono">
                {appointment.startTime} hrs.
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Fecha</span>
              <span className="text-sm font-medium text-slate-800">{appointment.date}</span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Dirección</span>
              <span className="text-xs font-medium text-slate-700 text-right max-w-[200px]">
                {operative?.address || 'Chacay 1164, Temuco'}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Estado</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                {appointment.status.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="text-center text-xs text-slate-500 italic">
            Por favor presentarse con 10 minutos de anticipación en el mesón de bienvenida.
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-3 gap-2 pt-2 print:hidden">
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar</span>
            </button>

            <button
              onClick={handleWhatsApp}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
          </div>

          <div className="pt-1 print:hidden">
            <button
              onClick={onClose}
              className="w-full py-2 text-center text-xs font-medium text-slate-500 hover:text-slate-800"
            >
              Cerrar y volver a recepción
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
