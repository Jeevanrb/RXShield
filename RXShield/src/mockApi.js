import axios from 'axios';
import dbData from './data/db.json';

let db = { ...dbData };
let drugs = db.medicines || [];

const getMockData = (url, method, configData) => {
  if (url.includes('/api/patients') && method === 'get') {
    return db.patients || [];
  } else if (url.includes('/api/patients') && method === 'post') {
    const payload = typeof configData === 'string' ? JSON.parse(configData) : configData;
    const newPatient = { id: Date.now(), ...payload };
    if (!db.patients) db.patients = [];
    db.patients.push(newPatient);
    return newPatient;
  } 
  else if (url.includes('/api/reports') && method === 'get') {
    return db.reports || [];
  } else if (url.includes('/api/reports') && method === 'post') {
    const payload = typeof configData === 'string' ? JSON.parse(configData) : configData;
    const newReport = { id: Date.now(), ...payload, createdAt: new Date().toISOString() };
    if (!db.reports) db.reports = [];
    db.reports.push(newReport);
    return newReport;
  } 
  else if (url.includes('/api/drugs') && method === 'get') {
    // Single drug fetch (e.g. /api/drugs/42)
    const singleMatch = url.match(/\/api\/drugs\/([a-zA-Z0-9_-]+)(?:\?|$)/);
    if (singleMatch) {
      const drug = drugs.find(d => String(d.id) === String(singleMatch[1]));
      return drug || null;
    }
    
    // Search query (e.g. /api/drugs?q=aspirin)
    const qMatch = url.match(/[\?&]q=([^&]+)/);
    if (qMatch) {
      const query = decodeURIComponent(qMatch[1]).toLowerCase();
      return drugs.filter(d => 
        d.name.toLowerCase().includes(query) || 
        d.generic_name.toLowerCase().includes(query)
      ).slice(0, 20); // Limit results for performance
    }
    
    // Fetch all (e.g. /api/drugs?limit=1000)
    return drugs;
  } 
  else if (url.includes('/api/analyze') && method === 'post') {
    return {
      safetyScore: Math.floor(Math.random() * 20) + 70,
      interactions: [],
      allergies: [],
      contraindications: [],
      organLoad: { liver: 15, kidney: 10, cardiovascular: 5 }
    };
  } 
  else if (url.includes('/api/chat') && method === 'post') {
    return {
      text: "I am running in frontend-only demo mode on Vercel. The backend Express server is not connected, but your UI, drug database, and components are functioning perfectly with the real data!"
    };
  } else {
    return [];
  }
};

// 1. Intercept Axios Calls
axios.interceptors.response.use(
  (response) => {
    if (typeof response.data === 'string' && response.data.trim().toLowerCase().startsWith('<!doctype html>')) {
      const url = response.config.url;
      const method = response.config.method?.toLowerCase();
      console.warn(`Intercepted HTML response for Axios ${method} ${url}.`);
      response.data = getMockData(url, method, response.config.data);
    }
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 404) {
      const url = error.config.url;
      const method = error.config.method?.toLowerCase();
      console.warn(`Intercepted 404 error for Axios ${method} ${url}.`);
      return Promise.resolve({
        data: getMockData(url, method, error.config.data),
        status: 200,
        statusText: 'OK',
        headers: {},
        config: error.config
      });
    }
    return Promise.reject(error);
  }
);

// 2. Intercept Native Fetch Calls (Used by DrugDatabase, OrganVisualizer, etc.)
const originalFetch = window.fetch;
window.fetch = async (url, options = {}) => {
  if (typeof url === 'string' && url.startsWith('/api/')) {
    const method = (options.method || 'get').toLowerCase();
    const configData = options.body || null;
    
    console.warn(`Intercepted native fetch for ${method} ${url}. Using mock data instead.`);
    
    // Simulate slight network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const mockData = getMockData(url, method, configData);
    
    return {
      ok: true,
      status: 200,
      json: async () => mockData,
      text: async () => JSON.stringify(mockData)
    };
  }
  return originalFetch(url, options);
};
