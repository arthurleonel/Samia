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

    client.release();
    console.log('[Database] Schema migrations verified / executed successfully.');
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
  planFeatures: {},
  tenants: [],
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

      const tenants = tenantsRes.rows.length > 0 ? JSON.parse(tenantsRes.rows[0].tenants_json) : localCache.tenants;

      return res.json({
        pricing,
        planFeatures: Object.keys(planFeatures).length > 0 ? planFeatures : localCache.planFeatures,
        tenants: tenants.length > 0 ? tenants : localCache.tenants,
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
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Leonel/Lumini SAS server running on port ${PORT}`);
    console.log(`[Server] Accessible publicly: http://localhost:${PORT}`);
  });
}

bootServer();
