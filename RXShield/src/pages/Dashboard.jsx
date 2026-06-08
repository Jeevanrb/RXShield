import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  HeartPulse, LayoutDashboard, FileSpreadsheet, Database, MessageSquare, 
  FileText, Settings as SettingsIcon, LogOut, Bell, ChevronRight, User, 
  Droplet, Scale, Ruler, ShieldAlert, CheckCircle, Activity, Info
} from 'lucide-react';
import { useMedical } from '../context/MedicalContext';

// Import sub-panels
import PrescriptionBuilder from '../components/PrescriptionBuilder';
import AIAssistant from '../components/AIAssistant';
import AnalyticsPanel from '../components/AnalyticsPanel';
import ReportTemplate from '../components/ReportTemplate';
import DrugDatabase from '../components/DrugDatabase';

// 1. Home Dashboard Sub-component
const HomeDashboard = ({ setActiveTab }) => {
  const { selectedPatient, prescription, analysisResults } = useMedical();
  
  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800">Clinical Overview</h1>
          <p className="text-sm text-slate-500">Welcome back, Dr. Jenkins. Here is your safety dashboard.</p>
        </div>
        
        <div className="glass-panel px-4 py-2 flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-500">Active Patient:</span>
          <span className="text-sm font-bold text-emerald-950 bg-medical-cyan/10 px-3 py-1 rounded-lg border border-medical-cyan/20">
            {selectedPatient ? selectedPatient.name : 'None'}
          </span>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Prescription Status</span>
            <span className="text-lg font-black text-slate-800">
              {prescription.length === 0 
                ? 'Empty Builder' 
                : `${prescription.length} Drug${prescription.length > 1 ? 's' : ''} loaded`}
            </span>
          </div>
          <div className="p-3 bg-medical-cyan/15 rounded-2xl">
            <FileSpreadsheet className="w-6 h-6 text-medical-cyan" />
          </div>
        </div>

        <div className="glass-panel p-6 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Safety Score</span>
            <span className="text-lg font-black text-slate-800">
              {analysisResults ? `${analysisResults.safetyScore}/100` : 'Not Analyzed'}
            </span>
          </div>
          <div className="p-3 bg-medical-purple/15 rounded-2xl">
            <Activity className="w-6 h-6 text-medical-purple" />
          </div>
        </div>

        <div className="glass-panel p-6 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Warnings</span>
            <span className="text-lg font-black text-slate-800">
              {analysisResults 
                ? `${analysisResults.interactions.length + analysisResults.allergies.length + analysisResults.contraindications.length} Flagged`
                : '0 Warnings'}
            </span>
          </div>
          <div className="p-3 bg-severity-critical/15 rounded-2xl">
            <ShieldAlert className="w-6 h-6 text-severity-critical" />
          </div>
        </div>
      </div>

      {/* Detailed Panels: Analytics Summary & Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Main Left: Analytics and Organ loads if checked */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="glass-panel p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-800">Safety Analytics Overview</h3>
              <button 
                onClick={() => setActiveTab('prescription')}
                className="text-xs font-semibold text-medical-cyan hover:underline flex items-center gap-1"
              >
                Go to Builder <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {analysisResults ? (
              <AnalyticsPanel />
            ) : (
              <div className="h-60 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 rounded-2xl bg-white/40">
                <Activity className="w-12 h-12 text-slate-600 mb-4 animate-pulse-slow" />
                <h4 className="text-sm font-bold text-slate-700 mb-1">No Active Safety Report</h4>
                <p className="text-xs text-slate-500 max-w-sm">
                  Compile a drug list for {selectedPatient ? selectedPatient.name : 'the active patient'} and trigger "Analyze Prescription" to display safety scores, interaction networks, and organ loading charts.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar: Clinical checklists and Patient alerts */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Patient medical summary card */}
          <div className="glass-panel p-6 border-l-4 border-medical-cyan">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-medical-cyan" /> Patient Profile
            </h3>
            {selectedPatient ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-medical-cyan/10 flex items-center justify-center font-bold text-medical-cyan text-sm">
                    {selectedPatient.name.split(' ').map(n=>n[0]).join('')}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{selectedPatient.name}</h4>
                    <p className="text-xs text-slate-500">ID: #00{selectedPatient.id} &bull; Age: {selectedPatient.age} &bull; {selectedPatient.gender}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs border-y border-slate-200/50 py-3">
                  <div className="flex items-center gap-1 text-slate-500">
                    <Scale className="w-3.5 h-3.5" /> {selectedPatient.weight}
                  </div>
                  <div className="flex items-center gap-1 text-slate-500">
                    <Ruler className="w-3.5 h-3.5" /> {selectedPatient.height}
                  </div>
                  <div className="flex items-center gap-1 text-slate-500 col-span-2 mt-1">
                    <Droplet className="w-3.5 h-3.5 text-severity-critical" /> Blood Group: <span className="font-bold text-slate-800">{selectedPatient.blood_group}</span>
                  </div>
                </div>

                <div>
                  <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Documented Allergies</h5>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedPatient.allergies.map((a, idx) => (
                      <span key={idx} className="text-[10px] font-semibold bg-severity-critical/10 text-severity-critical px-2 py-0.5 rounded-md border border-severity-critical/20">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Comorbidities</h5>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedPatient.existing_conditions.map((c, idx) => (
                      <span key={idx} className="text-[10px] font-semibold bg-severity-moderate/10 text-severity-moderate px-2 py-0.5 rounded-md border border-severity-moderate/20">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">No active patient profile loaded.</p>
            )}
          </div>

          {/* Smart Safety checklist */}
          <div className="glass-panel p-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-medical-teal" /> Pre-dispense Checklist
            </h3>
            <ul className="flex flex-col gap-3 text-xs text-slate-600">
              <li className="flex items-start gap-2.5">
                <input type="checkbox" className="mt-0.5 rounded border-slate-300 bg-white text-medical-cyan focus:ring-medical-cyan" checked={prescription.length > 0} readOnly />
                <span>Enter target medications in builder</span>
              </li>
              <li className="flex items-start gap-2.5">
                <input type="checkbox" className="mt-0.5 rounded border-slate-300 bg-white text-medical-cyan focus:ring-medical-cyan" checked={analysisResults !== null} readOnly />
                <span>Run automated safety cross-match checks</span>
              </li>
              <li className="flex items-start gap-2.5">
                <input type="checkbox" className="mt-0.5 rounded border-slate-300 bg-white text-medical-cyan focus:ring-medical-cyan" checked={analysisResults && analysisResults.safetyScore >= 70} readOnly />
                <span>Verify safety score &gt; 70% threshold</span>
              </li>
              <li className="flex items-start gap-2.5">
                <input type="checkbox" className="mt-0.5 rounded border-slate-300 bg-white text-medical-cyan focus:ring-medical-cyan" />
                <span>Review organ loading percentages</span>
              </li>
              <li className="flex items-start gap-2.5">
                <input type="checkbox" className="mt-0.5 rounded border-slate-300 bg-white text-medical-cyan focus:ring-medical-cyan" />
                <span>Patient verification and counseling complete</span>
              </li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
};

// 2. Drug Database Sub-component imported from src/components/DrugDatabase.jsx


// 3. Settings Panel Sub-component
const SettingsPanel = () => {
  const { darkMode, setDarkMode } = useMedical();
  
  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800">System Settings</h1>
        <p className="text-sm text-slate-500">Configure parameters for the RXSheild AI diagnostic workstation.</p>
      </div>

      <div className="max-w-2xl flex flex-col gap-6">
        <div className="glass-panel p-6 flex flex-col gap-4">
          <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-3">User Interface Theme</h3>
          <div className="flex justify-between items-center py-2">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-800">Dark Mode Theme (Recommended)</span>
              <span className="text-xs text-slate-500">Apply a dark glassmorphic medical grid UI.</span>
            </div>
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className={`w-12 h-6 rounded-full p-1 transition-all ${darkMode ? 'bg-medical-cyan' : 'bg-slate-700'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-all ${darkMode ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        <div className="glass-panel p-6 flex flex-col gap-4">
          <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-3">Diagnostic Rules Engine</h3>
          <div className="flex justify-between items-center py-2">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-800">Autosave Reports Log</span>
              <span className="text-xs text-slate-500">Automatically sync prescription analysis to patient history databases.</span>
            </div>
            <button className="w-12 h-6 rounded-full p-1 bg-medical-cyan">
              <div className="w-4 h-4 rounded-full bg-white translate-x-6" />
            </button>
          </div>
        </div>
        
        <div className="glass-panel p-6 flex flex-col gap-4">
          <h3 className="font-bold text-severity-critical border-b border-slate-100 pb-3">Clinical Sandbox Controls</h3>
          <div className="flex justify-between items-center py-2">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-800">Reset Application Data</span>
              <span className="text-xs text-slate-500">Clear saved local report registries and clinical logs.</span>
            </div>
            <button 
              onClick={() => {
                localStorage.removeItem('medHistory');
                alert('Clinical cache cleared successfully.');
              }}
              className="px-4 py-2 bg-severity-critical/10 border border-severity-critical/30 hover:bg-severity-critical/20 text-severity-critical rounded-xl text-xs font-bold transition-all"
            >
              Purge System Logs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 4. Primary Dashboard Shell
const Dashboard = () => {
  const navigate = useNavigate();
  const { 
    patients, 
    selectedPatient, 
    selectPatient, 
    activeTab, 
    setActiveTab,
    notifications,
    darkMode,
    createPatient
  } = useMedical();

  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const initialPatientForm = {
    name: '',
    age: '',
    gender: 'Male',
    weight: '',
    height: '',
    blood_group: 'O+',
    allergies: '',
    existing_conditions: ''
  };

  const [patientForm, setPatientForm] = useState(initialPatientForm);

  const handlePatientSubmit = async (e) => {
    e.preventDefault();
    if (!patientForm.name || !patientForm.age) return;

    try {
      const allergiesArr = patientForm.allergies
        ? patientForm.allergies.split(',').map(item => item.trim()).filter(Boolean)
        : [];
      const conditionsArr = patientForm.existing_conditions
        ? patientForm.existing_conditions.split(',').map(item => item.trim()).filter(Boolean)
        : [];

      await createPatient({
        ...patientForm,
        age: parseInt(patientForm.age),
        allergies: allergiesArr,
        existing_conditions: conditionsArr
      });

      setPatientForm(initialPatientForm);
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    navigate('/');
  };

  const renderActivePanel = () => {
    switch (activeTab) {
      case 'dashboard':
        return <HomeDashboard setActiveTab={setActiveTab} />;
      case 'prescription':
        return <PrescriptionBuilder />;
      case 'drugs':
        return <DrugDatabase />;
      case 'chat':
        return <AIAssistant />;
      case 'reports':
        return <ReportTemplate />;
      case 'settings':
        return <SettingsPanel />;
      default:
        return <HomeDashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className={`relative flex h-screen w-screen overflow-hidden bg-bg-dark text-slate-800 ${darkMode ? 'dark' : ''}`}>
      
      {/* 1. Left Navigation Sidebar */}
      <aside className="w-72 bg-bg-sidebar border-r border-slate-200/50 shrink-0 flex flex-col z-10 no-print">
        {/* Brand Header */}
        <div className="p-6 flex items-center gap-3 border-b border-slate-200/50">
          <div className="bg-gradient-to-br from-medical-cyan to-medical-purple p-2 rounded-xl shadow-neon-cyan animate-pulse">
            <HeartPulse className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-extrabold text-lg tracking-tight text-slate-800">
              RXSheild <span className="text-medical-cyan">AI</span>
            </span>
            <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-widest mt-0.5">Clinical Workspace</span>
          </div>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="p-4 flex flex-col gap-1.5">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all border ${
              activeTab === 'dashboard'
                ? 'bg-emerald-700/10 border-emerald-700/20 text-emerald-800 shadow-inner'
                : 'border-transparent text-slate-500 hover:text-emerald-950 hover:bg-emerald-700/5'
            }`}
          >
            <LayoutDashboard className="w-4.5 h-4.5" /> Clinical Dashboard
          </button>

          <button 
            onClick={() => setActiveTab('prescription')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all border ${
              activeTab === 'prescription'
                ? 'bg-emerald-700/10 border-emerald-700/20 text-emerald-800 shadow-inner'
                : 'border-transparent text-slate-500 hover:text-emerald-950 hover:bg-emerald-700/5'
            }`}
          >
            <FileSpreadsheet className="w-4.5 h-4.5" /> Prescription Checker
          </button>

          <button 
            onClick={() => setActiveTab('drugs')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all border ${
              activeTab === 'drugs'
                ? 'bg-emerald-700/10 border-emerald-700/20 text-emerald-800 shadow-inner'
                : 'border-transparent text-slate-500 hover:text-emerald-950 hover:bg-emerald-700/5'
            }`}
          >
            <Database className="w-4.5 h-4.5" /> Drug Database
          </button>

          <button 
            onClick={() => setActiveTab('chat')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all border ${
              activeTab === 'chat'
                ? 'bg-emerald-700/10 border-emerald-700/20 text-emerald-800 shadow-inner'
                : 'border-transparent text-slate-500 hover:text-emerald-950 hover:bg-emerald-700/5'
            }`}
          >
            <MessageSquare className="w-4.5 h-4.5" /> AI Chat Assistant
          </button>

          <button 
            onClick={() => setActiveTab('reports')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all border ${
              activeTab === 'reports'
                ? 'bg-emerald-700/10 border-emerald-700/20 text-emerald-800 shadow-inner'
                : 'border-transparent text-slate-500 hover:text-emerald-950 hover:bg-emerald-700/5'
            }`}
          >
            <FileText className="w-4.5 h-4.5" /> Reports Center
          </button>

          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all border ${
              activeTab === 'settings'
                ? 'bg-emerald-700/10 border-emerald-700/20 text-emerald-800 shadow-inner'
                : 'border-transparent text-slate-500 hover:text-emerald-950 hover:bg-emerald-700/5'
            }`}
          >
            <SettingsIcon className="w-4.5 h-4.5" /> System Settings
          </button>
        </nav>

        {/* Sidebar Patient widget fallback if active */}
        {selectedPatient && (
          <div className="mt-auto p-4 border-t border-slate-200/50 bg-white/40">
            <div className="p-3 bg-white border border-slate-200/50 rounded-xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-medical-cyan/10 flex items-center justify-center font-bold text-medical-cyan text-xs">
                {selectedPatient.name.split(' ').map(n=>n[0]).join('')}
              </div>
              <div className="flex flex-col min-w-0 leading-none">
                <span className="text-xs font-bold text-slate-800 truncate">{selectedPatient.name}</span>
                <span className="text-[10px] text-slate-600 mt-1 truncate">Allergies: {selectedPatient.allergies.join(', ') || 'None'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Logout widget */}
        <div className="p-4 border-t border-slate-200/50 flex flex-col gap-2">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 transition-all"
          >
            <LogOut className="w-4 h-4" /> Exit Workspace
          </button>
        </div>
      </aside>

      {/* 2. Main Work Area Container */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Header bar */}
        <header className="h-16 border-b border-slate-200/50 bg-white/50 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-10 no-print">
          
          {/* Patient Selector widget */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider mr-2">Loaded Profile:</span>
            <select
              value={selectedPatient ? selectedPatient.id : ''}
              onChange={(e) => selectPatient(e.target.value)}
              className="bg-white border border-slate-200 text-xs font-semibold text-slate-800 px-3 py-1.5 rounded-lg focus:outline-none focus:border-medical-cyan/40"
            >
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.name} (Age: {p.age})</option>
              ))}
            </select>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3 py-1.5 btn-gold rounded-lg text-xs font-bold transition-all shadow-none"
            >
              + New Patient
            </button>
          </div>

          {/* Right Header Widget: Notifications, Date */}
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-slate-600 hidden md:block">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            
            {/* Realtime Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="p-2 border border-slate-200 hover:border-slate-350 bg-white hover:bg-slate-50 rounded-xl relative transition-all"
              >
                <Bell className="w-4.5 h-4.5 text-slate-600" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-severity-critical animate-ping" />
                )}
              </button>
              
              {/* Notification dropdown */}
              {notifDropdownOpen && (
                <div className="absolute right-0 mt-3 w-80 glass-panel p-4 z-50 flex flex-col gap-3 animate-fade-in">
                  <h4 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-2">Clinical Notifications ({notifications.length})</h4>
                  <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                    {notifications.length > 0 ? (
                      notifications.map(n => (
                        <div key={n.id} className={`p-2.5 rounded-lg border text-xs leading-relaxed flex gap-2 ${
                          n.type === 'error' ? 'bg-severity-critical/10 border-severity-critical/20 text-severity-critical' :
                          n.type === 'warning' ? 'bg-severity-moderate/10 border-severity-moderate/20 text-severity-moderate' :
                          'bg-medical-cyan/5 border-medical-cyan/10 text-medical-cyan'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                            n.type === 'error' ? 'bg-severity-critical' :
                            n.type === 'warning' ? 'bg-severity-moderate' :
                            'bg-medical-cyan'
                          }`} />
                          <span>{n.message}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-xs text-slate-500 py-4 italic">No new notifications.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Inner work page */}
        <main className="flex-1 overflow-y-auto p-6 relative">
          {renderActivePanel()}
        </main>
      </div>

      {/* 3. New Patient Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in animate-duration-200">
          <div className="glass-panel w-full max-w-lg p-6 flex flex-col gap-5 bg-white/95 shadow-2xl border border-white max-h-[90vh] overflow-y-auto text-slate-800">
            <div className="flex justify-between items-center border-b border-slate-200/50 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Add New Patient</h3>
                <p className="text-xs text-slate-500">Create a new clinical profile in the workspace database.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-650 text-xl font-bold p-1 leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handlePatientSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-600">Full Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Jane Smith"
                  value={patientForm.name}
                  onChange={(e) => setPatientForm({...patientForm, name: e.target.value})}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-medical-cyan/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-600">Age *</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    max="120"
                    placeholder="e.g. 45"
                    value={patientForm.age}
                    onChange={(e) => setPatientForm({...patientForm, age: e.target.value})}
                    className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-medical-cyan/50"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-600">Gender *</label>
                  <select 
                    required
                    value={patientForm.gender}
                    onChange={(e) => setPatientForm({...patientForm, gender: e.target.value})}
                    className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-medical-cyan/50 focus:bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-600">Weight *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. 70 kg"
                    value={patientForm.weight}
                    onChange={(e) => setPatientForm({...patientForm, weight: e.target.value})}
                    className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-medical-cyan/50"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-600">Height *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. 175 cm"
                    value={patientForm.height}
                    onChange={(e) => setPatientForm({...patientForm, height: e.target.value})}
                    className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-medical-cyan/50"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-600">Blood Group</label>
                  <select 
                    value={patientForm.blood_group}
                    onChange={(e) => setPatientForm({...patientForm, blood_group: e.target.value})}
                    className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-medical-cyan/50 focus:bg-white"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-600">Allergies (comma-separated)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Penicillin, Aspirin, Sulfa Drugs"
                  value={patientForm.allergies}
                  onChange={(e) => setPatientForm({...patientForm, allergies: e.target.value})}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-medical-cyan/50"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-600">Comorbidities / Existing Conditions (comma-separated)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Asthma, Diabetes, Hypertension"
                  value={patientForm.existing_conditions}
                  onChange={(e) => setPatientForm({...patientForm, existing_conditions: e.target.value})}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-medical-cyan/50"
                />
              </div>

              <div className="flex justify-end gap-3 mt-4 border-t border-slate-200/50 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-250 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 btn-gold rounded-xl text-xs font-bold shadow-neon-blue transition-all"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
