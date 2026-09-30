import type { SystemData, Operative, Service, Professional, Patient, Appointment, WaitingListItem, User } from '../types';

export const api = {
  async fetchInitialData(): Promise<SystemData> {
    const res = await fetch('/api/data');
    if (!res.ok) throw new Error('Error al cargar datos del sistema');
    return res.json();
  },

  async login(email: string): Promise<{ user: User }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Error de autenticación' }));
      throw new Error(err.error || 'Usuario no encontrado');
    }
    return res.json();
  },

  async createOperative(data: Partial<Operative> & { userId?: string; userName?: string }): Promise<Operative> {
    const res = await fetch('/api/operatives', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Error al crear operativo' }));
      throw new Error(err.error || 'Error al crear operativo');
    }
    return res.json();
  },

  async updateOperative(id: string, data: Partial<Operative> & { userId?: string; userName?: string }): Promise<Operative> {
    const res = await fetch(`/api/operatives/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Error al actualizar operativo' }));
      throw new Error(err.error || 'Error al actualizar operativo');
    }
    return res.json();
  },

  async selectOperative(operativeId: string): Promise<{ activeOperativeId: string }> {
    const res = await fetch('/api/operatives/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operativeId })
    });
    if (!res.ok) throw new Error('Error al cambiar de operativo activo');
    return res.json();
  },

  async createService(data: Partial<Service> & { userId?: string; userName?: string }): Promise<Service> {
    const res = await fetch('/api/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Error al crear servicio' }));
      throw new Error(err.error || 'Error al crear servicio');
    }
    return res.json();
  },

  async updateService(id: string, data: Partial<Service> & { userId?: string; userName?: string }): Promise<Service> {
    const res = await fetch(`/api/services/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Error al actualizar servicio' }));
      throw new Error(err.error || 'Error al actualizar servicio');
    }
    return res.json();
  },

  async createProfessional(data: Partial<Professional> & { userId?: string; userName?: string }): Promise<Professional> {
    const res = await fetch('/api/professionals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Error al crear profesional' }));
      throw new Error(err.error || 'Error al crear profesional');
    }
    return res.json();
  },

  async updateProfessional(id: string, data: Partial<Professional> & { userId?: string; userName?: string }): Promise<Professional> {
    const res = await fetch(`/api/professionals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Error al actualizar profesional' }));
      throw new Error(err.error || 'Error al actualizar profesional');
    }
    return res.json();
  },

  async checkDuplicatePatient(phone?: string, name?: string, surname?: string): Promise<{ duplicates: Patient[] }> {
    const params = new URLSearchParams();
    if (phone) params.set('phone', phone);
    if (name) params.set('name', name);
    if (surname) params.set('surname', surname);
    const res = await fetch(`/api/patients/check-duplicate?${params.toString()}`);
    if (!res.ok) return { duplicates: [] };
    return res.json();
  },

  async createPatient(data: Partial<Patient> & { userId?: string; userName?: string }): Promise<Patient> {
    const res = await fetch('/api/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Error al registrar paciente' }));
      throw new Error(err.error || 'Error al registrar paciente');
    }
    return res.json();
  },

  async updatePatient(id: string, data: Partial<Patient> & { userId?: string; userName?: string }): Promise<Patient> {
    const res = await fetch(`/api/patients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Error al actualizar paciente' }));
      throw new Error(err.error || 'Error al actualizar paciente');
    }
    return res.json();
  },

  async createAppointment(data: {
    operativeId: string;
    patientId: string;
    serviceId: string;
    professionalId?: string;
    date: string;
    startTime: string;
    endTime?: string;
    observations?: string;
    userId: string;
    userName: string;
    autoAssign?: boolean;
  }): Promise<Appointment> {
    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Error al reservar cita' }));
      throw new Error(err.error || 'Error al reservar cita');
    }
    return res.json();
  },

  async updateAppointmentStatus(id: string, data: { status: string; attentionNotes?: string; userId: string; userName: string }): Promise<Appointment> {
    const res = await fetch(`/api/appointments/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Error al actualizar estado' }));
      throw new Error(err.error || 'Error al actualizar estado');
    }
    return res.json();
  },

  async updateAppointment(id: string, data: Partial<Appointment> & { userId: string; userName: string }): Promise<Appointment> {
    const res = await fetch(`/api/appointments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Error al modificar cita' }));
      throw new Error(err.error || 'Error al modificar cita');
    }
    return res.json();
  },

  async cancelAppointment(id: string, userId: string, userName: string, reason?: string, hardDelete: boolean = true): Promise<any> {
    const params = new URLSearchParams({ userId, userName });
    if (reason) params.set('reason', reason);
    params.set('hardDelete', hardDelete ? 'true' : 'false');
    const res = await fetch(`/api/appointments/${id}?${params.toString()}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Error al eliminar cita' }));
      throw new Error(err.error || 'Error al eliminar cita');
    }
    return res.json();
  },

  async addToWaitingList(data: {
    operativeId: string;
    patientId: string;
    serviceId: string;
    priority: 'Alta' | 'Media' | 'Baja';
    observations?: string;
    userId: string;
    userName: string;
  }): Promise<WaitingListItem> {
    const res = await fetch('/api/waiting-list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Error al agregar a lista de espera' }));
      throw new Error(err.error || 'Error al agregar a lista de espera');
    }
    return res.json();
  },

  async updateWaitingListItem(id: string, data: { status: 'Pendiente' | 'Asignado' | 'Cancelado'; userId: string; userName: string }): Promise<WaitingListItem> {
    const res = await fetch(`/api/waiting-list/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Error al actualizar lista de espera' }));
      throw new Error(err.error || 'Error al actualizar lista de espera');
    }
    return res.json();
  },

  async deletePatient(id: string, userId?: string, userName?: string): Promise<void> {
    const params = new URLSearchParams();
    if (userId) params.set('userId', userId);
    if (userName) params.set('userName', userName);
    const res = await fetch(`/api/patients/${id}?${params.toString()}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Error al eliminar paciente');
  },

  async deleteProfessional(id: string, userId?: string, userName?: string): Promise<void> {
    const params = new URLSearchParams();
    if (userId) params.set('userId', userId);
    if (userName) params.set('userName', userName);
    const res = await fetch(`/api/professionals/${id}?${params.toString()}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Error al eliminar profesional');
  },

  async clearOperationalData(userId?: string, userName?: string): Promise<void> {
    const res = await fetch('/api/clear-operational-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, userName })
    });
    if (!res.ok) throw new Error('Error al vaciar datos operativos');
  },

  async resetData(): Promise<void> {
    const res = await fetch('/api/reset-data', { method: 'POST' });
    if (!res.ok) throw new Error('Error al reiniciar datos');
  }
};
