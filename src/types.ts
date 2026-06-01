export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  birthdate: string;
  address: string;
  notes: string;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number; // in minutes
  visibleInBooking: boolean;
  status: 'Ativo' | 'Inativo';
}

export interface Absence {
  id: string;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endDate: string; // YYYY-MM-DD
  endTime: string; // HH:MM
  reason: string;
}

export interface Professional {
  id: string;
  name: string;
  role: string; // e.g. "Esteticista", "Biomédica Esteta"
  status: 'Ativo' | 'Inativo';
  loginCreated: boolean;
  loginEmail?: string;
  loginPassword?: string;
  absences: Absence[];
}

export interface Appointment {
  id: string;
  clientId: string;
  serviceId: string;
  professionalId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  status: 'Pendente' | 'Confirmado' | 'Ausente' | 'Finalizado';
  value: number;
  createdAt: string; // Timestamp
}

export interface OperatingHour {
  day: string; // Segunda-feira, Terça-feira etc
  enabled: boolean;
  start: string; // HH:MM
  end: string; // HH:MM
}

export interface ThemePreset {
  id: string;
  name: string;
  primary: string; // Hex
  secondary: string; // Hex
  background: string; // Hex
  textColor: string; // CSS color for text highlight
}

export interface ClinicSettings {
  name: string;
  description: string;
  address: string;
  whatsapp: string;
  selectedThemeId: string;
  customPrimary: string;
  customSecondary: string;
  customBackground: string;
  sidebarTitle?: string;
  sidebarSubtitle?: string;
  requireConfirmation?: boolean;
}

export interface UserAlert {
  id: string;
  title: string;
  description: string;
  type: 'danger' | 'info' | 'success' | 'warning';
}

export interface RecentActivity {
  id: string;
  text: string;
  timeAgo: string; // e.g. "há 4 minutos"
}

export interface PlanFeatures {
  maxAppointmentsMonth: number;
  maxClients: number;
  maxProfessionals: number;
  allowClinicalHistory: boolean;
  allowWhatsAppTemplates: boolean;
  allowMultiAgenda: boolean;
  allowAbsences: boolean;
  allowOnlineBooking: boolean;
  allowFinance: boolean;
  allowStock: boolean;
  allowCRM?: boolean;
  description?: string;
}

export type LeadStage = 'novo' | 'negociacao' | 'pendente_agendamento' | 'ganho' | 'arquivado';

export interface Lead {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  email: string;
  stage: LeadStage;
  value: number;
  interestServiceId?: string;
  notes: string;
  createdAt: string;
}

export function formatCurrency(value: any): string {
  const norm = Number(value) || 0;
  return norm.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatPhone(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length <= 2) {
    return digits.length > 0 ? `(${digits}` : '';
  }
  if (digits.length <= 6) {
    return `(${digits.substring(0, 2)}) ${digits.substring(2)}`;
  }
  if (digits.length <= 10) {
    return `(${digits.substring(0, 2)}) ${digits.substring(2, 6)}-${digits.substring(6)}`;
  }
  // Format as standard cell phone (11 digits: XX XXXXX-XXXX)
  return `(${digits.substring(0, 2)}) ${digits.substring(2, 7)}-${digits.substring(7, 11)}`;
}

export function formatDecimalDisplay(value: number | undefined | null): string {
  if (value === undefined || value === null) return '0,00';
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function parseDecimalFromInput(inputStr: string): number {
  if (!inputStr) return 0;
  const digits = inputStr.replace(/\D/g, '');
  if (!digits) return 0;
  return Number(digits) / 100;
}

