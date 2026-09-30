import * as XLSX from 'xlsx';
import type { SystemData, Operative, Appointment, Patient, WaitingListItem, Service } from '../types';

export const exportOperativeToExcel = (data: SystemData, activeOperative: Operative | null) => {
  const wb = XLSX.utils.book_new();

  // 1. Hoja 1: Atenciones y Citas
  const appointmentsData = data.appointments.map((apt: Appointment, index: number) => {
    const patient = data.patients.find((p: Patient) => p.id === apt.patientId);
    return {
      'N°': index + 1,
      'Folio': apt.id,
      'Fecha': apt.date,
      'Hora Inicio': apt.startTime,
      'Hora Fin': apt.endTime,
      'Nombre Paciente': apt.patientName,
      'Teléfono': apt.patientPhone,
      'RUT': apt.patientRut || patient?.rut || 'Sin RUT',
      'Edad': patient?.age ? `${patient.age} años` : 'No informada',
      'Servicio / Profesión': apt.serviceName,
      'Estado': apt.status,
      'Observaciones / Motivo': apt.observations || '',
      'Notas de Atención': apt.attentionNotes || '',
      'Registrado Por': apt.createdByUserName,
      'Fecha y Hora Registro': new Date(apt.createdAt).toLocaleString('es-CL')
    };
  });

  const wsAppointments = XLSX.utils.json_to_sheet(
    appointmentsData.length > 0
      ? appointmentsData
      : [{ 'Aviso': 'No hay atenciones registradas aún en el sistema' }]
  );
  wsAppointments['!cols'] = [
    { wch: 6 },
    { wch: 18 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 28 },
    { wch: 16 },
    { wch: 14 },
    { wch: 12 },
    { wch: 22 },
    { wch: 14 },
    { wch: 32 },
    { wch: 32 },
    { wch: 20 },
    { wch: 22 }
  ];
  XLSX.utils.book_append_sheet(wb, wsAppointments, 'Atenciones y Citas');

  // 2. Hoja 2: Directorio Maestro de Pacientes
  const patientsData = data.patients.map((p: Patient, index: number) => {
    const apts = data.appointments.filter((a: Appointment) => a.patientId === p.id && a.status !== 'Cancelado');
    const servicesRequested = [...new Set(apts.map((a: Appointment) => a.serviceName))].join(', ');
    return {
      'N°': index + 1,
      'ID Paciente': p.id,
      'Nombre': p.name,
      'Apellido': p.surname,
      'Nombre Completo': `${p.name} ${p.surname}`,
      'Teléfono': p.phone,
      'RUT': p.rut || 'Sin RUT',
      'Edad': p.age ? `${p.age} años` : 'No informada',
      'Observaciones / Antecedentes': p.observations || '',
      'Total Atenciones': apts.length,
      'Servicios Recibidos': servicesRequested || 'Sin atenciones aún',
      'Fecha Registro': new Date(p.createdAt).toLocaleString('es-CL')
    };
  });

  const wsPatients = XLSX.utils.json_to_sheet(
    patientsData.length > 0
      ? patientsData
      : [{ 'Aviso': 'No hay pacientes registrados aún' }]
  );
  wsPatients['!cols'] = [
    { wch: 6 },
    { wch: 18 },
    { wch: 16 },
    { wch: 16 },
    { wch: 28 },
    { wch: 16 },
    { wch: 14 },
    { wch: 12 },
    { wch: 30 },
    { wch: 14 },
    { wch: 30 },
    { wch: 22 }
  ];
  XLSX.utils.book_append_sheet(wb, wsPatients, 'Directorio Pacientes');

  // 3. Hoja 3: Lista de Espera
  const waitingData = data.waitingList.map((w: WaitingListItem, index: number) => {
    return {
      'N°': index + 1,
      'Paciente': w.patientName,
      'Teléfono': w.patientPhone,
      'Servicio Solicitado': w.serviceName,
      'Prioridad': w.priority,
      'Estado': w.status,
      'Observaciones': w.observations || '',
      'Fecha Solicitud': new Date(w.createdAt).toLocaleString('es-CL')
    };
  });

  const wsWaiting = XLSX.utils.json_to_sheet(
    waitingData.length > 0
      ? waitingData
      : [{ 'Aviso': 'No hay personas en lista de espera' }]
  );
  wsWaiting['!cols'] = [
    { wch: 6 },
    { wch: 28 },
    { wch: 16 },
    { wch: 22 },
    { wch: 12 },
    { wch: 14 },
    { wch: 32 },
    { wch: 22 }
  ];
  XLSX.utils.book_append_sheet(wb, wsWaiting, 'Lista de Espera');

  // 4. Hoja 4: Resumen Estadístico por Servicio
  const summaryData = data.services.map((s: Service) => {
    const apts = data.appointments.filter((a: Appointment) => a.serviceId === s.id);
    return {
      'Servicio / Profesión': s.name,
      'Total Agendadas': apts.length,
      'Atendidos': apts.filter((a: Appointment) => a.status === 'Atendido').length,
      'En Atención': apts.filter((a: Appointment) => a.status === 'En atención').length,
      'Esperando': apts.filter((a: Appointment) => a.status === 'Esperando' || a.status === 'Reservado' || a.status === 'Confirmado').length,
      'No Asistió': apts.filter((a: Appointment) => a.status === 'No asistió').length,
      'Canceladas': apts.filter((a: Appointment) => a.status === 'Cancelado').length
    };
  });

  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  wsSummary['!cols'] = [
    { wch: 24 },
    { wch: 16 },
    { wch: 12 },
    { wch: 14 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 }
  ];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen por Servicio');

  // Nombre de archivo con fecha del operativo
  const dateStr = activeOperative?.date || new Date().toISOString().split('T')[0];
  const fileName = `Operativo_Social_IBM_Pacientes_${dateStr}.xlsx`;

  // Genera y descarga el archivo Excel
  XLSX.writeFile(wb, fileName);
};
