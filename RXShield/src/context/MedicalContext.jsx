/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Configure dynamic API base URL from environment variables for production deployments (e.g., Netlify)
axios.defaults.baseURL = import.meta.env.VITE_API_URL || '';

const MedicalContext = createContext();

export const useMedical = () => useContext(MedicalContext);

export const MedicalProvider = ({ children }) => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [prescription, setPrescription] = useState([]);
  const [analysisResults, setAnalysisResults] = useState(null);
  
  const [reports, setReports] = useState([]);
  const [searchHistory, setSearchHistory] = useState(() => {
    const saved = localStorage.getItem('medHistory');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [activeTab, setActiveTab] = useState('landing'); // 'landing', 'dashboard', 'prescription', 'drugs', 'chat', 'reports', 'settings'
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [darkMode, setDarkMode] = useState(true);

  // Quick notifier
  const addNotification = useCallback((message, type = 'info') => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);
    
    // Auto remove after 5s
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  }, []);

  // Fetch reports from API - defined as useCallback so it can be added to dependencies safely
  const fetchReports = useCallback(async () => {
    try {
      const res = await axios.get('/api/reports');
      setReports(res.data);
    } catch (err) {
      console.error('Error fetching reports:', err);
    }
  }, []);

  // Load patients and reports on mount
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await axios.get('/api/patients');
        if (Array.isArray(res.data)) {
          setPatients(res.data);
          if (res.data.length > 0) {
            setSelectedPatient(res.data[0]);
          }
        }
      } catch (err) {
        console.error('Error fetching patients:', err);
        addNotification('Failed to fetch patient records from backend.', 'error');
      }
    };

    const fetchInitialReports = async () => {
      try {
        const res = await axios.get('/api/reports');
        if (Array.isArray(res.data)) {
          setReports(res.data);
        }
      } catch (err) {
        console.error('Error fetching initial reports:', err);
      }
    };

    fetchPatients();
    fetchInitialReports();
  }, [addNotification]);

  // Synchronize dark mode class
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  // Select patient
  const selectPatient = (id) => {
    const patient = patients.find(p => p.id === parseInt(id));
    if (patient) {
      setSelectedPatient(patient);
      // Clear analysis on patient change to prevent diagnostic bleeding
      setAnalysisResults(null);
      addNotification(`Switched patient profile to: ${patient.name}`, 'success');
    }
  };

  // Add drug to prescription
  const addDrug = (drug) => {
    // Check if drug already exists in prescription
    if (prescription.some(d => d.name.toLowerCase() === drug.name.toLowerCase())) {
      addNotification(`${drug.name} is already added to the prescription.`, 'warning');
      return;
    }
    
    setPrescription(prev => [...prev, {
      id: Date.now(),
      name: drug.name,
      genericName: drug.generic_name,
      dosage: drug.dosage || drug.dosages[0],
      frequency: drug.frequency || 'Once daily',
      duration: drug.duration || '7 Days',
      purpose: drug.uses
    }]);
    
    // Clear old analysis results
    setAnalysisResults(null);
    addNotification(`${drug.name} added to prescription builder.`, 'info');

    // Add to search history log
    setSearchHistory(prev => {
      const updated = [drug.name, ...prev.filter(name => name !== drug.name)].slice(0, 10);
      localStorage.setItem('medHistory', JSON.stringify(updated));
      return updated;
    });
  };

  // Remove drug from prescription
  const removeDrug = (drugId) => {
    setPrescription(prev => prev.filter(d => d.id !== drugId));
    setAnalysisResults(null);
    addNotification('Medication removed from prescription.', 'info');
  };

  // Clear builder
  const clearPrescription = () => {
    setPrescription([]);
    setAnalysisResults(null);
    addNotification('Prescription builder cleared.', 'info');
  };

  // Run AI Prescription Analyzer Engine
  const analyzePrescription = async () => {
    if (prescription.length === 0) {
      addNotification('Add at least one medicine before analyzing.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        patientId: selectedPatient ? selectedPatient.id : null,
        prescription: prescription.map(d => ({
          name: d.name,
          dosage: d.dosage,
          frequency: d.frequency,
          duration: d.duration
        }))
      };

      const res = await axios.post('/api/analyze', payload);
      setAnalysisResults(res.data);
      
      // Trigger notifications depending on severity
      if (res.data.safetyScore < 40) {
        addNotification('⚠️ CRITICAL SAFETY WARNING: High risk of interactions or allergies!', 'error');
      } else if (res.data.safetyScore < 70) {
        addNotification('⚠️ Warning: Multiple moderate warnings detected.', 'warning');
      } else {
        addNotification('Prescription checked: Safety evaluation completed.', 'success');
      }
    } catch (err) {
      console.error('Analysis failed:', err);
      addNotification('AI Analysis failed. Check server status.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Save report
  const saveReport = async () => {
    if (!analysisResults) {
      addNotification('Perform analysis before saving the clinical report.', 'warning');
      return;
    }

    try {
      const payload = {
        patientId: selectedPatient ? selectedPatient.id : null,
        patientName: selectedPatient ? selectedPatient.name : 'Unknown Patient',
        prescription: prescription.map(d => ({
          name: d.name,
          dosage: d.dosage,
          frequency: d.frequency,
          duration: d.duration
        })),
        riskScore: 100 - analysisResults.safetyScore,
        analysis: analysisResults
      };

      const res = await axios.post('/api/reports', payload);
      setReports(prev => [res.data, ...prev]);
      addNotification('Clinical Report saved successfully to cloud storage.', 'success');
    } catch (err) {
      console.error('Failed to save report:', err);
      addNotification('Failed to save report to backend.', 'error');
    }
  };

  // Create patient
  const createPatient = async (patientDetails) => {
    try {
      const res = await axios.post('/api/patients', patientDetails);
      const newPatient = res.data;
      setPatients(prev => [...prev, newPatient]);
      setSelectedPatient(newPatient);
      setAnalysisResults(null);
      addNotification(`New patient profile created: ${newPatient.name}`, 'success');
      return newPatient;
    } catch (err) {
      console.error('Failed to create patient:', err);
      addNotification('Failed to create patient profile.', 'error');
      throw err;
    }
  };

  return (
    <MedicalContext.Provider value={{
      patients,
      selectedPatient,
      prescription,
      analysisResults,
      reports,
      searchHistory,
      activeTab,
      loading,
      notifications,
      darkMode,
      setActiveTab,
      setDarkMode,
      selectPatient,
      createPatient,
      addDrug,
      removeDrug,
      clearPrescription,
      analyzePrescription,
      saveReport,
      addNotification,
      fetchReports
    }}>
      {children}
    </MedicalContext.Provider>
  );
};
