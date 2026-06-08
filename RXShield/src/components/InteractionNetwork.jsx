import { useEffect, useRef, useState } from 'react';
import { useMedical } from '../context/MedicalContext';
import { HelpCircle } from 'lucide-react';

const InteractionNetwork = () => {
  const { prescription, analysisResults } = useMedical();
  const canvasRef = useRef(null);
  
  const [hoveredNode, setHoveredNode] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let animationId;
    let particles = [];
    let nodes = [];

    const resize = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = 320;
    };
    resize();

    // Re-initialize nodes based on current prescription
    const initNetwork = () => {
      if (prescription.length === 0) {
        nodes = [];
        particles = [];
        return;
      }

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(canvas.width, canvas.height) * 0.35;

      nodes = prescription.map((d, index) => {
        // Arrange nodes in a beautiful circle
        const angle = (index / prescription.length) * Math.PI * 2;
        
        // Find if this drug is involved in any critical warnings
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
          generic: d.genericName,
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
          radius: 26,
          pulse: 0,
          hazardLevel: hazardLevel
        };
      });

      // Initialize flow particles along paths for active interactions
      particles = [];
      if (analysisResults && analysisResults.interactions.length > 0 && nodes.length > 1) {
        analysisResults.interactions.forEach(inter => {
          const nodeA = nodes.find(n => n.name.toLowerCase() === inter.drugA.toLowerCase());
          const nodeB = nodes.find(n => n.name.toLowerCase() === inter.drugB.toLowerCase());
          
          if (nodeA && nodeB) {
            // Add particles traveling along this edge
            const count = inter.severity === 'critical' ? 4 : 2;
            for (let k = 0; k < count; k++) {
              particles.push({
                from: nodeA,
                to: nodeB,
                progress: Math.random(),
                speed: 0.005 + Math.random() * 0.005,
                color: inter.severity === 'critical' ? '#FF7F50' : '#D4A017'
              });
            }
          }
        });
      }
    };

    initNetwork();

    // Monitor canvas click or hover
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      let found = null;
      nodes.forEach(node => {
        const dist = Math.hypot(node.x - mx, node.y - my);
        if (dist < node.radius) {
          found = node;
        }
      });
      setHoveredNode(found);
    };

    canvas.addEventListener('mousemove', handleMouseMove);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (nodes.length === 0) {
        ctx.fillStyle = 'rgba(15, 118, 110, 0.45)';
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('No medications loaded. Network is idle.', canvas.width / 2, canvas.height / 2);
        return;
      }

      // 1. Draw connecting lines between nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const nodeA = nodes[i];
          const nodeB = nodes[j];
          
          // Check if there is an interaction between nodeA and nodeB
          let severity = 'safe';
          if (analysisResults) {
            const inter = analysisResults.interactions.find(it => 
              (it.drugA.toLowerCase() === nodeA.name.toLowerCase() && it.drugB.toLowerCase() === nodeB.name.toLowerCase()) ||
              (it.drugA.toLowerCase() === nodeB.name.toLowerCase() && it.drugB.toLowerCase() === nodeA.name.toLowerCase())
            );
            if (inter) severity = inter.severity;
          }

          ctx.beginPath();
          ctx.moveTo(nodeA.x, nodeA.y);
          ctx.lineTo(nodeB.x, nodeB.y);
          
          let strokeStyle;
          let lineWidth;
          
          if (severity === 'critical') {
            strokeStyle = 'rgba(255, 127, 80, 0.55)';
            lineWidth = 3.5;
          } else if (severity === 'high' || severity === 'moderate') {
            strokeStyle = 'rgba(212, 160, 23, 0.5)';
            lineWidth = 2;
          } else {
            strokeStyle = 'rgba(15, 118, 110, 0.15)';
            lineWidth = 0.8;
          }
          
          ctx.strokeStyle = strokeStyle;
          ctx.lineWidth = lineWidth;
          ctx.stroke();
        }
      }

      // 2. Draw flow particles traveling on interaction lines
      particles.forEach(p => {
        p.progress += p.speed;
        if (p.progress > 1) {
          p.progress = 0;
          if (Math.random() > 0.5) {
            const temp = p.from;
            p.from = p.to;
            p.to = temp;
          }
        }
        
        const px = p.from.x + (p.to.x - p.from.x) * p.progress;
        const py = p.from.y + (p.to.y - p.from.y) * p.progress;
        
        ctx.beginPath();
        ctx.arc(px, py, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.shadowBlur = 0; // Reset
      });

      // 3. Draw nodes
      nodes.forEach(node => {
        node.pulse += 0.05;
        const pulseRadius = node.radius + Math.sin(node.pulse) * 2;

        ctx.save();
        ctx.shadowBlur = 12;
        if (node.hazardLevel === 'critical') {
          ctx.shadowColor = 'rgba(255, 127, 80, 0.6)';
          ctx.fillStyle = 'rgba(255, 127, 80, 0.15)';
          ctx.strokeStyle = 'rgba(255, 127, 80, 0.8)';
        } else if (node.hazardLevel === 'warning') {
          ctx.shadowColor = 'rgba(212, 160, 23, 0.5)';
          ctx.fillStyle = 'rgba(212, 160, 23, 0.1)';
          ctx.strokeStyle = 'rgba(212, 160, 23, 0.7)';
        } else {
          ctx.shadowColor = 'rgba(15, 118, 110, 0.15)';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
          ctx.strokeStyle = 'rgba(15, 118, 110, 0.4)';
        }

        ctx.beginPath();
        ctx.arc(node.x, node.y, pulseRadius, 0, Math.PI*2);
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();

        // Write pill text
        ctx.fillStyle = '#0F766E';
        ctx.font = 'bold 10px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(node.name, node.x, node.y + 2);
        
        ctx.fillStyle = 'rgba(30, 41, 59, 0.6)';
        ctx.font = '8px Inter';
        ctx.fillText(node.generic.substring(0, 10), node.x, node.y + 11);
      });
      
      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [prescription, analysisResults]);

  return (
    <div className="w-full flex flex-col gap-3 relative">
      <div className="flex justify-between items-center px-1">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-medical-cyan" /> Interaction Topology
        </span>
        <span className="text-[10px] text-slate-500">Nodes represent loaded drugs</span>
      </div>

      <div className="relative border border-slate-200/50 rounded-2xl bg-white/40 overflow-hidden shadow-inner flex items-center justify-center min-h-[320px]">
        <canvas ref={canvasRef} className="block w-full" />
        
        {hoveredNode && (
          <div className="absolute top-4 left-4 glass-panel p-3 border-l-2 border-medical-cyan text-xs max-w-xs animate-fade-in z-20 pointer-events-none">
            <h5 className="font-bold text-slate-800">{hoveredNode.name}</h5>
            <p className="text-[10px] text-slate-500 italic mb-1.5">{hoveredNode.generic}</p>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
              hoveredNode.hazardLevel === 'critical' ? 'bg-severity-critical/10 text-severity-critical border border-severity-critical/20' :
              hoveredNode.hazardLevel === 'warning' ? 'bg-severity-moderate/10 text-severity-moderate border border-severity-moderate/20' :
              'bg-medical-cyan/10 text-medical-cyan border border-medical-cyan/20'
            }`}>
              {hoveredNode.hazardLevel === 'critical' ? 'Critical Hazard' : (hoveredNode.hazardLevel === 'warning' ? 'Burden Alert' : 'Clinically Safe')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default InteractionNetwork;
