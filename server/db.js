import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const localPath = path.join(DATA_DIR, 'db.json');
const netlifyPath = path.join(process.cwd(), 'server', 'data', 'db.json');
const JSON_DB_PATH = fs.existsSync(localPath) ? localPath : netlifyPath
if (!fs.existsSync(DATA_DIR) && process.env.NODE_ENV !== 'production') {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Default environment variables
const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'prescription_advisor',
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
  connectionTimeoutMillis: 2000 // Quick timeout to failover fast
};

let pool = null;
let useJsonFallback = false;
let localDb = {
  medicines: [],
  patients: [],
  reports: []
};

// Load JSON database if it exists
const loadJsonDb = () => {
  try {
    if (fs.existsSync(JSON_DB_PATH)) {
      const raw = fs.readFileSync(JSON_DB_PATH, 'utf8');
      localDb = JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error loading JSON DB, starting with empty database:', err.message);
  }
};

const saveJsonDb = () => {
  try {
    fs.writeFileSync(JSON_DB_PATH, JSON.stringify(localDb, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving JSON DB:', err.message);
  }
};

// Initialize DB pool and test connection
export const initDb = async () => {
  loadJsonDb();

  try {
    pool = new pg.Pool(dbConfig);
    // Test the connection
    const client = await pool.connect();
    console.log('Successfully connected to PostgreSQL database:', dbConfig.database);
    client.release();
    useJsonFallback = false;
  } catch (err) {
    console.warn('\n⚠️  PostgreSQL connection failed:', err.message);
    console.warn('⚡ Falling back to high-fidelity local JSON database (server/data/db.json)\n');
    useJsonFallback = true;
    if (pool) {
      pool.end().catch(() => {});
    }
  }
};

// Helper mock operations for the JSON database fallback
const mockQuery = async (text, params = []) => {
  const queryText = text.trim().toLowerCase();
  
  if (queryText.includes('select * from medicines') || queryText.includes('select * from medicine')) {
    let result = [...localDb.medicines];
    // Simple mock filter for autocomplete
    if (queryText.includes('where') && params.length > 0) {
      const searchVal = params[0].replace(/%/g, '').toLowerCase();
      const searchValStarts = params.length > 1 ? params[1].replace(/%/g, '').toLowerCase() : searchVal;
      result = result.filter(m => 
        m.name.toLowerCase().includes(searchVal) || 
        m.generic_name.toLowerCase().includes(searchVal) || 
        m.drug_class.toLowerCase().startsWith(searchValStarts)
      );
    }
    // Sort: starts-with name matches first, then starts-with generic matches, then contains matches, then starts-with drug class
    result.sort((a, b) => {
      if (params.length > 0) {
        const searchVal = params[0].replace(/%/g, '').toLowerCase();
        const searchValStarts = params.length > 1 ? params[1].replace(/%/g, '').toLowerCase() : searchVal;
        
        const getScore = (m) => {
          if (m.name.toLowerCase().startsWith(searchValStarts)) return 1;
          if (m.generic_name.toLowerCase().startsWith(searchValStarts)) return 2;
          if (m.name.toLowerCase().includes(searchVal)) return 3;
          if (m.generic_name.toLowerCase().includes(searchVal)) return 4;
          if (m.drug_class.toLowerCase().startsWith(searchValStarts)) return 5;
          return 6;
        };

        const scoreA = getScore(a);
        const scoreB = getScore(b);
        
        if (scoreA !== scoreB) {
          return scoreA - scoreB;
        }
      }
      return a.name.localeCompare(b.name);
    });
    const limitMatch = queryText.match(/limit\s+(\d+)/);
    const limit = limitMatch ? parseInt(limitMatch[1]) : 50;
    return { rows: result.slice(0, limit) };
  }

  if (queryText.includes('select * from patients')) {
    return { rows: localDb.patients };
  }

  if (queryText.includes('insert into patients')) {
    // Expected params: [name, age, gender, weight, height, blood_group, allergies, existing_conditions]
    const newPatient = {
      id: localDb.patients.length + 1,
      name: params[0],
      age: params[1],
      gender: params[2],
      weight: params[3],
      height: params[4],
      blood_group: params[5],
      allergies: typeof params[6] === 'string' ? JSON.parse(params[6]) : params[6],
      existing_conditions: typeof params[7] === 'string' ? JSON.parse(params[7]) : params[7]
    };
    localDb.patients.push(newPatient);
    saveJsonDb();
    return { rows: [newPatient] };
  }

  if (queryText.includes('select * from reports') || queryText.includes('select * from report')) {
    // Sort reports by created_at desc
    const sortedReports = [...localDb.reports].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return { rows: sortedReports };
  }

  if (queryText.includes('insert into reports')) {
    // Expected params: [patient_id, patient_name, prescription, risk_score, analysis, created_at]
    const newReport = {
      id: localDb.reports.length + 1,
      patient_id: params[0],
      patient_name: params[1],
      prescription: typeof params[2] === 'string' ? JSON.parse(params[2]) : params[2],
      risk_score: params[3],
      analysis: typeof params[4] === 'string' ? JSON.parse(params[4]) : params[4],
      created_at: params[5] || new Date().toISOString()
    };
    localDb.reports.push(newReport);
    saveJsonDb();
    return { rows: [newReport] };
  }

  return { rows: [] };
};

// Generic query executor that routes to PostgreSQL or JSON fallback
export const query = async (text, params) => {
  if (useJsonFallback || !pool) {
    return mockQuery(text, params);
  }
  
  try {
    return await pool.query(text, params);
  } catch (err) {
    console.error('PostgreSQL query error, attempting JSON DB fallback:', err.message);
    return mockQuery(text, params);
  }
};

// Getter for direct local database updates during seeding
export const getLocalDb = () => localDb;
export const setLocalDb = (newDb) => {
  localDb = newDb;
  saveJsonDb();
};
export const isFallback = () => useJsonFallback;
export const getJsonDbPath = () => JSON_DB_PATH;
export const saveFallback = () => saveJsonDb();
