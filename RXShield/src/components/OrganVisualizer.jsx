import { useEffect, useState } from 'react';
import { useMedical } from '../context/MedicalContext';
import { Info, HeartPulse, Eye, EyeOff, Brain, Heart } from 'lucide-react';

// Custom high-fidelity organ icons for the summary list
const LungIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 18c0-3 2-8 6-8s6 5 6 8M12 10v10" />
    <path d="M9 12c-1.5 0-3 1.5-3 3s1.5 3 3 3M15 12c1.5 0 3 1.5 3 3s-1.5 3-3 3" />
  </svg>
);

const LiverIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 13c3-3 11-4 18-1c.5.2.5 1 0 1.2L12 18c-3 1.5-7 .5-9-5z" />
  </svg>
);

const StomachIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 7c3-2 10-1 12 4s-1 9-6 9-8-4-6-13z" />
  </svg>
);

const KidneysIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 8c-2 2-2 6 0 8s4 2 4-2-2-4-4-4zM16 8c2 2 2 6 0 8s-4 2-4-2 2-4 4-4z" />
  </svg>
);

const IntestinesIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 9c2-1 4 0 5 1s1 2 3 1 4-2 6-1M5 13c2-1 4 0 5 1s1 2 3 1 4-2 6-1M5 17c2-1 4 0 5 1s1 2 3 1 4-2 6-1" />
  </svg>
);

const BladderIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5c-3 4-5 7-5 10a5 5 0 0 0 10 0c0-3-2-6-5-10z" />
  </svg>
);

// Metadata for organs, alignment grid (600 x 560 parent viewBox space)
// Body outline is translated by 150, 45 (child center is at x=150, parent center is at x=300)
const ORGAN_METADATA = {
  brain: {
    name: 'Brain',
    loadKey: 'brain',
    side: 'left',
    y: 80,
    target: { x: 300, y: 87 },
    anchor: { x: 150, y: 42 },
    boundingBox: { x: 130, y: 20, w: 40, h: 36 },
    tooltipSide: 'right',
    tooltipY: 'top-[30px]'
  },
  right_lung: {
    name: 'Right Lung',
    loadKey: 'lungs',
    side: 'left',
    y: 165,
    target: { x: 283, y: 149 },
    anchor: { x: 133, y: 104 },
    boundingBox: { x: 122, y: 80, w: 22, h: 48 },
    tooltipSide: 'right',
    tooltipY: 'top-[90px]'
  },
  left_lung: {
    name: 'Left Lung',
    loadKey: 'lungs',
    side: 'right',
    y: 165,
    target: { x: 317, y: 149 },
    anchor: { x: 167, y: 104 },
    boundingBox: { x: 156, y: 80, w: 22, h: 48 },
    tooltipSide: 'left',
    tooltipY: 'top-[90px]'
  },
  heart: {
    name: 'Heart',
    loadKey: 'heart',
    side: 'right',
    y: 235,
    target: { x: 304, y: 156 },
    anchor: { x: 154, y: 111 },
    boundingBox: { x: 144, y: 96, w: 28, h: 32 },
    tooltipSide: 'left',
    tooltipY: 'top-[100px]'
  },
  liver: {
    name: 'Liver',
    loadKey: 'liver',
    side: 'left',
    y: 235,
    target: { x: 275, y: 181 },
    anchor: { x: 125, y: 136 },
    boundingBox: { x: 108, y: 115, w: 34, h: 42 },
    tooltipSide: 'right',
    tooltipY: 'top-[115px]'
  },
  stomach: {
    name: 'Stomach',
    loadKey: 'stomach',
    side: 'right',
    y: 305,
    target: { x: 323, y: 188 },
    anchor: { x: 173, y: 143 },
    boundingBox: { x: 159, y: 122, w: 28, h: 40 },
    tooltipSide: 'left',
    tooltipY: 'top-[127px]'
  },
  right_kidney: {
    name: 'Right Kidney',
    loadKey: 'kidneys',
    side: 'left',
    y: 325,
    target: { x: 267, y: 220 },
    anchor: { x: 117, y: 175 },
    boundingBox: { x: 113, y: 165, w: 9, h: 25 },
    tooltipSide: 'right',
    tooltipY: 'top-[155px]'
  },
  left_kidney: {
    name: 'Left Kidney',
    loadKey: 'kidneys',
    side: 'right',
    y: 365,
    target: { x: 334, y: 220 },
    anchor: { x: 184, y: 175 },
    boundingBox: { x: 179, y: 165, w: 9, h: 25 },
    tooltipSide: 'left',
    tooltipY: 'top-[155px]'
  },
  intestines: {
    name: 'Intestines',
    loadKey: 'intestines',
    side: 'left',
    y: 415,
    target: { x: 300, y: 218 },
    anchor: { x: 150, y: 173 },
    boundingBox: { x: 122, y: 150, w: 56, h: 45 },
    tooltipSide: 'right',
    tooltipY: 'top-[175px]'
  },
  bladder: {
    name: 'Bladder',
    loadKey: 'bladder',
    side: 'right',
    y: 445,
    target: { x: 300, y: 264 },
    anchor: { x: 150, y: 219 },
    boundingBox: { x: 142, y: 211, w: 16, h: 18 },
    tooltipSide: 'left',
    tooltipY: 'top-[234px]'
  }
};

