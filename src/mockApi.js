import axios from 'axios';

// Add a response interceptor to detect Netlify fallback HTML
axios.interceptors.response.use(
  (response) => {
    // If the response data is a string and looks like HTML (meaning it hit the Netlify /* redirect)
    if (typeof response.data === 'string' && response.data.trim().toLowerCase().startsWith('<!doctype html>')) {
      const url = response.config.url;
      const method = response.config.method?.toLowerCase();
      
      console.warn(`Intercepted Netlify HTML response for ${method} ${url}. Using mock data instead.`);
      
      // Provide mock data based on URL
      if (url.includes('/api/patients') && method === 'get') {
        response.data = [
          {
            id: 1,
            name: "Demo Patient",
            age: 45,
            gender: "Male",
            weight: "75 kg",
            height: "175 cm",
            blood_group: "O+",
            allergies: ["Penicillin"],
            existing_conditions: ["Hypertension"]
          }
        ];
      } else if (url.includes('/api/patients') && method === 'post') {
        const payload = JSON.parse(response.config.data);
        response.data = { id: Date.now(), ...payload };
      } else if (url.includes('/api/reports') && method === 'get') {
        response.data = [];
      } else if (url.includes('/api/reports') && method === 'post') {
        const payload = JSON.parse(response.config.data);
        response.data = { id: Date.now(), ...payload, createdAt: new Date().toISOString() };
      } else if (url.includes('/api/analyze') && method === 'post') {
        response.data = {
          safetyScore: 82,
          interactions: [
            { severity: 'Moderate', description: 'Mock interaction warning for demo purposes.' }
          ],
          allergies: [],
          contraindications: [],
          organLoad: { liver: 25, kidney: 15, cardiovascular: 10 }
        };
      } else if (url.includes('/api/chat') && method === 'post') {
        response.data = {
          text: "I am running in frontend-only demo mode on Netlify! The backend Express server is not connected, but your UI and components are functioning perfectly."
        };
      } else {
        response.data = [];
      }
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);
