import { useState, useRef } from 'react';
import { useMedical } from '../context/MedicalContext';
import { 
  Search, Plus, Trash2, ShieldAlert, AlertTriangle, 
  RefreshCw, Sparkles, Mic, 
  Printer, Save, CheckCircle
} from 'lucide-react';
import OrganVisualizer from './OrganVisualizer';
import AnalyticsPanel from './AnalyticsPanel';

const PrescriptionBuilder = () => {
  const {
    prescription,
    addDrug,
    removeDrug,
    clearPrescription,
    analyzePrescription,
    analysisResults,
    loading,
    saveReport,
    addNotification,
    selectedPatient
  } = useMedical();

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedDrug, setSelectedDrug] = useState(null);
  
  // Track active request to prevent race conditions
  const activeSearchQueryRef = useRef('');

  // Parameter overrides
  const [selectedDosage, setSelectedDosage] = useState('');
  const [selectedFrequency, setSelectedFrequency] = useState('Once daily');
  const [selectedDuration, setSelectedDuration] = useState('7 Days');

  // Voice recognition state
  const [isListening, setIsListening] = useState(false);

  // Search handler
  const handleSearchChange = async (val) => {
    setSearchQuery(val);
    activeSearchQueryRef.current = val;

    if (val.trim().length === 0) {
      setSearchResults([]);
      return;
    }

    try {
      const currentQuery = val;
      const res = await fetch(`/api/drugs?q=${val}`);
      const data = await res.json();
      
      // Only commit results if this matches the active search query
      if (activeSearchQueryRef.current === currentQuery) {
        setSearchResults(data);
      }
    } catch (err) {
      console.error('Drug search error:', err);
    }
  };

  const handleSelectDrug = (drug) => {
    setSelectedDrug(drug);
    setSelectedDosage(drug.dosages[0]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleAddDrug = () => {
    if (!selectedDrug) return;
    addDrug({
      ...selectedDrug,
      dosage: selectedDosage,
      frequency: selectedFrequency,
      duration: selectedDuration
    });
    setSelectedDrug(null);
    setSearchQuery('');
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addNotification('Web Speech recognition is not supported in this browser.', 'warning');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    
    recognition.onstart = () => {
      setIsListening(true);
      addNotification('Voice input active. Speak a drug name...', 'info');
    };

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setSearchQuery(transcript);
      handleSearchChange(transcript);
      setIsListening(false);
      addNotification(`Voice captured: "${transcript}"`, 'success');
    };

    recognition.onerror = () => {
      setIsListening(false);
      addNotification('Voice capture failed. Try again.', 'error');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handlePrint = () => {
    window.print();
  };

  // Compile organ levels for printing / analytics
  const organBurdens = {
    brain: 0,
    heart: 0,
    liver: 0,
    kidneys: 0,
    stomach: 0
  };

  prescription.forEach(p => {
    const name = p.name.toLowerCase();
    if (name.includes('warfarin')) {
      organBurdens.brain = Math.max(organBurdens.brain, 40);
      organBurdens.heart = Math.max(organBurdens.heart, 20);
      organBurdens.liver = Math.max(organBurdens.liver, 45);
      organBurdens.kidneys = Math.max(organBurdens.kidneys, 25);
      organBurdens.stomach = Math.max(organBurdens.stomach, 50);
    } else if (name.includes('aspirin')) {
      organBurdens.brain = Math.max(organBurdens.brain, 15);
      organBurdens.heart = Math.max(organBurdens.heart, 10);
      organBurdens.liver = Math.max(organBurdens.liver, 20);
      organBurdens.kidneys = Math.max(organBurdens.kidneys, 40);
      organBurdens.stomach = Math.max(organBurdens.stomach, 75);
    } else if (name.includes('ibuprofen')) {
      organBurdens.brain = Math.max(organBurdens.brain, 10);
      organBurdens.heart = Math.max(organBurdens.heart, 35);
      organBurdens.liver = Math.max(organBurdens.liver, 25);
      organBurdens.kidneys = Math.max(organBurdens.kidneys, 55);
      organBurdens.stomach = Math.max(organBurdens.stomach, 80);
    } else if (name.includes('lisinopril')) {
      organBurdens.brain = Math.max(organBurdens.brain, 10);
      organBurdens.heart = Math.max(organBurdens.heart, 20);
      organBurdens.liver = Math.max(organBurdens.liver, 10);
      organBurdens.kidneys = Math.max(organBurdens.kidneys, 45);
      organBurdens.stomach = Math.max(organBurdens.stomach, 15);
    } else if (name.includes('metformin')) {
      organBurdens.brain = Math.max(organBurdens.brain, 5);
      organBurdens.heart = Math.max(organBurdens.heart, 10);
      organBurdens.liver = Math.max(organBurdens.liver, 30);
      organBurdens.kidneys = Math.max(organBurdens.kidneys, 70);
      organBurdens.stomach = Math.max(organBurdens.stomach, 45);
    } else if (name.includes('propranolol')) {
      organBurdens.brain = Math.max(organBurdens.brain, 30);
      organBurdens.heart = Math.max(organBurdens.heart, 75);
      organBurdens.liver = Math.max(organBurdens.liver, 35);
      organBurdens.kidneys = Math.max(organBurdens.kidneys, 25);
      organBurdens.stomach = Math.max(organBurdens.stomach, 15);
    } else if (name.includes('nitroglycerin')) {
      organBurdens.brain = Math.max(organBurdens.brain, 20);
      organBurdens.heart = Math.max(organBurdens.heart, 40);
      organBurdens.liver = Math.max(organBurdens.liver, 15);
      organBurdens.kidneys = Math.max(organBurdens.kidneys, 20);
      organBurdens.stomach = Math.max(organBurdens.stomach, 10);
    } else if (name.includes('albuterol')) {
      organBurdens.brain = Math.max(organBurdens.brain, 15);
      organBurdens.heart = Math.max(organBurdens.heart, 35);
      organBurdens.liver = Math.max(organBurdens.liver, 10);
      organBurdens.kidneys = Math.max(organBurdens.kidneys, 15);
      organBurdens.stomach = Math.max(organBurdens.stomach, 5);
    } else {
      organBurdens.brain = Math.max(organBurdens.brain, 15);
      organBurdens.heart = Math.max(organBurdens.heart, 20);
      organBurdens.liver = Math.max(organBurdens.liver, 25);
      organBurdens.kidneys = Math.max(organBurdens.kidneys, 30);
      organBurdens.stomach = Math.max(organBurdens.stomach, 25);
    }
  });

  const safetyScore = analysisResults ? analysisResults.safetyScore : 100;
  const riskScore = 100 - safetyScore;

  // Calculate coordinates for Interaction Topology SVG
  const centerSvgX = 175;
  const centerSvgY = 130;
  const svgRadius = 75;
  const svgNodes = prescription.map((d, index) => {
    const angle = (index / prescription.length) * Math.PI * 2;
    const x = centerSvgX + Math.cos(angle) * svgRadius;
    const y = centerSvgY + Math.sin(angle) * svgRadius;
    
    let hazardLevel = 'safe';
    if (analysisResults) {
      const hasCritical = analysisResults.interactions.some(i => 
        (i.drugA.toLowerCase() === d.name.toLowerCase() && i.severity === 'critical') ||
        (i.drugB.toLowerCase() === d.name.toLowerCase() && i.severity === 'critical')
      ) || analysisResults.allergies.some(a => a.drug.toLowerCase() === d.name.toLowerCase());
      
      const hasModerate = analysisResults.interactions.some(i => 
        (i.drugA.toLowerCase() === d.name.toLowerCase() && (i.severity === 'moderate' || i.severity === 'high'))
      ) || analysisResults.contraindications.some(c => c.drug.toLowerCase() === d.name.toLowerCase());

      if (hasCritical) hazardLevel = 'critical';
      else if (hasModerate) hazardLevel = 'warning';
    }
    
    return {
      id: d.id,
      name: d.name,
      genericName: d.genericName,
      x,
      y,
      hazardLevel
    };
  });

  const svgLines = [];
  for (let i = 0; i < svgNodes.length; i++) {
    for (let j = i + 1; j < svgNodes.length; j++) {
      const nodeA = svgNodes[i];
      const nodeB = svgNodes[j];
      
      let severity = 'safe';
      if (analysisResults) {
        const inter = analysisResults.interactions.find(it => 
          (it.drugA.toLowerCase() === nodeA.name.toLowerCase() && it.drugB.toLowerCase() === nodeB.name.toLowerCase()) ||
          (it.drugA.toLowerCase() === nodeB.name.toLowerCase() && it.drugB.toLowerCase() === nodeA.name.toLowerCase())
        );
        if (inter) severity = inter.severity;
      }
      
      svgLines.push({
        x1: nodeA.x,
        y1: nodeA.y,
        x2: nodeB.x,
        y2: nodeB.y,
        severity
      });
    }
  }

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in">
      
      {/* Screen-Only Builder UI */}
      <div className="no-print w-full flex flex-col gap-6">
        {/* Page Title Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800">Prescription Checker</h1>
            <p className="text-sm text-slate-500">Validate polypharmacy regimens, clinical disease contraindications, and patient allergies.</p>
          </div>
          
          {/* Quick Toolbar */}
          <div className="flex gap-2">
            {prescription.length > 0 && (
              <button 
                onClick={clearPrescription}
                className="px-4 py-2 border border-slate-200 hover:border-severity-high/30 bg-white/40 hover:bg-severity-high/5 text-slate-600 hover:text-severity-high rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Trash2 className="w-4 h-4" /> Clear list
              </button>
            )}

            {analysisResults && (
              <>
                <button 
                  onClick={saveReport}
                  className="px-4 py-2 border border-slate-200 hover:border-medical-cyan/30 bg-white/40 hover:bg-medical-cyan/5 text-slate-600 hover:text-medical-cyan rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Save className="w-4 h-4" /> Save Record
                </button>

                <button 
                  onClick={handlePrint}
                  className="px-4 py-2 border border-slate-200 hover:border-medical-blue/30 bg-white/40 hover:bg-medical-blue/5 text-slate-600 hover:text-medical-blue rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Printer className="w-4 h-4" /> Print Form
                </button>
              </>
            )}
          </div>
        </div>

        {/* Centered Stack: Builder followed by Organ HUD */}
        <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto">
          
          {/* Top: Search & Polypharmacy List */}
          <div className="w-full flex flex-col gap-6">
            
            {/* Drug Search and parameters */}
            <div className="glass-panel p-6 flex flex-col gap-4 relative z-30">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Plus className="w-5 h-5 text-medical-cyan" /> Add Medications
              </h3>

              {/* Input and voice capture */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Type brand name or generic name (e.g. Warfarin, Aspirin)..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full bg-white/60 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-medical-blue/50 focus:shadow-neon-blue/20 transition-all"
                  />
                  
                  {/* Autocomplete dropdown list */}
                  {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xl max-h-56 overflow-y-auto z-[100] backdrop-blur-md">
                      {searchResults.map((d) => (
                        <button
                          key={d.id}
                          onClick={() => handleSelectDrug(d)}
                          className="w-full text-left p-3 hover:bg-medical-cyan/5 border-b border-slate-100 last:border-0 text-xs text-slate-600 flex justify-between items-center transition-all"
                        >
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800">{d.name}</span>
                            <span className="text-[10px] text-slate-400 italic">{d.generic_name}</span>
                          </div>
                          <span className="text-[9px] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-500 font-bold uppercase">{d.drug_class.split(' ')[0]}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Voice Input Button */}
                <button 
                  onClick={handleVoiceInput}
                  className={`p-3.5 rounded-xl border transition-all shrink-0 shadow-sm ${
                    isListening 
                      ? 'bg-severity-high/10 border-severity-high/30 text-severity-high animate-pulse' 
                      : 'bg-white/50 border-slate-200 hover:border-medical-cyan/30 text-slate-500 hover:text-medical-cyan'
                  }`}
                  title="Search by Voice"
                >
                  <Mic className="w-4 h-4" />
                </button>
              </div>

              {/* Parameter adjustments */}
              {selectedDrug && (
                <div className="p-4 bg-medical-cyan/5 border border-medical-cyan/15 rounded-2xl flex flex-col gap-4 animate-fade-in">
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col leading-none">
                      <span className="text-xs font-bold text-slate-800">{selectedDrug.name}</span>
                      <span className="text-[10px] text-slate-400 italic mt-1">{selectedDrug.generic_name}</span>
                    </div>
                    <span className="text-[10px] bg-medical-cyan/10 border border-medical-cyan/25 text-medical-cyan px-2.5 py-0.5 rounded-full font-bold uppercase">{selectedDrug.drug_class.split(' ')[0]}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-500 font-bold">Select Dose</label>
                      <select 
                        value={selectedDosage}
                        onChange={(e) => setSelectedDosage(e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg p-2 text-slate-700 focus:outline-none focus:border-medical-cyan/30"
                      >
                        {selectedDrug.dosages.map(dose => (
                          <option key={dose} value={dose}>{dose}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-500 font-bold">Frequency</label>
                      <select 
                        value={selectedFrequency}
                        onChange={(e) => setSelectedFrequency(e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg p-2 text-slate-700 focus:outline-none focus:border-medical-cyan/30"
                      >
                        <option value="Once daily">Once daily</option>
                        <option value="Twice daily">Twice daily</option>
                        <option value="Three times daily">Three times daily</option>
                        <option value="Four times daily">Four times daily</option>
                        <option value="Every 4-6 hours PRN">Every 4-6 hrs PRN</option>
                        <option value="At bedtime">At bedtime</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-500 font-bold">Duration</label>
                      <select 
                        value={selectedDuration}
                        onChange={(e) => setSelectedDuration(e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg p-2 text-slate-700 focus:outline-none focus:border-medical-cyan/30"
                      >
                        <option value="3 Days">3 Days</option>
                        <option value="7 Days">7 Days</option>
                        <option value="10 Days">10 Days</option>
                        <option value="14 Days">14 Days</option>
                        <option value="30 Days">30 Days</option>
                        <option value="90 Days">90 Days</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end mt-2">
                    <button 
                      onClick={() => setSelectedDrug(null)}
                      className="px-3.5 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleAddDrug}
                      className="px-4 py-2 btn-gold rounded-xl text-xs font-bold shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" /> Add to Prescription
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Active Drugs list */}
            <div className="flex flex-col gap-3 relative z-0">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Selected Regimen</span>
              
              {prescription.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {prescription.map((drug) => (
                    <div 
                      key={drug.id}
                      className="glass-panel p-4 flex justify-between items-center border-l-4 border-medical-cyan bg-white/50 hover:bg-white/80 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-medical-cyan/15 border border-medical-cyan/25 flex items-center justify-center font-bold text-medical-cyan text-xs">
                          💊
                        </div>
                        
                        <div className="flex flex-col leading-tight">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-800">{drug.name}</span>
                            <span className="text-[10px] font-semibold text-slate-500 uppercase bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{drug.dosage}</span>
                          </div>
                          <span className="text-[11px] text-slate-400 italic mt-0.5">Generic: {drug.genericName}</span>
                          <span className="text-[10px] text-slate-500 mt-1 font-light">Schedule: <span className="font-semibold text-slate-600">{drug.frequency}</span> &bull; Duration: <span className="font-semibold text-slate-600">{drug.duration}</span></span>
                        </div>
                      </div>

                      <button 
                        onClick={() => removeDrug(drug.id)}
                        className="p-2.5 border border-transparent hover:border-severity-high/20 hover:bg-severity-high/10 rounded-xl text-slate-400 hover:text-severity-high transition-all"
                        title="Remove Drug"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {/* Primary Analyze prescription button */}
                  <button 
                    onClick={analyzePrescription}
                    disabled={loading}
                    className="w-full mt-2 py-4 rounded-2xl btn-gold text-white font-extrabold shadow-neon-blue hover:shadow-neon-blue/80 transition-all flex items-center justify-center gap-2 group transform hover:-translate-y-0.5 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" /> Running AI Safety Scan...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform text-medical-blue" /> Analyze Prescription Regimen
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="glass-panel p-12 flex flex-col items-center justify-center text-center border border-dashed border-slate-200 rounded-2xl bg-white/30">
                  <Plus className="w-12 h-12 text-slate-400 mb-4 animate-pulse-slow" />
                  <h4 className="text-sm font-bold text-slate-600 mb-1">Prescription Builder is Empty</h4>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Search and add medicines above. You can also use voice input to automatically search for drugs.
                  </p>
                </div>
              )}
            </div>

          </div>

          {/* Center Bottom: Interactive Organ HUD */}
          <div className="w-full">
            <OrganVisualizer />
          </div>

        </div>

        {/* Expandable Analysis Reports Section */}
        {analysisResults && (
          <div className="flex flex-col gap-6 mt-4">
            <h3 className="text-lg font-extrabold text-slate-800 border-b border-slate-100 pb-3">AI Diagnostic Safety Report</h3>
            
            <AnalyticsPanel />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Allergies and Contraindications panel */}
              <div className="flex flex-col gap-6">
                
                {/* Allergy alerts */}
                <div className="flex flex-col gap-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Allergy Warnings</span>
                  {analysisResults.allergies.length > 0 ? (
                    <div className="flex flex-col gap-3">
                      {analysisResults.allergies.map((a, idx) => (
                        <div key={idx} className="p-4 bg-severity-critical/10 border border-severity-critical/20 rounded-2xl flex gap-3 animate-pulse">
                          <ShieldAlert className="w-5 h-5 text-severity-critical shrink-0 mt-0.5" />
                          <div className="flex flex-col gap-1.5">
                            <h4 className="text-sm font-bold text-severity-critical">CRITICAL ALLERGY ALERT: {a.drug}</h4>
                            <p className="text-xs text-slate-700 font-light">{a.reason}</p>
                            <p className="text-xs text-slate-600 mt-1"><span className="font-bold text-slate-700">Reaction:</span> {a.reaction}</p>
                            <div className="bg-white/70 p-3 rounded-xl border border-white/80 text-[11px] text-slate-600 leading-normal font-light mt-1">
                              <span className="font-bold text-slate-800 block mb-0.5">Emergency Advice:</span>
                              {a.advice}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="glass-panel p-4 bg-white/40 flex items-center gap-3 text-xs text-slate-500">
                      <CheckCircle className="w-5 h-5 text-severity-low" /> No documented allergy risks detected.
                    </div>
                  )}
                </div>

                {/* Disease Contraindications */}
                <div className="flex flex-col gap-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Disease Contraindications</span>
                  {analysisResults.contraindications.length > 0 ? (
                    <div className="flex flex-col gap-3">
                      {analysisResults.contraindications.map((c, idx) => (
                        <div key={idx} className="p-4 bg-severity-high/10 border border-severity-high/20 rounded-2xl flex gap-3">
                          <AlertTriangle className="w-5 h-5 text-severity-high shrink-0 mt-0.5" />
                          <div className="flex flex-col gap-1">
                            <h4 className="text-sm font-bold text-severity-high">Contraindication Warning: {c.drug} vs {c.condition}</h4>
                            <p className="text-xs text-slate-700 leading-relaxed font-light">{c.explanation}</p>
                            <p className="text-xs text-slate-600 italic mt-1 font-light"><span className="font-bold text-slate-700 font-normal">Recommended action:</span> {c.action}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="glass-panel p-4 bg-white/40 flex items-center gap-3 text-xs text-slate-500">
                      <CheckCircle className="w-5 h-5 text-severity-low" /> No disease contraindications detected.
                    </div>
                  )}
                </div>

              </div>

              {/* Interactions and safer alternatives panels */}
              <div className="flex flex-col gap-6">
                
                {/* Interaction pairs */}
                <div className="flex flex-col gap-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Drug Interactions list</span>
                  {analysisResults.interactions.length > 0 ? (
                    <div className="flex flex-col gap-3">
                      {analysisResults.interactions.map((inter, idx) => (
                        <div key={idx} className="glass-panel p-4 bg-white/40 flex flex-col gap-3">
                          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                            <span className="text-xs font-bold text-slate-800">{inter.drugA} + {inter.drugB}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                              inter.severity === 'critical' ? 'bg-severity-critical/10 text-severity-critical border-severity-critical/20' :
                              (inter.severity === 'high' ? 'bg-severity-high/10 text-severity-high border-severity-high/20' : 'bg-severity-moderate/10 text-severity-moderate border border-severity-moderate/20')
                            }`}>
                              {inter.severity.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex flex-col gap-2 text-xs">
                            <p className="text-slate-700 font-light"><span className="font-bold text-slate-800">Mechanism:</span> {inter.mechanism}</p>
                            <p className="text-slate-600 font-light"><span className="font-bold text-slate-800">Clinical impact:</span> {inter.clinicalImpact}</p>
                            <div className="bg-white/70 p-3 rounded-xl border border-white/80 text-[11px] text-slate-600 font-light">
                              <span className="font-bold text-slate-800 block mb-0.5">Recommended action:</span>
                              {inter.recommendedAction}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="glass-panel p-4 bg-white/40 flex items-center gap-3 text-xs text-slate-500">
                      <CheckCircle className="w-5 h-5 text-severity-low" /> No severe drug interactions detected.
                    </div>
                  )}
                </div>

                {/* Safer Alternatives Recommendation Engine */}
                <div className="flex flex-col gap-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Safer Alternatives Engine</span>
                  {Object.keys(analysisResults.alternatives).length > 0 ? (
                    <div className="flex flex-col gap-4">
                      {Object.entries(analysisResults.alternatives).map(([drugName, alts]) => (
                        <div key={drugName} className="glass-panel p-4 bg-white/40 flex flex-col gap-3 border-l-2 border-medical-purple">
                          <span className="text-xs font-bold text-slate-800">Alternatives for: <span className="text-severity-high font-black">{drugName}</span></span>
                          
                          <div className="flex flex-col gap-2.5">
                            {alts.map((alt, altIdx) => (
                              <div key={altIdx} className="bg-white/80 border border-slate-200 p-3 rounded-xl flex items-center justify-between gap-4 shadow-sm">
                                <div className="flex flex-col leading-tight">
                                  <span className="text-xs font-bold text-slate-800">{alt.name}</span>
                                  <span className="text-[10px] text-slate-400 italic mt-0.5">Generic: {alt.genericName} &bull; {alt.class}</span>
                                </div>

                                <div className="flex items-center gap-4 text-xs font-semibold">
                                  <div className="flex flex-col items-center">
                                    <span className="text-[9px] text-slate-400 uppercase font-bold">Safety</span>
                                    <span className="text-severity-low">{alt.safetyRating} ★</span>
                                  </div>
                                  <div className="flex flex-col items-center">
                                    <span className="text-[9px] text-slate-400 uppercase font-bold">Risk</span>
                                    <span className="text-slate-600 font-bold uppercase">{alt.interactionRisk}</span>
                                  </div>
                                  <div className="flex flex-col items-center">
                                    <span className="text-[9px] text-slate-400 uppercase font-bold">Price</span>
                                    <span className="text-slate-800">{alt.priceEstimate}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="glass-panel p-4 bg-white/40 flex items-center gap-3 text-xs text-slate-400">
                      <CheckCircle className="w-5 h-5 text-severity-low" /> Prescription is safe. No drug alternatives required.
                    </div>
                  )}
                </div>

              </div>

            </div>
          </div>
        )}
      </div>

      {/* Print-Only safety report matching mockup styling exactly */}
      <div className="hidden print:block w-full p-8 rounded-3xl flex flex-col gap-6 font-sans min-h-screen" style={{ backgroundColor: '#070D0B', color: 'white' }}>
        
        {/* Patient Details & Clinical Context Header */}
        {selectedPatient && (
          <div className="border border-white/10 p-6 rounded-2xl flex flex-col gap-4" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider">Patient Clinical Profile</span>
                <h2 className="text-xl font-bold text-white mt-1">{selectedPatient.name}</h2>
                <p className="text-xs text-slate-400 mt-1">Patient ID: #00{selectedPatient.id}</p>
              </div>
              <div className="text-right text-xs text-slate-400">
                <p className="font-bold text-white">RXSheild AI Diagnostic Workstation</p>
                <p className="mt-1">{new Date().toLocaleString()}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs border-t border-white/5 pt-4">
              <div>
                <span className="text-[10px] text-slate-500 block">Age / Gender</span>
                <span className="font-semibold text-slate-200 mt-1 block">{selectedPatient.age} yrs / {selectedPatient.gender}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Weight / Height</span>
                <span className="font-semibold text-slate-200 mt-1 block">{selectedPatient.weight} / {selectedPatient.height}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Blood Group</span>
                <span className="font-semibold text-slate-200 mt-1 block text-teal-400">{selectedPatient.blood_group}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Active Regimen</span>
                <span className="font-semibold text-slate-200 mt-1 block">{prescription.length} Meds loaded</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-white/5 pt-4 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 block font-bold">Documented Allergies</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {selectedPatient.allergies.length > 0 ? (
                    selectedPatient.allergies.map((a, i) => (
                      <span key={i} className="text-[9px] font-bold bg-red-500/10 border border-red-500/20 text-red-400 px-2 py-0.5 rounded">
                        {a}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">No documented allergies</span>
                  )}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block font-bold">Comorbidities / Conditions</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {selectedPatient.existing_conditions.length > 0 ? (
                    selectedPatient.existing_conditions.map((c, i) => (
                      <span key={i} className="text-[9px] font-bold bg-orange-500/10 border border-orange-500/20 text-orange-400 px-2 py-0.5 rounded">
                        {c}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">No active comorbidities</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Report Section Title */}
        <div className="border-b border-white/10 pb-2">
          <h1 className="text-xl font-black text-white uppercase tracking-wide">AI Diagnostic Safety Report</h1>
        </div>

        {/* Top Gauges Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          
          {/* Gauges (Safety Index & Risk Score) */}
          <div className="md:col-span-5 border border-white/10 p-4 rounded-2xl flex items-center justify-around" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
            
            {/* Safety Index Circle */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Safety Index</span>
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="48" cy="48" r="40" stroke="rgba(255,255,255,0.03)" strokeWidth="5" fill="transparent" />
                  <circle 
                    cx="48" 
                    cy="48" 
                    r="40" 
                    stroke={safetyScore > 80 ? '#2dd4bf' : (safetyScore > 50 ? '#D4A017' : '#FF7F50')} 
                    strokeWidth="6" 
                    fill="transparent" 
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={2 * Math.PI * 40 * (1 - safetyScore / 100)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center leading-none">
                  <span className="text-base font-black text-white">{safetyScore}%</span>
                  <span className="text-[8px] text-teal-400 uppercase tracking-widest mt-0.5">Safe</span>
                </div>
              </div>
            </div>
            
            {/* Risk Score Circle */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Risk Score</span>
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="48" cy="48" r="40" stroke="rgba(255,255,255,0.03)" strokeWidth="5" fill="transparent" />
                  <circle 
                    cx="48" 
                    cy="48" 
                    r="40" 
                    stroke={riskScore > 60 ? '#ef4444' : (riskScore > 30 ? '#D4A017' : '#2dd4bf')} 
                    strokeWidth="6" 
                    fill="transparent" 
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={2 * Math.PI * 40 * (1 - riskScore / 100)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center leading-none">
                  <span className="text-base font-black text-white">{riskScore}%</span>
                  <span className="text-[8px] text-red-400 uppercase tracking-widest mt-0.5">Risk</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendation & Warning Counts */}
          <div className="md:col-span-7 flex flex-col justify-between gap-4">
            
            {/* Clearance Box */}
            <div className="p-4 rounded-2xl border text-[11px] leading-relaxed flex-1 flex flex-col justify-center" style={{ 
              backgroundColor: safetyScore >= 90 ? 'rgba(45, 212, 191, 0.05)' : (safetyScore >= 70 ? 'rgba(212, 160, 23, 0.05)' : 'rgba(239, 68, 68, 0.05)'),
              borderColor: safetyScore >= 90 ? 'rgba(45, 212, 191, 0.15)' : (safetyScore >= 70 ? 'rgba(212, 160, 23, 0.15)' : 'rgba(239, 68, 68, 0.15)')
            }}>
              <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] mb-1">
                <span className={safetyScore >= 90 ? 'text-teal-400' : (safetyScore >= 70 ? 'text-yellow-400' : 'text-red-450') }>
                  🛡️ {safetyScore >= 90 ? 'Class A Clearance' : (safetyScore >= 70 ? 'Class B Alert' : 'Class C Critical Alert')}
                </span>
              </div>
              <p className="text-slate-300">
                {analysisResults ? analysisResults.recommendations : 'Prescription is safe and ready for patient dispensation.'}
              </p>
            </div>

            {/* Counts Boxes */}
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="border border-white/10 p-2.5 rounded-xl flex flex-col items-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
                <span className="text-slate-500 text-[9px] uppercase font-bold tracking-wider">Interactions</span>
                <span className="text-lg font-bold text-white mt-0.5">
                  {analysisResults ? analysisResults.interactions.length : 0}
                </span>
              </div>
              <div className="border border-white/10 p-2.5 rounded-xl flex flex-col items-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
                <span className="text-slate-500 text-[9px] uppercase font-bold tracking-wider">Allergies</span>
                <span className="text-lg font-bold text-white mt-0.5">
                  {analysisResults ? analysisResults.allergies.length : 0}
                </span>
              </div>
              <div className="border border-white/10 p-2.5 rounded-xl flex flex-col items-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
                <span className="text-slate-500 text-[9px] uppercase font-bold tracking-wider">Contraindications</span>
                <span className="text-lg font-bold text-white mt-0.5">
                  {analysisResults ? analysisResults.contraindications.length : 0}
                </span>
              </div>
            </div>

          </div>

        </div>

        {/* Topology & Organ Load Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch mt-2">
          
          {/* Interaction Topology Graph */}
          <div className="border border-white/10 p-4 rounded-2xl flex flex-col gap-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                🕸️ Interaction Topology
              </span>
              <span className="text-[8px] text-slate-500">Nodes represent loaded drugs</span>
            </div>
            
            <div className="flex-1 flex items-center justify-center border border-white/5 rounded-xl py-3 min-h-[220px]" style={{ backgroundColor: '#0a100e' }}>
              {prescription.length === 0 ? (
                <span className="text-[10px] text-slate-500 italic">No medications loaded. Network is idle.</span>
              ) : (
                <svg width="350" height="260" viewBox="0 0 350 260" className="w-full h-auto max-w-[350px]">
                  {/* Lines */}
                  {svgLines.map((line, idx) => {
                    let stroke = 'rgba(255, 255, 255, 0.08)';
                    let strokeWidth = '1';
                    
                    if (line.severity === 'critical') {
                      stroke = '#ef4444';
                      strokeWidth = '2';
                    } else if (line.severity === 'high' || line.severity === 'moderate') {
                      stroke = '#D4A017';
                      strokeWidth = '1.5';
                    }
                    
                    return (
                      <line 
                        key={idx}
                        x1={line.x1}
                        y1={line.y1}
                        x2={line.x2}
                        y2={line.y2}
                        stroke={stroke}
                        strokeWidth={strokeWidth}
                      />
                    );
                  })}
                  
                  {/* Nodes */}
                  {svgNodes.map((node, idx) => {
                    let fill = '#0a100e';
                    let stroke = '#0F766E';
                    let labelColor = '#ffffff';
                    
                    if (node.hazardLevel === 'critical') {
                      fill = 'rgba(239, 68, 68, 0.15)';
                      stroke = '#ef4444';
                      labelColor = '#ef4444';
                    } else if (node.hazardLevel === 'warning') {
                      fill = 'rgba(212, 160, 23, 0.15)';
                      stroke = '#D4A017';
                      labelColor = '#D4A017';
                    }
                    
                    return (
                      <g key={idx}>
                        <circle 
                          cx={node.x}
                          cy={node.y}
                          r="22"
                          fill={fill}
                          stroke={stroke}
                          strokeWidth="2"
                        />
                        <text 
                          x={node.x}
                          y={node.y}
                          fill={labelColor}
                          fontSize="8.5"
                          fontWeight="bold"
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          {node.name.substring(0, 10)}
                        </text>
                        <text 
                          x={node.x}
                          y={node.y + 10}
                          fill="rgba(255, 255, 255, 0.4)"
                          fontSize="6"
                          textAnchor="middle"
                        >
                          {node.genericName.substring(0, 11)}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              )}
            </div>
          </div>

          {/* Organ Load progress list */}
          <div className="border border-white/10 p-4 rounded-2xl flex flex-col gap-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                🫀 Organ Load Comparison
              </span>
            </div>
            
            <div className="flex-1 flex flex-col justify-center gap-3 border border-white/5 rounded-xl p-4 min-h-[220px]" style={{ backgroundColor: '#0a100e' }}>
              {Object.entries(organBurdens).map(([organ, value]) => {
                let barColor = 'bg-[#0F766E]'; // default deep emerald
                if (value > 60) barColor = 'bg-[#ef4444]'; // red
                else if (value > 30) barColor = 'bg-[#B497D6]'; // purple
                else if (value > 15) barColor = 'bg-[#D4A017]'; // gold

                return (
                  <div key={organ} className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-slate-350 uppercase tracking-wider flex items-center gap-1.5">
                        {organ === 'heart' && '❤️'}
                        {organ === 'brain' && '🧠'}
                        {organ === 'stomach' && '💧'}
                        {organ === 'liver' && '🫁'}
                        {organ === 'kidneys' && '🩺'}
                        {organ}
                      </span>
                      <span className="font-bold text-slate-400">{value}% Burden</span>
                    </div>
                    
                    <div className="w-full h-2 bg-white/5 border border-white/5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${barColor}`} 
                        style={{ width: `${value}%` }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Warning cards & Alternatives Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
          
          {/* Left: Allergy & Contraindications */}
          <div className="flex flex-col gap-6">
            
            {/* Allergies list */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">ALLERGY WARNINGS</span>
              {analysisResults && analysisResults.allergies.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {analysisResults.allergies.map((a, idx) => (
                    <div key={idx} className="p-4 rounded-xl flex gap-3 border border-red-500/20" style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)' }}>
                      <div className="text-red-400 text-sm mt-0.5 font-bold">⚠️</div>
                      <div className="flex flex-col gap-1">
                        <h4 className="text-xs font-bold text-red-400">CRITICAL ALLERGY ALERT: {a.drug}</h4>
                        <p className="text-[11px] text-slate-300 leading-normal">{a.reason}</p>
                        <p className="text-[10px] text-slate-400 mt-1"><span className="font-bold text-slate-355 text-slate-300">Reaction:</span> {a.reaction}</p>
                        <div className="p-2 rounded border border-white/5 text-[10px] text-slate-400 leading-normal mt-1" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                          <span className="font-bold text-slate-300 block mb-0.5">Emergency Advice:</span>
                          {a.advice}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-white/5 p-4 rounded-full flex items-center gap-3 text-xs text-slate-400" style={{ backgroundColor: '#0a1210' }}>
                  <CheckCircle className="w-4.5 h-4.5 text-teal-400 shrink-0" />
                  <span>No documented allergy risks detected.</span>
                </div>
              )}
            </div>

            {/* Contraindications list */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">DISEASE CONTRAINDICATIONS</span>
              {analysisResults && analysisResults.contraindications.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {analysisResults.contraindications.map((c, idx) => (
                    <div key={idx} className="p-4 rounded-xl flex gap-3 border border-orange-500/20" style={{ backgroundColor: 'rgba(255, 127, 80, 0.08)' }}>
                      <div className="text-orange-400 text-sm mt-0.5 font-bold">⚠️</div>
                      <div className="flex flex-col gap-1">
                        <h4 className="text-xs font-bold text-orange-400">Contraindication Warning: {c.drug} vs {c.condition}</h4>
                        <p className="text-[11px] text-slate-300 leading-relaxed">{c.explanation}</p>
                        <p className="text-[10px] text-slate-400 mt-1"><span className="font-bold text-slate-300">Action:</span> {c.action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-white/5 p-4 rounded-full flex items-center gap-3 text-xs text-slate-400" style={{ backgroundColor: '#0a1210' }}>
                  <CheckCircle className="w-4.5 h-4.5 text-teal-400 shrink-0" />
                  <span>No disease contraindications detected.</span>
                </div>
              )}
            </div>

          </div>

          {/* Right: Interactions & Alternatives */}
          <div className="flex flex-col gap-6">
            
            {/* Drug Interactions list */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">DRUG INTERACTIONS LIST</span>
              {analysisResults && analysisResults.interactions.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {analysisResults.interactions.map((inter, idx) => (
                    <div key={idx} className="border border-white/10 p-4 rounded-xl flex flex-col gap-2.5" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                      <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                        <span className="text-xs font-bold text-slate-200">{inter.drugA} + {inter.drugB}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                          inter.severity === 'critical' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          (inter.severity === 'high' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20')
                        }`}>
                          {inter.severity.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1 text-[11px] text-slate-300">
                        <p><span className="font-bold text-slate-400">Mechanism:</span> {inter.mechanism}</p>
                        <p><span className="font-bold text-slate-400">Clinical Impact:</span> {inter.clinicalImpact}</p>
                        <div className="p-2 rounded border border-white/5 text-[10px] text-slate-400 leading-normal mt-1.5" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                          <span className="font-bold text-slate-300 block mb-0.5">Recommended Action:</span>
                          {inter.recommendedAction}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-white/5 p-4 rounded-full flex items-center gap-3 text-xs text-slate-400" style={{ backgroundColor: '#0a1210' }}>
                  <CheckCircle className="w-4.5 h-4.5 text-teal-400 shrink-0" />
                  <span>No severe drug interactions detected.</span>
                </div>
              )}
            </div>

            {/* Safer Alternatives Recomendations */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">SAFER ALTERNATIVES ENGINE</span>
              {analysisResults && Object.keys(analysisResults.alternatives).length > 0 ? (
                <div className="flex flex-col gap-3">
                  {Object.entries(analysisResults.alternatives).map(([drugName, alts]) => (
                    <div key={drugName} className="border border-white/10 p-4 rounded-xl flex flex-col gap-2.5 border-l-2 border-purple-500" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                      <span className="text-xs font-bold text-slate-200">Alternatives for: <span className="text-red-400 font-extrabold">{drugName}</span></span>
                      
                      <div className="flex flex-col gap-2">
                        {alts.map((alt, altIdx) => (
                          <div key={altIdx} className="border border-white/5 p-2 rounded-lg flex items-center justify-between gap-4 text-xs" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
                            <div className="flex flex-col leading-tight">
                              <span className="font-bold text-slate-200">{alt.name}</span>
                              <span className="text-[9px] text-slate-500 italic mt-0.5">Generic: {alt.genericName} &bull; {alt.class}</span>
                            </div>

                            <div className="flex items-center gap-2 text-[10px] font-bold">
                              <div className="flex flex-col items-center">
                                <span className="text-[8px] text-slate-500 uppercase">Safety</span>
                                <span className="text-teal-400">{alt.safetyRating} ★</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <span className="text-[8px] text-slate-500 uppercase">Risk</span>
                                <span className="text-slate-350 font-normal uppercase">{alt.interactionRisk}</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <span className="text-[8px] text-slate-500 uppercase">Price</span>
                                <span className="text-slate-300">{alt.priceEstimate}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-white/5 p-4 rounded-full flex items-center gap-3 text-xs text-slate-400" style={{ backgroundColor: '#0a1210' }}>
                  <CheckCircle className="w-4.5 h-4.5 text-teal-400 shrink-0" />
                  <span>Prescription is safe. No drug alternatives required.</span>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default PrescriptionBuilder;
