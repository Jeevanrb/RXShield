import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, ShieldAlert, HeartPulse, RefreshCw, MessageSquare, Info, 
  ArrowRight, CheckCircle, Database, Award
} from 'lucide-react';
import { useMedical } from '../context/MedicalContext';

const Landing = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const { setActiveTab } = useMedical();

  // Statistics state counters
  const [stats, setStats] = useState({
    medicines: 0,
    interactions: 0,
    prescriptions: 0,
    accuracy: 0
  });

  // Animated counters logic
  useEffect(() => {
    const duration = 2000; // ms
    const startTime = performance.now();

    const targets = {
      medicines: 510,
      interactions: 1240,
      prescriptions: 4850,
      accuracy: 99.8
    };

    let animationFrame;

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function outQuad
      const ease = progress * (2 - progress);

      setStats({
        medicines: Math.floor(targets.medicines * ease),
        interactions: Math.floor(targets.interactions * ease),
        prescriptions: Math.floor(targets.prescriptions * ease),
        accuracy: parseFloat((targets.accuracy * ease).toFixed(1))
      });

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  // HTML5 Canvas Neural Network Particle Background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let animationId;
    let particles = [];
    const particleCount = 40;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 4 + 2,
        color: Math.random() > 0.5 ? 'rgba(15, 118, 110, 0.4)' : 'rgba(212, 160, 23, 0.4)',
        type: Math.random() > 0.8 ? 'capsule' : 'dot',
        rotation: Math.random() * Math.PI,
        rotationSpeed: (Math.random() - 0.5) * 0.02
      });
    }

    const drawCapsule = (ctx, x, y, r, rotation) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      
      // Capsule capsule structure (pill shape)
      ctx.beginPath();
      ctx.rect(-10, -4, 20, 8);
      ctx.fillStyle = 'rgba(15, 118, 110, 0.2)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(15, 118, 110, 0.6)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Half colored
      ctx.beginPath();
      ctx.rect(0, -4, 10, 8);
      ctx.fillStyle = 'rgba(212, 160, 23, 0.4)';
      ctx.fill();
      ctx.stroke();
      
      ctx.restore();
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.01)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw and update particles
      particles.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        // Bounce borders
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        if (p.type === 'capsule') {
          drawCapsule(ctx, p.x, p.y, p.radius, p.rotation);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 10;
          ctx.shadowColor = p.color;
          ctx.fill();
          ctx.shadowBlur = 0; // Reset
        }

        // Draw links between close particles
        for (let j = index + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            const alpha = (1 - dist / 150) * 0.15;
            ctx.strokeStyle = `rgba(15, 118, 110, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  const handleStart = () => {
    setActiveTab('prescription');
    navigate('/dashboard');
  };

  const handleDemo = () => {
    setActiveTab('dashboard');
    navigate('/dashboard');
  };

  const features = [
    {
      icon: <Activity className="w-8 h-8 text-medical-cyan" />,
      title: 'Drug Interaction Detection',
      desc: 'Real-time checking across polypharmacy lists to identify critical drug-to-drug safety risks instantly.'
    },
    {
      icon: <ShieldAlert className="w-8 h-8 text-medical-purple" />,
      title: 'Allergy Cross-Reactivity',
      desc: 'Matches prescription agents against detailed patient allergy records to alert before dose dispensation.'
    },
    {
      icon: <HeartPulse className="w-8 h-8 text-severity-critical" />,
      title: 'Organ Load Visualization',
      desc: 'Interactive visual models charting liver, kidney, and cardiovascular workload for selected combinations.'
    },
    {
      icon: <RefreshCw className="w-8 h-8 text-medical-teal" />,
      title: 'Safer Alternative Engine',
      desc: 'Provides automated, therapeutic class-equivalent drug proposals scored by price, risk, and efficacy.'
    },
    {
      icon: <MessageSquare className="w-8 h-8 text-medical-blue" />,
      title: 'AI Medical Assistant',
      desc: 'Integrates a futuristic conversational chatbot trained to answer pharmacology queries and explain mechanisms.'
    },
    {
      icon: <Info className="w-8 h-8 text-severity-moderate" />,
      title: 'Clinical Knowledge Center',
      desc: 'Access a database of 500+ medicines with generic brand profiles, black box warnings, and storage rules.'
    }
  ];

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-start overflow-x-hidden bg-bg-dark text-slate-800">
      
      {/* Background canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />

      {/* Floating Header */}
      <header className="relative w-full max-w-7xl px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-br from-medical-cyan to-medical-purple p-2 rounded-xl shadow-neon-cyan animate-pulse">
            <HeartPulse className="w-6 h-6 text-white" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-slate-800">
            RXSheild <span className="text-medical-cyan">AI</span>
          </span>
        </div>
        <button 
          onClick={handleStart}
          className="px-5 py-2.5 rounded-xl border border-emerald-700/10 hover:border-medical-cyan/30 bg-white/70 hover:bg-medical-cyan/5 text-medical-cyan text-sm font-semibold transition-all duration-300 shadow-sm"
        >
          Access Portal
        </button>
      </header>

      {/* Hero Section */}
      <main className="relative flex-1 w-full max-w-7xl px-6 pt-16 pb-20 flex flex-col items-center text-center z-10">
        
        {/* Neon Badge */}
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-medical-cyan/30 bg-medical-cyan/10 text-medical-cyan text-xs font-semibold uppercase tracking-wider mb-8 animate-float">
          <Activity className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} /> Hospital-Grade Diagnostic AI
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-6xl font-black tracking-tight max-w-4xl leading-tight mb-6">
          AI Drug Interaction & <br />
          <span className="bg-gradient-to-r from-medical-cyan via-medical-blue to-medical-purple bg-clip-text text-transparent drop-shadow-sm">
            Prescription Advisor
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-slate-600 max-w-2xl font-light mb-10 leading-relaxed">
          Advanced Artificial Intelligence for safe medication management. Safeguard patient health with real-time polypharmacy analysis, allergy cross-checks, and organ workload diagnostics.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-20">
          <button 
            onClick={handleStart}
            className="px-8 py-4 rounded-xl font-bold btn-gold text-white transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 group"
          >
            Start Analysis <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <button 
            onClick={handleDemo}
            className="px-8 py-4 rounded-xl font-bold border border-emerald-700/15 hover:border-emerald-700/30 bg-white/80 hover:bg-white/90 text-emerald-800 transform hover:-translate-y-0.5 transition-all duration-200 shadow-sm"
          >
            View Doctor Dashboard
          </button>
        </div>

        {/* Counters Dashboard */}
        <div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-6 p-2 glass-panel mb-24">
          <div className="p-6 md:p-8 flex flex-col items-center border-r border-slate-200/50 last:border-0">
            <div className="p-3 bg-medical-cyan/10 rounded-2xl mb-4">
              <Database className="w-6 h-6 text-medical-cyan" />
            </div>
            <span className="text-3xl md:text-4xl font-extrabold text-emerald-950 tracking-tight mb-2">
              {stats.medicines}+
            </span>
            <span className="text-xs md:text-sm text-slate-500 font-medium">Medicines Supported</span>
          </div>

          <div className="p-6 md:p-8 flex flex-col items-center border-r border-slate-200/50 last:border-0">
            <div className="p-3 bg-medical-purple/10 rounded-2xl mb-4">
              <ShieldAlert className="w-6 h-6 text-medical-purple" />
            </div>
            <span className="text-3xl md:text-4xl font-extrabold text-emerald-950 tracking-tight mb-2">
              {stats.interactions}+
            </span>
            <span className="text-xs md:text-sm text-slate-500 font-medium">Interactions Detected</span>
          </div>

          <div className="p-6 md:p-8 flex flex-col items-center border-r border-slate-200/50 last:border-0">
            <div className="p-3 bg-medical-teal/10 rounded-2xl mb-4">
              <CheckCircle className="w-6 h-6 text-medical-teal" />
            </div>
            <span className="text-3xl md:text-4xl font-extrabold text-emerald-950 tracking-tight mb-2">
              {stats.prescriptions}+
            </span>
            <span className="text-xs md:text-sm text-slate-500 font-medium">Prescriptions Analyzed</span>
          </div>

          <div className="p-6 md:p-8 flex flex-col items-center">
            <div className="p-3 bg-severity-critical/10 rounded-2xl mb-4">
              <Award className="w-6 h-6 text-severity-critical" />
            </div>
            <span className="text-3xl md:text-4xl font-extrabold text-emerald-950 tracking-tight mb-2">
              {stats.accuracy}%
            </span>
            <span className="text-xs md:text-sm text-slate-500 font-medium">AI Accuracy Rate</span>
          </div>
        </div>

        {/* Feature section grid */}
        <div className="w-full text-left">
          <h2 className="text-2xl md:text-3xl font-extrabold text-center text-slate-800 mb-4">
            Comprehensive Clinical Intelligence
          </h2>
          <p className="text-slate-600 text-center max-w-xl mx-auto mb-16 font-light">
            Empower prescription decision-making with advanced heuristic algorithms and safety warnings compiled at the point of care.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div 
                key={i} 
                className="glass-panel p-6 hover:border-medical-cyan/30 hover:shadow-neon-cyan/15 transform hover:-translate-y-1 transition-all duration-300"
              >
                <div className="p-3 bg-emerald-700/5 border border-emerald-700/10 w-fit rounded-2xl mb-5 shadow-inner">
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed font-light">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="relative w-full max-w-7xl border-t border-slate-200/50 py-8 px-6 text-center text-xs text-slate-500 z-10 mt-auto">
        &copy; 2026 RXSheild AI Healthcare Technologies. Hospital-Grade Prescription Safety Advisor. All rights reserved.
      </footer>
    </div>
  );
};

export default Landing;
