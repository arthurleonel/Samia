import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { createServer as createViteServer } from 'vite';

const { Pool } = pg;

// Support dual-mode path resolution (both ESM dev and CJS bundle prod)
let resolvedFilename = '';
let resolvedDirname = '';

try {
  if (typeof import.meta !== 'undefined' && import.meta.url) {
    resolvedFilename = fileURLToPath(import.meta.url);
    resolvedDirname = path.dirname(resolvedFilename);
  }
} catch (e) {
  // Graceful fallback
}

// Safely bind helper paths to avoid shadowing global __filename/__dirname and provoking compiler TDZ errors
export const _filename = resolvedFilename || (typeof __filename !== 'undefined' ? __filename : '');
export const _dirname = resolvedDirname || (typeof __dirname !== 'undefined' ? __dirname : process.cwd());

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// --- PostgreSQL Database Connection Pool Helper ---
let pool: any = null;
let isDbConnected = false;

// Pull DB parameters
const connectionString = process.env.DATABASE_URL;
const dbUser = process.env.DB_USER || process.env.POSTGRES_USER;
const dbPassword = process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD;
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = parseInt(process.env.DB_PORT || '5432');
const dbName = process.env.DB_DATABASE || process.env.POSTGRES_DB || 'lumini_db';

try {
  if (connectionString) {
    console.log(`[Database] Attempting connection via DATABASE_URL...`);
    pool = new Pool({ connectionString });
  } else if (dbUser && dbPassword) {
    console.log(`[Database] Attempting connection via discrete credentials...`);
    pool = new Pool({
      user: dbUser,
      password: dbPassword,
      host: dbHost,
      port: dbPort,
      database: dbName,
    });
  } else {
    console.log(`[Database] No PostgreSQL credentials found in environment. Fallback JSON storage enabled.`);
  }
} catch (err: any) {
  console.error('[Database] Failed to init pg Pool:', err.message);
}

