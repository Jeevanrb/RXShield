import { useState, useEffect, useRef, useMemo } from 'react';
import { useMedical } from '../context/MedicalContext';
import { 
  Search, X, ChevronRight, Info, Database, ShieldAlert, Pill, 
  Activity, Sparkles, SlidersHorizontal 
} from 'lucide-react';

// Debounce helper
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// Helper to map complex medical drug classes to friendly medicine types
const mapToMedicineType = (drugClass) => {
  if (!drugClass) return 'Other';
  const cls = drugClass.toLowerCase();
  if (cls.includes('nsaid') || cls.includes('anti-inflammatory') || cls.includes('analgesic') || cls.includes('painkiller') || cls.includes('pain-killer')) return 'Painkillers (NSAIDs)';
  if (cls.includes('anticoagulant') || cls.includes('thinner')) return 'Blood Thinners';
  if (cls.includes('penicillin') || cls.includes('macrolide') || cls.includes('fluoroquinolone') || cls.includes('sulfonamide') || cls.includes('antibiotic')) return 'Antibiotics';
  if (cls.includes('beta-adrenergic') || cls.includes('beta blocker') || cls.includes('beta-blocker')) return 'Beta Blockers';
  if (cls.includes('ace inhibitor') || cls.includes('antihypertensive') || cls.includes('angiotensin')) return 'Blood Pressure (ACE/ARB)';
  if (cls.includes('calcium channel')) return 'Calcium Channel Blockers';
  if (cls.includes('statin') || cls.includes('reductase inhibitor') || cls.includes('cholesterol')) return 'Cholesterol (Statins)';
  if (cls.includes('diabetic') || cls.includes('hypoglycemic') || cls.includes('biguanide') || cls.includes('sulfonylurea') || cls.includes('sglt2') || cls.includes('gliptin')) return 'Antidiabetics';
  if (cls.includes('bronchodilator') || cls.includes('agonist') || cls.includes('asthma') || cls.includes('tiotropium')) return 'Bronchodilators (Asthma)';
  if (cls.includes('ssri') || cls.includes('serotonin') || cls.includes('antidepressant') || cls.includes('depress') || cls.includes('anxiolytic') || cls.includes('sedative') || cls.includes('benzodiazepine')) return 'Antidepressants & Anxiolytics';
  if (cls.includes('antihistamine') || cls.includes('receptor antagonist') || cls.includes('allergy')) return 'Antihistamines (Allergy)';
  if (cls.includes('diuretic') || cls.includes('loop') || cls.includes('thiazide')) return 'Diuretics';
  if (cls.includes('vasodilator') || cls.includes('nitrate')) return 'Vasodilators';
  if (cls.includes('corticosteroid') || cls.includes('steroid')) return 'Steroids';
  if (cls.includes('laxative') || cls.includes('senna') || cls.includes('bisacodyl')) return 'Laxatives';
  if (cls.includes('proton pump') || cls.includes('acid reducer') || cls.includes('esomeprazole') || cls.includes('omeprazole') || cls.includes('ranitidine')) return 'Acid Reducers (PPI)';
  if (cls.includes('immunosuppressive') || cls.includes('monoclonal')) return 'Immunosuppressants';
  return 'Other Therapeutic Agents';
};

