import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import type { 
  SystemData, 
  User, 
  Operative, 
  Service, 
  Professional, 
  Patient, 
  Appointment, 
  WaitingListItem, 
  AuditLog 
} from '../types';
import { api } from '../services/api';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: number;
}

interface AppContextType {
  data: SystemData | null;
  loading: boolean;
  error: string | null;
  activeOperative: Operative | null;
  currentUser: User;
  isConnected: boolean;
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
  addToast: (message: string, type?: ToastMessage['type']) => void;
  setCurrentUser: (user: User) => void;
  switchUser: (email: string) => Promise<void>;
  setActiveOperativeId: (id: string) => Promise<void>;
  generateTimeSlots: (startTime?: string, endTime?: string, slotMinutes?: number) => string[];
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<SystemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Default initial active user: Receptionist or Admin
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'usr-recep1',
    name: 'Recepción Central',
    email: 'recepcion@ibm.cl',
    role: 'RECEPCION'
  });

  const addToast = useCallback((message: string, type: ToastMessage['type'] = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts(prev => [...prev.slice(-4), { id, message, type, timestamp: Date.now() }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const refreshData = useCallback(async () => {
    try {
      const fullData = await api.fetchInitialData();
      setData(fullData);
      setError(null);
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message || 'Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize and connect to SSE Realtime stream
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;

    const connectSSE = () => {
      const query = new URLSearchParams({
        role: currentUser.role,
        professionalId: currentUser.professionalId || ''
      });

      eventSource = new EventSource(`/api/realtime/stream?${query.toString()}`);

      eventSource.onopen = () => {
        setIsConnected(true);
        setError(null);
      };

      eventSource.addEventListener('sync', (e: MessageEvent) => {
        try {
          const syncedData: SystemData = JSON.parse(e.data);
          setData(syncedData);
          setLoading(false);
        } catch (err) {
          console.error('Error parsing sync data:', err);
        }
      });

      eventSource.addEventListener('appointment:created', (e: MessageEvent) => {
        try {
          const apt: Appointment = JSON.parse(e.data);
          setData(prev => {
            if (!prev) return prev;
            if (prev.appointments.some(a => a.id === apt.id)) return prev;
            return {
              ...prev,
              appointments: [apt, ...prev.appointments]
            };
          });
          addToast(`Nueva reserva: ${apt.patientName} (${apt.serviceName} a las ${apt.startTime})`, 'info');
        } catch (err) {
          console.error(err);
        }
      });

      eventSource.addEventListener('appointment:status_changed', (e: MessageEvent) => {
        try {
          const apt: Appointment = JSON.parse(e.data);
          setData(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              appointments: prev.appointments.map(a => a.id === apt.id ? apt : a)
            };
          });
          addToast(`Estado actualizado: ${apt.patientName} → "${apt.status}"`, 'success');
        } catch (err) {
          console.error(err);
        }
      });

      eventSource.addEventListener('appointment:updated', (e: MessageEvent) => {
        try {
          const apt: Appointment = JSON.parse(e.data);
          setData(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              appointments: prev.appointments.map(a => a.id === apt.id ? apt : a)
            };
          });
          addToast(`Reserva modificada: ${apt.patientName} (${apt.startTime} hrs)`, 'info');
        } catch (err) {
          console.error(err);
        }
      });

      eventSource.addEventListener('appointment:cancelled', (e: MessageEvent) => {
        try {
          const apt: Appointment = JSON.parse(e.data);
          setData(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              appointments: prev.appointments.map(a => a.id === apt.id ? apt : a)
            };
          });
          addToast(`Reserva cancelada: ${apt.patientName}`, 'warning');
        } catch (err) {
          console.error(err);
        }
      });

      eventSource.addEventListener('appointment:deleted', (e: MessageEvent) => {
        try {
          const { id } = JSON.parse(e.data);
          setData(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              appointments: prev.appointments.filter(a => a.id !== id)
            };
          });
          addToast(`Cita eliminada de la agenda`, 'info');
        } catch (err) {
          console.error(err);
        }
      });

      eventSource.addEventListener('patient:created', (e: MessageEvent) => {
        try {
          const pat: Patient = JSON.parse(e.data);
          setData(prev => {
            if (!prev) return prev;
            if (prev.patients.some(p => p.id === pat.id)) return prev;
            return {
              ...prev,
              patients: [pat, ...prev.patients]
            };
          });
        } catch (err) {
          console.error(err);
        }
      });

      eventSource.addEventListener('patient:updated', (e: MessageEvent) => {
        try {
          const pat: Patient = JSON.parse(e.data);
          setData(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              patients: prev.patients.map(p => p.id === pat.id ? pat : p)
            };
          });
        } catch (err) {
          console.error(err);
        }
      });

      eventSource.addEventListener('service:created', (e: MessageEvent) => {
        try {
          const srv: Service = JSON.parse(e.data);
          setData(prev => prev ? { ...prev, services: [...prev.services, srv] } : prev);
          addToast(`Nuevo servicio agregado: ${srv.name}`, 'info');
        } catch (err) {
          console.error(err);
        }
      });

      eventSource.addEventListener('service:updated', (e: MessageEvent) => {
        try {
          const srv: Service = JSON.parse(e.data);
          setData(prev => prev ? { ...prev, services: prev.services.map(s => s.id === srv.id ? srv : s) } : prev);
        } catch (err) {
          console.error(err);
        }
      });

      eventSource.addEventListener('professional:created', (e: MessageEvent) => {
        try {
          const prof: Professional = JSON.parse(e.data);
          setData(prev => prev ? { ...prev, professionals: [...prev.professionals, prof] } : prev);
          addToast(`Profesional incorporado: ${prof.name} ${prof.surname}`, 'info');
        } catch (err) {
          console.error(err);
        }
      });

      eventSource.addEventListener('professional:updated', (e: MessageEvent) => {
        try {
          const prof: Professional = JSON.parse(e.data);
          setData(prev => prev ? { ...prev, professionals: prev.professionals.map(p => p.id === prof.id ? prof : p) } : prev);
        } catch (err) {
          console.error(err);
        }
      });

      eventSource.addEventListener('operative:created', (e: MessageEvent) => {
        try {
          const op: Operative = JSON.parse(e.data);
          setData(prev => prev ? { ...prev, operatives: [...prev.operatives, op] } : prev);
          addToast(`Nuevo operativo creado: ${op.name}`, 'info');
        } catch (err) {
          console.error(err);
        }
      });

      eventSource.addEventListener('operative:updated', (e: MessageEvent) => {
        try {
          const op: Operative = JSON.parse(e.data);
          setData(prev => prev ? { ...prev, operatives: prev.operatives.map(o => o.id === op.id ? op : o) } : prev);
        } catch (err) {
          console.error(err);
        }
      });

      eventSource.addEventListener('operative:active_changed', (e: MessageEvent) => {
        try {
          const { activeOperativeId } = JSON.parse(e.data);
          setData(prev => prev ? { ...prev, activeOperativeId } : prev);
        } catch (err) {
          console.error(err);
        }
      });

      eventSource.addEventListener('waiting_list:created', (e: MessageEvent) => {
        try {
          const item: WaitingListItem = JSON.parse(e.data);
          setData(prev => prev ? { ...prev, waitingList: [item, ...prev.waitingList] } : prev);
          addToast(`Paciente ingresado a Lista de Espera (${item.serviceName})`, 'warning');
        } catch (err) {
          console.error(err);
        }
      });

      eventSource.addEventListener('waiting_list:updated', (e: MessageEvent) => {
        try {
          const item: WaitingListItem = JSON.parse(e.data);
          setData(prev => prev ? { ...prev, waitingList: prev.waitingList.map(w => w.id === item.id ? item : w) } : prev);
        } catch (err) {
          console.error(err);
        }
      });

      eventSource.onerror = () => {
        setIsConnected(false);
        if (eventSource) {
          eventSource.close();
        }
        reconnectTimeout = setTimeout(connectSSE, 3000);
      };
    };

    connectSSE();

    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [currentUser, addToast]);

  const activeOperative = useMemo(() => {
    if (!data || !data.operatives.length) return null;
    return data.operatives.find(o => o.id === data.activeOperativeId) || data.operatives[0];
  }, [data]);

  const switchUser = useCallback(async (email: string) => {
    try {
      const res = await api.login(email);
      setCurrentUser(res.user);
      addToast(`Sesión cambiada a: ${res.user.name} (${res.user.role})`, 'info');
    } catch (err: any) {
      addToast(err.message || 'Error al cambiar usuario', 'error');
    }
  }, [addToast]);

  const setActiveOperativeId = useCallback(async (id: string) => {
    try {
      await api.selectOperative(id);
      setData(prev => prev ? { ...prev, activeOperativeId: id } : prev);
      addToast('Operativo seleccionado correctamente', 'success');
    } catch (err: any) {
      addToast(err.message || 'Error al cambiar de operativo', 'error');
    }
  }, [addToast]);

  // Generates array of start time blocks: ["11:00", "11:20", ...]
  const generateTimeSlots = useCallback((
    startTime?: string, 
    endTime?: string, 
    slotMinutes?: number
  ): string[] => {
    const start = startTime || activeOperative?.startTime || '11:00';
    const end = endTime || activeOperative?.endTime || '17:00';
    const duration = slotMinutes || activeOperative?.slotDurationMinutes || 20;

    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);

    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;

    const slots: string[] = [];
    for (let time = startTotal; time + duration <= endTotal; time += duration) {
      const h = Math.floor(time / 60);
      const m = time % 60;
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }

    return slots;
  }, [activeOperative]);

  return (
    <AppContext.Provider value={{
      data,
      loading,
      error,
      activeOperative,
      currentUser,
      isConnected,
      toasts,
      removeToast,
      addToast,
      setCurrentUser,
      switchUser,
      setActiveOperativeId,
      generateTimeSlots,
      refreshData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
