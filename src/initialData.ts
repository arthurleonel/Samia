import { Client, Service, Professional, Appointment, OperatingHour, ThemePreset, ClinicSettings, UserAlert, RecentActivity } from './types';

export const INITIAL_CLIENTS: Client[] = [];

export const INITIAL_SERVICES: Service[] = [
  {
    id: 'srv-1',
    name: 'limpeza de pele',
    price: 30.00,
    duration: 60,
    visibleInBooking: true,
    status: 'Ativo'
  },
  {
    id: 'srv-2',
    name: 'harmonização facial',
    price: 1200.00,
    duration: 90,
    visibleInBooking: true,
    status: 'Ativo'
  },
  {
    id: 'srv-3',
    name: 'toxina botulínica',
    price: 800.00,
    duration: 45,
    visibleInBooking: true,
    status: 'Ativo'
  }
];

export const INITIAL_PROFESSIONALS: Professional[] = [
  {
    id: 'prof-1',
    name: 'Samia',
    role: 'Esteticista',
    status: 'Ativo',
    loginCreated: false,
    absences: []
  }
];

export const INITIAL_APPOINTMENTS: Appointment[] = [];

export const INITIAL_OPERATING_HOURS: OperatingHour[] = [
  { day: 'Segunda-feira', enabled: true, start: '08:00', end: '18:00' },
  { day: 'Terça-feira', enabled: true, start: '08:00', end: '18:00' },
  { day: 'Quarta-feira', enabled: true, start: '08:00', end: '18:00' },
  { day: 'Quinta-feira', enabled: true, start: '08:00', end: '18:00' },
  { day: 'Sexta-feira', enabled: true, start: '08:00', end: '18:00' },
  { day: 'Sábado', enabled: true, start: '09:00', end: '13:00' },
  { day: 'Domingo', enabled: false, start: '09:00', end: '13:00' }
];

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'cliniqly',
    name: 'Padrão Cliniqly',
    primary: '#A8C3A0', // sage green
    secondary: '#EFE6DA',
    background: '#F8F9FA',
    textColor: '#516E4E'
  },
  {
    id: 'minimalist',
    name: 'Minimalista',
    primary: '#1E293B',
    secondary: '#E2E8F0',
    background: '#F8F9FA',
    textColor: '#334155'
  },
  {
    id: 'elegant',
    name: 'Elegante',
    primary: '#A18260',
    secondary: '#F5F2EB',
    background: '#F9F8F6',
    textColor: '#705435'
  },
  {
    id: 'modern_clinic',
    name: 'Clínica Moderna',
    primary: '#4A9E9F',
    secondary: '#E8FAF8',
    background: '#F4F8F8',
    textColor: '#2E696A'
  },
  {
    id: 'dark_mode',
    name: 'Dark Mode',
    primary: '#8B5CF6',
    secondary: '#1E1B4B',
    background: '#0F172A',
    textColor: '#A78BFA'
  },
  {
    id: 'rose_aesthetic',
    name: 'Rosa Estético',
    primary: '#D98A99',
    secondary: '#FDF2F4',
    background: '#FDFBFB',
    textColor: '#C25D73'
  },
  {
    id: 'blue_pro',
    name: 'Azul Profissional',
    primary: '#3B82F6',
    secondary: '#EFF6FF',
    background: '#F8FAFC',
    textColor: '#1D4ED8'
  }
];

export const INITIAL_CLINIC_SETTINGS: ClinicSettings = {
  name: 'Samia',
  description: 'Clínica Estética avançada focada no seu bem-estar e realce da sua beleza natural.',
  address: 'Rua das Flores, 456, Jardim Paulista, Florianópolis - SC',
  whatsapp: '(48) 99636-7442',
  selectedThemeId: 'cliniqly',
  customPrimary: '#A8C3A0',
  customSecondary: '#EFE6DA',
  customBackground: '#F8F9FA',
  sidebarTitle: 'Lumini',
  sidebarSubtitle: 'Estética Avançada',
};

export const INITIAL_ALERTS: UserAlert[] = [];

export const INITIAL_ACTIVITIES: RecentActivity[] = [];
