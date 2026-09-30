import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import type { 
  SystemData, 
  Operative, 
  Service, 
  Professional, 
  Patient, 
  Appointment, 
  WaitingListItem, 
  AuditLog, 
  User 
} from './src/types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial Seed Data
const initialOperative: Operative = {
  id: 'op-2026-10-17',
  name: 'OPERATIVO SOCIAL IBM',
  organization: 'Iglesia Bautista Millaray — IBM',
  address: 'Chacay 1164, Temuco, Chile',
  date: '2026-10-17',
  startTime: '11:00',
  endTime: '17:00',
  slotDurationMinutes: 20,
  active: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const initialServices: Service[] = [
  { id: 'srv-1', name: 'Fonoaudiología', description: 'Evaluación y terapia del habla, lenguaje y deglución', color: '#0284c7', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'srv-2', name: 'Psicología', description: 'Orientación psicológica, apoyo emocional y contención', color: '#7c3aed', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'srv-3', name: 'Asistencia Social', description: 'Orientación en beneficios del Estado, subsidios y redes de apoyo', color: '#059669', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'srv-4', name: 'Enfermería', description: 'Control de signos vitales, glicemia, presión arterial y curaciones', color: '#dc2626', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'srv-5', name: 'Asesoría Jurídica', description: 'Consultoría legal en familia, herencias, laboral y civil', color: '#d97706', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'srv-6', name: 'Óptica', description: 'Evaluación visual preventiva, agudeza y receta de lentes', color: '#2563eb', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'srv-7', name: 'Veterinaria', description: 'Atención primaria a mascotas, desparasitación y chequeo', color: '#16a34a', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'srv-8', name: 'Kinesiología', description: 'Evaluación musculoesquelética, dolor articular y movilidad', color: '#ea580c', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'srv-9', name: 'Estilismo', description: 'Cortes de cabello y estética comunitaria', color: '#db2777', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'srv-10', name: 'Podología', description: 'Cuidado clínico de pies, uñas y prevención en pie diabético', color: '#4f46e5', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'srv-11', name: 'Matronería', description: 'Orientación en salud reproductiva, exámenes preventivos y consejería', color: '#9333ea', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
];

const initialProfessionals: Professional[] = [
  { id: 'prof-1', name: 'Fonoaudiología', surname: '', specialty: 'Fonoaudiología', email: 'fonoaudiologia@ibm.cl', userEmail: 'fonoaudiologia@ibm.cl', phone: '', serviceIds: ['srv-1'], active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'prof-2', name: 'Psicología', surname: '', specialty: 'Psicología', email: 'psicologia@ibm.cl', userEmail: 'psicologia@ibm.cl', phone: '', serviceIds: ['srv-2'], active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'prof-3', name: 'Asistencia Social', surname: '', specialty: 'Asistencia Social', email: 'asistencia.social@ibm.cl', userEmail: 'asistencia.social@ibm.cl', phone: '', serviceIds: ['srv-3'], active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'prof-4', name: 'Enfermería', surname: '', specialty: 'Enfermería', email: 'enfermeria@ibm.cl', userEmail: 'enfermeria@ibm.cl', phone: '', serviceIds: ['srv-4'], active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'prof-5', name: 'Asesoría Jurídica', surname: '', specialty: 'Asesoría Jurídica', email: 'asesoria.juridica@ibm.cl', userEmail: 'asesoria.juridica@ibm.cl', phone: '', serviceIds: ['srv-5'], active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'prof-6', name: 'Óptica', surname: '', specialty: 'Óptica', email: 'optica@ibm.cl', userEmail: 'optica@ibm.cl', phone: '', serviceIds: ['srv-6'], active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'prof-7', name: 'Veterinaria', surname: '', specialty: 'Veterinaria', email: 'veterinaria@ibm.cl', userEmail: 'veterinaria@ibm.cl', phone: '', serviceIds: ['srv-7'], active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'prof-8', name: 'Kinesiología', surname: '', specialty: 'Kinesiología', email: 'kinesiologia@ibm.cl', userEmail: 'kinesiologia@ibm.cl', phone: '', serviceIds: ['srv-8'], active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'prof-9', name: 'Estilismo', surname: '', specialty: 'Estilismo', email: 'estilismo@ibm.cl', userEmail: 'estilismo@ibm.cl', phone: '', serviceIds: ['srv-9'], active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'prof-10', name: 'Podología', surname: '', specialty: 'Podología', email: 'podologia@ibm.cl', userEmail: 'podologia@ibm.cl', phone: '', serviceIds: ['srv-10'], active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'prof-11', name: 'Matronería', surname: '', specialty: 'Matronería', email: 'matroneria@ibm.cl', userEmail: 'matroneria@ibm.cl', phone: '', serviceIds: ['srv-11'], active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
];

const initialUsers: User[] = [
  { id: 'usr-admin', name: 'Pastor Administrador', email: 'admin@ibm.cl', role: 'ADMIN' },
  { id: 'usr-recep1', name: 'Recepción Central', email: 'recepcion@ibm.cl', role: 'RECEPCION' },
  { id: 'usr-recep2', name: 'Recepción 02', email: 'recepcion2@ibm.cl', role: 'RECEPCION' },
  { id: 'usr-psico', name: 'Psicología', email: 'psicologia@ibm.cl', role: 'PROFESIONAL', professionalId: 'prof-2' },
  { id: 'usr-enf', name: 'Enfermería', email: 'enfermeria@ibm.cl', role: 'PROFESIONAL', professionalId: 'prof-4' },
  { id: 'usr-kine', name: 'Kinesiología', email: 'kinesiologia@ibm.cl', role: 'PROFESIONAL', professionalId: 'prof-8' },
  { id: 'usr-soc', name: 'Asistencia Social', email: 'asistencia.social@ibm.cl', role: 'PROFESIONAL', professionalId: 'prof-3' },
  { id: 'usr-vet', name: 'Veterinaria', email: 'veterinaria@ibm.cl', role: 'PROFESIONAL', professionalId: 'prof-7' },
  { id: 'usr-fono', name: 'Fonoaudiología', email: 'fonoaudiologia@ibm.cl', role: 'PROFESIONAL', professionalId: 'prof-1' },
  { id: 'usr-opt', name: 'Óptica', email: 'optica@ibm.cl', role: 'PROFESIONAL', professionalId: 'prof-6' },
  { id: 'usr-pod', name: 'Podología', email: 'podologia@ibm.cl', role: 'PROFESIONAL', professionalId: 'prof-10' },
  { id: 'usr-mat', name: 'Matronería', email: 'matroneria@ibm.cl', role: 'PROFESIONAL', professionalId: 'prof-11' },
  { id: 'usr-est', name: 'Estilismo', email: 'estilismo@ibm.cl', role: 'PROFESIONAL', professionalId: 'prof-9' },
  { id: 'usr-jur', name: 'Asesoría Jurídica', email: 'asesoria.juridica@ibm.cl', role: 'PROFESIONAL', professionalId: 'prof-5' }
];

const initialPatients: Patient[] = [];

const initialAppointments: Appointment[] = [];

const initialWaitingList: WaitingListItem[] = [];

const initialAuditLogs: AuditLog[] = [
  {
    id: 'log-init',
    userId: 'usr-admin',
    userName: 'Pastor Administrador',
    action: 'Inicialización de Operativo',
    entityType: 'operative',
    entityId: 'op-2026-10-17',
    details: 'Configuración lista para el Operativo Social IBM en Chacay 1164, Temuco',
    timestamp: new Date().toISOString()
  }
];

function loadDatabase(): SystemData {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error loading db.json, falling back to seed:', err);
  }

  const initialData: SystemData = {
    operatives: [initialOperative],
    activeOperativeId: initialOperative.id,
    services: initialServices,
    professionals: initialProfessionals,
    patients: initialPatients,
    appointments: initialAppointments,
    waitingList: initialWaitingList,
    users: initialUsers,
    auditLogs: initialAuditLogs
  };

  saveDatabase(initialData);
  return initialData;
}

function saveDatabase(data: SystemData) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving db.json:', err);
  }
}

