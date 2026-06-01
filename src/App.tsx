import React, { useState, useEffect } from 'react';
import { 
  Appointment, Client, Service, Professional, OperatingHour, ClinicSettings, UserAlert, RecentActivity, ThemePreset, Absence, PlanFeatures, Lead, LeadStage, formatPhone, formatCurrency, formatDecimalDisplay, parseDecimalFromInput
} from './types';
import { 
  INITIAL_CLIENTS, INITIAL_SERVICES, INITIAL_PROFESSIONALS, INITIAL_APPOINTMENTS, 
  INITIAL_OPERATING_HOURS, THEME_PRESETS, INITIAL_CLINIC_SETTINGS, INITIAL_ALERTS, INITIAL_ACTIVITIES 
} from './initialData';

// Import Custom Views
import DashboardView from './components/DashboardView';
import AgendamentosView from './components/AgendamentosView';
import ClientesView from './components/ClientesView';
import ServicosView from './components/ServicosView';
import EquipeView from './components/EquipeView';
import HorariosView from './components/HorariosView';
import MensagensView from './components/MensagensView';
import PaginaPublicaView from './components/PaginaPublicaView';
import PlanosView from './components/PlanosView';
import LoginView from './components/LoginView';
import SuperadminView from './components/SuperadminView';
import LeadsView from './components/LeadsView';
import PublicBookingView from './components/PublicBookingView';
import { Shield } from 'lucide-react';

// Icons
import { 
  LayoutDashboard, Calendar, Users, Sparkles, UserCheck, Clock, TrendingUp, Package, 
  MessageSquare, Eye, Award, Copy, Check, LogOut, ChevronRight, X, Plus, AlertCircle, DollarSign, Columns
} from 'lucide-react';