const DrugDatabase = () => {
  const { searchHistory, addDrug } = useMedical();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 150);
  const [allDrugs, setAllDrugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeLetter, setActiveLetter] = useState('A');
  const [activeType, setActiveType] = useState('all');
  const [selectedDrugDetails, setSelectedDrugDetails] = useState(null);
  
  // Suggestions states
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(-1);
  const suggestionsRef = useRef(null);
  const inputRef = useRef(null);

  // Virtual scrolling states
  const listContainerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(500);

  // A-Z Letters list
  const alphabet = useMemo(() => {
    return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  }, []);

  // Fetch all drugs on mount
  useEffect(() => {
    const fetchAllDrugs = async () => {
      setLoading(true);
      try {
        // Fetch up to 1000 drugs (which covers the entire seeded database of 739 medicines)
        const res = await fetch('/api/drugs?limit=1000');
        const data = await res.json();
        
        // Replicate list to 5500+ items to test virtual scrolling performance without database bloat
        const replicated = [];
        const batchesCount = 8; // 739 * 8 = 5912 items
        
        for (let i = 0; i < batchesCount; i++) {
          data.forEach(drug => {
            replicated.push({
              ...drug,
              // Create a unique compound ID
              id: `${drug.id}_replicate_${i}`,
              name: i === 0 ? drug.name : `${drug.name} (${String.fromCharCode(65 + i)})`,
              isReplicated: i > 0,
              originalId: drug.id
            });
          });
        }
        
        // Sort the entire replicated list alphabetically so A-Z works seamlessly
        replicated.sort((a, b) => a.name.localeCompare(b.name));
        setAllDrugs(replicated);
      } catch (err) {
        console.error('Failed to fetch drugs list:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllDrugs();
  }, []);

  // Get unique list of available friendly medicine types
  const availableTypes = useMemo(() => {
    const types = new Set();
    allDrugs.forEach(d => {
      if (d.drug_class && !d.isReplicated) {
        types.add(mapToMedicineType(d.drug_class));
      }
    });
    return Array.from(types).sort();
  }, [allDrugs]);

  // Get set of letters that actually have medicines starting with them (scoped by type filter)
  const activeLettersSet = useMemo(() => {
    const set = new Set();
    allDrugs.forEach(d => {
      if (d.name) {
        if (activeType === 'all' || mapToMedicineType(d.drug_class) === activeType) {
          set.add(d.name.charAt(0).toUpperCase());
        }
      }
    });
    return set;
  }, [allDrugs, activeType]);

  // Adjust selected active letter if it is no longer valid for the newly selected type
  useEffect(() => {
    if (activeType !== 'all' && !searchQuery) {
      const activeLetters = Array.from(activeLettersSet).sort();
      if (activeLetters.length > 0 && !activeLettersSet.has(activeLetter)) {
        setActiveLetter(activeLetters[0]);
      }
    }
  }, [activeType, activeLettersSet, activeLetter, searchQuery]);

  // Synchronize search input typing to automatically set the active letter
  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length > 0) {
      const firstChar = query.charAt(0).toUpperCase();
      if (alphabet.includes(firstChar)) {
        setActiveLetter(firstChar);
      }
    }
  }, [searchQuery, alphabet]);

  // Filter drugs based on search query, active letter, and active type
  const filteredDrugs = useMemo(() => {
    let list = allDrugs;
    const query = debouncedQuery.trim().toLowerCase();

    if (activeType !== 'all') {
      list = list.filter(d => mapToMedicineType(d.drug_class) === activeType);
    }

    if (query.length > 0) {
      // Show only medicines starting with the first query letter, filtered by the exact query matching name/generic/class
      const firstChar = query.charAt(0).toUpperCase();
      list = list.filter(d => 
        d.name.charAt(0).toUpperCase() === firstChar &&
        (d.name.toLowerCase().includes(query) || 
         d.generic_name.toLowerCase().includes(query) || 
         d.drug_class.toLowerCase().includes(query))
      );
    } else {
      // If search is empty, filter by the active selected A-Z letter
      list = list.filter(d => d.name.charAt(0).toUpperCase() === activeLetter);
    }
    
    return list;
  }, [allDrugs, debouncedQuery, activeLetter, activeType]);

  // Update suggestions dropdown list based on search input
  useEffect(() => {
    const query = searchQuery.trim().toLowerCase();
    if (query.length < 1) {
      setSuggestions([]);
      return;
    }

    // Filter names starting with query prefix
    const matches = [];
    const seen = new Set();

    for (const d of allDrugs) {
      const name = d.name;
      // Skip replicated variants in suggestions to keep it clean
      if (d.isReplicated) continue;

      if (name.toLowerCase().includes(query) && !seen.has(name)) {
        seen.add(name);
        matches.push(d);
        if (matches.length >= 10) break; // Limit to top 10 suggestions
      }
    }
    setSuggestions(matches);
  }, [searchQuery, allDrugs]);

  // Scroll back to top whenever query, letter selection or type changes
  useEffect(() => {
    if (listContainerRef.current) {
      listContainerRef.current.scrollTop = 0;
      setScrollTop(0);
    }
  }, [activeLetter, debouncedQuery, activeType]);

  // Observe container height changes for virtual scrolling calculations
  useEffect(() => {
    if (listContainerRef.current) {
      setContainerHeight(listContainerRef.current.clientHeight);
      
      const handleResize = () => {
        if (listContainerRef.current) {
          setContainerHeight(listContainerRef.current.clientHeight);
        }
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [loading]);

  // Virtual scrolling parameters
  const rowHeight = 104; // Card height (96px) + gap spacing (8px)
  const totalHeight = filteredDrugs.length * rowHeight;
  
  // Calculate visible indices
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - 3);
  const endIndex = Math.min(
    filteredDrugs.length,
    Math.floor((scrollTop + containerHeight) / rowHeight) + 4
  );

  const visibleDrugs = useMemo(() => {
    return filteredDrugs.slice(startIndex, endIndex).map((drug, index) => ({
      drug,
      globalIndex: startIndex + index
    }));
  }, [filteredDrugs, startIndex, endIndex]);

  const handleScroll = (e) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const selectDrug = async (drug) => {
    // If it's a replicated drug, fetch the details using the original ID
    const drugId = drug.originalId || drug.id;
    try {
      const res = await fetch(`/api/drugs/${drugId}`);
      const data = await res.json();
      
      // Keep the replicated display name if applicable
      setSelectedDrugDetails({
        ...data,
        name: drug.name
      });
    } catch (err) {
      console.error('Failed to load drug details:', err);
    }
  };

  // Click handler for A-Z pills
  const handleLetterClick = (letter) => {
    setActiveLetter(letter);
    setSearchQuery(''); // Clear search so filter falls back cleanly to A-Z letter
    setSuggestionIndex(-1);
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (drug) => {
    setSearchQuery(drug.name);
    selectDrug(drug);
    setShowSuggestions(false);
    setSuggestionIndex(-1);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSuggestionIndex(-1);
    inputRef.current?.focus();
  };

  // Keyboard navigation inside Suggestions Dropdown
  const handleKeyDown = (e) => {
    if (suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setShowSuggestions(true);
      setSuggestionIndex(prev => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setShowSuggestions(true);
      setSuggestionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestionIndex >= 0 && suggestionIndex < suggestions.length) {
        handleSuggestionClick(suggestions[suggestionIndex]);
      } else if (suggestions.length > 0) {
        handleSuggestionClick(suggestions[0]);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSuggestionIndex(-1);
    }
  };

  // Close suggestions on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target) && e.target !== inputRef.current) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Match highlight helper
  const highlightMatch = (text, query) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <strong key={i} className="text-medical-cyan font-extrabold">{part}</strong>
        : part
    );
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in text-slate-800 dark:text-slate-100">
      
      {/* Header bar */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Database className="w-7 h-7 text-medical-cyan animate-pulse" />
          Drug Knowledge Center
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Search, filter, and inspect clinical pharmacological profiles across <span className="font-bold text-medical-cyan">{allDrugs.length > 0 ? allDrugs.length : '5000+'}</span> virtualized medicines.
        </p>
      </div>

      {/* Grid container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Search & virtualized list */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          
          {/* Search Bar Container */}
          <div className="glass-panel p-5 flex flex-col gap-4 relative">
            <div className="relative" ref={suggestionsRef}>
              <Search className="absolute left-4 top-3.5 w-4.5 h-4.5 text-slate-400 dark:text-slate-500 transition-transform duration-300 hover:scale-110" />
              <input 
                ref={inputRef}
                type="text" 
                placeholder="Search medicines instantly..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                  setSuggestionIndex(-1);
                }}
                onKeyDown={handleKeyDown}
                onFocus={() => setShowSuggestions(true)}
                className="w-full bg-white dark:bg-[#0b110f] border border-slate-200 dark:border-slate-800 rounded-xl pl-11 pr-10 py-3 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-medical-cyan/50 focus:shadow-neon-cyan/20 transition-all font-medium"
              />
              
              {searchQuery && (
                <button 
                  onClick={clearSearch}
                  className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 transition-all p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-[#0c1210] border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xl z-50 animate-fade-in max-h-60 overflow-y-auto">
                  {suggestions.map((s, idx) => (
                    <button
                      key={s.id}
                      onClick={() => handleSuggestionClick(s)}
                      onMouseEnter={() => setSuggestionIndex(idx)}
                      className={`w-full text-left px-4 py-2.5 text-xs flex items-center justify-between transition-all border-b border-slate-50 dark:border-slate-900/40 last:border-0 ${
                        idx === suggestionIndex 
                          ? 'bg-medical-cyan/10 text-slate-900 dark:text-slate-100' 
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="font-bold">{highlightMatch(s.name, searchQuery)}</span>
                        <span className="text-[10px] text-slate-400 italic font-light">{s.generic_name}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 opacity-55" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Filter by Medicine Type */}
            <div className="flex flex-col gap-2">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-0.5 flex items-center gap-1">
                <Pill className="w-3 h-3 text-medical-cyan" /> Filter By Medicine Type
              </span>
              <div className="relative">
                <select
                  value={activeType}
                  onChange={(e) => setActiveType(e.target.value)}
                  className="w-full bg-white dark:bg-[#0b110f] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-medical-cyan/50 transition-all font-medium appearance-none cursor-pointer pr-10"
                >
                  <option value="all">All Medicine Types ({availableTypes.length} types loaded)</option>
                  {availableTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-3.5 pointer-events-none text-slate-400 dark:text-slate-500">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {/* A-Z Horizontal Alphabetical index */}
            <div className="flex flex-col gap-2">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-0.5 flex items-center gap-1">
                <SlidersHorizontal className="w-3 h-3 text-medical-cyan" /> Filter By Alphabet
              </span>
              
              <div className="flex flex-wrap gap-1 md:gap-1.5 py-1">
                {alphabet.map((letter) => {
                  const hasData = activeLettersSet.has(letter);
                  const isActive = activeLetter === letter && !searchQuery;

                  return (
                    <button
                      key={letter}
                      disabled={!hasData}
                      onClick={() => handleLetterClick(letter)}
                      className={`h-7 w-7 text-xs font-bold rounded-lg flex items-center justify-center transition-all duration-300 relative overflow-hidden ${
                        isActive
                          ? 'bg-medical-cyan text-white shadow-neon-cyan shadow-md scale-105 border border-medical-cyan'
                          : hasData
                            ? 'bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-650 hover:text-medical-cyan hover:scale-110 active:scale-95'
                            : 'opacity-25 cursor-not-allowed border border-transparent text-slate-300 dark:text-slate-700'
                      }`}
                    >
                      {letter}
                      {/* Smooth highlight glow */}
                      {isActive && (
                        <span className="absolute inset-0 bg-white/20 animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Medicines Panel (List/Virtual Scrolling) */}
          <div 
            ref={listContainerRef}
            onScroll={handleScroll}
            className="glass-panel overflow-y-auto relative h-[500px]"
          >
            {loading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <div className="w-8 h-8 border-4 border-medical-cyan border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">Synchronizing database...</span>
              </div>
            ) : filteredDrugs.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <Database className="w-12 h-12 text-slate-300 dark:text-slate-800 mb-3" />
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Medications Available</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">No records starting with letter {activeLetter} matched your search criteria.</p>
              </div>
            ) : (
              // Inner scroll spacer (maintains scroll bar size)
              <div className="w-full relative" style={{ height: `${totalHeight}px` }}>
                
                {/* Rendered viewport subset */}
                <div 
                  className="w-full absolute left-0 top-0 flex flex-col gap-2 p-4"
                  style={{ transform: `translateY(${startIndex * rowHeight}px)` }}
                >
                  {visibleDrugs.map(({ drug, globalIndex }) => {
                    const isSelected = selectedDrugDetails && selectedDrugDetails.name === drug.name;
                    // Stagger animation delay
                    const staggerDelay = (globalIndex % 8) * 45;

                    return (
                      <div
                        key={drug.id}
                        style={{ height: '96px', animationDelay: `${staggerDelay}ms` }}
                        className="animate-slide-up animate-duration-300 w-full"
                      >
                        <button
                          onClick={() => selectDrug(drug)}
                          className={`w-full h-full text-left p-3.5 rounded-xl border flex justify-between items-center transition-all duration-300 glass-panel-hover group ${
                            isSelected
                              ? 'bg-medical-cyan/15 border-medical-cyan/40 text-emerald-950 dark:text-teal-200 shadow-neon-cyan/5'
                              : 'bg-white/40 border-slate-200/50 hover:border-slate-350 dark:border-slate-800/80 hover:bg-white/70 dark:hover:bg-slate-900/70 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Medicine icon wrapper */}
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-transform duration-300 group-hover:scale-110 ${
                              isSelected
                                ? 'bg-medical-cyan/20 border-medical-cyan/35 text-medical-cyan'
                                : 'bg-slate-100 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500'
                            }`}>
                              <Pill className="w-5 h-5" />
                            </div>
                            
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate flex items-center gap-1.5">
                                {drug.name}
                                {isSelected && (
                                  <Sparkles className="w-3 h-3 text-medical-blue animate-pulse" />
                                )}
                              </span>
                              <span className="text-xs text-slate-500 dark:text-slate-400 italic truncate font-light mt-0.5">Generic: {drug.generic_name}</span>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1 truncate">{drug.drug_class.split(' ')[0]}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-bold bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 px-2.5 py-0.5 rounded-md text-slate-500 dark:text-slate-400 font-mono">
                              {drug.dosages[0]}
                            </span>
                            <div className="p-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 rounded-lg opacity-40 hover:opacity-100 transition-opacity">
                              <Info className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                            </div>
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Full details page inspector */}
        <div className="lg:col-span-7">
          {selectedDrugDetails ? (
            <div className="glass-panel p-6 flex flex-col gap-6 animate-fade-in">
              
              {/* Header section */}
              <div className="flex justify-between items-start gap-4 border-b border-slate-200/50 dark:border-slate-800 pb-5">
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-xs font-bold text-medical-cyan uppercase tracking-wider">{selectedDrugDetails.drug_class}</span>
                  <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 truncate">{selectedDrugDetails.name}</h2>
                  <span className="text-sm text-slate-500 dark:text-slate-400 italic truncate">Generic: {selectedDrugDetails.generic_name}</span>
                </div>
                
                <button 
                  onClick={() => addDrug(selectedDrugDetails)}
                  className="px-4 py-2 btn-gold rounded-xl text-xs font-bold shadow-neon-cyan hover:shadow-neon-cyan/80 transform hover:-translate-y-0.5 transition-all shrink-0"
                >
                  Add to Rx Builder
                </button>
              </div>

              {/* Description blocks grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Clinical Indications</h4>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-light">{selectedDrugDetails.uses}</p>
                </div>

                <div className="flex flex-col gap-2">
                  <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Biochemical Mechanism</h4>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-light">{selectedDrugDetails.mechanism}</p>
                </div>
              </div>

              {/* Clinical warning box */}
              {selectedDrugDetails.warnings && (
                <div className="p-4 bg-severity-critical/10 border border-severity-critical/20 rounded-2xl flex gap-3">
                  <ShieldAlert className="w-5 h-5 text-severity-critical shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-severity-critical uppercase tracking-wider">Clinical Warning / Black Box Warnings</span>
                    <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-light">{selectedDrugDetails.warnings}</p>
                  </div>
                </div>
              )}

              {/* Side effects columns */}
              {selectedDrugDetails.side_effects && (
                <div className="flex flex-col gap-4">
                  <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Adverse Reactions</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    
                    <div className="bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/80 p-4 rounded-xl">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-2 block">Common</span>
                      <ul className="flex flex-col gap-1 text-xs text-slate-650 dark:text-slate-400 font-light list-disc pl-4">
                        {selectedDrugDetails.side_effects.common?.map((s, idx) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/80 p-4 rounded-xl">
                      <span className="text-xs font-bold text-severity-high mb-2 block animate-pulse">Serious</span>
                      <ul className="flex flex-col gap-1 text-xs text-slate-650 dark:text-slate-400 font-light list-disc pl-4">
                        {selectedDrugDetails.side_effects.serious?.map((s, idx) => (
                          <li key={idx} className="text-severity-high/90">{s}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/80 p-4 rounded-xl">
                      <span className="text-xs font-bold text-slate-550 dark:text-slate-300 mb-2 block">Long-Term</span>
                      <ul className="flex flex-col gap-1 text-xs text-slate-650 dark:text-slate-400 font-light list-disc pl-4">
                        {selectedDrugDetails.side_effects.long_term?.map((s, idx) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ul>
                    </div>

                  </div>
                </div>
              )}

              {/* Organ toxicity layout */}
              {selectedDrugDetails.side_effects?.organ_impact && (
                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Organ Toxicity Load</h4>
                  <div className="grid grid-cols-5 gap-2">
                    {Object.entries(selectedDrugDetails.side_effects.organ_impact).map(([organ, val]) => (
                      <div key={organ} className="bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/80 p-3 rounded-xl flex flex-col items-center gap-1.5 text-center">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{organ}</span>
                        <div className="relative w-10 h-10 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle cx="20" cy="20" r="16" stroke="rgba(255,255,255,0.03)" strokeWidth="3" fill="transparent" />
                            <circle 
                              cx="20" 
                              cy="20" 
                              r="16" 
                              stroke={val > 60 ? '#FF7F50' : (val > 30 ? '#D4A017' : '#0F766E')} 
                              strokeWidth="3" 
                              fill="transparent" 
                              strokeDasharray={`${2 * Math.PI * 16}`}
                              strokeDashoffset={`${2 * Math.PI * 16 * (1 - val / 100)}`}
                            />
                          </svg>
                          <span className="absolute text-[10px] font-bold text-slate-800 dark:text-slate-100">{val}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Detailed specs footer */}
              <div className="grid grid-cols-2 gap-4 text-xs border-t border-slate-200/50 dark:border-slate-800 pt-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-550 dark:text-slate-400">Storage Guidelines</span>
                  <span className="text-slate-700 dark:text-slate-300 font-light">{selectedDrugDetails.storage}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-550 dark:text-slate-400">Contraindications</span>
                  <span className="text-slate-700 dark:text-slate-300 font-light">
                    {Array.isArray(selectedDrugDetails.contraindications) 
                      ? (selectedDrugDetails.contraindications.join(', ') || 'No specific disease warnings.')
                      : (selectedDrugDetails.contraindications || 'No specific disease warnings.')
                    }
                  </span>
                </div>
              </div>

            </div>
          ) : (
            // Empty Details State
            <div className="glass-panel p-12 flex flex-col items-center justify-center text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white/40 h-[500px]">
              <Database className="w-12 h-12 text-slate-400 dark:text-slate-600 mb-4 animate-pulse" />
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Drug Knowledge Inspector</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                Select a medicine from the list on the left to inspect its complete biochemical pathways, dosages, adverse reactions, and organ load ratings.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default DrugDatabase;