// Graceful verification of Postgres & Auto Schema Creation
// Graceful verification of Postgres & Auto Schema Creation
const DEFAULT_INITIAL_TENANTS = [
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

const DEFAULT_PLAN_FEATURES = {
  'Grátis': {
    maxAppointmentsMonth: 15,
    maxClients: 10,
    maxProfessionals: 1,
    allowClinicalHistory: false,
    allowWhatsAppTemplates: false,
    allowMultiAgenda: false,
    allowAbsences: false,
    allowOnlineBooking: false,
    allowFinance: false,
    allowStock: false,
    allowCRM: false
  },
  'Profissional': {
    maxAppointmentsMonth: 200,
    maxClients: 150,
    maxProfessionals: 3,
    allowClinicalHistory: true,
    allowWhatsAppTemplates: true,
    allowMultiAgenda: true,
    allowAbsences: true,
    allowOnlineBooking: true,
    allowFinance: true,
    allowStock: false,
    allowCRM: true
  },
  'Clínica': {
    maxAppointmentsMonth: 9999,
    maxClients: 9999,
    maxProfessionals: 20,
    allowClinicalHistory: true,
    allowWhatsAppTemplates: true,
    allowMultiAgenda: true,
    allowAbsences: true,
    allowOnlineBooking: true,
    allowFinance: true,
    allowStock: true,
    allowCRM: true
  }
};

async function initDatabaseSchema() {
  if (!pool) return;
  try {
    const client = await pool.connect();
    console.log('[Database] Connected to PostgreSQL successful!');
    isDbConnected = true;

    // Create central SAAS tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS saas_pricing (
        id VARCHAR(50) PRIMARY KEY,
        pricing_json TEXT NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS saas_plan_features (
        id VARCHAR(50) PRIMARY KEY,
        features_json TEXT NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS saas_tenants (
        id VARCHAR(50) PRIMARY KEY,
        tenants_json TEXT NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS tenant_data (
        tenant_id VARCHAR(50) NOT NULL,
        key_type VARCHAR(50) NOT NULL,
        data_json TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (tenant_id, key_type)
      );
    `);

    // Seed default tenants list if missing in Postgres saas_tenants
    const tenantsCheck = await client.query('SELECT tenants_json FROM saas_tenants WHERE id = $1', ['global']);
    if (tenantsCheck.rows.length === 0) {
      console.log('[Database] Seeding default tenants list in Postgres...');
      await client.query('INSERT INTO saas_tenants (id, tenants_json) VALUES ($1, $2)', ['global', JSON.stringify(DEFAULT_INITIAL_TENANTS)]);
    }

    // Seed default pricing if missing
    const pricingCheck = await client.query('SELECT pricing_json FROM saas_pricing WHERE id = $1', ['global']);
    if (pricingCheck.rows.length === 0) {
      console.log('[Database] Seeding default pricing in Postgres...');
      await client.query('INSERT INTO saas_pricing (id, pricing_json) VALUES ($1, $2)', ['global', JSON.stringify({ 'Grátis': 0, 'Profissional': 67, 'Clínica': 147 })]);
    }

    // Seed default plan features if missing
    const featuresCheck = await client.query('SELECT id FROM saas_plan_features');
    if (featuresCheck.rows.length === 0) {
      console.log('[Database] Seeding default plan features in Postgres...');
      for (const planName of Object.keys(DEFAULT_PLAN_FEATURES)) {
        await client.query('INSERT INTO saas_plan_features (id, features_json) VALUES ($1, $2)', [planName, JSON.stringify(DEFAULT_PLAN_FEATURES[planName as 'Grátis'|'Profissional'|'Clínica'])]);
      }
    }

    client.release();
    console.log('[Database] Schema migrations and seed values verified successfully.');
  } catch (err: any) {
    console.error('[Database] PostgreSQL connection failed or timed out. Graceful offline JSON state fallback enabled.', err.message);
    isDbConnected = false;
    pool = null; // revert to backup store
  }
}

// Fallback Local File Storage Database Paths
const FALLBACK_FILE_PATH = path.join(process.cwd(), 'data_fallback.json');

// Memory defaults in case fallback file does not exist yet either
let localCache: Record<string, any> = {
  pricing: { 'Grátis': 0, 'Profissional': 67, 'Clínica': 147 },
  planFeatures: DEFAULT_PLAN_FEATURES,
  tenants: DEFAULT_INITIAL_TENANTS,
  tenant_data: {}
};

// Sync local cache to file
function saveCacheToFallbackFile() {
  try {
    fs.writeFileSync(FALLBACK_FILE_PATH, JSON.stringify(localCache, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Storage Error] Could not write fallback cache file:', err);
  }
}

// Load local cache on start
function loadCacheFromFallbackFile() {
  try {
    if (fs.existsSync(FALLBACK_FILE_PATH)) {
      const data = fs.readFileSync(FALLBACK_FILE_PATH, 'utf-8');
      if (data.trim()) {
        localCache = JSON.parse(data);
        console.log('[Storage] Loaded local backup cache successfully.');
      }
    } else {
      console.log('[Storage] No fallback data file found. Creating default storage registry.');
      saveCacheToFallbackFile();
    }
  } catch (err) {
    console.error('[Storage Error] Error reading fallback file:', err);
  }
}

// Initial storage boot
loadCacheFromFallbackFile();


// --- API REST ENDPOINTS ---

// 1. Initial SaaS bundle load (pricing, tenants, planFeatures)
app.get('/api/saas/init', async (req, res) => {
  try {
    if (isDbConnected && pool) {
      const pricingRes = await pool.query('SELECT pricing_json FROM saas_pricing WHERE id = $1', ['global']);
      const featuresRes = await pool.query('SELECT id, features_json FROM saas_plan_features');
      const tenantsRes = await pool.query('SELECT tenants_json FROM saas_tenants WHERE id = $1', ['global']);

      const pricing = pricingRes.rows.length > 0 ? JSON.parse(pricingRes.rows[0].pricing_json) : localCache.pricing;
      
      const planFeatures: Record<string, any> = {};
      if (featuresRes.rows.length > 0) {
        featuresRes.rows.forEach((row: any) => {
          planFeatures[row.id] = JSON.parse(row.features_json);
        });
      }

      // Check row existence in DB instead of checking .length > 0
      const hasDbRow = tenantsRes.rows.length > 0;
      const tenants = hasDbRow ? JSON.parse(tenantsRes.rows[0].tenants_json) : localCache.tenants;

      return res.json({
        pricing,
        planFeatures: Object.keys(planFeatures).length > 0 ? planFeatures : localCache.planFeatures,
        tenants: tenants,
        postgresql: true
      });
    }
  } catch (e: any) {
    console.warn('[Database Fallback] Failed querying DB on init, falling back to local storage:', e.message);
  }

  // Fallback state return
  res.json({
    pricing: localCache.pricing,
    planFeatures: localCache.planFeatures,
    tenants: localCache.tenants,
    postgresql: false
  });
});

// 2. Save SaaS Plan pricing
app.post('/api/saas/pricing', async (req, res) => {
  const { pricing } = req.body;
  if (!pricing) return res.status(400).json({ error: 'pricing required' });

  localCache.pricing = pricing;
  saveCacheToFallbackFile();

  try {
    if (isDbConnected && pool) {
      await pool.query(
        `INSERT INTO saas_pricing (id, pricing_json) VALUES ($1, $2)
         ON CONFLICT (id) DO UPDATE SET pricing_json = EXCLUDED.pricing_json`,
        ['global', JSON.stringify(pricing)]
      );
      return res.json({ success: true, database: true });
    }
  } catch (e: any) {
    console.error('[DB Save Error] pricing:', e.message);
  }

  res.json({ success: true, database: false });
});

// 3. Save SaaS Plan features
app.post('/api/saas/features', async (req, res) => {
  const { planFeatures } = req.body;
  if (!planFeatures) return res.status(400).json({ error: 'planFeatures required' });

  localCache.planFeatures = planFeatures;
  saveCacheToFallbackFile();

  try {
    if (isDbConnected && pool) {
      for (const planName of Object.keys(planFeatures)) {
        await pool.query(
          `INSERT INTO saas_plan_features (id, features_json) VALUES ($1, $2)
           ON CONFLICT (id) DO UPDATE SET features_json = EXCLUDED.features_json`,
          [planName, JSON.stringify(planFeatures[planName])]
        );
      }
      return res.json({ success: true, database: true });
    }
  } catch (e: any) {
    console.error('[DB Save Error] planFeatures:', e.message);
  }

  res.json({ success: true, database: false });
});

// 4. Save SaaS global clinics tenants
app.post('/api/saas/tenants', async (req, res) => {
  const { tenants } = req.body;
  if (!tenants) return res.status(400).json({ error: 'tenants list required' });

  localCache.tenants = tenants;
  saveCacheToFallbackFile();

  try {
    if (isDbConnected && pool) {
      await pool.query(
        `INSERT INTO saas_tenants (id, tenants_json) VALUES ($1, $2)
         ON CONFLICT (id) DO UPDATE SET tenants_json = EXCLUDED.tenants_json`,
        ['global', JSON.stringify(tenants)]
      );
      return res.json({ success: true, database: true });
    }
  } catch (e: any) {
    console.error('[DB Save Error] tenants:', e.message);
  }

  res.json({ success: true, database: false });
});

// 4b. Register a new tenant safely (prevents client-side race conditions / competitive overwriting)
app.post('/api/saas/register-tenant', async (req, res) => {
  const { name, email, password, phone, plan } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
  }

  // 1. Get the latest tenants list from SQL or fallback cache
  let currentTenants: any[] = [];
  try {
    if (isDbConnected && pool) {
      const tenantsRes = await pool.query('SELECT tenants_json FROM saas_tenants WHERE id = $1', ['global']);
      if (tenantsRes.rows.length > 0) {
        currentTenants = JSON.parse(tenantsRes.rows[0].tenants_json);
      } else {
        currentTenants = localCache.tenants || [];
      }
    } else {
      currentTenants = localCache.tenants || [];
    }
  } catch (err: any) {
    console.error('[DB Register Load Error]:', err.message);
    currentTenants = localCache.tenants || [];
  }

  // Ensure it is an array
  if (!Array.isArray(currentTenants)) {
    currentTenants = [];
  }

  // 2. Check if already exists
  const exists = currentTenants.some((t: any) => t.email && t.email.toLowerCase() === email.toLowerCase());
  if (exists || email.toLowerCase() === 'admin@leonel.com' || email.toLowerCase() === 'admin@lumini.com') {
    return res.status(400).json({ error: 'Este endereço de email já está em uso.' });
  }

  // 3. Create new tenant object
  const newTenantId = 'tenant_' + Math.random().toString(36).substring(2, 11);
  const newT = {
    id: newTenantId,
    name,
    email,
    password,
    phone: phone || '',
    plan: plan || 'Grátis',
    status: 'Ativo',
    sidebarTitle: name,
    sidebarSubtitle: 'Estética Avançada',
    createdAt: new Date().toISOString()
  };

  currentTenants.push(newT);

  // 4. Save updated list
  localCache.tenants = currentTenants;
  saveCacheToFallbackFile();

  try {
    if (isDbConnected && pool) {
      await pool.query(
        `INSERT INTO saas_tenants (id, tenants_json) VALUES ($1, $2)
         ON CONFLICT (id) DO UPDATE SET tenants_json = EXCLUDED.tenants_json`,
        ['global', JSON.stringify(currentTenants)]
      );
    }
  } catch (err: any) {
    console.error('[DB Register Save Error]:', err.message);
  }

  res.json({ success: true, newTenant: newT, tenants: currentTenants });
});

// 4c. Register a plan request for a specific tenant safely
app.post('/api/saas/tenant/:tenantId/plan-request', async (req, res) => {
  const { tenantId } = req.params;
  const { planName, clearRequest } = req.body;

  let currentTenants: any[] = [];
  try {
    if (isDbConnected && pool) {
      const tenantsRes = await pool.query('SELECT tenants_json FROM saas_tenants WHERE id = $1', ['global']);
      if (tenantsRes.rows.length > 0) {
        currentTenants = JSON.parse(tenantsRes.rows[0].tenants_json);
      } else {
        currentTenants = localCache.tenants || [];
      }
    } else {
      currentTenants = localCache.tenants || [];
    }
  } catch (err: any) {
    currentTenants = localCache.tenants || [];
  }

  if (!Array.isArray(currentTenants)) {
    return res.status(500).json({ error: 'Erro de carga de dados central.' });
  }

  let matched = false;
  currentTenants = currentTenants.map((t: any) => {
    if (t.id === tenantId) {
      matched = true;
      if (clearRequest) {
        return { ...t, plan: planName || t.plan, pendingPlanRequest: undefined };
      } else {
        return { ...t, pendingPlanRequest: planName };
      }
    }
    return t;
  });

  if (!matched) {
    return res.status(404).json({ error: 'Clínica não encontrada no cadastro global.' });
  }

  localCache.tenants = currentTenants;
  saveCacheToFallbackFile();

  try {
    if (isDbConnected && pool) {
      await pool.query(
        `INSERT INTO saas_tenants (id, tenants_json) VALUES ($1, $2)
         ON CONFLICT (id) DO UPDATE SET tenants_json = EXCLUDED.tenants_json`,
        ['global', JSON.stringify(currentTenants)]
      );
    }
  } catch (err: any) {
    console.error('[DB Plan Request Sync Error]:', err.message);
  }

  res.json({ success: true, tenants: currentTenants });
});

// 5. Load complete clinic data (all storage tables)
app.get('/api/tenant/:tenantId/load', async (req, res) => {
  const { tenantId } = req.params;

  try {
    if (isDbConnected && pool) {
      const dbRes = await pool.query('SELECT key_type, data_json FROM tenant_data WHERE tenant_id = $1', [tenantId]);
      const data: Record<string, any> = {};
      dbRes.rows.forEach((row: any) => {
        data[row.key_type] = JSON.parse(row.data_json);
      });
      return res.json({ data, database: true });
    }
  } catch (e: any) {
    console.error('[DB Load Error] tenant details:', e.message);
  }

  // Fallback to local schema
  const data = localCache.tenant_data[tenantId] || {};
  res.json({ data, database: false });
});

// 6. Save a specific clinic data list
app.post('/api/tenant/:tenantId/save', async (req, res) => {
  const { tenantId } = req.params;
  const { keyType, dataList } = req.body;

  if (!keyType) return res.status(400).json({ error: 'keyType is required' });

  // Update memory cache
  if (!localCache.tenant_data[tenantId]) {
    localCache.tenant_data[tenantId] = {};
  }
  localCache.tenant_data[tenantId][keyType] = dataList;
  saveCacheToFallbackFile();

  // If editing settings, sync clinic details (name, sidebarTitle, sidebarSubtitle) back to the global tenant list
  if (keyType === 'settings' && dataList) {
    const { name, sidebarTitle, sidebarSubtitle } = dataList;
    if (name || sidebarTitle || sidebarSubtitle) {
      let currentTenants: any[] = [];
      try {
        if (isDbConnected && pool) {
          const tenantsRes = await pool.query('SELECT tenants_json FROM saas_tenants WHERE id = $1', ['global']);
          if (tenantsRes.rows.length > 0) {
            currentTenants = JSON.parse(tenantsRes.rows[0].tenants_json);
          } else {
            currentTenants = localCache.tenants || [];
          }
        } else {
          currentTenants = localCache.tenants || [];
        }
      } catch (err: any) {
        currentTenants = localCache.tenants || [];
      }

      if (Array.isArray(currentTenants)) {
        let tenantChanged = false;
        currentTenants = currentTenants.map((t: any) => {
          if (t.id === tenantId) {
            tenantChanged = true;
            return {
              ...t,
              name: name || t.name,
              sidebarTitle: sidebarTitle || t.sidebarTitle,
              sidebarSubtitle: sidebarSubtitle || t.sidebarSubtitle
            };
          }
          return t;
        });

        if (tenantChanged) {
          localCache.tenants = currentTenants;
          saveCacheToFallbackFile();

          if (isDbConnected && pool) {
            try {
              await pool.query(
                `INSERT INTO saas_tenants (id, tenants_json) VALUES ($1, $2)
                 ON CONFLICT (id) DO UPDATE SET tenants_json = EXCLUDED.tenants_json`,
                ['global', JSON.stringify(currentTenants)]
              );
            } catch (dbErr: any) {
              console.error('[DB Settings Metadata Sync Error]:', dbErr.message);
            }
          }
        }
      }
    }
  }

  try {
    if (isDbConnected && pool) {
      await pool.query(
        `INSERT INTO tenant_data (tenant_id, key_type, data_json, updated_at) VALUES ($1, $2, $3, NOW())
         ON CONFLICT (tenant_id, key_type) DO UPDATE SET data_json = EXCLUDED.data_json, updated_at = NOW()`,
        [tenantId, keyType, JSON.stringify(dataList)]
      );
      return res.json({ success: true, database: true });
    }
  } catch (e: any) {
    console.error('[DB Save Error] tenant key update:', e.message);
  }

  res.json({ success: true, database: false });
});


// --- SECURE SYSTEM PUBLIC BOOKING ENDPOINTS ---

// GET: Load public clinic info stripped of any customer metadata, sensitive listings, or multi-tenant leaks
app.get('/api/public-booking/:slugOrId', async (req, res) => {
  const { slugOrId } = req.params;
  if (!slugOrId) {
    return res.status(400).json({ error: 'Tenant identifier required.' });
  }

  try {
    // Load current tenants globally to match the identifier
    let currentTenants: any[] = [];
    if (isDbConnected && pool) {
      const tenantsRes = await pool.query('SELECT tenants_json FROM saas_tenants WHERE id = $1', ['global']);
      if (tenantsRes.rows.length > 0) {
        currentTenants = JSON.parse(tenantsRes.rows[0].tenants_json);
      } else {
        currentTenants = localCache.tenants || [];
      }
    } else {
      currentTenants = localCache.tenants || [];
    }

    const match = currentTenants.find((t: any) => 
      t.id === slugOrId || 
      (t.id && t.id.toLowerCase() === slugOrId.toLowerCase()) ||
      (t.sidebarTitle && t.sidebarTitle.toLowerCase() === slugOrId.toLowerCase()) ||
      (t.name && t.name.toLowerCase().replace(/\s+/g, '-') === slugOrId.toLowerCase())
    );

    if (!match) {
      return res.status(404).json({ error: 'Consultório / Clínica não encontrada.' });
    }

    if (match.status !== 'Ativo') {
      return res.status(403).json({ error: 'Este consultório está temporariamente inativo ou suspenso.' });
    }

    const tenantId = match.id;

    // Load tenant data securely
    let tenantData: Record<string, any> = {};
    if (isDbConnected && pool) {
      const dbRes = await pool.query('SELECT key_type, data_json FROM tenant_data WHERE tenant_id = $1', [tenantId]);
      dbRes.rows.forEach((row: any) => {
        tenantData[row.key_type] = JSON.parse(row.data_json);
      });
    } else {
      tenantData = localCache.tenant_data[tenantId] || {};
    }

    // Filter and strip data to prevent leakage of client details, notes, values, etc.
    const rawSettings = tenantData.settings || {};
    const settings = {
       name: rawSettings.name || match.name,
       sidebarTitle: rawSettings.sidebarTitle || match.sidebarTitle,
       sidebarSubtitle: rawSettings.sidebarSubtitle || match.sidebarSubtitle,
       address: rawSettings.address || '',
       phone: rawSettings.phone || match.phone,
       instagram: rawSettings.instagram || '',
       aboutText: rawSettings.aboutText || '',
       logoUrl: rawSettings.logoUrl || ''
    };

    // Filter services that are strictly marked visibleInBooking and are not deleted or Inactive
    const services = (tenantData.services || [])
      .filter((s: any) => !s.deleted && s.visibleInBooking && s.status !== 'Inativo')
      .map((s: any) => ({
         id: s.id,
         name: s.name,
         price: s.price,
         duration: s.duration,
         visibleInBooking: s.visibleInBooking
      }));

    // Filter professionals who are not deleted or Inactive
    const professionals = (tenantData.professionals || [])
      .filter((p: any) => !p.deleted && p.status !== 'Inativo')
      .map((p: any) => ({
         id: p.id,
         name: p.name,
         role: p.role,
         avatar: p.avatar,
         specialties: p.specialties
      }));

    const absences = tenantData.absences || [];

    // Filter appointments - ONLY expose date, time and professionalId so the schedule checker knows busy slots.
    // Absolutely NO client details, finances, observations, or history are returned.
    const appointments = (tenantData.appointments || []).map((a: any) => ({
       date: a.date,
       time: a.time,
       professionalId: a.professionalId
    }));

    return res.json({
      success: true,
      tenant: {
         id: match.id,
         name: match.name,
         sidebarTitle: match.sidebarTitle,
         sidebarSubtitle: match.sidebarSubtitle
      },
      settings,
      services,
      professionals,
      absences,
      appointments
    });

  } catch (err: any) {
    console.error('[Public Booking Get Error]:', err.message);
    return res.status(500).json({ error: 'Erro ao carregar os dados de agendamento do consultório.' });
  }
});

// POST: Securely place and save a public online booking on the server
app.post('/api/public-booking/:tenantId/confirm', async (req, res) => {
  const { tenantId } = req.params;
  const { clientName, clientPhone, date, time, serviceId, professionalId, value } = req.body;

  if (!clientName || !clientPhone || !date || !time || !serviceId || !professionalId) {
    return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos.' });
  }

  try {
    // 1. Load current tenant data
    let tenantData: Record<string, any> = {};
    if (isDbConnected && pool) {
      const dbRes = await pool.query('SELECT key_type, data_json FROM tenant_data WHERE tenant_id = $1', [tenantId]);
      dbRes.rows.forEach((row: any) => {
        tenantData[row.key_type] = JSON.parse(row.data_json);
      });
    } else {
      tenantData = localCache.tenant_data[tenantId] || {};
    }

    const appointments = tenantData.appointments || [];
    const clients = tenantData.clients || [];
    const leads = tenantData.leads || [];

    // Helper functions to generate ID
    const genId = (prefix: string) => `${prefix}_` + Math.random().toString(36).substr(2, 9);

    // 2. Manage client record
    const cleanPhone = clientPhone.replace(/\D/g, '');
    let existingClient = clients.find((c: any) => c.phone.replace(/\D/g, '') === cleanPhone);
    let clientId = existingClient ? existingClient.id : null;
    let isNewClient = false;

    if (!existingClient) {
      isNewClient = true;
      clientId = genId('clt');
      const newClientRecord = {
        id: clientId,
        name: clientName,
        phone: clientPhone,
        email: '',
        instagram: '',
        cpf: '',
        createdAt: new Date().toISOString()
      };
      clients.push(newClientRecord);

      // Create a Lead too!
      const newLeadRecord = {
        id: genId('ld'),
        name: clientName,
        phone: clientPhone,
        serviceId: serviceId,
        status: 'Novo', // Novo / Contatado / Agendado / Arquivado
        notes: 'Lead gerado por agendamento online público.',
        createdAt: new Date().toISOString()
      };
      leads.push(newLeadRecord);
    }

    // 3. Create the Appointment
    const newAptId = genId('apt');
    const newAppointment = {
      id: newAptId,
      clientId: clientId,
      alternativeClientName: isNewClient ? clientName : undefined,
      alternativeClientPhone: isNewClient ? clientPhone : undefined,
      serviceId,
      professionalId,
      date,
      time,
      status: 'Pendente',
      value: Number(value || 0),
      paymentStatus: 'Pendente',
      remarks: 'Agendado via link público online.',
      createdAt: new Date().toISOString()
    };
    appointments.push(newAppointment);

    // 4. Save updated arrays
    if (!localCache.tenant_data[tenantId]) {
      localCache.tenant_data[tenantId] = {};
    }
    localCache.tenant_data[tenantId]['appointments'] = appointments;
    localCache.tenant_data[tenantId]['clients'] = clients;
    localCache.tenant_data[tenantId]['leads'] = leads;
    saveCacheToFallbackFile();

    if (isDbConnected && pool) {
      await pool.query(
        `INSERT INTO tenant_data (tenant_id, key_type, data_json, updated_at) VALUES ($1, $2, $3, NOW())
         ON CONFLICT (tenant_id, key_type) DO UPDATE SET data_json = EXCLUDED.data_json, updated_at = NOW()`,
        [tenantId, 'appointments', JSON.stringify(appointments)]
      );
      await pool.query(
        `INSERT INTO tenant_data (tenant_id, key_type, data_json, updated_at) VALUES ($1, $2, $3, NOW())
         ON CONFLICT (tenant_id, key_type) DO UPDATE SET data_json = EXCLUDED.data_json, updated_at = NOW()`,
        [tenantId, 'clients', JSON.stringify(clients)]
      );
      await pool.query(
        `INSERT INTO tenant_data (tenant_id, key_type, data_json, updated_at) VALUES ($1, $2, $3, NOW())
         ON CONFLICT (tenant_id, key_type) DO UPDATE SET data_json = EXCLUDED.data_json, updated_at = NOW()`,
        [tenantId, 'leads', JSON.stringify(leads)]
      );
    }

    return res.json({
      success: true,
      appointment: newAppointment,
      isNewClient
    });

  } catch (err: any) {
    console.error('[Public Booking Confirm Error]:', err.message);
    return res.status(500).json({ error: 'Erro interno ao processar o agendamento no servidor.' });
  }
});


// --- INTEGRATE VITE FOR DEV VS COMPILED STATIC FRONTEND FOR PROD ---

async function bootServer() {
  await initDatabaseSchema();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Leonel/Lumini SAS server running on port ${PORT}`);
    console.log(`[Server] Accessible publicly: http://localhost:${PORT}`);
  });
}

bootServer();