const OrganVisualizer = () => {
  const { prescription, saveReport, analysisResults, analyzePrescription } = useMedical();
  const [showAltsModal, setShowAltsModal] = useState(false);

  const handleRecommendationClick = async () => {
    if (prescription.length === 0) {
      setShowAltsModal(true);
      return;
    }

    if (!analysisResults) {
      try {
        await analyzePrescription();
      } catch (err) {
        console.error("Auto safety check failed:", err);
      }
    } else {
      saveReport();
    }
    setShowAltsModal(true);
  };

  const getDrugHasWarning = (drugName) => {
    if (!analysisResults) return false;
    const lowerName = drugName.toLowerCase();
    const hasAllergy = analysisResults.allergies?.some(a => a.drug.toLowerCase() === lowerName);
    const hasContraindication = analysisResults.contraindications?.some(c => c.drug.toLowerCase() === lowerName);
    const hasInteraction = analysisResults.interactions?.some(i => 
      i.drugA.toLowerCase() === lowerName || i.drugB.toLowerCase() === lowerName
    );
    return hasAllergy || hasContraindication || hasInteraction;
  };

  const [selectedOrganKey, setSelectedOrganKey] = useState(null);
  const [hoveredOrgan, setHoveredOrgan] = useState(null);
  const [isDebugMode, setIsDebugMode] = useState(false);

  const [activeLoads, setActiveLoads] = useState({
    brain: 0,
    heart: 0,
    liver: 0,
    kidneys: 0,
    lungs: 0,
    stomach: 0,
    intestines: 0,
    bladder: 0
  });
  const [activeExplanations, setActiveExplanations] = useState({});

  // 1. Calculate combined organ loads from active prescription
  useEffect(() => {
    const calculateLoads = async () => {
      if (prescription.length === 0) {
        setActiveLoads({ brain: 0, heart: 0, liver: 0, kidneys: 0, lungs: 0, stomach: 0, intestines: 0, bladder: 0 });
        setActiveExplanations({});
        return;
      }

      const newLoads = { brain: 0, heart: 0, liver: 0, kidneys: 0, lungs: 0, stomach: 0, intestines: 0, bladder: 0 };
      const explanations = { brain: [], heart: [], liver: [], kidneys: [], lungs: [], stomach: [], intestines: [], bladder: [] };

      for (const drug of prescription) {
        try {
          const res = await fetch(`/api/drugs`);
          const drugs = await res.json();
          const dbDrug = drugs.find(d => d.name.toLowerCase() === drug.name.toLowerCase());
          
          if (dbDrug && dbDrug.side_effects && dbDrug.side_effects.organ_impact) {
            const impact = dbDrug.side_effects.organ_impact;
            Object.keys(newLoads).forEach(organ => {
              let val = 0;
              if (organ === 'intestines') {
                val = Math.round((impact['stomach'] || 0) * 0.8);
              } else if (organ === 'bladder') {
                val = Math.round((impact['kidneys'] || 0) * 0.5);
              } else {
                val = impact[organ] || 0;
              }

              if (val > newLoads[organ]) {
                newLoads[organ] = val;
              }
              if (val > 15) {
                let organDesc = organ;
                if (organ === 'intestines') organDesc = 'intestines (due to GI irritation)';
                if (organ === 'bladder') organDesc = 'bladder (due to renal filtration workload)';
                explanations[organ].push(`${drug.name}: ${val}% load - ${dbDrug.warnings.split('.')[0]}.`);
              }
            });
          }
        } catch (err) {
          console.error('Failed to resolve organ load:', err);
        }
      }

      setActiveLoads(newLoads);
      
      const finalExplanations = {};
      Object.keys(explanations).forEach(organ => {
        if (explanations[organ].length > 0) {
          finalExplanations[organ] = explanations[organ].join(' ');
        } else {
          finalExplanations[organ] = `Normal baseline physiological load. No high drug burden noted.`;
        }
      });
      setActiveExplanations(finalExplanations);
    };

    calculateLoads();
  }, [prescription]);

  const getSeverityLevel = (score) => {
    if (score === 0) return { 
      label: 'None', 
      colorClass: 'text-slate-500', 
      colorHex: '#64748b', 
      bg: 'bg-slate-500/10 border-slate-500/20', 
      fill: 'rgba(99, 102, 241, 0.03)', 
      stroke: 'rgba(99, 102, 241, 0.15)', 
      bullet: '○' 
    };
    if (score <= 30) return { 
      label: 'Low', 
      colorClass: 'text-emerald-500', 
      colorHex: '#10b981', 
      bg: 'bg-emerald-500/10 border-emerald-500/20', 
      fill: 'rgba(16, 185, 129, 0.15)', 
      stroke: '#10b981', 
      bullet: '●' 
    };
    if (score <= 60) return { 
      label: 'Moderate', 
      colorClass: 'text-amber-500', 
      colorHex: '#f59e0b', 
      bg: 'bg-amber-500/10 border-amber-500/20', 
      fill: 'rgba(245, 158, 11, 0.2)', 
      stroke: '#f59e0b', 
      bullet: '●' 
    };
    return { 
      label: 'High', 
      colorClass: 'text-rose-500', 
      colorHex: '#ef4444', 
      bg: 'bg-rose-500/10 border-rose-500/20', 
      fill: 'rgba(239, 68, 68, 0.25)', 
      stroke: '#ef4444', 
      bullet: '●' 
    };
  };

  const handleMouseEnterOrgan = (key) => {
    const meta = ORGAN_METADATA[key];
    const loadKey = meta ? meta.loadKey : key;
    setHoveredOrgan(key);
  };

  const handleMouseLeaveOrgan = () => {
    setHoveredOrgan(null);
  };

  const getOrganStyles = (organKey) => {
    const meta = ORGAN_METADATA[organKey];
    const loadKey = meta ? meta.loadKey : organKey;
    const isHovered = hoveredOrgan === organKey || hoveredOrgan === loadKey;
    const score = activeLoads[loadKey] || 0;
    const severity = getSeverityLevel(score);
    
    if (isHovered) {
      return {
        fill: severity.fill,
        stroke: severity.stroke,
        strokeWidth: 2,
        filter: `drop-shadow(0 0 6px ${score > 0 ? severity.colorHex : 'rgba(99, 102, 241, 0.5)'})`
      };
    }

    if (score > 15) {
      return {
        fill: severity.fill,
        stroke: severity.stroke,
        strokeWidth: 1.5,
        filter: `drop-shadow(0 0 3px ${severity.colorHex})`
      };
    }

    return {
      fill: 'rgba(99, 102, 241, 0.04)',
      stroke: 'rgba(99, 102, 241, 0.2)',
      strokeWidth: 1
    };
  };

  // Overall statistics calculation
  const totalScore = Object.values(activeLoads).reduce((a, b) => a + b, 0);
  // Max load of any organ represents the safety score deduction
  const maxLoad = Math.max(...Object.values(activeLoads));
  const safetyScore = Math.max(0, 100 - maxLoad);
  
  const affectedOrgansCount = Object.values(activeLoads).filter(val => val > 15).length;
  
  const overallRiskSeverity = getSeverityLevel(100 - safetyScore);

  const summaryOrgans = [
    { key: 'brain', name: 'Brain', icon: <Brain className="w-4 h-4" /> },
    { key: 'lungs', name: 'Lungs', icon: <LungIcon /> },
    { key: 'heart', name: 'Heart', icon: <Heart className="w-4 h-4" /> },
    { key: 'liver', name: 'Liver', icon: <LiverIcon /> },
    { key: 'stomach', name: 'Stomach', icon: <StomachIcon /> },
    { key: 'kidneys', name: 'Kidneys', icon: <KidneysIcon /> },
    { key: 'intestines', name: 'Intestines', icon: <IntestinesIcon /> },
    { key: 'bladder', name: 'Bladder', icon: <BladderIcon /> }
  ];

  return (
    <div className="w-full flex flex-col gap-6 text-white bg-[#0b0f19] border border-[#1e293b] p-6 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
      
      {/* Header bar matches image style */}
      <div className="flex justify-between items-center border-b border-[#1e293b] pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-[#6366f1]/10 p-2.5 rounded-xl border border-[#6366f1]/20 text-[#6366f1]">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M12 8v8M9 12h6" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Organ Impact Visualization</h2>
            <p className="text-[10px] text-slate-400">Medically Accurate 2D/3D Hybrid Mapping</p>
          </div>
        </div>
      </div>

      {/* Main Grid: split body and summary list */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Side: Body Silhouette SVG */}
        <div className="lg:col-span-8 flex flex-col items-center justify-center relative bg-[#070b13]/80 rounded-2xl border border-[#1e293b]/60 overflow-hidden p-2">
          
          {/* Grid Scanner Effect */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.015)_1px,transparent_1px)] bg-[size:18px_18px] pointer-events-none" />
          <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-[#6366f1]/30 to-transparent animate-scanner-sweep pointer-events-none" />

          {/* Unified SVG Layout */}
          <svg 
            className="w-full h-auto max-w-[680px] z-10 select-none"
            viewBox="0 0 600 500"
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* 1. Connection lines with circles at endpoints */}
            {Object.entries(ORGAN_METADATA).map(([key, data]) => {
              const score = activeLoads[data.loadKey] || 0;
              const isHovered = hoveredOrgan === key || hoveredOrgan === data.loadKey;
              const severity = getSeverityLevel(score);
              const isRight = data.side === 'right';

              // Pointer line coordinates
              const startX = isRight ? 420 : 180;
              const midX = isRight ? 380 : 220;
              const linePath = `M ${startX},${data.y} L ${midX},${data.y} L ${data.target.x},${data.target.y}`;

              return (
                <g key={`line-${key}`} opacity={score > 0 || isHovered ? 1 : 0.2} className="transition-opacity duration-300">
                  {/* Glowing backdrop line for active state */}
                  {(score > 0 || isHovered) && (
                    <path 
                      d={linePath} 
                      stroke={severity.colorHex} 
                      strokeWidth="3.5" 
                      fill="none" 
                      opacity="0.15" 
                      className="blur-[2px]"
                    />
                  )}
                  {/* Base pointer line */}
                  <path 
                    d={linePath} 
                    stroke={score > 0 || isHovered ? severity.colorHex : 'rgba(255, 255, 255, 0.15)'} 
                    strokeWidth={isHovered ? '1.5' : '1'} 
                    fill="none" 
                    strokeDasharray={score > 0 || isHovered ? 'none' : '2 2'}
                    className="transition-all duration-300"
                  />
                  {/* Outer circle dot at label end */}
                  <circle 
                    cx={startX} 
                    cy={data.y} 
                    r={isHovered ? 4.5 : 3} 
                    fill="#0b0f19"
                    stroke={score > 0 || isHovered ? severity.colorHex : 'rgba(255, 255, 255, 0.3)'} 
                    strokeWidth="1.2"
                  />
                  {/* Inner center dot for active state */}
                  {(score > 0 || isHovered) && (
                    <circle cx={startX} cy={data.y} r="1.5" fill={severity.colorHex} />
                  )}
                  {/* Circle dot at organ target */}
                  <circle 
                    cx={data.target.x} 
                    cy={data.target.y} 
                    r={isHovered ? 3.5 : 2} 
                    fill={score > 0 || isHovered ? severity.colorHex : 'rgba(255, 255, 255, 0.3)'} 
                  />
                </g>
              );
            })}

            {/* 2. Embedded HTML Organ Labels */}
            {Object.entries(ORGAN_METADATA).map(([key, data]) => {
              const score = activeLoads[data.loadKey] || 0;
              const isHovered = hoveredOrgan === key || hoveredOrgan === data.loadKey;
              const severity = getSeverityLevel(score);
              const isRight = data.side === 'right';

              const foreignX = isRight ? 430 : 15;

              return (
                <foreignObject 
                  key={`label-${key}`}
                  x={foreignX} 
                  y={data.y - 25} 
                  width="155" 
                  height="55"
                  opacity={score > 0 || isHovered ? 1 : 0.45}
                  className="transition-opacity duration-300"
                >
                  <div 
                    onClick={() => setSelectedOrganKey(selectedOrganKey === data.loadKey ? null : data.loadKey)}
                    onMouseEnter={() => handleMouseEnterOrgan(key)}
                    onMouseLeave={handleMouseLeaveOrgan}
                    className={`flex flex-col gap-0.5 font-sans cursor-pointer p-1 rounded-lg transition-all ${
                      isRight ? 'text-left' : 'text-right'
                    } ${isHovered ? 'bg-white/5' : ''}`}
                  >
                    <div className={`flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-white ${isRight ? '' : 'justify-end'}`}>
                      {!isRight && <span style={{ color: severity.colorHex }} className="text-[10px]">{severity.bullet}</span>}
                      <span className={isHovered ? 'text-indigo-300' : ''}>{data.name}</span>
                      {isRight && <span style={{ color: severity.colorHex }} className="text-[10px]">{severity.bullet}</span>}
                    </div>
                    <div className="text-[8px] font-medium text-slate-400">
                      Risk: <span style={{ color: severity.colorHex }} className="font-semibold">{severity.label}</span>
                    </div>
                    <div className="text-[8px] font-medium text-slate-400">
                      Impact: <span className="text-white">{score}%</span>
                    </div>
                  </div>
                </foreignObject>
              );
            })}

            {/* 3. Scaled Body & Organ Graphic Group */}
            <g transform="translate(150, 45)" className="transition-all duration-300">
              
              {/* High-fidelity 3D Anatomical Human Body X-ray image */}
              <image 
                href="/human_anatomy_trans.png" 
                x="-60" 
                y="10" 
                width="420" 
                height="420" 
                style={{ 
                  filter: 'drop-shadow(0 0 10px rgba(34, 211, 238, 0.45))',
                  opacity: 0.88
                }}
                className="pointer-events-none"
              />

              {/* BRAIN */}
              <g 
                onClick={() => setSelectedOrganKey(selectedOrganKey === 'brain' ? null : 'brain')}
                onMouseEnter={() => handleMouseEnterOrgan('brain')}
                onMouseLeave={handleMouseLeaveOrgan}
                className="cursor-pointer"
              >
                <path 
                  d="M150 22 C138 22, 132 30, 132 42 C132 48, 138 54, 148 54 C149 54, 150 53, 150 52 C150 53, 151 54, 152 54 C162 54, 168 48, 168 42 C168 30, 162 22, 150 22 Z" 
                  style={getOrganStyles('brain')}
                  className="transition-all duration-300"
                />
                <path d="M150 22 V52 M140 28 C138 34, 145 36, 142 42 M160 28 C162 34, 155 36, 158 42" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="0.5" fill="none" />
              </g>
                          {/* RIGHT LUNG */}
              <g 
                onClick={() => setSelectedOrganKey(selectedOrganKey === 'lungs' ? null : 'lungs')}
                onMouseEnter={() => handleMouseEnterOrgan('right_lung')}
                onMouseLeave={handleMouseLeaveOrgan}
                className="cursor-pointer"
              >
                <path 
                  d="M142 80 C132 80, 122 90, 122 108 C122 122, 130 128, 140 128 C142 128, 144 122, 144 112 C144 100, 144 80, 142 80 Z" 
                  style={getOrganStyles('right_lung')}
                  className="transition-all duration-300"
                />
                <path d="M138 86 C134 94, 128 100, 126 114 M138 96 C132 102, 130 112, 134 120" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="0.5" fill="none" />
              </g>

              {/* LEFT LUNG */}
              <g 
                onClick={() => setSelectedOrganKey(selectedOrganKey === 'lungs' ? null : 'lungs')}
                onMouseEnter={() => handleMouseEnterOrgan('left_lung')}
                onMouseLeave={handleMouseLeaveOrgan}
                className="cursor-pointer"
              >
                <path 
                  d="M158 80 C168 80, 178 90, 178 108 C178 122, 170 128, 160 128 C158 128, 156 122, 156 112 C156 100, 156 80, 158 80 Z" 
                  style={getOrganStyles('left_lung')}
                  className="transition-all duration-300"
                />
                <path d="M162 86 C166 94, 172 100, 174 114 M162 96 C168 102, 170 112, 166 120" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="0.5" fill="none" />
              </g>

              {/* HEART */}
              <g 
                onClick={() => setSelectedOrganKey(selectedOrganKey === 'heart' ? null : 'heart')}
                onMouseEnter={() => handleMouseEnterOrgan('heart')}
                onMouseLeave={handleMouseLeaveOrgan}
                className="cursor-pointer"
              >
                <path 
                  d="M150 100 C145 100, 142 106, 147 113 L152 122 C152 122, 153 123, 154 123 C155 123, 156 122, 156 122 L161 113 C166 106, 163 100, 158 100 C155 100, 154 103, 154 104 C154 103, 150 100, 150 100 Z" 
                  style={getOrganStyles('heart')}
                  className="transition-all duration-300"
                />
                <path d="M150 100 V95 M154 100 V92 M158 100 V96" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1" fill="none" />
              </g>

              {/* LIVER */}
              <g 
                onClick={() => setSelectedOrganKey(selectedOrganKey === 'liver' ? null : 'liver')}
                onMouseEnter={() => handleMouseEnterOrgan('liver')}
                onMouseLeave={handleMouseLeaveOrgan}
                className="cursor-pointer"
              >
                <path 
                  d="M 108,125 C 108,115 126,115 142,119 C 142,119 142,130 140,147 C 134,160 119,160 110,147 C 106,139 108,125 108,125 Z" 
                  style={getOrganStyles('liver')}
                  className="transition-all duration-300"
                />
              </g>

              {/* STOMACH */}
              <g 
                onClick={() => setSelectedOrganKey(selectedOrganKey === 'stomach' ? null : 'stomach')}
                onMouseEnter={() => handleMouseEnterOrgan('stomach')}
                onMouseLeave={handleMouseLeaveOrgan}
                className="cursor-pointer"
              >
                <path 
                  d="M 162,126 C 168,122 182,124 185,132 C 187,140 178,160 168,160 C 161,160 159,150 162,126 Z" 
                  style={getOrganStyles('stomach')}
                  className="transition-all duration-300"
                />
              </g>

              {/* RIGHT KIDNEY */}
              <g 
                onClick={() => setSelectedOrganKey(selectedOrganKey === 'kidneys' ? null : 'kidneys')}
                onMouseEnter={() => handleMouseEnterOrgan('right_kidney')}
                onMouseLeave={handleMouseLeaveOrgan}
                className="cursor-pointer"
              >
                <path 
                  d="M118 193 C115 193, 113 199, 115 207 C117 213, 120 213, 121 207 C122 201, 120 193, 118 193 Z" 
                  style={getOrganStyles('right_kidney')}
                  className="transition-all duration-300"
                />
              </g>

              {/* LEFT KIDNEY */}
              <g 
                onClick={() => setSelectedOrganKey(selectedOrganKey === 'kidneys' ? null : 'kidneys')}
                onMouseEnter={() => handleMouseEnterOrgan('left_kidney')}
                onMouseLeave={handleMouseLeaveOrgan}
                className="cursor-pointer"
              >
                <path 
                  d="M183 193 C186 193, 188 199, 186 207 C184 213, 181 213, 180 207 C179 201, 180 193, 183 193 Z" 
                  style={getOrganStyles('left_kidney')}
                  className="transition-all duration-300"
                />
              </g>

              {/* INTESTINES */}
              <g 
                onClick={() => setSelectedOrganKey(selectedOrganKey === 'intestines' ? null : 'intestines')}
                onMouseEnter={() => handleMouseEnterOrgan('intestines')}
                onMouseLeave={handleMouseLeaveOrgan}
                className="cursor-pointer"
              >
                <path 
                  d="M 124,158 C 120,166 120,184 126,192 C 132,196 168,196 174,192 C 180,184 180,166 176,158 C 172,150 128,150 124,158 Z" 
                  style={getOrganStyles('intestines')}
                  className="transition-all duration-300"
                />
              </g>

              {/* BLADDER */}
              <g 
                onClick={() => setSelectedOrganKey(selectedOrganKey === 'bladder' ? null : 'bladder')}
                onMouseEnter={() => handleMouseEnterOrgan('bladder')}
                onMouseLeave={handleMouseLeaveOrgan}
                className="cursor-pointer"
              >
                <path 
                  d="M 144,213 C 144,213 140,220 146,225 C 149,228 151,228 154,225 C 159,220 156,213 156,213 C 156,213 152,211 150,211 C 148,211 144,213 144,213 Z" 
                  style={getOrganStyles('bladder')}
                  className="transition-all duration-300"
                />
              </g>

              {/* Glowing anchor circles on active/hovered organs */}
              {Object.entries(ORGAN_METADATA).map(([key, data]) => {
                const score = activeLoads[data.loadKey] || 0;
                const isHovered = hoveredOrgan === key || hoveredOrgan === data.loadKey;
                const severity = getSeverityLevel(score);

                if (isHovered || score > 15) {
                  return (
                    <g key={`${key}-pulse`} className="pointer-events-none">
                      <circle 
                        cx={data.anchor.x} 
                        cy={data.anchor.y} 
                        r="8" 
                        className="animate-ping" 
                        stroke={score > 15 ? severity.colorHex : 'rgba(99, 102, 241, 0.7)'} 
                        strokeWidth="0.8" 
                        fill="none" 
                      />
                      <circle 
                        cx={data.anchor.x} 
                        cy={data.anchor.y} 
                        r="3.5" 
                        fill={score > 15 ? severity.colorHex : '#818cf8'} 
                      />
                    </g>
                  );
                }
                return null;
              })}

            </g>

            {/* 4. Developer Debug HUD Overlay */}
            {isDebugMode && (
              <g className="pointer-events-none" opacity="0.85">
                {Object.entries(ORGAN_METADATA).map(([key, data]) => {
                  const box = data.boundingBox;
                  const target = data.target;
                  
                  return (
                    <g key={`debug-${key}`}>
                      {/* Bounding box inside body space */}
                      <rect 
                        x={box.x + 150} 
                        y={box.y + 45} 
                        width={box.w} 
                        height={box.h} 
                        fill="rgba(239, 68, 68, 0.03)" 
                        stroke="#ef4444" 
                        strokeWidth="0.7" 
                        strokeDasharray="2 2" 
                      />
                      {/* Anchor coords label */}
                      <circle cx={target.x} cy={target.y} r="2.5" fill="none" stroke="#f59e0b" strokeWidth="0.8" />
                      <line x1={target.x - 5} y1={target.y} x2={target.x + 5} y2={target.y} stroke="#f59e0b" strokeWidth="0.6" />
                      <line x1={target.x} y1={target.y - 5} x2={target.x} y2={target.y + 5} stroke="#f59e0b" strokeWidth="0.6" />
                      <text 
                        x={target.x + 6} 
                        y={target.y + 2.5} 
                        fill="#f59e0b" 
                        fontSize="6" 
                        fontFamily="monospace" 
                        fontWeight="bold"
                      >
                        {key.substring(0, 4).toUpperCase()} ({target.x}, {target.y})
                      </text>
                    </g>
                  );
                })}
              </g>
            )}
          </svg>

          {/* Scanner Sweeping Version Label */}
          <span className="absolute bottom-3 left-4 text-[8px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 pointer-events-none">
            <HeartPulse className="w-3 h-3 text-[#6366f1]" /> AEGIS-ANATOMY V2.5 (VEC-HUD)
          </span>

          {/* Floating Hover Tooltip (Opal Card) */}
          {hoveredOrgan && (() => {
            const meta = ORGAN_METADATA[hoveredOrgan] || Object.values(ORGAN_METADATA).find(m => m.loadKey === hoveredOrgan);
            if (!meta) return null;
            
            const score = activeLoads[meta.loadKey] || 0;
            const severity = getSeverityLevel(score);
            const explanation = activeExplanations[meta.loadKey] || 'Normal baseline physiological activity.';
            
            const sideClass = meta.tooltipSide === 'left' ? 'left-3 border-l-2' : 'right-3 border-r-2';

            return (
              <div 
                className={`absolute ${meta.tooltipY} ${sideClass} z-50 w-44 bg-[#050914]/95 border-slate-700 px-3 py-2 rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.8)] border flex flex-col gap-1 transition-all duration-200 animate-fade-in`}
                style={{ borderColor: score > 0 ? severity.colorHex : 'rgba(99, 102, 241, 0.25)' }}
              >
                <div className="flex justify-between items-center border-b border-white/5 pb-1">
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">{meta.name}</span>
                  <span style={{ color: severity.colorHex }} className="text-[9px] font-extrabold">
                    {score}%
                  </span>
                </div>
                <div className="w-full h-0.5 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${score}%`, backgroundColor: severity.colorHex }}
                  />
                </div>
                <p className="text-[8px] text-slate-400 leading-normal mt-0.5 font-light">
                  {explanation.split('.')[0]}.
                </p>
              </div>
            );
          })()}

        </div>

        {/* Right Side: Organ Summary Side Panel List */}
        <div className="lg:col-span-4 flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 pl-1">
            Organ Summary
          </div>
          
          <div className="flex flex-col gap-2.5">
            {summaryOrgans.map(item => {
              const score = activeLoads[item.key] || 0;
              const severity = getSeverityLevel(score);
              const isSelected = selectedOrganKey === item.key;
              const explanation = activeExplanations[item.key] || 'Normal baseline physiologic load.';

              return (
                <div 
                  key={item.key}
                  onClick={() => setSelectedOrganKey(isSelected ? null : item.key)}
                  onMouseEnter={() => handleMouseEnterOrgan(item.key)}
                  onMouseLeave={handleMouseLeaveOrgan}
                  className={`p-3 bg-[#0c1220]/75 border border-[#1e293b]/70 rounded-2xl hover:border-indigo-500/50 hover:bg-[#0f172a]/90 transition-all cursor-pointer flex flex-col gap-2 relative group ${
                    isSelected || hoveredOrgan === item.key ? 'border-indigo-500/80 bg-[#0f172a]' : ''
                  }`}
                >
                  {/* Top Row */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2.5">
                      <div style={{ color: severity.colorHex }} className="transition-colors">
                        {item.icon}
                      </div>
                      <span className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors">
                        {item.name}
                      </span>
                    </div>
                    <span className={`text-[10px] text-slate-500 group-hover:text-white transition-all transform ${
                      isSelected ? 'rotate-90 text-white font-bold' : ''
                    }`}>
                      ›
                    </span>
                  </div>

                  {/* Info Row */}
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>
                      Risk: <span style={{ color: severity.colorHex }} className="font-semibold">{severity.label}</span>
                    </span>
                    <span>
                      Impact: <span className="text-white font-medium">{score}%</span>
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${score > 0 ? score : 4}%`, 
                        backgroundColor: score > 0 ? severity.colorHex : 'rgba(255, 255, 255, 0.05)'
                      }}
                    />
                  </div>

                  {/* Collapsible Detailed Explanation */}
                  {isSelected && (
                    <div className="mt-2.5 p-3 bg-[#060b13]/85 rounded-xl border border-white/5 flex gap-2 items-start text-[10px] leading-relaxed text-slate-300 animate-fade-in">
                      <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <div className="flex flex-col gap-1.5 w-full">
                        <p className="font-light">{explanation}</p>
                        {score > 15 ? (
                          <div className="text-[9px] text-rose-400 font-bold border-t border-white/5 pt-1.5 uppercase tracking-wide">
                            ⚠️ Clinical Caution: Monitor Organ Load closely
                          </div>
                        ) : (
                          <div className="text-[9px] text-emerald-400 font-bold border-t border-white/5 pt-1.5 uppercase tracking-wide">
                            🛡️ Safety Status: Normal Physiological Load
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Bottom Panel: Risk Levels legend and debug toggler */}
      <div className="flex justify-between items-center border-t border-[#1e293b] pt-4 mt-1">
        <div className="flex items-center gap-6 text-[10px] text-slate-400">
          <span className="font-bold uppercase tracking-wider text-[9px]">Risk Levels</span>
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-500">●</span> Low (0-30%)
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-amber-500">●</span> Moderate (31-60%)
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-rose-500">●</span> High (61-100%)
          </div>
        </div>

        {/* Developer Debug HUD toggle button */}
        <button 
          onClick={() => setIsDebugMode(!isDebugMode)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-[9px] font-extrabold tracking-wider uppercase transition-all shadow-sm ${
            isDebugMode 
              ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20' 
              : 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10'
          }`}
        >
          {isDebugMode ? (
            <>
              <EyeOff className="w-3.5 h-3.5" /> Disable Coordinates
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5" /> Enable Coordinates
            </>
          )}
        </button>
      </div>

      {/* Bottom Metrics: Overall Risk, Affected Organs, and Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-[#1e293b] pt-5 mt-1">
        
        {/* Card 1: Overall Risk Score */}
        <div className="bg-[#0c1220]/45 border border-[#1e293b]/70 p-4 rounded-2xl flex items-center gap-4 hover:border-indigo-500/30 transition-all">
          <div className="bg-[#6366f1]/10 p-3 rounded-2xl border border-[#6366f1]/20 text-[#6366f1] shrink-0">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <circle cx="12" cy="11" r="3" />
              <path d="M12 8v6M10 11h4" />
            </svg>
          </div>
          <div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Overall Risk Score</div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-black text-white">{100 - safetyScore}%</span>
              <span style={{ color: overallRiskSeverity.colorHex }} className="text-[10px] font-bold">
                {overallRiskSeverity.label} Risk
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Affected Organs count */}
        <div className="bg-[#0c1220]/45 border border-[#1e293b]/70 p-4 rounded-2xl flex items-center gap-4 hover:border-indigo-500/30 transition-all">
          <div className="bg-[#6366f1]/10 p-3 rounded-2xl border border-[#6366f1]/20 text-[#6366f1] shrink-0">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </div>
          <div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Affected Organs</div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-black text-white">{affectedOrgansCount}/8</span>
              <span className={`text-[10px] font-bold ${affectedOrgansCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {affectedOrgansCount > 2 ? 'High Impact' : (affectedOrgansCount > 0 ? 'Moderate Impact' : 'No Impact')}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Recommendation panel (interactive click to print/save) */}
        <div 
          onClick={handleRecommendationClick}
          title="Save clinical safety report and print recommendation details"
          className="bg-[#0c1220]/60 border border-[#1e293b]/70 p-4 rounded-2xl flex items-center justify-between gap-4 hover:border-[#f59e0b]/60 hover:bg-[#0f172a] transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-4">
            <div className="bg-[#f59e0b]/10 p-3 rounded-2xl border border-[#f59e0b]/20 text-[#f59e0b] shrink-0 group-hover:bg-[#f59e0b]/20 group-hover:scale-105 transition-all">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-amber-400 transition-colors">Recommendation</div>
              <div className="text-xs font-bold text-white mt-0.5 truncate max-w-[160px] md:max-w-none">
                {100 - safetyScore >= 60 
                  ? 'Review medications and consult physician' 
                  : (100 - safetyScore >= 30 
                      ? 'Vigilant dosing / monitoring advised' 
                      : 'Prescription is safe for dispensation')}
              </div>
            </div>
          </div>
          <span className="text-slate-400 group-hover:text-white transition-colors text-base cursor-pointer group-hover:translate-x-1 duration-200">
            ➔
          </span>
        </div>

      </div>

      {/* Safer Alternatives Popup Modal */}
      {showAltsModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#0b0f19] border border-[#1e293b] rounded-3xl w-full max-w-lg p-6 shadow-2xl flex flex-col gap-4 relative animate-scale-up">
            
            {/* Header */}
            <div className="flex justify-between items-start border-b border-[#1e293b] pb-3">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <svg className="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <circle cx="12" cy="11" r="3" />
                  </svg>
                  Safer Alternatives Recommendations
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">AI-computed clinical drug substitutions</p>
              </div>
              <button 
                onClick={() => setShowAltsModal(false)}
                className="text-slate-400 hover:text-white transition-colors font-bold text-sm px-1"
              >
                ✕
              </button>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto max-h-[320px] flex flex-col gap-4 pr-1 custom-scrollbar">
              {prescription.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                  <div className="bg-[#f59e0b]/10 p-3 rounded-full border border-[#f59e0b]/20 text-[#f59e0b]">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </div>
                  <h4 className="text-xs font-bold text-slate-350 mt-1">Prescription is Empty</h4>
                  <p className="text-[10px] text-slate-500 max-w-xs leading-normal">
                    Please search and add medications to the prescription builder first, then click the recommendation card to view safety alternative medicines.
                  </p>
                </div>
              ) : analysisResults && analysisResults.alternatives && Object.keys(analysisResults.alternatives).length > 0 ? (
                Object.entries(analysisResults.alternatives).map(([drugName, alts]) => {
                  const hasWarning = getDrugHasWarning(drugName);

                  return (
                    <div key={drugName} className={`border p-4 rounded-2xl flex flex-col gap-3 ${
                      hasWarning 
                        ? 'border-rose-500/30 bg-rose-500/5' 
                        : 'border-[#1e293b] bg-[#0c1220]/60'
                    }`}>
                      <div className="text-xs font-bold flex justify-between items-center">
                        <span className="text-slate-200">
                          Alternatives for: <span className={hasWarning ? "text-rose-450 font-extrabold" : "text-emerald-400 font-extrabold"}>{drugName}</span>
                        </span>
                        <span className={`text-[8px] uppercase px-1.5 py-0.5 rounded font-black ${
                          hasWarning 
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20' 
                            : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {hasWarning ? 'Warning Active' : 'Safe Regimen'}
                        </span>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        {alts.map((alt, idx) => (
                          <div key={idx} className="bg-[#0f172a] border border-[#1e293b]/70 p-3 rounded-xl flex items-center justify-between gap-4">
                            <div className="flex flex-col leading-tight">
                              <span className="text-xs font-bold text-white">{alt.name}</span>
                              <span className="text-[9px] text-slate-400 italic mt-0.5">{alt.genericName} &bull; {alt.class}</span>
                            </div>

                            <div className="flex items-center gap-3 text-[10px] font-semibold text-slate-300">
                              <div className="flex flex-col items-center">
                                <span className="text-[8px] text-slate-500 uppercase font-bold">Safety</span>
                                <span className="text-emerald-400">{alt.safetyRating} ★</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <span className="text-[8px] text-slate-500 uppercase font-bold">Risk</span>
                                <span className="text-slate-400 font-bold uppercase">{alt.interactionRisk}</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <span className="text-[8px] text-slate-500 uppercase font-bold">Price</span>
                                <span className="text-slate-350">{alt.priceEstimate}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                  <div className="bg-emerald-500/10 p-3 rounded-full border border-emerald-500/20 text-emerald-450">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </div>
                  <h4 className="text-xs font-bold text-slate-305 mt-1">No Alternatives Found</h4>
                  <p className="text-[10px] text-slate-500 max-w-xs leading-normal">
                    The medications in the active regimen do not have alternative suggestions in the database.
                  </p>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-2 justify-end border-t border-[#1e293b] pt-3 mt-1">
              <button 
                onClick={() => {
                  setShowAltsModal(false);
                  window.print();
                }}
                className="px-4 py-2 border border-[#1e293b] hover:border-slate-500 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              >
                Print Full Scan
              </button>
              <button 
                onClick={() => setShowAltsModal(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default OrganVisualizer;
