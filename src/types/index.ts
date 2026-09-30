export type UserRole = 'ADMIN' | 'RECEPCION' | 'PROFESIONAL';

export type AppointmentStatus = 
  | 'Reservado'
  | 'Confirmado'
  | 'Esperando'
  | 'En atención'
  | 'Atendido'
  | 'No asistió'
  | 'Cancelado';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  professionalId?: string; // Links to professional if role is PROFESIONAL
}

export interface Operative {
  id: string;
  name: string;
  organization: string;
  address: string;
  date: string; // e.g. "2026-10-17" or "17 de octubre"
  startTime: string; // "11:00"
  endTime: string; // "17:00"
  slotDurationMinutes: number; // 20, 25, or 30
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color: string; // hex or tailwind color
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Professional {
  id: string;
  name: string;
  surname: string;
  specialty: string;
  phone?: string;
  email?: string;
  userEmail?: string;
  serviceIds: string[]; // can belong to multiple services
  active: boolean;
  availabilityNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Patient {
  id: string;
  name: string;
  surname: string;
  phone: string;
  rut?: string;
  birthDate?: string;
  age?: number;
  email?: string;
  observations?: string;
  dataConsent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  operativeId: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientRut?: string;
  serviceId: string;
  serviceName: string;
  professionalId: string;
  professionalName: string;
  date: string;
  startTime: string; // "11:00"
  endTime: string; // "11:20"
  status: AppointmentStatus;
  observations?: string;
  attentionNotes?: string;
  attendedAt?: string;
  startedAt?: string;
  createdByUserId: string;
  createdByUserName: string;
  createdAt: string;
  updatedAt: string;
}

export interface WaitingListItem {
  id: string;
  operativeId: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  serviceId: string;
  serviceName: string;
  priority: 'Alta' | 'Media' | 'Baja';
  observations?: string;
  status: 'Pendiente' | 'Asignado' | 'Cancelado';
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: 'appointment' | 'patient' | 'professional' | 'service' | 'operative' | 'waiting_list';
  entityId: string;
  details: string;
  timestamp: string;
}

export interface SystemData {
  operatives: Operative[];
  activeOperativeId: string;
  services: Service[];
  professionals: Professional[];
  patients: Patient[];
  appointments: Appointment[];
  waitingList: WaitingListItem[];
  users: User[];
  auditLogs: AuditLog[];
}