// In-Memory state
let db: SystemData = loadDatabase();

// In-Memory booking lock mutex to guarantee atomic concurrency
const bookingLocks = new Set<string>();

function getBookingLockKey(operativeId: string, professionalId: string, date: string, startTime: string): string {
  return `${operativeId}_${professionalId}_${date}_${startTime}`;
}

// Connected SSE clients
type SSEClient = {
  id: number;
  res: express.Response;
  userRole?: string;
  professionalId?: string;
};
let clients: SSEClient[] = [];
let nextClientId = 1;

function broadcast(eventType: string, payload: any) {
  const message = `event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of clients) {
    try {
      client.res.write(message);
    } catch {
      // client disconnected
    }
  }
}

function logAudit(userId: string, userName: string, action: string, entityType: AuditLog['entityType'], entityId: string, details: string) {
  const log: AuditLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    userId,
    userName,
    action,
    entityType,
    entityId,
    details,
    timestamp: new Date().toISOString()
  };
  db.auditLogs.unshift(log);
  if (db.auditLogs.length > 500) {
    db.auditLogs.pop();
  }
  return log;
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // SSE Stream for Realtime updates
  app.get('/api/realtime/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const clientId = nextClientId++;
    const client: SSEClient = {
      id: clientId,
      res,
      userRole: req.query.role as string,
      professionalId: req.query.professionalId as string
    };
    clients.push(client);

    // Send initial sync
    res.write(`event: sync\ndata: ${JSON.stringify(db)}\n\n`);

    // Keepalive ping every 15s
    const pingInterval = setInterval(() => {
      try {
        res.write(': ping\n\n');
      } catch {
        clearInterval(pingInterval);
      }
    }, 15000);

    req.on('close', () => {
      clearInterval(pingInterval);
      clients = clients.filter(c => c.id !== clientId);
    });
  });

  // GET complete state
  app.get('/api/data', (_req, res) => {
    res.json(db);
  });

  // Quick switch or auth login
  app.post('/api/auth/login', (req, res) => {
    const { email } = req.body;
    let user = db.users.find(u => u.email.toLowerCase() === (email || '').toLowerCase());
    
    // If not found in users list, check if it's a registered professional
    if (!user) {
      const prof = db.professionals.find(p => p.email?.toLowerCase() === email?.toLowerCase());
      if (prof) {
        user = {
          id: `usr-${prof.id}`,
          name: `${prof.name} ${prof.surname}`,
          email: prof.email || `${prof.name.toLowerCase()}@ibm.cl`,
          role: 'PROFESIONAL',
          professionalId: prof.id
        };
        db.users.push(user);
        saveDatabase(db);
      }
    }

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ user });
  });

  // Operative endpoints
  app.post('/api/operatives', (req, res) => {
    const { name, organization, address, date, startTime, endTime, slotDurationMinutes, userId, userName } = req.body;
    if (!name || !date || !startTime || !endTime) {
      return res.status(400).json({ error: 'Faltan campos obligatorios para el operativo' });
    }

    const newOp: Operative = {
      id: `op-${Date.now()}`,
      name,
      organization: organization || 'Iglesia Bautista Millaray — IBM',
      address: address || 'Chacay 1164, Temuco, Chile',
      date,
      startTime,
      endTime,
      slotDurationMinutes: Number(slotDurationMinutes) || 20,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.operatives.push(newOp);
    logAudit(userId || 'admin', userName || 'Administrador', 'Creó operativo', 'operative', newOp.id, `Operativo: ${newOp.name} (${newOp.date})`);
    saveDatabase(db);
    broadcast('operative:created', newOp);
    res.status(201).json(newOp);
  });

  app.put('/api/operatives/:id', (req, res) => {
    const { id } = req.params;
    const { name, organization, address, date, startTime, endTime, slotDurationMinutes, active, userId, userName } = req.body;
    const op = db.operatives.find(o => o.id === id);
    if (!op) return res.status(404).json({ error: 'Operativo no encontrado' });

    if (name !== undefined) op.name = name;
    if (organization !== undefined) op.organization = organization;
    if (address !== undefined) op.address = address;
    if (date !== undefined) op.date = date;
    if (startTime !== undefined) op.startTime = startTime;
    if (endTime !== undefined) op.endTime = endTime;
    if (slotDurationMinutes !== undefined) op.slotDurationMinutes = Number(slotDurationMinutes);
    if (active !== undefined) op.active = active;
    op.updatedAt = new Date().toISOString();

    logAudit(userId || 'admin', userName || 'Administrador', 'Modificó operativo', 'operative', op.id, `Actualizó datos de: ${op.name}`);
    saveDatabase(db);
    broadcast('operative:updated', op);
    res.json(op);
  });

  app.post('/api/operatives/select', (req, res) => {
    const { operativeId } = req.body;
    const op = db.operatives.find(o => o.id === operativeId);
    if (!op) return res.status(404).json({ error: 'Operativo no encontrado' });
    db.activeOperativeId = operativeId;
    saveDatabase(db);
    broadcast('operative:active_changed', { activeOperativeId: operativeId });
    res.json({ activeOperativeId: operativeId });
  });

  // Services endpoints
  app.post('/api/services', (req, res) => {
    const { name, description, color, userId, userName } = req.body;
    if (!name) return res.status(400).json({ error: 'El nombre del servicio es obligatorio' });

    const newSrv: Service = {
      id: `srv-${Date.now()}`,
      name,
      description: description || '',
      color: color || '#2563eb',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.services.push(newSrv);
    logAudit(userId || 'admin', userName || 'Administrador', 'Creó servicio', 'service', newSrv.id, `Servicio: ${newSrv.name}`);
    saveDatabase(db);
    broadcast('service:created', newSrv);
    res.status(201).json(newSrv);
  });

  app.put('/api/services/:id', (req, res) => {
    const { id } = req.params;
    const { name, description, color, active, userId, userName } = req.body;
    const srv = db.services.find(s => s.id === id);
    if (!srv) return res.status(404).json({ error: 'Servicio no encontrado' });

    if (name !== undefined) srv.name = name;
    if (description !== undefined) srv.description = description;
    if (color !== undefined) srv.color = color;
    if (active !== undefined) srv.active = active;
    srv.updatedAt = new Date().toISOString();

    const actionText = active === false ? 'Desactivó servicio' : (active === true ? 'Reactivó servicio' : 'Modificó servicio');
    logAudit(userId || 'admin', userName || 'Administrador', actionText, 'service', srv.id, `${srv.name} (Estado: ${srv.active ? 'Activo' : 'Inactivo'})`);
    saveDatabase(db);
    broadcast('service:updated', srv);
    res.json(srv);
  });

  // Professionals endpoints
  app.post('/api/professionals', (req, res) => {
    const { name, surname, specialty, phone, email, serviceIds, availabilityNote, userId, userName } = req.body;
    if (!name || !surname || !specialty || !serviceIds || !serviceIds.length) {
      return res.status(400).json({ error: 'Nombre, apellido, especialidad y al menos un servicio son requeridos' });
    }

    const newProf: Professional = {
      id: `prof-${Date.now()}`,
      name,
      surname,
      specialty,
      phone: phone || '',
      email: email || '',
      userEmail: email || '',
      serviceIds,
      availabilityNote: availabilityNote || '',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.professionals.push(newProf);

    // Also register user so they can log in
    if (newProf.email) {
      const existingUser = db.users.find(u => u.email.toLowerCase() === newProf.email?.toLowerCase());
      if (!existingUser) {
        db.users.push({
          id: `usr-${newProf.id}`,
          name: `${newProf.name} ${newProf.surname}`,
          email: newProf.email,
          role: 'PROFESIONAL',
          professionalId: newProf.id
        });
      }
    }

    logAudit(userId || 'admin', userName || 'Administrador', 'Creó profesional', 'professional', newProf.id, `Profesional: ${newProf.name} ${newProf.surname} (${newProf.specialty})`);
    saveDatabase(db);
    broadcast('professional:created', newProf);
    res.status(201).json(newProf);
  });

  app.put('/api/professionals/:id', (req, res) => {
    const { id } = req.params;
    const { name, surname, specialty, phone, email, serviceIds, availabilityNote, active, userId, userName } = req.body;
    const prof = db.professionals.find(p => p.id === id);
    if (!prof) return res.status(404).json({ error: 'Profesional no encontrado' });

    if (name !== undefined) prof.name = name;
    if (surname !== undefined) prof.surname = surname;
    if (specialty !== undefined) prof.specialty = specialty;
    if (phone !== undefined) prof.phone = phone;
    if (email !== undefined) prof.email = email;
    if (serviceIds !== undefined) prof.serviceIds = serviceIds;
    if (availabilityNote !== undefined) prof.availabilityNote = availabilityNote;
    if (active !== undefined) prof.active = active;
    prof.updatedAt = new Date().toISOString();

    const actionText = active === false ? 'Desactivó profesional' : (active === true ? 'Reactivó profesional' : 'Modificó profesional');
    logAudit(userId || 'admin', userName || 'Administrador', actionText, 'professional', prof.id, `${prof.name} ${prof.surname} (Estado: ${prof.active ? 'Activo' : 'Inactivo'})`);
    saveDatabase(db);
    broadcast('professional:updated', prof);
    res.json(prof);
  });

  // Patients endpoints & duplicate check
  app.get('/api/patients/check-duplicate', (req, res) => {
    const { phone, name, surname } = req.query as { phone?: string; name?: string; surname?: string };
    const cleanPhone = (phone || '').replace(/\s+/g, '');
    const cleanName = (name || '').trim().toLowerCase();
    const cleanSurname = (surname || '').trim().toLowerCase();

    const matches = db.patients.filter(p => {
      const pPhone = p.phone.replace(/\s+/g, '');
      const phoneMatch = cleanPhone && pPhone && (cleanPhone === pPhone || pPhone.includes(cleanPhone) || cleanPhone.includes(pPhone));
      const nameMatch = cleanName && cleanSurname && 
        p.name.toLowerCase().includes(cleanName) && 
        p.surname.toLowerCase().includes(cleanSurname);
      return phoneMatch || nameMatch;
    });

    res.json({ duplicates: matches });
  });

  app.post('/api/patients', (req, res) => {
    const { name, surname, phone, rut, birthDate, age, email, observations, dataConsent, userId, userName } = req.body;
    if (!name || !surname || !phone) {
      return res.status(400).json({ error: 'Nombre, apellido y teléfono son requeridos' });
    }

    const newPat: Patient = {
      id: `pat-${Date.now()}`,
      name: name.trim(),
      surname: surname.trim(),
      phone: phone.trim(),
      rut: rut?.trim() || '',
      birthDate: birthDate || '',
      age: age ? Number(age) : undefined,
      email: email?.trim() || '',
      observations: observations || '',
      dataConsent: dataConsent ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.patients.push(newPat);
    logAudit(userId || 'recepcion', userName || 'Recepción', 'Creó paciente', 'patient', newPat.id, `Paciente: ${newPat.name} ${newPat.surname} (${newPat.phone})`);
    saveDatabase(db);
    broadcast('patient:created', newPat);
    res.status(201).json(newPat);
  });

  app.put('/api/patients/:id', (req, res) => {
    const { id } = req.params;
    const { name, surname, phone, rut, birthDate, age, email, observations, dataConsent, userId, userName } = req.body;
    const pat = db.patients.find(p => p.id === id);
    if (!pat) return res.status(404).json({ error: 'Paciente no encontrado' });

    if (name !== undefined) pat.name = name.trim();
    if (surname !== undefined) pat.surname = surname.trim();
    if (phone !== undefined) pat.phone = phone.trim();
    if (rut !== undefined) pat.rut = rut?.trim();
    if (birthDate !== undefined) pat.birthDate = birthDate;
    if (age !== undefined) pat.age = age ? Number(age) : undefined;
    if (email !== undefined) pat.email = email?.trim();
    if (observations !== undefined) pat.observations = observations;
    if (dataConsent !== undefined) pat.dataConsent = dataConsent;
    pat.updatedAt = new Date().toISOString();

    logAudit(userId || 'recepcion', userName || 'Recepción', 'Modificó paciente', 'patient', pat.id, `Actualizó datos de: ${pat.name} ${pat.surname}`);
    saveDatabase(db);
    broadcast('patient:updated', pat);
    res.json(pat);
  });

  // Appointments endpoints WITH ATOMIC LOCK PREVENTING DOUBLE BOOKING
  app.post('/api/appointments', async (req, res) => {
    const { 
      operativeId, 
      patientId, 
      serviceId, 
      professionalId, 
      date, 
      startTime, 
      endTime, 
      observations,
      userId,
      userName,
      autoAssign // Boolean
    } = req.body;

    if (!operativeId || !patientId || !serviceId || !date || !startTime) {
      return res.status(400).json({ error: 'Faltan parámetros indispensables para la reserva' });
    }

    const op = db.operatives.find(o => o.id === operativeId);
    if (!op) return res.status(404).json({ error: 'Operativo no encontrado' });

    const patient = db.patients.find(p => p.id === patientId);
    if (!patient) return res.status(404).json({ error: 'Paciente no encontrado' });

    const service = db.services.find(s => s.id === serviceId);
    if (!service || !service.active) {
      return res.status(400).json({ error: 'El servicio seleccionado no está activo' });
    }

    let targetProfId = professionalId;

    // Auto assignment logic
    if (autoAssign || !targetProfId || targetProfId === 'auto') {
      const candidateProfs = db.professionals.filter(p => p.active && p.serviceIds.includes(serviceId));
      if (!candidateProfs.length) {
        return res.status(400).json({ error: 'No hay profesionales activos disponibles para este servicio' });
      }

      // Find candidate professionals who are free at this exact slot
      const availableCandidates = candidateProfs.filter(prof => {
        const isOccupied = db.appointments.some(
          a => a.operativeId === operativeId &&
               a.professionalId === prof.id &&
               a.date === date &&
               a.startTime === startTime &&
               a.status !== 'Cancelado'
        );
        return !isOccupied;
      });

      if (!availableCandidates.length) {
        return res.status(409).json({ error: 'Todos los profesionales de este servicio están ocupados en este horario' });
      }

      // Pick the professional with fewest total appointments today to balance load
      availableCandidates.sort((a, b) => {
        const countA = db.appointments.filter(apt => apt.professionalId === a.id && apt.operativeId === operativeId && apt.status !== 'Cancelado').length;
        const countB = db.appointments.filter(apt => apt.professionalId === b.id && apt.operativeId === operativeId && apt.status !== 'Cancelado').length;
        return countA - countB;
      });

      targetProfId = availableCandidates[0].id;
    }

    const professional = db.professionals.find(p => p.id === targetProfId);
    if (!professional || !professional.active) {
      return res.status(400).json({ error: 'Este profesional está inactivo o no existe' });
    }

    // ATOMIC LOCK SECTION
    const lockKey = getBookingLockKey(operativeId, targetProfId, date, startTime);
    if (bookingLocks.has(lockKey)) {
      return res.status(409).json({ error: 'Este horario está en proceso de reserva simultánea. Seleccione otro horario.' });
    }

    bookingLocks.add(lockKey);

    try {
      // 1. Critical Check: Is this slot already occupied?
      const existingAppointment = db.appointments.find(
        a => a.operativeId === operativeId &&
             a.professionalId === targetProfId &&
             a.date === date &&
             a.startTime === startTime &&
             a.status !== 'Cancelado'
      );

      if (existingAppointment) {
        return res.status(409).json({ 
          error: 'Este horario acaba de ser ocupado. Seleccione otro horario.' 
        });
      }

      // 2. Critical Check: Does this patient already have an active appointment for the SAME service today?
      const patientDuplicateService = db.appointments.find(
        a => a.operativeId === operativeId &&
             a.patientId === patientId &&
             a.serviceId === serviceId &&
             a.date === date &&
             a.status !== 'Cancelado'
      );

      if (patientDuplicateService) {
        return res.status(400).json({
          error: `El paciente ya tiene una reserva en ${service.name} a las ${patientDuplicateService.startTime} hrs.`
        });
      }

      // Calculate endTime based on operative slot duration if not provided
      let calculatedEndTime = endTime;
      if (!calculatedEndTime) {
        const [hours, minutes] = startTime.split(':').map(Number);
        const slotMinutes = op.slotDurationMinutes || 20;
        const totalMinutes = hours * 60 + minutes + slotMinutes;
        const endH = Math.floor(totalMinutes / 60);
        const endM = totalMinutes % 60;
        calculatedEndTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
      }

      const newAppointment: Appointment = {
        id: `apt-${Date.now()}`,
        operativeId,
        patientId,
        patientName: `${patient.name} ${patient.surname}`,
        patientPhone: patient.phone,
        patientRut: patient.rut,
        serviceId,
        serviceName: service.name,
        professionalId: targetProfId,
        professionalName: professional.specialty || professional.name,
        date,
        startTime,
        endTime: calculatedEndTime,
        status: 'Esperando', // Starts directly in Esperando or Reservado
        observations: observations || '',
        createdByUserId: userId || 'recepcion',
        createdByUserName: userName || 'Recepción Central',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      db.appointments.push(newAppointment);

      // If patient was in waiting list for this service, mark as Asignado
      const wlItem = db.waitingList.find(w => w.patientId === patientId && w.serviceId === serviceId && w.status === 'Pendiente');
      if (wlItem) {
        wlItem.status = 'Asignado';
        broadcast('waiting_list:updated', wlItem);
      }

      logAudit(
        userId || 'recepcion', 
        userName || 'Recepción Central', 
        'Creó reserva', 
        'appointment', 
        newAppointment.id, 
        `${newAppointment.patientName} → ${newAppointment.serviceName} con ${newAppointment.professionalName} (${newAppointment.startTime})`
      );

      saveDatabase(db);
      broadcast('appointment:created', newAppointment);

      return res.status(201).json(newAppointment);
    } finally {
      // Release lock
      bookingLocks.delete(lockKey);
    }
  });

  // Change appointment status (Esperando -> En atención -> Atendido, etc.)
  app.patch('/api/appointments/:id/status', (req, res) => {
    const { id } = req.params;
    const { status, attentionNotes, userId, userName } = req.body;
    const apt = db.appointments.find(a => a.id === id);
    if (!apt) return res.status(404).json({ error: 'Reserva no encontrada' });

    const previousStatus = apt.status;
    apt.status = status;
    apt.updatedAt = new Date().toISOString();

    if (attentionNotes !== undefined) {
      apt.attentionNotes = attentionNotes;
    }

    if (status === 'En atención' && !apt.startedAt) {
      apt.startedAt = new Date().toISOString();
    } else if (status === 'Atendido' && !apt.attendedAt) {
      apt.attendedAt = new Date().toISOString();
    }

    logAudit(
      userId || 'usr-prof', 
      userName || 'Profesional', 
      'Cambió estado de reserva', 
      'appointment', 
      apt.id, 
      `${apt.patientName} (${apt.serviceName}): de "${previousStatus}" a "${status}"`
    );

    saveDatabase(db);
    broadcast('appointment:status_changed', apt);
    res.json(apt);
  });

  // Modify appointment (reschedule, change professional, etc.)
  app.put('/api/appointments/:id', (req, res) => {
    const { id } = req.params;
    const { professionalId, startTime, endTime, date, observations, userId, userName } = req.body;
    const apt = db.appointments.find(a => a.id === id);
    if (!apt) return res.status(404).json({ error: 'Reserva no encontrada' });

    const newProfId = professionalId || apt.professionalId;
    const newDate = date || apt.date;
    const newStart = startTime || apt.startTime;

    // Check if new slot conflicts with another appointment
    if (newProfId !== apt.professionalId || newDate !== apt.date || newStart !== apt.startTime) {
      const conflict = db.appointments.find(
        a => a.id !== id &&
             a.operativeId === apt.operativeId &&
             a.professionalId === newProfId &&
             a.date === newDate &&
             a.startTime === newStart &&
             a.status !== 'Cancelado'
      );
      if (conflict) {
        return res.status(409).json({ error: 'El horario de destino ya está ocupado por otro paciente' });
      }
    }

    if (professionalId) {
      const prof = db.professionals.find(p => p.id === professionalId);
      if (prof) {
        apt.professionalId = prof.id;
        apt.professionalName = `${prof.name} ${prof.surname}`;
      }
    }
    if (startTime) apt.startTime = startTime;
    if (endTime) apt.endTime = endTime;
    if (date) apt.date = date;
    if (observations !== undefined) apt.observations = observations;
    apt.updatedAt = new Date().toISOString();

    logAudit(
      userId || 'recepcion', 
      userName || 'Recepción', 
      'Modificó reserva', 
      'appointment', 
      apt.id, 
      `Reserva de ${apt.patientName}: ${apt.serviceName} a las ${apt.startTime} hrs con ${apt.professionalName}`
    );

    saveDatabase(db);
    broadcast('appointment:updated', apt);
    res.json(apt);
  });

  // Cancel / Delete appointment
  app.delete('/api/appointments/:id', (req, res) => {
    const { id } = req.params;
    const { userId, userName, reason, hardDelete } = req.query as { userId?: string; userName?: string; reason?: string; hardDelete?: string };
    const apt = db.appointments.find(a => a.id === id);
    if (!apt) return res.status(404).json({ error: 'Reserva no encontrada' });

    // If hardDelete is true (or requested to permanently delete):
    if (hardDelete !== 'false') {
      db.appointments = db.appointments.filter(a => a.id !== id);
      logAudit(
        userId || 'recepcion', 
        userName || 'Recepción', 
        'Eliminó reserva', 
        'appointment', 
        id, 
        `Eliminó definitivamente la cita de ${apt.patientName} (${apt.serviceName} a las ${apt.startTime} hrs)`
      );
      saveDatabase(db);
      broadcast('appointment:deleted', { id });
      return res.json({ message: 'Cita eliminada de la agenda', id });
    }

    // Soft delete if explicitly requested:
    apt.status = 'Cancelado';
    apt.observations = reason ? `${apt.observations ? apt.observations + ' | ' : ''}Cancelación: ${reason}` : apt.observations;
    apt.updatedAt = new Date().toISOString();

    logAudit(
      userId || 'recepcion', 
      userName || 'Recepción', 
      'Canceló reserva', 
      'appointment', 
      apt.id, 
      `Canceló cita de ${apt.patientName} con ${apt.professionalName} (${apt.startTime})${reason ? ' Motivo: ' + reason : ''}`
    );

    saveDatabase(db);
    broadcast('appointment:cancelled', apt);
    res.json(apt);
  });

  // Waiting list endpoints
  app.post('/api/waiting-list', (req, res) => {
    const { operativeId, patientId, serviceId, priority, observations, userId, userName } = req.body;
    if (!operativeId || !patientId || !serviceId) {
      return res.status(400).json({ error: 'Operativo, paciente y servicio son obligatorios' });
    }

    const patient = db.patients.find(p => p.id === patientId);
    const service = db.services.find(s => s.id === serviceId);
    if (!patient || !service) return res.status(404).json({ error: 'Paciente o servicio no encontrado' });

    const newItem: WaitingListItem = {
      id: `wl-${Date.now()}`,
      operativeId,
      patientId,
      patientName: `${patient.name} ${patient.surname}`,
      patientPhone: patient.phone,
      serviceId,
      serviceName: service.name,
      priority: priority || 'Media',
      observations: observations || '',
      status: 'Pendiente',
      createdAt: new Date().toISOString()
    };

    db.waitingList.push(newItem);
    logAudit(userId || 'recepcion', userName || 'Recepción', 'Agregó a lista de espera', 'waiting_list', newItem.id, `${newItem.patientName} en ${newItem.serviceName} (Prioridad: ${newItem.priority})`);
    saveDatabase(db);
    broadcast('waiting_list:created', newItem);
    res.status(201).json(newItem);
  });

  app.patch('/api/waiting-list/:id', (req, res) => {
    const { id } = req.params;
    const { status, userId, userName } = req.body;
    const item = db.waitingList.find(w => w.id === id);
    if (!item) return res.status(404).json({ error: 'Registro de lista de espera no encontrado' });

    item.status = status;
    logAudit(userId || 'recepcion', userName || 'Recepción', 'Actualizó lista de espera', 'waiting_list', item.id, `${item.patientName} estado: ${status}`);
    saveDatabase(db);
    broadcast('waiting_list:updated', item);
    res.json(item);
  });

  // Delete patient
  app.delete('/api/patients/:id', (req, res) => {
    const { id } = req.params;
    const { userId, userName } = req.query as { userId?: string; userName?: string };
    const pat = db.patients.find(p => p.id === id);
    if (!pat) return res.status(404).json({ error: 'Paciente no encontrado' });

    db.patients = db.patients.filter(p => p.id !== id);
    db.appointments = db.appointments.filter(a => a.patientId !== id);
    db.waitingList = db.waitingList.filter(w => w.patientId !== id);

    logAudit(userId || 'recepcion', userName || 'Recepción', 'Eliminó paciente', 'patient', id, `Eliminó registro de: ${pat.name} ${pat.surname}`);
    saveDatabase(db);
    broadcast('sync', db);
    res.json({ message: 'Paciente eliminado', id });
  });

  // Delete professional
  app.delete('/api/professionals/:id', (req, res) => {
    const { id } = req.params;
    const { userId, userName } = req.query as { userId?: string; userName?: string };
    const prof = db.professionals.find(p => p.id === id);
    if (!prof) return res.status(404).json({ error: 'Profesional no encontrado' });

    db.professionals = db.professionals.filter(p => p.id !== id);
    db.appointments = db.appointments.filter(a => a.professionalId !== id);

    logAudit(userId || 'admin', userName || 'Administrador', 'Eliminó profesional', 'professional', id, `Eliminó a: ${prof.name} ${prof.surname}`);
    saveDatabase(db);
    broadcast('sync', db);
    res.json({ message: 'Profesional eliminado', id });
  });

  // Clear all operational data (leaves operative & services clean for live event)
  app.post('/api/clear-operational-data', (req, res) => {
    const { userId, userName } = req.body;
    db.patients = [];
    db.appointments = [];
    db.waitingList = [];
    db.auditLogs = [
      {
        id: `log-${Date.now()}`,
        userId: userId || 'admin',
        userName: userName || 'Pastor Administrador',
        action: 'Puesta en Marcha Operativo Real',
        entityType: 'operative',
        entityId: db.activeOperativeId,
        details: 'Se han eliminado todos los pacientes y citas previas. Sistema listo y en cero para el Operativo Social IBM.',
        timestamp: new Date().toISOString()
      }
    ];

    saveDatabase(db);
    broadcast('sync', db);
    res.json({ message: 'Datos operativos vaciados exitosamente. Sistema en cero.', db });
  });

  // Reset database endpoint (for testing/clearing)
  app.post('/api/reset-data', (_req, res) => {
    db = {
      operatives: [initialOperative],
      activeOperativeId: initialOperative.id,
      services: initialServices,
      professionals: initialProfessionals,
      patients: [],
      appointments: [],
      waitingList: [],
      users: initialUsers,
      auditLogs: [
        {
          id: `log-${Date.now()}`,
          userId: 'usr-admin',
          userName: 'Pastor Administrador',
          action: 'Limpieza e Inicialización',
          entityType: 'operative',
          entityId: initialOperative.id,
          details: 'Datos limpios para comenzar el Operativo Social IBM en Chacay 1164',
          timestamp: new Date().toISOString()
        }
      ]
    };
    saveDatabase(db);
    broadcast('sync', db);
    res.json({ message: 'Sistema restaurado con éxito y sin datos ficticios', db });
  });

  // Attach Vite middleware in development
  const vite = await createViteServer({
    server: { 
      middlewareMode: true,
      allowedHosts: true
    },
    appType: 'spa'
  });
  app.use(vite.middlewares);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[OPERATIVO SOCIAL IBM] Server running at http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
