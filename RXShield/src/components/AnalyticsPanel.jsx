import { useMedical } from '../context/MedicalContext';
import { Activity, ShieldAlert, Heart, Brain, Droplet } from 'lucide-react';
import InteractionNetwork from './InteractionNetwork';

const AnalyticsPanel = () => {
  const { analysisResults, prescription } = useMedical();

  if (!analysisResults) return null;

  const { safetyScore, interactions, allergies, contraindications } = analysisResults;
  const riskScore = 100 - safetyScore;

  // Compile organ levels for drawing the bar chart
  const organBurdens = {
    brain: 0,
    heart: 0,
    liver: 0,
    kidneys: 0,
    stomach: 0
  };

  // Find max organ burdens
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
      // General fallbacks
      organBurdens.brain = Math.max(organBurdens.brain, 15);
      organBurdens.heart = Math.max(organBurdens.heart, 20);
      organBurdens.liver = Math.max(organBurdens.liver, 25);
      organBurdens.kidneys = Math.max(organBurdens.kidneys, 30);
      organBurdens.stomach = Math.max(organBurdens.stomach, 25);
    }
  });

  const getSafetyColor = (score) => {
    if (score >= 90) return 'text-severity-low';
    if (score >= 70) return 'text-severity-moderate';
    if (score >= 40) return 'text-severity-high';
    return 'text-severity-critical';
  };

  const getSafetyBg = (score) => {
    if (score >= 90) return 'bg-severity-low/10 border-severity-low/20';
    if (score >= 70) return 'bg-severity-moderate/10 border-severity-moderate/20';
    if (score >= 40) return 'bg-severity-high/10 border-severity-high/20';
    return 'bg-severity-critical/10 border-severity-critical/20';
  };

  // SVGs circular parameters
  const circRadius = 50;
  const circCircum = 2 * Math.PI * circRadius;
  const circStrokeOffset = circCircum * (1 - safetyScore / 100);
  const riskStrokeOffset = circCircum * (1 - riskScore / 100);

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in">
      
      {/* Visual Analytics Header Panel */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        
        {/* Left: Risk and Safety score circular gauges */}
        <div className="md:col-span-5 flex items-center justify-around py-4 glass-panel bg-white/40">
          
          {/* Circular Safety Gauge */}
          <div className="flex flex-col items-center gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Safety Index</span>
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="56" cy="56" r={circRadius} stroke="rgba(0,0,0,0.03)" strokeWidth="6" fill="transparent" />
                <circle 
                  cx="56" 
                  cy="56" 
                  r={circRadius} 
                  stroke={safetyScore > 80 ? '#0F766E' : (safetyScore > 50 ? '#D4A017' : '#FF7F50')} 
                  strokeWidth="8" 
                  fill="transparent" 
                  strokeDasharray={circCircum}
                  strokeDashoffset={circStrokeOffset}
                  className="transition-all duration-1000 ease-out"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-xl font-black text-slate-800">{safetyScore}%</span>
                <span className="text-[9px] text-slate-600 uppercase tracking-widest">Safe</span>
              </div>
            </div>
          </div>

          {/* Circular Risk Gauge */}
          <div className="flex flex-col items-center gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Risk Score</span>
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="56" cy="56" r={circRadius} stroke="rgba(0,0,0,0.03)" strokeWidth="6" fill="transparent" />
                <circle 
                  cx="56" 
                  cy="56" 
                  r={circRadius} 
                  stroke={riskScore > 60 ? '#FF7F50' : (riskScore > 30 ? '#D4A017' : '#0F766E')} 
                  strokeWidth="8" 
                  fill="transparent" 
                  strokeDasharray={circCircum}
                  strokeDashoffset={riskStrokeOffset}
                  className="transition-all duration-1000 ease-out"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-xl font-black text-slate-800">{riskScore}%</span>
                <span className="text-[9px] text-slate-600 uppercase tracking-widest">Risk</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right: Detailed report overview stats */}
        <div className="md:col-span-7 flex flex-col gap-3">
          <div className={`p-4 rounded-2xl border text-xs leading-relaxed ${getSafetyBg(safetyScore)}`}>
            <div className="flex items-center gap-2 mb-1">
              <ShieldAlert className={`w-4 h-4 ${getSafetyColor(safetyScore)}`} />
              <span className={`font-bold ${getSafetyColor(safetyScore)} uppercase tracking-wider`}>
                {safetyScore >= 90 ? 'Class A Clearance' : (safetyScore >= 70 ? 'Class B Alert' : 'Class C Critical Alert')}
              </span>
            </div>
            <p className="text-slate-700 font-light">{analysisResults.recommendations}</p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div className="bg-white/40 border border-slate-200/50 p-3 rounded-xl">
              <span className="text-slate-500 block">Interactions</span>
              <span className="text-base font-bold text-slate-800 mt-1 block">{interactions.length}</span>
            </div>
            <div className="bg-white/40 border border-slate-200/50 p-3 rounded-xl">
              <span className="text-slate-500 block">Allergies</span>
              <span className="text-base font-bold text-slate-800 mt-1 block">{allergies.length}</span>
            </div>
            <div className="bg-white/40 border border-slate-200/50 p-3 rounded-xl">
              <span className="text-slate-500 block">Contraindications</span>
              <span className="text-base font-bold text-slate-800 mt-1 block">{contraindications.length}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Network Graph & Bar Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* Interaction Network Topology */}
        <InteractionNetwork />

        {/* Organ load bar chart */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-medical-cyan" /> Organ Load Comparison
          </span>

          <div className="glass-panel p-5 bg-white/40 flex flex-col gap-4 min-h-[320px] justify-center">
            {Object.entries(organBurdens).map(([organ, value]) => {
              
              let barColor = 'bg-medical-cyan shadow-neon-cyan';
              if (value > 60) barColor = 'bg-severity-high shadow-neon-critical'; // Coral
              else if (value > 30) barColor = 'bg-severity-moderate shadow-neon-purple'; // Lavender
              else if (value > 15) barColor = 'bg-medical-blue shadow-neon-blue'; // Gold

              return (
                <div key={organ} className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                      {organ === 'heart' && <Heart className="w-3.5 h-3.5 text-severity-critical" />}
                      {organ === 'brain' && <Brain className="w-3.5 h-3.5 text-medical-cyan" />}
                      {organ === 'stomach' && <Droplet className="w-3.5 h-3.5 text-severity-high" />}
                      {organ === 'liver' && <Activity className="w-3.5 h-3.5 text-severity-moderate" />}
                      {organ === 'kidneys' && <Activity className="w-3.5 h-3.5 text-medical-teal" />}
                      {organ}
                    </span>
                    <span className="font-semibold text-slate-550">{value}% Burden</span>
                  </div>
                  
                  {/* Track and Fill */}
                  <div className="w-full h-3 bg-slate-200/50 border border-slate-200/30 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${barColor}`} 
                      style={{ width: `${value}%` }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};

export default AnalyticsPanel;