function generateUniqueId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export default function App() {
  // SaaS Multi-Tenant states
  const [session, setSession] = useState<{ role: 'admin' | 'clinic'; tenantId?: string; impersonated?: boolean } | null>(() => {
    const saved = localStorage.getItem('lumini_active_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [tenants, setTenants] = useState<any[]>(() => {
    const saved = localStorage.getItem('lumini_tenants');
    if (saved) {
      try {
        let parsed = JSON.parse(saved);
        let changed = false;
        parsed = parsed.map((t: any) => {
          if (t.id === 'trial-clinic' && (t.name === 'Lumini' || t.email === 'doc@lumini.com' || t.sidebarTitle === 'Lumini')) {
            changed = true;
            return {
              ...t,
              name: 'Leonel CRM',
              email: 'doc@leonel.com',
              sidebarTitle: 'Leonel CRM'
            };
          }
          if (t.id === 'sorella-clinic' && t.email === 'sorella@lumini.com') {
            changed = true;
            return {
              ...t,
              email: 'sorella@leonel.com'
            };
          }
          return t;
        });
        if (changed) {
          localStorage.setItem('lumini_tenants', JSON.stringify(parsed));
        }
        return parsed;
      } catch (e) {
        // ignore parsing error, fallback to initial
      }
    }
    const initial = [
      {
        id: 'trial-clinic',
        name: 'Leonel CRM',
        email: 'doc@leonel.com',
        password: '123',
        phone: '(48) 99876-0001',
        plan: 'Clínica',
        status: 'Ativo',
        sidebarTitle: 'Leonel CRM',
        sidebarSubtitle: 'Estética Avançada',
        createdAt: new Date().toISOString()
      },
      {
        id: 'sorella-clinic',
        name: 'Clínica Sorella',
        email: 'sorella@leonel.com',
        password: '123',
        phone: '(11) 98765-0002',
        plan: 'Profissional',
        status: 'Ativo',
        sidebarTitle: 'Sorella',
        sidebarSubtitle: 'Estética Facial',
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem('lumini_tenants', JSON.stringify(initial));
    return initial;
  });

  const [pricing, setPricing] = useState<{ Grátis: number; Profissional: number; Clínica: number }>(() => {
    const saved = localStorage.getItem('lumini_plans_pricing');
    return saved ? JSON.parse(saved) : { Grátis: 0, Profissional: 67, Clínica: 147 };
  });

  // Support both query params (?booking=true&tenant=...) and path slug (/samia or /sorella)
  const getBookingContext = () => {
    const searchParams = new URLSearchParams(window.location.search);
    const pathname = window.location.pathname.replace(/^\/|\/$/g, ''); // strip leading/trailing slash

    const queryBooking = searchParams.get('booking') === 'true';
    const queryTenant = searchParams.get('tenant');

    if (queryBooking) {
      return {
        isPublic: true,
        tenantId: queryTenant || 'trial-clinic'
      };
    }

    // Since we do not have system hash routing, we check if pathname matches known tenant ID/slug
    const systemKeywords = ['dashboard', 'admin', 'login', 'superadmin', 'financeiro', 'servicos', 'agendamentos', 'leads', 'clientes', 'profissionais', 'estoque', ''];
    if (pathname && !systemKeywords.includes(pathname.toLowerCase())) {
      const lowerPath = pathname.toLowerCase();
      let matchedTenant = 'trial-clinic'; // default
      if (lowerPath === 'sorella' || lowerPath === 'sorella-clinic') {
        matchedTenant = 'sorella-clinic';
      } else if (lowerPath === 'samia' || lowerPath === 'trial-clinic') {
        matchedTenant = 'trial-clinic';
      } else {
        try {
          const rawTenants = localStorage.getItem('lumini_tenants');
          if (rawTenants) {
            const parsed = JSON.parse(rawTenants);
            const found = parsed.find((t: any) => 
              t.id.toLowerCase() === lowerPath || 
              t.name.toLowerCase().replace(/\s+/g, '-') === lowerPath ||
              (t.sidebarTitle && t.sidebarTitle.toLowerCase() === lowerPath)
            );
            if (found) {
              matchedTenant = found.id;
            } else {
              matchedTenant = lowerPath; // direct fallback to url slug
            }
          } else {
            matchedTenant = lowerPath;
          }
        } catch (e) {
          matchedTenant = lowerPath;
        }
      }
      return {
        isPublic: true,
        tenantId: matchedTenant
      };
    }

    return {
      isPublic: false,
      tenantId: 'trial-clinic'
    };
  };

  const bookingContext = getBookingContext();
  const isPublicBooking = bookingContext.isPublic;
  const urlTenantId = bookingContext.tenantId;

  // Active tenant matching ID
  const activeTenantId = isPublicBooking 
    ? urlTenantId 
    : ((session && session.role === 'clinic') ? (session.tenantId || 'trial-clinic') : 'trial-clinic');

  const [loadedTenantId, setLoadedTenantId] = useState<string>(activeTenantId);

  const getPublicBookingUrl = (tenantId: string) => {
    let slug = tenantId;
    if (tenantId === 'trial-clinic') {
      slug = 'samia';
    } else if (tenantId === 'sorella-clinic') {
      slug = 'sorella';
    } else {
      try {
        const rawTenants = localStorage.getItem('lumini_tenants');
        const list = rawTenants ? JSON.parse(rawTenants) : tenants;
        const found = list.find((t: any) => t.id === tenantId);
        if (found) {
          slug = found.sidebarTitle ? found.sidebarTitle.toLowerCase() : found.name.toLowerCase().replace(/\s+/g, '-');
        }
      } catch (e) {
        // fallback
      }
    }

    const qParams = new URLSearchParams();
    if (settings && activeTenantId === tenantId) {
      if (settings.name) qParams.set('n', settings.name);
      if (settings.description) qParams.set('d', settings.description);
      if (settings.address) qParams.set('a', settings.address);
      if (settings.whatsapp) qParams.set('w', settings.whatsapp);
      if (settings.customPrimary) qParams.set('cp', settings.customPrimary);
      if (settings.customSecondary) qParams.set('cs', settings.customSecondary);
      if (settings.customBackground) qParams.set('cb', settings.customBackground);
    } else {
      const savedSpecific = localStorage.getItem(`lumini_tenant_${tenantId}_settings`);
      if (savedSpecific) {
        try {
          const parsed = JSON.parse(savedSpecific);
          if (parsed.name) qParams.set('n', parsed.name);
          if (parsed.description) qParams.set('d', parsed.description);
          if (parsed.address) qParams.set('a', parsed.address);
          if (parsed.whatsapp) qParams.set('w', parsed.whatsapp);
          if (parsed.customPrimary) qParams.set('cp', parsed.customPrimary);
          if (parsed.customSecondary) qParams.set('cs', parsed.customSecondary);
          if (parsed.customBackground) qParams.set('cb', parsed.customBackground);
        } catch (e) {}
      }
    }

    const qStr = qParams.toString();
    return `${window.location.origin}/${slug}${qStr ? '?' + qStr : ''}`;
  };

  // Tab State
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Load / Partition storage elements safely
  const getStoredItem = (activeId: string, key: string, defaultValue: any) => {
    const specificKey = `lumini_tenant_${activeId}_${key}`;
    const legacyKey = `samia_crm_${key}`;
    const savedSpecific = localStorage.getItem(specificKey);
    if (savedSpecific) return JSON.parse(savedSpecific);
    if (activeId === 'trial-clinic') {
      const savedLegacy = localStorage.getItem(legacyKey);
      if (savedLegacy) return JSON.parse(savedLegacy);
    }
    return defaultValue;
  };

  // Full-Stack DB Synchronization HTTP helpers (graceful fallbacks inside)
  const syncTenantDataPoint = (keyType: string, list: any) => {
    if (!activeTenantId || !loadedTenantId || loadedTenantId !== activeTenantId) return;
    fetch(`/api/tenant/${activeTenantId}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyType, dataList: list })
    }).catch(err => {
      console.debug(`[Sync Debug] could not persist key ${keyType} online (using localStorage fallback):`, err.message);
    });
  };

  const syncSaasPricing = (newPricing: any) => {
    fetch('/api/saas/pricing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pricing: newPricing })
    }).catch(() => {});
  };

  const syncSaasPlanFeatures = (newFeatures: any) => {
    fetch('/api/saas/features', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planFeatures: newFeatures })
    }).catch(() => {});
  };

  const syncSaasTenantsList = (newTenants: any) => {
    fetch('/api/saas/tenants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenants: newTenants })
    }).catch(() => {});
  };

  const [clients, setClients] = useState<Client[]>(() => {
    return getStoredItem(activeTenantId, 'clients', INITIAL_CLIENTS);
  });
  const [services, setServices] = useState<Service[]>(() => {
    return getStoredItem(activeTenantId, 'services', INITIAL_SERVICES);
  });
  const [professionals, setProfessionals] = useState<Professional[]>(() => {
    return getStoredItem(activeTenantId, 'professionals', INITIAL_PROFESSIONALS);
  });
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    return getStoredItem(activeTenantId, 'appointments', INITIAL_APPOINTMENTS);
  });
  const [operatingHours, setOperatingHours] = useState<OperatingHour[]>(() => {
    return getStoredItem(activeTenantId, 'operating_hours', INITIAL_OPERATING_HOURS);
  });
  const [settings, setSettings] = useState<ClinicSettings>(() => {
    const activeObj = tenants.find(t => t.id === activeTenantId);
    const base = getStoredItem(activeTenantId, 'settings', {
      ...INITIAL_CLINIC_SETTINGS,
      name: activeObj?.name || 'Leonel CRM',
      sidebarTitle: activeObj?.sidebarTitle || 'Leonel CRM',
      sidebarSubtitle: activeObj?.sidebarSubtitle || 'Estética Avançada',
      customPrimary: '#A8C3A0',
      customSecondary: '#EFE6DA',
      customBackground: '#FAFAF9',
    });

    // Merge from query parameters as fallback
    const params = new URLSearchParams(window.location.search);
    const qName = params.get('n');
    const qDesc = params.get('d');
    const qAddr = params.get('a');
    const qPhone = params.get('w');
    const qColorP = params.get('cp');
    const qColorS = params.get('cs');
    const qColorB = params.get('cb');

    if (qName) base.name = qName;
    if (qDesc) base.description = qDesc;
    if (qAddr) base.address = qAddr;
    if (qPhone) base.whatsapp = qPhone;
    if (qColorP) base.customPrimary = qColorP;
    if (qColorS) base.customSecondary = qColorS;
    if (qColorB) base.customBackground = qColorB;

    return base;
  });
  const [alerts, setAlerts] = useState<UserAlert[]>(() => {
    return getStoredItem(activeTenantId, 'alerts', INITIAL_ALERTS);
  });
  const [activities, setActivities] = useState<RecentActivity[]>(() => {
    return getStoredItem(activeTenantId, 'activities', INITIAL_ACTIVITIES);
  });
  const [stockItems, setStockItems] = useState<{ id: string; name: string; qty: number; minQty: number; unit: string; price: number; }[]>(() => {
    return getStoredItem(activeTenantId, 'stock_items', []);
  });
  const [transactions, setTransactions] = useState<{ id: string; desc: string; type: string; value: number; date: string; clientName?: string; }[]>(() => {
    return getStoredItem(activeTenantId, 'transactions', []);
  });
  const [leads, setLeads] = useState<Lead[]>(() => {
    return getStoredItem(activeTenantId, 'leads', []);
  });

  // Load state whenever the tenantId transforms
  useEffect(() => {
    setClients(getStoredItem(activeTenantId, 'clients', INITIAL_CLIENTS));
    setServices(getStoredItem(activeTenantId, 'services', INITIAL_SERVICES));
    setProfessionals(getStoredItem(activeTenantId, 'professionals', INITIAL_PROFESSIONALS));
    setAppointments(getStoredItem(activeTenantId, 'appointments', INITIAL_APPOINTMENTS));
    setOperatingHours(getStoredItem(activeTenantId, 'operating_hours', INITIAL_OPERATING_HOURS));
    
    setLeads(getStoredItem(activeTenantId, 'leads', []));
    
    const activeObj = tenants.find(t => t.id === activeTenantId);
    const storedSettings = getStoredItem(activeTenantId, 'settings', {
      ...INITIAL_CLINIC_SETTINGS,
      name: activeObj ? activeObj.name : INITIAL_CLINIC_SETTINGS.name,
      sidebarTitle: activeObj ? (activeObj.sidebarTitle || activeObj.name) : 'Leonel CRM',
      sidebarSubtitle: activeObj ? (activeObj.sidebarSubtitle || 'Estética Avançada') : 'Estética Avançada',
    });

    // Merge from query parameters if available
    const urlParams = new URLSearchParams(window.location.search);
    const urlName = urlParams.get('n');
    const urlDesc = urlParams.get('d');
    const urlAddr = urlParams.get('a');
    const urlPhone = urlParams.get('w');
    const urlColorP = urlParams.get('cp');
    const urlColorS = urlParams.get('cs');
    const urlColorB = urlParams.get('cb');

    if (urlName) storedSettings.name = urlName;
    if (urlDesc) storedSettings.description = urlDesc;
    if (urlAddr) storedSettings.address = urlAddr;
    if (urlPhone) storedSettings.whatsapp = urlPhone;
    if (urlColorP) storedSettings.customPrimary = urlColorP;
    if (urlColorS) storedSettings.customSecondary = urlColorS;
    if (urlColorB) storedSettings.customBackground = urlColorB;

    setSettings(storedSettings);
    
    setAlerts(getStoredItem(activeTenantId, 'alerts', INITIAL_ALERTS));
    setActivities(getStoredItem(activeTenantId, 'activities', INITIAL_ACTIVITIES));
    
    setStockItems(getStoredItem(activeTenantId, 'stock', []));
    
    setTransactions(getStoredItem(activeTenantId, 'transactions', []));

    // Update loadedTenantId to allow syncing
    setLoadedTenantId(activeTenantId);

    // Asynchronously update to database records if available on the server
    fetch(`/api/tenant/${activeTenantId}/load`)
      .then(res => res.json())
      .then(res => {
        if (res.data && Object.keys(res.data).length > 0) {
          const remote = res.data;
          if (remote.clients) setClients(remote.clients);
          if (remote.services) setServices(remote.services);
          if (remote.professionals) setProfessionals(remote.professionals);
          if (remote.appointments) setAppointments(remote.appointments);
          if (remote.operating_hours) setOperatingHours(remote.operating_hours);
          if (remote.settings) setSettings(remote.settings);
          if (remote.alerts) setAlerts(remote.alerts);
          if (remote.activities) setActivities(remote.activities);
          if (remote.stock) setStockItems(remote.stock);
          if (remote.transactions) setTransactions(remote.transactions);
          if (remote.leads) setLeads(remote.leads);
          console.debug(`[FullStack DB] Resynced state for active tenant: ${activeTenantId}`);
        }
      })
      .catch((err) => {
        console.debug('[FullStack Sync Debug] Loaded offline local tenant profile:', err.message);
      });
  }, [activeTenantId]);

  // Sync state writes back to tenant boundaries
  useEffect(() => {
    if (loadedTenantId !== activeTenantId) return;
    if (!activeTenantId || !clients.length) return;
    localStorage.setItem(`lumini_tenant_${activeTenantId}_clients`, JSON.stringify(clients));
    syncTenantDataPoint('clients', clients);
  }, [clients, activeTenantId, loadedTenantId]);

  useEffect(() => {
    if (loadedTenantId !== activeTenantId) return;
    if (!activeTenantId || !services.length) return;
    localStorage.setItem(`lumini_tenant_${activeTenantId}_services`, JSON.stringify(services));
    syncTenantDataPoint('services', services);
  }, [services, activeTenantId, loadedTenantId]);

  useEffect(() => {
    if (loadedTenantId !== activeTenantId) return;
    if (!activeTenantId || !professionals.length) return;
    localStorage.setItem(`lumini_tenant_${activeTenantId}_professionals`, JSON.stringify(professionals));
    syncTenantDataPoint('professionals', professionals);
  }, [professionals, activeTenantId, loadedTenantId]);

  useEffect(() => {
    if (loadedTenantId !== activeTenantId) return;
    if (!activeTenantId || !appointments.length) return;
    localStorage.setItem(`lumini_tenant_${activeTenantId}_appointments`, JSON.stringify(appointments));
    syncTenantDataPoint('appointments', appointments);
  }, [appointments, activeTenantId, loadedTenantId]);

  useEffect(() => {
    if (loadedTenantId !== activeTenantId) return;
    if (!activeTenantId || !operatingHours.length) return;
    localStorage.setItem(`lumini_tenant_${activeTenantId}_operating_hours`, JSON.stringify(operatingHours));
    syncTenantDataPoint('operating_hours', operatingHours);
  }, [operatingHours, activeTenantId, loadedTenantId]);

  useEffect(() => {
    if (loadedTenantId !== activeTenantId) return;
    if (!activeTenantId || !settings?.name) return;
    localStorage.setItem(`lumini_tenant_${activeTenantId}_settings`, JSON.stringify(settings));
    syncTenantDataPoint('settings', settings);
    
    setTenants(prev => prev.map(t => t.id === activeTenantId ? {
      ...t,
      sidebarTitle: settings.sidebarTitle,
      sidebarSubtitle: settings.sidebarSubtitle,
      name: settings.name
    } : t));
  }, [settings, activeTenantId, loadedTenantId]);

  useEffect(() => {
    if (loadedTenantId !== activeTenantId) return;
    if (!activeTenantId) return;
    localStorage.setItem(`lumini_tenant_${activeTenantId}_alerts`, JSON.stringify(alerts));
    syncTenantDataPoint('alerts', alerts);
  }, [alerts, activeTenantId, loadedTenantId]);

  useEffect(() => {
    if (loadedTenantId !== activeTenantId) return;
    if (!activeTenantId) return;
    localStorage.setItem(`lumini_tenant_${activeTenantId}_activities`, JSON.stringify(activities));
    syncTenantDataPoint('activities', activities);
  }, [activities, activeTenantId, loadedTenantId]);

  useEffect(() => {
    if (loadedTenantId !== activeTenantId) return;
    if (!activeTenantId) return;
    localStorage.setItem(`lumini_tenant_${activeTenantId}_stock`, JSON.stringify(stockItems));
    syncTenantDataPoint('stock', stockItems);
  }, [stockItems, activeTenantId, loadedTenantId]);

  useEffect(() => {
    if (loadedTenantId !== activeTenantId) return;
    if (!activeTenantId) return;
    localStorage.setItem(`lumini_tenant_${activeTenantId}_transactions`, JSON.stringify(transactions));
    syncTenantDataPoint('transactions', transactions);
  }, [transactions, activeTenantId, loadedTenantId]);

  useEffect(() => {
    if (loadedTenantId !== activeTenantId) return;
    if (!activeTenantId || !leads) return;
    localStorage.setItem(`lumini_tenant_${activeTenantId}_leads`, JSON.stringify(leads));
    syncTenantDataPoint('leads', leads);
  }, [leads, activeTenantId, loadedTenantId]);

  // Session storage sync
  useEffect(() => {
    if (session) {
      localStorage.setItem('lumini_active_session', JSON.stringify(session));
    } else {
      localStorage.removeItem('lumini_active_session');
    }
  }, [session]);

  // Tenants list storage sync
  useEffect(() => {
    localStorage.setItem('lumini_tenants', JSON.stringify(tenants));
    syncSaasTenantsList(tenants);
  }, [tenants]);

  // Real-time synchronization of lists between tabs and frames to automatically mirror bookings
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key.startsWith(`lumini_tenant_${activeTenantId}_`)) {
        const keyType = e.key.replace(`lumini_tenant_${activeTenantId}_`, '');
        const storedStr = localStorage.getItem(e.key);
        if (!storedStr) return;
        
        try {
          const parsed = JSON.parse(storedStr);
          if (keyType === 'clients') {
            setClients(prev => JSON.stringify(prev) !== storedStr ? parsed : prev);
          } else if (keyType === 'services') {
            setServices(prev => JSON.stringify(prev) !== storedStr ? parsed : prev);
          } else if (keyType === 'professionals') {
            setProfessionals(prev => JSON.stringify(prev) !== storedStr ? parsed : prev);
          } else if (keyType === 'appointments') {
            setAppointments(prev => JSON.stringify(prev) !== storedStr ? parsed : prev);
          } else if (keyType === 'operating_hours') {
            setOperatingHours(prev => JSON.stringify(prev) !== storedStr ? parsed : prev);
          } else if (keyType === 'leads') {
            setLeads(prev => JSON.stringify(prev) !== storedStr ? parsed : prev);
          } else if (keyType === 'settings') {
            setSettings(prev => JSON.stringify(prev) !== storedStr ? parsed : prev);
          } else if (keyType === 'alerts') {
            setAlerts(prev => JSON.stringify(prev) !== storedStr ? parsed : prev);
          } else if (keyType === 'activities') {
            setActivities(prev => JSON.stringify(prev) !== storedStr ? parsed : prev);
          } else if (keyType === 'stock') {
            setStockItems(prev => JSON.stringify(prev) !== storedStr ? parsed : prev);
          } else if (keyType === 'transactions') {
            setTransactions(prev => JSON.stringify(prev) !== storedStr ? parsed : prev);
          }
        } catch (err) {
          // ignore parse/empty errors
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [activeTenantId]);

  // Pricing storage sync
  useEffect(() => {
    localStorage.setItem('lumini_plans_pricing', JSON.stringify(pricing));
    syncSaasPricing(pricing);
  }, [pricing]);

  // Plan Features Config and customization (SaaS control, can be managed in Superadmin)
  const [planFeatures, setPlanFeatures] = useState<Record<string, PlanFeatures>>(() => {
    const saved = localStorage.getItem('lumini_plans_features');
    if (saved) return JSON.parse(saved);
    return {
      'Grátis': {
        maxAppointmentsMonth: 5,
        maxClients: 15,
        maxProfessionals: 1,
        allowClinicalHistory: false,
        allowWhatsAppTemplates: false,
        allowMultiAgenda: false,
        allowAbsences: false,
        allowOnlineBooking: false,
        allowFinance: false,
        allowStock: false,
        allowCRM: false,
        description: 'Limite de 5 atendimentos e 15 clientes cadastrados.',
      },
      'Profissional': {
        maxAppointmentsMonth: 9999,
        maxClients: 100,
        maxProfessionals: 2,
        allowClinicalHistory: true,
        allowWhatsAppTemplates: true,
        allowMultiAgenda: false,
        allowAbsences: false,
        allowOnlineBooking: true,
        allowFinance: true,
        allowStock: true,
        allowCRM: true,
        description: 'WhatsApp, CRM, 2 colaboradores, 100 clientes e disparo rápido.',
      },
      'Clínica': {
        maxAppointmentsMonth: 9999,
        maxClients: 9999,
        maxProfessionals: 9999,
        allowClinicalHistory: true,
        allowWhatsAppTemplates: true,
        allowMultiAgenda: true,
        allowAbsences: true,
        allowOnlineBooking: true,
        allowFinance: true,
        allowStock: true,
        allowCRM: true,
        description: 'Multi-Agenda, ausências, Funil CRM, agendamento online livre e gestão ilimitada.',
      }
    };
  });

  useEffect(() => {
    localStorage.setItem('lumini_plans_features', JSON.stringify(planFeatures));
    syncSaasPlanFeatures(planFeatures);
  }, [planFeatures]);

  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeFeatureName, setUpgradeFeatureName] = useState('');

  const handleShowUpgradeModal = (featureName: string) => {
    setUpgradeFeatureName(featureName);
    setUpgradeModalOpen(true);
  };

  // General Interactive Modals controls
  const [modalType, setModalType] = useState<'appointment' | 'client' | 'service' | 'professional' | 'absence' | null>(null);
  const [pendingLeadConversion, setPendingLeadConversion] = useState<Lead | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null);

  // States for advanced stock/inventory management
  const [stockSearch, setStockSearch] = useState('');
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [editingStockItem, setEditingStockItem] = useState<{ id: string; name: string; qty: number; minQty: number; unit: string; price: number; } | null>(null);
  const [newStockItem, setNewStockItem] = useState({ name: '', qty: 0, minQty: 0, unit: 'unidade', price: 0.00 });

  // States for advanced financial filtering and ledger registry
  const [financeStartDate, setFinanceStartDate] = useState('');
  const [financeEndDate, setFinanceEndDate] = useState('');
  const [financeClientFilter, setFinanceClientFilter] = useState('');
  const [financeModalOpen, setFinanceModalOpen] = useState(false);
  const [newTx, setNewTx] = useState({ desc: '', type: 'receita', value: 0, date: new Date().toISOString().split('T')[0], clientName: '' });
  const [txDeleteConfirmId, setTxDeleteConfirmId] = useState<string | null>(null);
  const [stockDeleteConfirmId, setStockDeleteConfirmId] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Quick link copy helper tracking
  const [copiedLink, setCopiedLink] = useState(false);

  // New Booking State Builder
  const [newBooking, setNewBooking] = useState({
    clientId: '',
    serviceId: '',
    professionalId: 'prof-1',
    date: '2026-05-28',
    time: '12:00',
    status: 'Pendente' as Appointment['status'],
  });

  // New Client State Builder
  const [newClient, setNewClient] = useState({
    name: '',
    phone: '',
    email: '',
    birthdate: '1995-01-01',
    address: '',
    notes: '',
  });

  // New Service Builder
  const [newService, setNewService] = useState({
    name: '',
    price: 30.00,
    duration: 60,
    visibleInBooking: true,
  });

  // New Professional/Colaborador state
  const [newProf, setNewProf] = useState({
    name: '',
    role: 'Esteticista',
    status: 'Ativo' as 'Ativo' | 'Inativo',
  });

  // Absence State Builder
  const [newAbsence, setNewAbsence] = useState({
    professionalId: 'prof-1',
    startDate: '2026-05-28',
    startTime: '08:00',
    endDate: '2026-05-28',
    endTime: '12:00',
    reason: 'Consulta médica',
  });

  // Computed visual styles
  const activePreset: ThemePreset = THEME_PRESETS.find(p => p.id === settings.selectedThemeId) || {
    id: 'custom',
    name: 'Customizado',
    primary: settings.customPrimary,
    secondary: settings.customSecondary,
    background: settings.customBackground,
    textColor: '#334155'
  };

  const customPrimary = settings.customPrimary || activePreset.primary;
  const customSecondary = settings.customSecondary || activePreset.secondary;
  const customBackground = settings.customBackground || activePreset.background;

  // Custom visual audits logging
  const logActivity = (text: string) => {
    const newAct: RecentActivity = {
      id: generateUniqueId('ac'),
      text,
      timeAgo: 'há poucos segundos',
    };
    setActivities(prev => [newAct, ...prev]);
  };

  // Click Action Triggers
  const handleCopyBookingLink = () => {
    const link = getPublicBookingUrl(activeTenantId);
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Leads CRM Event Handlers
  const handleAddLead = (leadData: Omit<Lead, 'id' | 'tenantId' | 'createdAt'>) => {
    const newL: Lead = {
      ...leadData,
      id: generateUniqueId('lead'),
      tenantId: activeTenantId,
      createdAt: new Date().toISOString()
    };
    setLeads(prev => [newL, ...prev]);
    logActivity(`Lead manual "${leadData.name}" cadastrado no funil`);
  };

  const handleUpdateLeadStage = (id: string, newStage: LeadStage) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, stage: newStage } : l));
    const l = leads.find(lead => lead.id === id);
    if (l) {
      logActivity(`Lead "${l.name}" movido para a etapa "${newStage}"`);
    }
  };

  const handleUpdateLead = (id: string, updatedFields: Partial<Lead>) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updatedFields } : l));
    logActivity(`Dados do lead "${updatedFields.name || 'editado'}" atualizados`);
  };

  const handleDeleteLead = (id: string) => {
    const parent = leads.find(l => l.id === id);
    if (parent) {
      setLeads(prev => prev.filter(l => l.id !== id));
      logActivity(`Lead "${parent.name}" excluído do funil`);
    }
  };

  const handleConvertToClientAndSchedule = (l: Lead) => {
    if (clients.length >= currentFeatures.maxClients) {
      alert(`Limite de Clientes Atingido! Seu plano atual (${activePlanName}) permite até ${currentFeatures.maxClients} clientes. Por favor, faça um upgrade para continuar a conversão.`);
      handleShowUpgradeModal(`Conversão de Lead (${clients.length}/${currentFeatures.maxClients} limite do plano)`);
      return;
    }

    const exists = clients.find(c => c.phone.replace(/\D/g, '') === l.phone.replace(/\D/g, ''));
    let targetClientId = exists?.id;

    // Always store the lead we are converting so we can mark it as 'ganho'
    setPendingLeadConversion(l);
    if (!exists) {
      targetClientId = 'convert-lead-current';
    } else {
      targetClientId = exists.id;
    }

    setNewBooking({
      clientId: targetClientId || '',
      serviceId: l.interestServiceId || services[0]?.id || '',
      professionalId: professionals[0]?.id || '',
      date: new Date().toISOString().split('T')[0],
      time: '14:00',
      status: 'Pendente'
    });
    setModalType('appointment');
  };

  const handlePublicConfirmBooking = (bookingData: {
    clientName: string;
    clientPhone: string;
    clientEmail: string;
    serviceId: string;
    professionalId: string;
    date: string;
    time: string;
    value: number;
    isNewClient: boolean;
    notes?: string;
  }) => {
    // 1. Check if client exists by phone
    const normalizedPhone = bookingData.clientPhone.replace(/\D/g, '');
    let existingC = clients.find(c => c.phone.replace(/\D/g, '') === normalizedPhone);
    let finalClientId = existingC?.id;

    if (bookingData.isNewClient) {
      // Create new Lead in the CRM funil
      const newLead: Lead = {
        id: generateUniqueId('lead'),
        tenantId: activeTenantId,
        name: bookingData.clientName,
        phone: bookingData.clientPhone,
        email: bookingData.clientEmail,
        stage: 'novo',
        value: bookingData.value,
        interestServiceId: bookingData.serviceId,
        notes: bookingData.notes || `Agendamento solicitado pelo Link Público para dia ${bookingData.date} às ${bookingData.time}`,
        createdAt: new Date().toISOString()
      };
      setLeads(prev => [newLead, ...prev]);

      // Create client too so they can be associated with the pending appointment
      const newCliId = generateUniqueId('cli');
      const newC: Client = {
        id: newCliId,
        name: bookingData.clientName,
        phone: bookingData.clientPhone,
        email: bookingData.clientEmail,
        birthdate: '',
        address: '',
        notes: `Lead do Link Público - Agendamento Solicitado.`
      };
      setClients(prev => [...prev, newC]);
      finalClientId = newCliId;

      logActivity(`Novo LEAD no funil CRM: "${bookingData.clientName}" registrado via Link de Agendamento!`);
    } else {
      if (!existingC) {
        // Create new client if not matched
        const newId = generateUniqueId('cli');
        const newC: Client = {
          id: newId,
          name: bookingData.clientName,
          phone: bookingData.clientPhone,
          email: bookingData.clientEmail,
          birthdate: '',
          address: '',
          notes: 'Cliente cadastrado via agendamento online público.'
        };
        setClients(prev => [...prev, newC]);
        finalClientId = newId;
      }
    }

    // Determine status of the appointment based on requireConfirmation setting
    // If it's a new lead, it should always start as Pendente.
    // If it's an existing client, respect the settings configuration toggle.
    const mustConfirm = bookingData.isNewClient || settings.requireConfirmation !== false;
    const initialStatus: Appointment['status'] = mustConfirm ? 'Pendente' : 'Confirmado';

    // 2. Add appointment
    const targetService = services.find(s => s.id === bookingData.serviceId);
    const servicePrice = targetService ? targetService.price : 0;
    const newApt: Appointment = {
      id: generateUniqueId('apt'),
      clientId: finalClientId || '',
      serviceId: bookingData.serviceId,
      professionalId: bookingData.professionalId,
      date: bookingData.date,
      time: bookingData.time,
      status: initialStatus,
      value: bookingData.value || servicePrice,
      createdAt: new Date().toISOString()
    };
    setAppointments(prev => [...prev, newApt]);

    // 3. Log activity
    logActivity(`Novo agendamento online [${initialStatus}]: ${bookingData.clientName} agendou para o dia ${bookingData.date} às ${bookingData.time}`);
  };

  // Add client submit helper
  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.name.trim() || !newClient.phone.trim()) return;

    if (clients.length >= currentFeatures.maxClients) {
      alert(`Limite de Clientes Atingido! Seu plano atual (${activePlanName}) permite até ${currentFeatures.maxClients} clientes. Por favor, faça um upgrade para cadastrar mais.`);
      handleShowUpgradeModal(`Cadastro de Clientes (${clients.length}/${currentFeatures.maxClients} limite do plano)`);
      return;
    }

    const added: Client = {
      id: generateUniqueId('cli'),
      ...newClient
    };

    setClients(prev => [...prev, added]);
    logActivity(`Novo cliente cadastrado: ${added.name}`);
    
    // Auto select this customer for scheduling modal optionally
    setNewBooking(prev => ({ ...prev, clientId: added.id }));

    // Reset Form
    setNewClient({ name: '', phone: '', email: '', birthdate: '1995-01-01', address: '', notes: '' });
    setModalType(null);
  };

  // Add Appointment submit helper
  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBooking.clientId || !newBooking.serviceId) return;

    if (appointments.length >= currentFeatures.maxAppointmentsMonth) {
      alert(`Limite de Agendamentos Mensais Atingido! Seu plano atual (${activePlanName}) permite até ${currentFeatures.maxAppointmentsMonth} agendamentos/mês. Por favor, faça um upgrade para continuar agendando.`);
      handleShowUpgradeModal(`Atendimentos e Agendamentos (${appointments.length}/${currentFeatures.maxAppointmentsMonth} limite do plano)`);
      return;
    }

    let targetClientId = newBooking.clientId;
    let finalClientObj = clients.find(c => c.id === targetClientId);

    // If we are performing a transaction for pending lead conversion
    if (targetClientId === 'convert-lead-current' && pendingLeadConversion) {
      const newClientId = generateUniqueId('cli');
      const newCli: Client = {
        id: newClientId,
        name: pendingLeadConversion.name,
        phone: pendingLeadConversion.phone,
        email: pendingLeadConversion.email || '',
        birthdate: '',
        address: '',
        notes: `Convertido do Funil de Leads. Notas originais: ${pendingLeadConversion.notes || 'Sem observações'}`
      };
      
      setClients(prev => [...prev, newCli]);
      targetClientId = newClientId;
      finalClientObj = newCli;
      
      logActivity(`Lead "${pendingLeadConversion.name}" convertido para cliente 🎉`);
    }

    // Always mark the lead being converted as 'ganho' when registering the appointment
    if (pendingLeadConversion) {
      const leadId = pendingLeadConversion.id;
      setLeads(prev => prev.map(lead => lead.id === leadId ? { ...lead, stage: 'ganho' as LeadStage } : lead));
      logActivity(`Lead "${pendingLeadConversion.name}" fechado como GANHO (Agendamento Registrado!) ⚡`);
      setPendingLeadConversion(null);
    }

    const chosenService = services.find(s => s.id === newBooking.serviceId);
    const chosenClient = finalClientObj;

    const added: Appointment = {
      id: generateUniqueId('apt'),
      clientId: targetClientId,
      serviceId: newBooking.serviceId,
      professionalId: newBooking.professionalId,
      date: newBooking.date,
      time: newBooking.time,
      status: newBooking.status,
      value: chosenService ? chosenService.price : 30.00,
      createdAt: new Date().toISOString()
    };

    setAppointments(prev => [...prev, added]);

    // Log Revenue direct simulation entry
    if (added.status === 'Confirmado' || added.status === 'Finalizado') {
      const addedTx = {
        id: generateUniqueId('tx'),
        desc: `Atendimento: ${chosenClient?.name || 'Cliente'} (${chosenService?.name || 'Serviço'})`,
        type: 'receita',
        value: added.value,
        date: added.date
      };
      setTransactions(prev => [addedTx, ...prev]);
    }

    logActivity(`Agendamento registrado para ${chosenClient?.name || 'Cliente'} no dia ${added.date} às ${added.time}`);
    setModalType(null);
  };

  // Actions for Appointment controls
  const handleUpdateAppointmentStatus = (id: string, newStatus: Appointment['status']) => {
    const updated = appointments.map(apt => {
      if (apt.id === id) {
        // Log auditing update
        const cliName = clients.find(c => c.id === apt.clientId)?.name || 'Cliente';
        logActivity(`Atendimento de ${cliName} atualizado para status "${newStatus}"`);
        return { ...apt, status: newStatus };
      }
      return apt;
    });
    setAppointments(updated);
  };

  const handleDeleteAppointment = (id: string) => {
    setAppointments(prev => prev.filter(apt => apt.id !== id));
    logActivity(`Agendamento excluído.`);
  };

  const handleEditAppointment = (id: string, updatedFields: Partial<Appointment>) => {
    setAppointments(prev => prev.map(apt => apt.id === id ? { ...apt, ...updatedFields } : apt));
    logActivity(`Agendamento atualizado com novas informações.`);
  };

  // Service CRUD Events
  const handleCreateOrUpdateService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newService.name.trim()) return;

    if (editingService) {
      setServices(prev => prev.map(s => s.id === editingService.id ? { ...s, name: newService.name, price: newService.price, duration: newService.duration } : s));
      logActivity(`Serviço "${newService.name}" modificado com sucesso`);
      setEditingService(null);
    } else {
      const added: Service = {
        id: generateUniqueId('srv'),
        name: newService.name,
        price: Number(newService.price),
        duration: Number(newService.duration),
        visibleInBooking: newService.visibleInBooking,
        status: 'Ativo'
      };
      setServices(prev => [...prev, added]);
      logActivity(`Novo serviço cadastrado: "${added.name}"`);
    }

    // Reset Form
    setNewService({ name: '', price: 30.00, duration: 60, visibleInBooking: true });
    setModalType(null);
  };

  const handleToggleServiceVisibility = (id: string) => {
    setServices(prev => prev.map(s => {
      if (s.id === id) {
        logActivity(`Visibilidade do serviço "${s.name}" alterada.`);
        return { ...s, visibleInBooking: !s.visibleInBooking };
      }
      return s;
    }));
  };

  const handleDeleteService = (id: string) => {
    setServices(prev => prev.filter(s => s.id !== id));
    logActivity(`Serviço removido.`);
  };

  // Staff events
  const handleCreateOrUpdateProfessional = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProf.name.trim()) return;

    if (editingProfessional) {
      setProfessionals(prev => prev.map(p => p.id === editingProfessional.id ? { ...p, name: newProf.name, role: newProf.role, status: newProf.status } : p));
      logActivity(`Colaborador "${newProf.name}" modificado.`);
      setEditingProfessional(null);
    } else {
      if (professionals.length >= currentFeatures.maxProfessionals) {
        alert(`Limite de Colaboradores Atingido! Seu plano atual (${activePlanName}) permite até ${currentFeatures.maxProfessionals} colaboradores ativos. Por favor, faça um upgrade para adicionar mais profissionais.`);
        handleShowUpgradeModal(`Cadastro de Colaborador (${professionals.length}/${currentFeatures.maxProfessionals} limite do plano)`);
        return;
      }
      const added: Professional = {
        id: generateUniqueId('prof'),
        name: newProf.name,
        role: newProf.role,
        status: newProf.status,
        loginCreated: false,
        absences: []
      };
      setProfessionals(prev => [...prev, added]);
      logActivity(`Novo colaborador cadastrado: ${added.name}`);
    }

    setNewProf({ name: '', role: 'Esteticista', status: 'Ativo' });
    setModalType(null);
  };

  const handleCreateAbsence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFeatures.allowAbsences) {
      alert(`Recurso Bloqueado! Seu plano atual (${activePlanName}) não permite gerenciar ausências ou bloqueios de horários na agenda.`);
      handleShowUpgradeModal('Controle de Ausências e Bloqueio de Horários');
      return;
    }
    const addedAbs: Absence = {
      id: generateUniqueId('abs'),
      startDate: newAbsence.startDate,
      startTime: newAbsence.startTime,
      endDate: newAbsence.endDate,
      endTime: newAbsence.endTime,
      reason: newAbsence.reason
    };

    setProfessionals(prev => prev.map(p => {
      if (p.id === newAbsence.professionalId) {
        logActivity(`Registrado bloqueio de agenda de ${p.name} por motivo: ${addedAbs.reason}`);
        return { ...p, absences: [...p.absences, addedAbs] };
      }
      return p;
    }));

    setModalType(null);
  };

  const handleDeleteAbsence = (profId: string, absId: string) => {
    setProfessionals(prev => prev.map(p => {
      if (p.id === profId) {
        logActivity(`Absência removida de ${p.name}`);
        return { ...p, absences: p.absences.filter(abs => abs.id !== absId) };
      }
      return p;
    }));
  };

  // 0. IF PUBLIC BOOKING MODE: Render client-facing booking view directly
  if (isPublicBooking) {
    return (
      <PublicBookingView
        settings={settings}
        services={services}
        operatingHours={operatingHours}
        professionals={professionals}
        appointments={appointments}
        onConfirmBooking={handlePublicConfirmBooking}
      />
    );
  }

  // 1. IF NO SESSION: Render Login
  if (!session) {
    return (
      <LoginView
        tenants={tenants}
        onLogin={(role, tenantId) => {
          setSession({ role, tenantId });
          setActiveTab('dashboard');
        }}
        onCreateTenant={(newT) => {
          setTenants(prev => [
            ...prev,
            {
              id: generateUniqueId('tenant'),
              name: newT.name,
              email: newT.email,
              password: newT.password,
              phone: newT.phone,
              plan: newT.plan,
              status: 'Ativo',
              sidebarTitle: newT.name,
              sidebarSubtitle: 'Estética Avançada',
              createdAt: new Date().toISOString()
            }
          ]);
        }}
      />
    );
  }

  // 2. IF ADMIN: Render Superadmin
  if (session.role === 'admin') {
    return (
      <SuperadminView
        tenants={tenants}
        pricing={pricing}
        onUpdatePricing={(newPricing) => setPricing(newPricing)}
        onUpdateTenantStatus={(id, status) => {
          setTenants(prev => prev.map(t => t.id === id ? { ...t, status } : t));
        }}
        onUpdateTenantPlan={(id, plan) => {
          setTenants(prev => prev.map(t => t.id === id ? { ...t, plan, pendingPlanRequest: undefined } : t));
        }}
        onRejectTenantPlanRequest={(id) => {
          setTenants(prev => prev.map(t => t.id === id ? { ...t, pendingPlanRequest: undefined } : t));
        }}
        onDeleteTenant={(id) => {
          setTenants(prev => prev.filter(t => t.id !== id));
        }}
        onImpersonate={(id) => {
          setSession({ role: 'clinic', tenantId: id, impersonated: true });
          setActiveTab('dashboard');
        }}
        onLogout={() => setSession(null)}
        planFeatures={planFeatures}
        onUpdatePlanFeatures={(newFeatures) => setPlanFeatures(newFeatures)}
      />
    );
  }

  const activeTenantObj = tenants.find(t => t.id === activeTenantId);
  const activePlanName = activeTenantObj?.plan || 'Grátis';
  
  const rawFeatures = planFeatures[activePlanName] || {
    maxAppointmentsMonth: 5,
    maxClients: 15,
    maxProfessionals: 1,
    allowClinicalHistory: false,
    allowWhatsAppTemplates: false,
    allowMultiAgenda: false,
    allowAbsences: false,
    allowOnlineBooking: false,
    allowFinance: false,
    allowStock: false,
    allowCRM: false,
    description: 'Limite de 5 atendimentos e 15 clientes cadastrados.',
  };

  const currentFeatures: PlanFeatures = {
    allowFinance: false,
    allowStock: false,
    allowCRM: false,
    ...rawFeatures
  };

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden">
      {session?.impersonated && (
        <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 text-white px-8 py-2.5 text-[10px] font-black uppercase tracking-wider flex items-center justify-between shadow-md relative z-50 animate-pulse font-sans">
          <span>⚠️ Modo Simulação: Você está visualizando e editando a clínica "{activeTenantObj?.name}" como Administrador.</span>
          <button
            onClick={() => {
              setSession({ role: 'admin' });
              setActiveTab('dashboard');
            }}
            className="px-3 py-1 bg-white hover:bg-slate-100 text-orange-700 font-extrabold rounded-lg uppercase tracking-widest text-[8px] transition-all cursor-pointer border border-transparent"
          >
            Voltar para Superadmin
          </button>
        </div>
      )}
      
      <div className="flex h-full w-full overflow-hidden font-sans" style={{ backgroundColor: customBackground }}>
      {/* LEFT STATIC NAVIGATION SIDEBAR */}
      <aside className="w-64 bg-white border-r border-slate-100 flex flex-col justify-between shrink-0 h-full">
        {/* Core Clinic Title Head */}
        <div className="p-6">
          <div className="flex items-center gap-2">
            <span 
              className="w-8 h-8 rounded-xl font-black text-sm text-white flex items-center justify-center italic shrink-0"
              style={{ backgroundColor: customPrimary }}
            >
              {(settings.sidebarTitle || 'Leonel CRM')[0].toUpperCase()}
            </span>
            <div className="min-w-0">
              <h1 className="text-xs font-extrabold tracking-tight text-slate-800 uppercase leading-none truncate" title={settings.sidebarTitle || 'Leonel CRM'}>
                {settings.sidebarTitle || 'Leonel CRM'}
              </h1>
              <span className="text-[9px] text-slate-400 font-mono tracking-widest uppercase mt-1 block truncate" title={settings.sidebarSubtitle || 'Estética Avançada'}>
                {settings.sidebarSubtitle || 'Estética Avançada'}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Nav link Items */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto no-scrollbar py-2">
          {/* PAINEL GERAL */}
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center px-4 py-3 text-xs font-semibold rounded-2xl transition-all cursor-pointer ${
              activeTab === 'dashboard' 
                ? 'bg-slate-100/50 text-slate-800' 
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
            }`}
          >
            <LayoutDashboard size={15} className="mr-3 text-slate-400" />
            Painel Geral
          </button>

          {/* AGENDA */}
          <button 
            onClick={() => setActiveTab('agendamentos')}
            className={`w-full flex items-center px-4 py-3 text-xs font-semibold rounded-2xl transition-all cursor-pointer ${
              activeTab === 'agendamentos' 
                ? 'bg-slate-100/50 text-slate-800' 
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
            }`}
          >
            <Calendar size={15} className="mr-3 text-slate-400" />
            Agenda
          </button>

          {/* PACIENTES */}
          <button 
            onClick={() => setActiveTab('clientes')}
            className={`w-full flex items-center px-4 py-3 text-xs font-semibold rounded-2xl transition-all cursor-pointer ${
              activeTab === 'clientes' 
                ? 'bg-slate-100/50 text-slate-800' 
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
            }`}
          >
            <Users size={15} className="mr-3 text-slate-400" />
            Pacientes
          </button>

          {/* FUNIL DE LEADS CRM */}
          <button 
            onClick={() => setActiveTab('leads_crm')}
            className={`w-full flex items-center px-4 py-3 text-xs font-semibold rounded-2xl transition-all cursor-pointer ${
              activeTab === 'leads_crm' 
                ? 'bg-slate-100/50 text-slate-800' 
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
            }`}
          >
            <Columns size={15} className="mr-3 text-slate-400" />
            Leads / Funil CRM
          </button>

          {/* TRATAMENTOS */}
          <button 
            onClick={() => setActiveTab('servicos')}
            className={`w-full flex items-center px-4 py-3 text-xs font-semibold rounded-2xl transition-all cursor-pointer ${
              activeTab === 'servicos' 
                ? 'bg-slate-100/50 text-slate-800' 
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
            }`}
          >
            <Sparkles size={15} className="mr-3 text-slate-400" />
            Tratamentos
          </button>

          {/* EQUIPE */}
          <button 
            onClick={() => setActiveTab('equipe')}
            className={`w-full flex items-center px-4 py-3 text-xs font-semibold rounded-2xl transition-all cursor-pointer ${
              activeTab === 'equipe' 
                ? 'bg-slate-100/50 text-slate-800' 
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
            }`}
          >
            <UserCheck size={15} className="mr-3 text-slate-400" />
            Equipe
          </button>

          {/* HORÁRIOS */}
          <button 
            onClick={() => setActiveTab('horarios')}
            className={`w-full flex items-center px-4 py-3 text-xs font-semibold rounded-2xl transition-all cursor-pointer ${
              activeTab === 'horarios' 
                ? 'bg-slate-100/50 text-slate-800' 
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
            }`}
          >
            <Clock size={15} className="mr-3 text-slate-400" />
            Funcionamento
          </button>

          {/* FINANCEIRO */}
          <button 
            onClick={() => setActiveTab('financeiro')}
            className={`w-full flex items-center px-4 py-3 text-xs font-semibold rounded-2xl transition-all cursor-pointer ${
              activeTab === 'financeiro' 
                ? 'bg-slate-100/50 text-slate-800' 
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
            }`}
          >
            <TrendingUp size={15} className="mr-3 text-slate-400" />
            Financeiro
          </button>

          {/* ESTOQUE */}
          <button 
            onClick={() => setActiveTab('estoque')}
            className={`w-full flex items-center px-4 py-3 text-xs font-semibold rounded-2xl transition-all cursor-pointer ${
              activeTab === 'estoque' 
                ? 'bg-slate-100/50 text-slate-800' 
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
            }`}
          >
            <Package size={15} className="mr-3 text-slate-400" />
            Estoque
          </button>

          {/* MENSAGENS */}
          <button 
            onClick={() => setActiveTab('mensagens')}
            className={`w-full flex items-center px-4 py-3 text-xs font-semibold rounded-2xl transition-all cursor-pointer ${
              activeTab === 'mensagens' 
                ? 'bg-slate-100/50 text-slate-800' 
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
            }`}
          >
            <MessageSquare size={15} className="mr-3 text-slate-400" />
            Mensagens WhatsApp
          </button>

          {/* PÁGINA PÚBLICA */}
          <button 
            onClick={() => setActiveTab('pagina_publica')}
            className={`w-full flex items-center px-4 py-3 text-xs font-semibold rounded-2xl transition-all cursor-pointer ${
              activeTab === 'pagina_publica' 
                ? 'bg-slate-100/50 text-slate-800' 
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
            }`}
          >
            <Eye size={15} className="mr-3 text-slate-400" />
            Design / Link Público
          </button>

          {/* PLANOS */}
          <button 
            onClick={() => setActiveTab('planos')}
            className={`w-full flex items-center px-4 py-3 text-xs font-semibold rounded-2xl transition-all cursor-pointer ${
              activeTab === 'planos' 
                ? 'bg-slate-100/50 text-slate-800' 
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
            }`}
          >
            <Award size={15} className="mr-3 text-slate-400" />
            Planos
          </button>

          {/* Quick link copying sidebar */}
          <div className="pt-4 border-t border-slate-50 mt-4 px-2">
            <button
              onClick={handleCopyBookingLink}
              style={{ color: customPrimary }}
              className="text-[10px] font-bold tracking-wider hover:opacity-85 flex items-center gap-1.5 cursor-pointer"
            >
              {copiedLink ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
              {copiedLink ? 'Link Copiado!' : 'Copiar Link Agenda'}
            </button>
          </div>
        </nav>

        {/* Sidebar Footer User detail card layout */}
        <div className="p-4 border-t border-slate-50 space-y-3">
          <div className="flex items-center gap-2.5 justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <span 
                className="w-9 h-9 rounded-full text-white text-[11px] font-black tracking-tight flex items-center justify-center uppercase shrink-0"
                style={{ backgroundColor: customPrimary }}
              >
                {(activeTenantObj?.name || 'C')[0]}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-700 truncate capitalize">{activeTenantObj?.name || 'Clínica'}</p>
                <span className="inline-block px-1.5 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-150 rounded-full text-[8px] font-black uppercase tracking-widest mt-0.5 leading-none shadow-xs">
                  Plano: {activeTenantObj?.plan || 'Grátis'}
                </span>
              </div>
            </div>
            
            {/* Sign Out Button */}
            {showLogoutConfirm ? (
              <div className="flex items-center gap-1 shrink-0 bg-red-50 p-1 rounded-lg border border-red-100 animate-pulse">
                <span className="text-[8px] text-red-600 font-black px-1 select-none">Sair?</span>
                <button
                  type="button"
                  onClick={() => {
                    setSession(null);
                    setActiveTab('dashboard');
                    setShowLogoutConfirm(false);
                  }}
                  className="px-1.5 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[8px] font-bold cursor-pointer transition-colors"
                >
                  Sim
                </button>
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="px-1.5 py-0.5 bg-white hover:bg-slate-50 text-slate-500 rounded border border-slate-150 text-[8px] font-bold cursor-pointer transition-colors"
                >
                  Não
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg cursor-pointer flex items-center justify-center shrink-0 transition-colors"
                title="Fazer Logout"
              >
                <LogOut size={14} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* CORE DISPLAY CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden h-full">
        {/* TOP SEARCH HEADER BAR */}
        <header className="h-16 px-8 border-b border-slate-50 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium font-sans">
            <span className="text-slate-800 font-bold uppercase tracking-wider text-[11px] font-sans">
              {(() => {
                switch (activeTab) {
                  case 'dashboard': return 'Painel Geral';
                  case 'agendamentos': return 'Agenda de Horários';
                  case 'clientes': return 'Meus Clientes';
                  case 'servicos': return 'Serviços e Tratamentos';
                  case 'equipe': return 'Profissionais e Colaboradores';
                  case 'horarios': return 'Horário de Funcionamento';
                  case 'mensagens': return 'Modelos de Mensagens';
                  case 'publico': return 'Design e Link Público';
                  case 'planos': return 'Nossos Planos';
                  case 'estoque': return 'Estoque e Controle';
                  case 'financeiro': return 'Financeiro e Livro Caixa';
                  default: return activeTab.replace('_', ' ');
                }
              })()}
            </span>
          </div>

          <div className="text-right flex items-center gap-4">
            <p className="text-[11px] font-mono text-slate-400">{new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
          </div>
        </header>

        {/* VIEW BODY RENDERING AREA */}
        <div className="flex-1 p-8 overflow-y-auto no-scrollbar" style={{ backgroundColor: customBackground }}>
          
          {activeTab === 'dashboard' && (
            <DashboardView 
              appointments={appointments}
              clients={clients}
              services={services}
              alerts={alerts}
              activities={activities}
              theme={activePreset}
              customPrimary={customPrimary}
              onNavigateToTab={setActiveTab}
              onOpenNewAppointment={() => setModalType('appointment')}
              onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
              currentPlan={activePlanName}
              currentFeatures={currentFeatures}
            />
          )}

          {activeTab === 'agendamentos' && (
            <AgendamentosView 
              appointments={appointments}
              clients={clients}
              services={services}
              professionals={professionals}
              theme={activePreset}
              customPrimary={customPrimary}
              onOpenNewAppointment={() => setModalType('appointment')}
              onOpenNewAppointmentWithDate={(dateString) => {
                setNewBooking(prev => ({ ...prev, date: dateString }));
                setModalType('appointment');
              }}
              onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
              onDeleteAppointment={handleDeleteAppointment}
              onEditAppointment={handleEditAppointment}
            />
          )}

          {activeTab === 'clientes' && (
            <ClientesView 
              clients={clients}
              appointments={appointments}
              services={services}
              theme={activePreset}
              customPrimary={customPrimary}
              onOpenNewClient={() => {
                if (clients.length >= currentFeatures.maxClients) {
                  handleShowUpgradeModal(`Cadastro de Clientes (${clients.length}/${currentFeatures.maxClients} limite atingido)`);
                } else {
                  setModalType('client');
                }
              }}
              onOpenNewAppointmentWithClient={(clientId) => {
                if (appointments.length >= currentFeatures.maxAppointmentsMonth) {
                  handleShowUpgradeModal(`Agendamentos Mensais (${appointments.length}/${currentFeatures.maxAppointmentsMonth} limite atingido)`);
                } else {
                  setNewBooking(prev => ({ ...prev, clientId }));
                  setModalType('appointment');
                }
              }}
              allowClinicalHistory={currentFeatures.allowClinicalHistory}
              onShowUpgradeModal={handleShowUpgradeModal}
            />
          )}

          {activeTab === 'leads_crm' && (
            <div className="relative h-full w-full">
              {!currentFeatures.allowCRM && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-8 text-center bg-slate-50/70 backdrop-blur-[2px] rounded-3xl border border-slate-100 min-h-[460px] text-slate-700">
                  <div className="max-w-sm p-6 bg-white rounded-3xl border border-slate-150 shadow-xl space-y-4">
                    <span className="inline-flex p-3 bg-amber-50 rounded-full text-orange-600">
                      <Columns size={24} />
                    </span>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Funil de Leads CRM Bloqueado</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Gerencie e converta leads interessados em tratamentos estéticos. Controle etapas de captação e agende atendimentos com total rastreabilidade. Disponível a partir do plano <strong>Profissional</strong>.
                    </p>
                    <button
                      onClick={() => handleShowUpgradeModal('Funil de Leads CRM')}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-indigo-500/10"
                    >
                      Liberar Funil CRM ⚡
                    </button>
                  </div>
                </div>
              )}
              <div className={`h-full w-full ${!currentFeatures.allowCRM ? 'blur-[1.5px] pointer-events-none select-none' : ''}`}>
                <LeadsView 
                  leads={leads}
                  services={services}
                  theme={activePreset}
                  customPrimary={customPrimary}
                  onAddLead={handleAddLead}
                  onUpdateLeadStage={handleUpdateLeadStage}
                  onUpdateLead={handleUpdateLead}
                  onDeleteLead={handleDeleteLead}
                  onConvertToClientAndSchedule={handleConvertToClientAndSchedule}
                />
              </div>
            </div>
          )}

          {activeTab === 'servicos' && (
            <ServicosView 
              services={services}
              theme={activePreset}
              customPrimary={customPrimary}
              onOpenNewService={() => {
                setEditingService(null);
                setNewService({ name: '', price: 30.00, duration: 60, visibleInBooking: true });
                setModalType('service');
              }}
              onToggleServiceVisibility={handleToggleServiceVisibility}
              onDeleteService={handleDeleteService}
              onEditService={(srv) => {
                setEditingService(srv);
                setNewService({ name: srv.name, price: srv.price, duration: srv.duration, visibleInBooking: srv.visibleInBooking });
                setModalType('service');
              }}
            />
          )}

          {activeTab === 'equipe' && (
            <EquipeView 
              professionals={professionals}
              theme={activePreset}
              customPrimary={customPrimary}
              onOpenNewProfessional={() => {
                if (professionals.length >= currentFeatures.maxProfessionals) {
                  handleShowUpgradeModal(`Cadastro de Colaborador (${professionals.length}/${currentFeatures.maxProfessionals} limite atingido)`);
                } else {
                  setEditingProfessional(null);
                  setNewProf({ name: '', role: 'Esteticista', status: 'Ativo' });
                  setModalType('professional');
                }
              }}
              onOpenNewAbsence={() => {
                if (!currentFeatures.allowAbsences) {
                  handleShowUpgradeModal('Controle de Ausências e Bloqueios de Agenda');
                } else {
                  setModalType('absence');
                }
              }}
              onDeleteAbsence={handleDeleteAbsence}
              onEditProfessional={(prof) => {
                setEditingProfessional(prof);
                setNewProf({ name: prof.name, role: prof.role, status: prof.status });
                setModalType('professional');
              }}
              onToggleLoginStatus={(id, email, password) => {
                setProfessionals(prev => prev.map(p => p.id === id ? { 
                  ...p, 
                  loginCreated: !!email, 
                  loginEmail: email, 
                  loginPassword: password 
                } : p));
                if (email) {
                  logActivity(`Login habilitado para colaborador com e-mail: ${email}`);
                } else {
                  logActivity(`Login desabilitado para colaborador.`);
                }
              }}
              allowAbsences={currentFeatures.allowAbsences}
              onShowUpgradeModal={handleShowUpgradeModal}
            />
          )}

          {activeTab === 'horarios' && (
            <HorariosView 
              operatingHours={operatingHours}
              theme={activePreset}
              customPrimary={customPrimary}
              onUpdateOperatingHours={setOperatingHours}
            />
          )}

          {activeTab === 'mensagens' && (
            <MensagensView 
              theme={activePreset}
              customPrimary={customPrimary}
              clients={clients}
              appointments={appointments}
              services={services}
              allowWhatsAppTemplates={currentFeatures.allowWhatsAppTemplates}
              onShowUpgradeModal={handleShowUpgradeModal}
            />
          )}

          {activeTab === 'pagina_publica' && (
            <PaginaPublicaView 
              settings={settings}
              services={services}
              operatingHours={operatingHours}
              currentTheme={activePreset}
              customPrimary={customPrimary}
              customSecondary={customSecondary}
              customBackground={customBackground}
              onUpdateSettings={(vals) => setSettings(prev => ({ ...prev, ...vals }))}
              onSaveSettings={(currentSettings) => {
                localStorage.setItem(`lumini_tenant_${activeTenantId}_settings`, JSON.stringify(currentSettings));
                setTenants(prev => {
                  const updated = prev.map(t => t.id === activeTenantId ? {
                    ...t,
                    sidebarTitle: currentSettings.sidebarTitle,
                    sidebarSubtitle: currentSettings.sidebarSubtitle,
                    name: currentSettings.name
                  } : t);
                  localStorage.setItem('lumini_tenants', JSON.stringify(updated));
                  return updated;
                });
              }}
              onCopyBookingLink={handleCopyBookingLink}
              copiedLink={copiedLink}
              allowOnlineBooking={currentFeatures.allowOnlineBooking}
              onShowUpgradeModal={handleShowUpgradeModal}
              bookingUrl={getPublicBookingUrl(activeTenantId)}
            />
          )}

          {activeTab === 'planos' && (
            <PlanosView 
              theme={activePreset}
              customPrimary={customPrimary}
              currentPlan={activeTenantObj?.plan || 'Grátis'}
              pricing={pricing}
              pendingPlanRequest={activeTenantObj?.pendingPlanRequest}
              planFeatures={planFeatures}
              onSelectPlan={(planName) => {
                if (planName === 'Grátis') {
                  setTenants(prev => prev.map(t => t.id === activeTenantId ? { ...t, plan: 'Grátis', pendingPlanRequest: undefined } : t));
                  alert("Seu plano foi alterado de volta para o plano Grátis.");
                  return;
                }
                setTenants(prev => prev.map(t => t.id === activeTenantId ? { ...t, pendingPlanRequest: planName } : t));
                alert(`Solicitação Recebida! Sua solicitação para migração para o plano "${planName}" foi registrada com sucesso e está em análise. Um administrador ativará seu acesso em breve.`);
              }}
            />
          )}

          {/* FINANCE REAL LEDGER SUBVIEW */}
          {activeTab === 'financeiro' && (() => {
            const filteredTransactions = transactions.filter(tx => {
              if (financeStartDate && tx.date < financeStartDate) return false;
              if (financeEndDate && tx.date > financeEndDate) return false;
              if (financeClientFilter) {
                if (!tx.clientName || !tx.clientName.toLowerCase().includes(financeClientFilter.toLowerCase())) return false;
              }
              return true;
            });

            const totalRevenue = filteredTransactions.filter(tx => tx.type === 'receita').reduce((sum, tx) => sum + tx.value, 0);
            const totalExpense = filteredTransactions.filter(tx => tx.type === 'despesa').reduce((sum, tx) => sum + tx.value, 0);
            const netIncome = totalRevenue - totalExpense;

            return (
              <div className="space-y-6 pb-12 animate-fade-in text-slate-700">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">Financeiro e Caixa</h2>
                    <p className="text-xs text-slate-500 mt-0.5 font-sans">Acompanhe receitas, custos operacionais e margens líquidas.</p>
                  </div>
                  {currentFeatures.allowFinance ? (
                    <button
                      onClick={() => {
                        setNewTx({ desc: '', type: 'receita', value: 0, date: new Date().toISOString().split('T')[0], clientName: '' });
                        setFinanceModalOpen(true);
                      }}
                      className="px-5 py-2.5 rounded-full text-xs font-semibold text-white cursor-pointer"
                      style={{ backgroundColor: customPrimary }}
                    >
                      + Novo Lançamento Manual
                    </button>
                  ) : (
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-[10px] font-black font-sans flex items-center gap-1 uppercase tracking-wider self-start shrink-0">
                      Plano Profissional
                    </span>
                  )}
                </div>

                <div className="relative">
                  {!currentFeatures.allowFinance && (
                    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-8 text-center bg-slate-50/70 backdrop-blur-[2px] rounded-3xl border border-slate-100 min-h-[460px]">
                      <div className="max-w-sm p-6 bg-white rounded-3xl border border-slate-150 shadow-xl space-y-4">
                        <span className="inline-flex p-3 bg-amber-50 rounded-full text-orange-600">
                          <TrendingUp size={24} />
                        </span>
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Gestão Financeira Bloqueada</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Tenha visão geral de faturamento, controle de caixa diário, despesas clínicas e cálculo de lucros. Disponível a partir do plano <strong>Profissional</strong>.
                        </p>
                        <button
                          onClick={() => handleShowUpgradeModal('Financeiro e Livro Caixa')}
                          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-indigo-500/10"
                        >
                          Liberar Módulo Financeiro ⚡
                        </button>
                      </div>
                    </div>
                  )}

                  <div className={`space-y-6 ${!currentFeatures.allowFinance ? 'blur-[1.5px] pointer-events-none select-none' : ''}`}>
                    {/* Summary Info Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-1">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block font-bold">Total Receitas</span>
                    <span className="text-xl font-mono font-extrabold text-emerald-600 block">{formatCurrency(totalRevenue)}</span>
                  </div>
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-1">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block font-bold">Total Despesas</span>
                    <span className="text-xl font-mono font-extrabold text-red-500 block">{formatCurrency(totalExpense)}</span>
                  </div>
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-1">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block font-bold">Saldo do Período</span>
                    <span className={`text-xl font-mono font-extrabold block ${netIncome >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                      {formatCurrency(netIncome)}
                    </span>
                  </div>
                </div>

                {/* Advanced Filtering Controls Block */}
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">Filtros Avançados</h4>
                    {(financeStartDate || financeEndDate || financeClientFilter) && (
                      <button
                        onClick={() => {
                          setFinanceStartDate('');
                          setFinanceEndDate('');
                          setFinanceClientFilter('');
                        }}
                        className="text-[10px] font-bold text-slate-500 hover:text-slate-700 bg-slate-50 px-2.5 py-1 rounded-full cursor-pointer"
                      >
                        Limpar Filtros
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">Data Inicial</label>
                      <input
                        type="date"
                        value={financeStartDate}
                        onChange={(e) => setFinanceStartDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">Data Final</label>
                      <input
                        type="date"
                        value={financeEndDate}
                        onChange={(e) => setFinanceEndDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">Filtrar por Cliente</label>
                      <select
                        value={financeClientFilter}
                        onChange={(e) => setFinanceClientFilter(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white outline-none"
                      >
                        <option value="">-- Todos os Clientes --</option>
                        {clients.map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Transactions display list */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
                  <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Histórico de Fluxo de Caixa</h4>
                    <span className="text-[10px] font-mono text-slate-400">Total de registros filtrados: {filteredTransactions.length}</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-400 font-mono text-[9px] uppercase tracking-wider border-b border-slate-100">
                          <th className="py-3 px-6">Data</th>
                          <th className="py-3 px-6">Lançamento / Descrição</th>
                          <th className="py-3 px-6">Cliente Relacionado</th>
                          <th className="py-3 px-6">Tipo</th>
                          <th className="py-3 px-6 text-right">Valor</th>
                          <th className="py-3 px-6 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredTransactions.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-slate-400 italic">Nenhum lançamento encontrado para os filtros selecionados.</td>
                          </tr>
                        ) : (
                          filteredTransactions.map(tx => (
                            <tr key={tx.id} className="hover:bg-slate-50/20">
                              <td className="py-4 px-6 font-mono text-slate-500">{new Date(tx.date + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                              <td className="py-4 px-6 font-semibold text-slate-700 capitalize">{tx.desc}</td>
                              <td className="py-4 px-6 text-slate-500 capitalize">{tx.clientName || 'N/A'}</td>
                              <td className="py-4 px-6">
                                <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase ${
                                  tx.type === 'receita' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                                }`}>
                                  {tx.type}
                                </span>
                              </td>
                              <td className={`py-4 px-6 text-right font-mono font-bold ${
                                tx.type === 'receita' ? 'text-emerald-600' : 'text-red-500'
                              }`}>
                                {tx.type === 'receita' ? '+' : '-'} {formatCurrency(tx.value)}
                              </td>
                              <td className="py-4 px-6 text-center">
                                {txDeleteConfirmId === tx.id ? (
                                  <div className="inline-flex items-center justify-center gap-1.5 animate-pulse bg-red-50 p-1.5 rounded-lg border border-red-100">
                                    <span className="text-[8px] text-red-600 font-bold select-none">Excluir?</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setTransactions(prev => prev.filter(t => t.id !== tx.id));
                                        logActivity(`Lançamento excluído: ${tx.desc}`);
                                        setTxDeleteConfirmId(null);
                                      }}
                                      className="px-1.5 py-0.5 bg-red-600 text-white rounded text-[8px] font-bold cursor-pointer hover:bg-red-700"
                                    >
                                      Sim
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setTxDeleteConfirmId(null)}
                                      className="px-1.5 py-0.5 bg-white text-slate-500 rounded border border-slate-200 text-[8px] font-bold cursor-pointer"
                                    >
                                      Não
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setTxDeleteConfirmId(tx.id);
                                    }}
                                    className="text-[10px] text-red-500 hover:text-red-700 bg-red-50/50 hover:bg-red-50 px-2 py-1 rounded-md transition-all cursor-pointer"
                                  >
                                    Excluir
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                </div>
                </div>

                {/* Modal for manual financial ledger entry */}
                {financeModalOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const brandNewTx = {
                          id: generateUniqueId('tx'),
                          desc: newTx.desc,
                          type: newTx.type,
                          value: newTx.value,
                          date: newTx.date,
                          clientName: newTx.clientName
                        };
                        setTransactions(prev => [brandNewTx, ...prev]);
                        logActivity(`Lançamento financeiro manual: ${newTx.desc} (R$ ${newTx.value})`);
                        setFinanceModalOpen(false);
                      }}
                      className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4"
                    >
                      <div>
                        <h3 className="text-sm font-bold text-slate-800">Registrar Fluxo de Caixa</h3>
                        <p className="text-[10px] text-slate-500 mt-0.5 font-sans">Efetue o lançamento imediato no livro de caixa operacional da clínica.</p>
                      </div>

                      <div className="space-y-3 font-sans text-xs text-slate-700">
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-slate-400 uppercase block tracking-wider font-bold">Descrição do Lançamento</label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: Compra toalhas descartáveis"
                            value={newTx.desc}
                            onChange={(e) => setNewTx(prev => ({ ...prev, desc: e.target.value }))}
                            className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono text-slate-400 uppercase block tracking-wider font-bold">Tipo de Operação</label>
                            <select
                              value={newTx.type}
                              onChange={(e) => setNewTx(prev => ({ ...prev, type: e.target.value }))}
                              className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white outline-none"
                            >
                              <option value="receita">Receita (Entrada)</option>
                              <option value="despesa">Despesa (Saída)</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-mono text-slate-400 uppercase block tracking-wider font-bold">Valor (R$)</label>
                            <input
                              type="text"
                              required
                              placeholder="0,00"
                              value={formatDecimalDisplay(newTx.value)}
                              onChange={(e) => setNewTx(prev => ({ ...prev, value: parseDecimalFromInput(e.target.value) }))}
                              onFocus={(e) => e.target.select()}
                              className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white outline-none font-mono text-right text-slate-850"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono text-slate-400 uppercase block tracking-wider font-bold">Data do Lançamento</label>
                            <input
                              type="date"
                              required
                              value={newTx.date}
                              onChange={(e) => setNewTx(prev => ({ ...prev, date: e.target.value }))}
                              className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-mono text-slate-400 uppercase block tracking-wider font-bold">Cliente Vinculado</label>
                            <select
                              value={newTx.clientName}
                              onChange={(e) => setNewTx(prev => ({ ...prev, clientName: e.target.value }))}
                              className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white outline-none"
                            >
                              <option value="">Nenhum (Despesa Geral)</option>
                              {clients.map(c => (
                                <option key={c.id} value={c.name}>{c.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setFinanceModalOpen(false)}
                          className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold border border-slate-100 transition-colors cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
                          style={{ backgroundColor: customPrimary }}
                        >
                          Confirmar
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            );
          })()}

          {/* STOCK TRACKER SUBVIEW */}
          {activeTab === 'estoque' && (
            <div className="space-y-6 pb-12 animate-fade-in text-slate-700">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">Gestão de Estoque e Suprimentos</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Monitore os níveis de preenchedores, cosméticos, agulhas e evite surpresas.</p>
                </div>
                {currentFeatures.allowStock ? (
                  <button
                    onClick={() => {
                      setEditingStockItem(null);
                      setNewStockItem({ name: '', qty: 10, minQty: 5, unit: 'seringa', price: 100.00 });
                      setStockModalOpen(true);
                    }}
                    className="px-5 py-2.5 rounded-full text-xs font-semibold text-white cursor-pointer"
                    style={{ backgroundColor: customPrimary }}
                  >
                    + Cadastrar Produto
                  </button>
                ) : (
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-[10px] font-black font-sans flex items-center gap-1 uppercase tracking-wider self-start shrink-0">
                    Plano Profissional
                  </span>
                )}
              </div>

              <div className="relative">
                {!currentFeatures.allowStock && (
                  <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-8 text-center bg-slate-50/70 backdrop-blur-[2px] rounded-3xl border border-slate-100 min-h-[460px]">
                    <div className="max-w-sm p-6 bg-white rounded-3xl border border-slate-150 shadow-xl space-y-4">
                      <span className="inline-flex p-3 bg-amber-50 rounded-full text-orange-600">
                        <Shield size={24} />
                      </span>
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Auditoria de Estoque Bloqueada</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Controle produtos profissionais, registre as saídas de insumos por procedimento e receba avisos automáticos de estoque crítico. Disponível a partir do plano <strong>Profissional</strong>.
                      </p>
                      <button
                        onClick={() => handleShowUpgradeModal('Controle e Auditoria de Estoques')}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-indigo-500/10"
                      >
                        Liberar Módulo de Estoque ⚡
                      </button>
                    </div>
                  </div>
                )}

                <div className={`space-y-6 ${!currentFeatures.allowStock ? 'blur-[1.5px] pointer-events-none select-none' : ''}`}>

              {/* Filtering & Search Bar */}
              <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex items-center justify-between gap-4">
                <input
                  type="text"
                  placeholder="🔍 Buscar produto pelo nome..."
                  value={stockSearch}
                  onChange={(e) => setStockSearch(e.target.value)}
                  className="text-xs px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-full w-full max-w-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-300 transition-all font-sans"
                />
                
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-full">
                  Total de itens: {stockItems.length}
                </span>
              </div>

              {/* Items Card Grid */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
                <div className="p-5 border-b flex items-center justify-between bg-slate-50/50">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono">Inventário Clínico</h4>
                  {stockItems.some(item => item.qty <= item.minQty) && (
                    <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2.5 py-1 rounded-full animate-pulse">
                      ⚠️ Atenção: Itens em Estoque Crítico
                    </span>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 font-mono text-[9px] uppercase border-b border-slate-100">
                        <th className="py-3 px-6">Produto / Insumo</th>
                        <th className="py-3 px-6">Quantidade</th>
                        <th className="py-3 px-6 text-center">Ajuste Rápido</th>
                        <th className="py-3 px-6">Status de Alerta</th>
                        <th className="py-3 px-6 text-right">Preço Unitário</th>
                        <th className="py-3 px-6 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {stockItems
                        .filter(item => item.name.toLowerCase().includes(stockSearch.toLowerCase()))
                        .map(item => {
                          const isLow = item.qty <= item.minQty;
                          return (
                            <tr key={item.id} className="hover:bg-slate-50/20">
                              <td className="py-4 px-6">
                                <span className="font-bold text-slate-700 block">{item.name}</span>
                                <span className="text-[10px] text-slate-400">Restante mínimo sugerido: {item.minQty} {item.unit}s</span>
                              </td>
                              <td className="py-4 px-6 font-mono font-semibold text-slate-600">
                                {item.qty} {item.unit}s
                              </td>
                              <td className="py-4 px-6 text-center">
                                <div className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-100 p-1 rounded-xl">
                                  <button
                                    onClick={() => {
                                      setStockItems(prev => prev.map(p => p.id === item.id ? { ...p, qty: Math.max(0, p.qty - 1) } : p));
                                      logActivity(`Estoque diminuído para ${item.name}`);
                                    }}
                                    className="w-6 h-6 rounded-lg text-slate-600 hover:bg-white border hover:border-slate-200 font-bold transition-all flex items-center justify-center cursor-pointer"
                                  >
                                    -
                                  </button>
                                  <span className="font-mono text-[10px] font-bold text-slate-600 px-1">{item.qty}</span>
                                  <button
                                    onClick={() => {
                                      setStockItems(prev => prev.map(p => p.id === item.id ? { ...p, qty: p.qty + 1 } : p));
                                      logActivity(`Estoque aumentado para ${item.name}`);
                                    }}
                                    className="w-6 h-6 rounded-lg text-slate-600 hover:bg-white border hover:border-slate-200 font-bold transition-all flex items-center justify-center cursor-pointer"
                                  >
                                    +
                                  </button>
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase inline-block ${
                                  isLow ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'
                                }`}>
                                  {isLow ? '🚨 Abastecer Imediato' : '✅ Estabilidade OK'}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-right font-mono font-bold text-slate-700">{formatCurrency(item.price)}</td>
                              <td className="py-4 px-6 text-center space-x-2">
                                <button
                                  onClick={() => {
                                    setEditingStockItem(item);
                                    setNewStockItem({ name: item.name, qty: item.qty, minQty: item.minQty, unit: item.unit, price: item.price });
                                    setStockModalOpen(true);
                                  }}
                                  className="px-2.5 py-1.5 border border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-[10px] font-semibold text-slate-600 rounded-xl transition-all cursor-pointer"
                                >
                                  ✏️ Editar
                                </button>
                                {stockDeleteConfirmId === item.id ? (
                                  <div className="inline-flex items-center gap-1 animate-pulse bg-red-50 p-1 rounded-xl border border-red-100">
                                    <span className="text-[8px] text-red-600 font-bold px-1 select-none">Excluir?</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setStockItems(prev => prev.filter(p => p.id !== item.id));
                                        logActivity(`Item de estoque excluído: ${item.name}`);
                                        setStockDeleteConfirmId(null);
                                      }}
                                      className="px-1.5 py-0.5 bg-red-600 text-white rounded text-[8px] font-bold cursor-pointer hover:bg-red-700"
                                    >
                                      Sim
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setStockDeleteConfirmId(null)}
                                      className="px-1.5 py-0.5 bg-white text-slate-500 rounded border border-slate-150 text-[8px] font-bold cursor-pointer"
                                    >
                                      Não
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setStockDeleteConfirmId(item.id);
                                    }}
                                    className="px-2.5 py-1.5 border border-red-50 hover:bg-red-50 text-[10px] font-semibold text-red-500 rounded-xl transition-all cursor-pointer"
                                  >
                                    🗑️ Excluir
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Dynamic Modal to Create or Edit Stock Items */}
              {stockModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (editingStockItem) {
                        setStockItems(prev => prev.map(item => item.id === editingStockItem.id ? { ...editingStockItem, name: newStockItem.name, qty: newStockItem.qty, minQty: newStockItem.minQty, unit: newStockItem.unit, price: newStockItem.price } : item));
                        logActivity(`Produto editado no estoque: ${newStockItem.name}`);
                        setEditingStockItem(null);
                      } else {
                        const brandNew = {
                          id: generateUniqueId('st'),
                          name: newStockItem.name,
                          qty: newStockItem.qty,
                          minQty: newStockItem.minQty,
                          unit: newStockItem.unit,
                          price: newStockItem.price
                        };
                        setStockItems(prev => [...prev, brandNew]);
                        logActivity(`Novo produto cadastrado no estoque: ${newStockItem.name}`);
                      }
                      setStockModalOpen(false);
                    }}
                    className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4"
                  >
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">
                        {editingStockItem ? 'Editar Produto / Insumo' : 'Cadastrar Novo Insumo'}
                      </h3>
                      <p className="text-[10px] text-slate-500 mt-0.5">Preencha as informações detalhadas para o controle e auditoria automática do estoque.</p>
                    </div>

                    <div className="space-y-3 font-sans text-xs">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">Nome do Produto</label>
                        <input
                          type="text"
                          required
                          value={newStockItem.name}
                          onChange={(e) => setNewStockItem(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Ex: Ácido Hialurônico 1ml Restylane"
                          className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-300 transition-all font-sans"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">Unid. Medida</label>
                          <select
                            value={newStockItem.unit}
                            onChange={(e) => setNewStockItem(prev => ({ ...prev, unit: e.target.value }))}
                            className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:outline-none transition-all font-sans"
                          >
                            <option value="unidade">unidade(s)</option>
                            <option value="seringa">seringa(s)</option>
                            <option value="frasco">frasco(s)</option>
                            <option value="ampola">ampola(s)</option>
                            <option value="caixa">caixa(s)</option>
                            <option value="bisnaga">bisnaga(s)</option>
                            <option value="pacote">pacote(s)</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">Preço Unitário</label>
                          <input
                            type="text"
                            required
                            value={formatDecimalDisplay(newStockItem.price)}
                            onChange={(e) => setNewStockItem(prev => ({ ...prev, price: parseDecimalFromInput(e.target.value) }))}
                            onFocus={(e) => e.target.select()}
                            placeholder="0,00"
                            className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-300 transition-all font-mono text-right text-slate-850"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">Qtd. Atual</label>
                          <input
                            type="number"
                            min="0"
                            required
                            value={newStockItem.qty || ''}
                            onChange={(e) => setNewStockItem(prev => ({ ...prev, qty: parseInt(e.target.value) || 0 }))}
                            onFocus={(e) => e.target.select()}
                            placeholder="0"
                            className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-300 transition-all font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">Alerta Mínimo</label>
                          <input
                            type="number"
                            min="0"
                            required
                            value={newStockItem.minQty || ''}
                            onChange={(e) => setNewStockItem(prev => ({ ...prev, minQty: parseInt(e.target.value) || 0 }))}
                            onFocus={(e) => e.target.select()}
                            placeholder="Ex: 5"
                            className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-300 transition-all font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setStockModalOpen(false);
                          setEditingStockItem(null);
                        }}
                        className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold border border-slate-100 transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
                        style={{ backgroundColor: customPrimary }}
                      >
                        Salvar Produto
                      </button>
                    </div>
                  </form>
                </div>
              )}

              </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ----------------- INTERACTIVE DIALOG MODAL POPUPS ----------------- */}

      {/* 1. NEW BOOKING MODAL */}
      {modalType === 'appointment' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <form 
            onSubmit={handleCreateAppointment}
            className="bg-white rounded-[32px] max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-xs text-slate-700"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-slate-800">Agendar Tratamento</h3>
              <button 
                type="button" 
                onClick={() => { setModalType(null); setPendingLeadConversion(null); }} 
                className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {/* Client select dropdown with quick add trigger */}
              <div className="space-y-1.5ClassName">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">Paciente</label>
                  <button
                    type="button"
                    onClick={() => setModalType('client')}
                    style={{ color: customPrimary }}
                    className="text-[10px] font-bold hover:underline cursor-pointer"
                  >
                    + Criar Paciente Novo
                  </button>
                </div>
                <select
                  value={newBooking.clientId}
                  onChange={(e) => setNewBooking(prev => ({ ...prev, clientId: e.target.value }))}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs text-slate-700 focus:outline-none"
                >
                  <option value="">Selecione um cliente...</option>
                  {pendingLeadConversion && (
                    <option value="convert-lead-current">Criar cadastro: {pendingLeadConversion.name} (Lead)</option>
                  )}
                  {clients.map(c => (
                    <option key={c.id} value={c.id} className="capitalize">{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Service Select */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">Procedimento Estético</label>
                <select
                  value={newBooking.serviceId}
                  onChange={(e) => setNewBooking(prev => ({ ...prev, serviceId: e.target.value }))}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs text-slate-700 focus:outline-none"
                >
                  <option value="">Selecione o procedimento...</option>
                  {services.filter(s => s.status === 'Ativo').map(s => (
                    <option key={s.id} value={s.id} className="capitalize">{s.name} ({formatCurrency(s.price)})</option>
                  ))}
                </select>
              </div>

              {/* Professional Select */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">Profissional Colaborador</label>
                <select
                  value={newBooking.professionalId}
                  onChange={(e) => setNewBooking(prev => ({ ...prev, professionalId: e.target.value }))}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs text-slate-700 focus:outline-none"
                >
                  {professionals.map(p => (
                    <option key={p.id} value={p.id}>{p.name} · {p.role}</option>
                  ))}
                </select>
              </div>

              {/* Date and Time selectors */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block font-mono">Data</label>
                  <input
                    type="date"
                    value={newBooking.date}
                    onChange={(e) => setNewBooking(prev => ({ ...prev, date: e.target.value }))}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block font-mono">Horário</label>
                  <input
                    type="text"
                    value={newBooking.time}
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, '');
                      if (val.length > 4) {
                        val = val.slice(0, 4);
                      }
                      if (val.length > 2) {
                        val = `${val.slice(0, 2)}:${val.slice(2)}`;
                      }
                      setNewBooking(prev => ({ ...prev, time: val }));
                    }}
                    onBlur={(e) => {
                      let val = e.target.value.trim();
                      const digits = val.replace(/\D/g, '');
                      if (digits.length === 4) {
                        val = `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
                      } else if (digits.length === 3) {
                        val = `0${digits.slice(0, 1)}:${digits.slice(1, 3)}`;
                      } else if (digits.length > 0 && digits.length <= 2) {
                        val = `${digits.padStart(2, '0')}:00`;
                      }
                      if (/^\d{2}:\d{2}$/.test(val)) {
                        setNewBooking(prev => ({ ...prev, time: val }));
                      }
                    }}
                    onFocus={(e) => {
                      const target = e.target;
                      setTimeout(() => {
                        try {
                          target.select();
                        } catch (err) {}
                      }, 50);
                    }}
                    onClick={(e) => {
                      try {
                        (e.target as HTMLInputElement).select();
                      } catch (err) {}
                    }}
                    required
                    placeholder="Ex: 11:50"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs focus:outline-none font-mono font-semibold"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 pt-4 border-t border-slate-50">
              <button
                type="button"
                onClick={() => { setModalType(null); setPendingLeadConversion(null); }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold cursor-pointer text-center"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 text-white rounded-xl font-bold cursor-pointer text-center transition-opacity hover:opacity-90"
                style={{ backgroundColor: customPrimary }}
              >
                Registrar Agendamento
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. NEW CLIENT MODAL */}
      {modalType === 'client' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <form 
            onSubmit={handleCreateClient}
            className="bg-white rounded-[32px] max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-xs text-slate-700"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-slate-800">Cadastrar Novo Paciente</h3>
              <button 
                type="button" 
                onClick={() => setModalType(null)} 
                className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={newClient.name}
                  onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome do cliente"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs text-slate-750 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Telefone Celular</label>
                  <input
                    type="text"
                    required
                    value={newClient.phone}
                    onChange={(e) => setNewClient(prev => ({ ...prev, phone: formatPhone(e.target.value) }))}
                    onFocus={(e) => e.target.select()}
                    placeholder="Ex: (48) 99636-7442"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs focus:outline-none font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Data Nascimento</label>
                  <input
                    type="date"
                    value={newClient.birthdate}
                    onChange={(e) => setNewClient(prev => ({ ...prev, birthdate: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Email de Contato</label>
                <input
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="paciente@exemplo.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Observações / Alergias Clínicas</label>
                <textarea
                  value={newClient.notes}
                  onChange={(e) => setNewClient(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Alergia a ácidos, reações anteriores..."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs focus:outline-none focus:ring-1 transition-all"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-4 border-t border-slate-50">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="flex-1 py-2.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 text-white rounded-xl font-bold cursor-pointer transition-opacity hover:opacity-90"
                style={{ backgroundColor: customPrimary }}
              >
                Salvar Paciente
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. NEW/EDIT SERVICE MODAL */}
      {modalType === 'service' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in animate-scale-up">
          <form 
            onSubmit={handleCreateOrUpdateService}
            className="bg-white rounded-[32px] max-w-sm w-full p-6 shadow-2xl border space-y-4 text-xs text-slate-700"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-slate-800">{editingService ? 'Editar Procedimento' : 'Novo Procedimento Estético'}</h3>
              <button 
                type="button" 
                onClick={() => setModalType(null)} 
                className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Nome do Serviço</label>
                <input
                  type="text"
                  required
                  value={newService.name}
                  onChange={(e) => setNewService(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Limpeza de Pele Profunda"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs focus:outline-none text-slate-750"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Preço (R$)</label>
                  <input
                    type="text"
                    required
                    value={formatDecimalDisplay(newService.price)}
                    onChange={(e) => setNewService(prev => ({ ...prev, price: parseDecimalFromInput(e.target.value) }))}
                    onFocus={(e) => e.target.select()}
                    placeholder="0,00"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs focus:outline-none text-slate-750 font-mono text-right"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Duração (minutos)</label>
                  <input
                    type="number"
                    required
                    value={newService.duration}
                    onChange={(e) => setNewService(prev => ({ ...prev, duration: Number(e.target.value) }))}
                    onFocus={(e) => e.target.select()}
                    placeholder="60"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs focus:outline-none text-slate-750 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 pt-4 border-t border-slate-50">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="flex-1 py-2.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 text-white rounded-xl font-bold cursor-pointer transition-opacity hover:opacity-90"
                style={{ backgroundColor: customPrimary }}
              >
                Salvar Procedimento
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. NEW/EDIT COLLABORATOR MODAL */}
      {modalType === 'professional' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in animate-scale-up">
          <form 
            onSubmit={handleCreateOrUpdateProfessional}
            className="bg-white rounded-[32px] max-w-sm w-full p-6 shadow-2xl border space-y-4 text-xs text-slate-700"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-slate-800">{editingProfessional ? 'Editar Colaborador' : 'Adicionar Colaborador'}</h3>
              <button 
                type="button" 
                onClick={() => setModalType(null)} 
                className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={newProf.name}
                  onChange={(e) => setNewProf(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome do colaborador"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs focus:outline-none text-slate-750"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Função / Cargo Especialista</label>
                <input
                  type="text"
                  required
                  value={newProf.role}
                  onChange={(e) => setNewProf(prev => ({ ...prev, role: e.target.value }))}
                  placeholder="Ex: Biomédica Esteta"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs focus:outline-none text-slate-750"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Status Contratual</label>
                <select
                  value={newProf.status}
                  onChange={(e) => setNewProf(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs focus:outline-none text-slate-750"
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2.5 pt-4 border-t border-slate-50">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="flex-1 py-2.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 text-white rounded-xl font-bold cursor-pointer transition-opacity hover:opacity-90"
                style={{ backgroundColor: customPrimary }}
              >
                Salvar Colaborador
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 5. DEFINE ABSENCE (LOCK CALENDAR) MODAL */}
      {modalType === 'absence' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <form 
            onSubmit={handleCreateAbsence}
            className="bg-white rounded-[32px] max-w-sm w-full p-6 shadow-2xl border space-y-4 text-xs text-slate-700"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-slate-800">Definir Ausência do Profissional</h3>
              <button type="button" onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Selecione o Profissional</label>
                <select
                  value={newAbsence.professionalId}
                  onChange={(e) => setNewAbsence(prev => ({ ...prev, professionalId: e.target.value }))}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs"
                >
                  {professionals.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Data Cobertura Início</label>
                  <input
                    type="date"
                    required
                    value={newAbsence.startDate}
                    onChange={(e) => setNewAbsence(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Hora Início</label>
                  <input
                    type="time"
                    required
                    value={newAbsence.startTime}
                    onChange={(e) => setNewAbsence(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Data Cobertura Fim</label>
                  <input
                    type="date"
                    required
                    value={newAbsence.endDate}
                    onChange={(e) => setNewAbsence(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Hora Fim</label>
                  <input
                    type="time"
                    required
                    value={newAbsence.endTime}
                    onChange={(e) => setNewAbsence(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Motivo / Bloqueio</label>
                <input
                  type="text"
                  required
                  value={newAbsence.reason}
                  onChange={(e) => setNewAbsence(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Ex: Congresso estético, folga, almoço"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs text-slate-750 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-4 border-t border-slate-50">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="flex-1 py-2.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl font-bold cursor-pointer text-center"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 text-white rounded-xl font-bold cursor-pointer text-center transition-opacity hover:opacity-90"
                style={{ backgroundColor: customPrimary }}
              >
                Registrar Bloqueio / Ausência
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 6. UPGRADE PREMIUM SAAS MODAL */}
      {upgradeModalOpen && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in text-slate-700">
          <div className="bg-white rounded-[32px] max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-5 text-xs relative overflow-hidden">
            
            {/* Visual accent background */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 via-amber-500 to-indigo-600" />

            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-orange-50 rounded-xl text-orange-600">
                  <Award size={18} />
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-900 tracking-tight leading-none">Upgrade Premium</h3>
                  <span className="text-[8px] text-orange-500 font-extrabold font-mono uppercase tracking-widest mt-1 block">Leonel CRM Recursos</span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setUpgradeModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 text-lg font-bold w-6 h-6 rounded-full hover:bg-slate-50 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-3.5 space-y-2">
                <p className="text-[10px] font-medium text-slate-600">
                  Você atingiu o limite ou recurso bloqueado do seu plano:
                </p>
                <div className="flex items-center gap-1.5 py-1 px-2.5 bg-white border border-orange-200/50 rounded-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping shrink-0" />
                  <span className="font-extrabold text-[11px] text-slate-800">{upgradeFeatureName}</span>
                </div>
                <p className="text-[9px] text-slate-500 leading-relaxed font-sans">
                  Sua clínica está atualmente no plano <span className="font-black text-orange-600 font-mono uppercase bg-orange-100 px-1 py-0.5 rounded-md">{activePlanName}</span>. Faça um upgrade instantâneo para desbloquear seu potencial!
                </p>
              </div>

              <div className="space-y-2.5">
                <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider font-mono">Planos Disponíveis:</p>

                {/* Professional plan box */}
                <div 
                  onClick={() => {
                    setTenants(prev => prev.map(t => t.id === activeTenantId ? { ...t, pendingPlanRequest: 'Profissional' } : t));
                    setUpgradeModalOpen(false);
                    alert("Sua solicitação para migração para o Plano Profissional foi enviada com sucesso! A administração ativará sua conta em instantes.");
                  }}
                  className="group relative p-3 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-200 rounded-2xl cursor-pointer transition flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-extrabold text-slate-900 block">Profissional</span>
                    <span className="text-[8px] text-slate-500 tracking-tight leading-normal max-w-44 block">
                      {planFeatures['Profissional']?.description || 'WhatsApp, CRM, 2 colaboradores, 100 clientes e disparo rápido.'}
                    </span>
                  </div>
                  <span className="text-right whitespace-nowrap shrink-0 font-mono">
                    <strong className="text-xs text-indigo-700 font-bold block">R$ {pricing.Profissional || 67}</strong>
                    <span className="text-[7px] text-indigo-400 block mt-0.5 leading-none">/ mês</span>
                  </span>
                </div>

                {/* Clinic Plan Box */}
                <div 
                  onClick={() => {
                    setTenants(prev => prev.map(t => t.id === activeTenantId ? { ...t, pendingPlanRequest: 'Clínica' } : t));
                    setUpgradeModalOpen(false);
                    alert("Excelência solicitada! Sua solicitação para migração para o Plano Clínica foi enviada com sucesso! A administração ativará sua conta em instantes.");
                  }}
                  className="group relative p-3 bg-indigo-950 border border-indigo-900 rounded-2xl cursor-pointer transition flex items-center justify-between text-white"
                >
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-extrabold text-indigo-100 block">Clínica 👑</span>
                    <span className="text-[8px] text-slate-300 tracking-tight leading-normal max-w-44 block">
                      {planFeatures['Clínica']?.description || 'Multi-Agenda, ausências, agendamento online livre e gestão ilimitada.'}
                    </span>
                  </div>
                  <span className="text-right whitespace-nowrap shrink-0 font-mono">
                    <strong className="text-xs text-amber-400 font-bold block">R$ {pricing.Clínica || 147}</strong>
                    <span className="text-[7px] text-indigo-300 block mt-0.5 leading-none">/ mês</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setUpgradeModalOpen(false)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold cursor-pointer text-center font-sans tracking-wide text-[9px] transition"
              >
                Voltar e manter limitações
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
