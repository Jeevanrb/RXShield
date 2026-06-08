import { useState, useEffect } from 'react';
import { useMedical } from '../context/MedicalContext';
import { 
  FileText, Download, Printer, ChevronRight, User, Calendar, 
  ShieldAlert, Activity, ClipboardList, CheckCircle
} from 'lucide-react';

const ReportTemplate = () => {
  const { reports, fetchReports, addNotification } = useMedical();
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleSelectReport = (rep) => {
    setSelectedReport(rep);
    addNotification(`Loaded report for ${rep.patient_name}`, 'info');
  };

  // CSV Exporter
  const exportCSV = (rep) => {
    if (!rep) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    
    // Header
    csvContent += ' RXSheild AI Clinical Prescription Report\n';
    csvContent += `Patient: ,${rep.patient_name}\n`;
    csvContent += `Created At: ,${new Date(rep.created_at).toLocaleString()}\n`;
    csvContent += `Safety Score: ,${rep.analysis.safetyScore}/100\n\n`;
    
    // Prescription section
    csvContent += 'PRESCRIPTION REGIMEN\n';
    csvContent += 'Drug Name,Dosage,Frequency,Duration\n';
    rep.prescription.forEach(d => {
      csvContent += `"${d.name}","${d.dosage}","${d.frequency}","${d.duration}"\n`;
    });
    csvContent += '\n';

    // Warnings section
    csvContent += 'AI CLINICAL WARNINGS\n';
    csvContent += 'Warning Type,Affected Agent,Details/Impact,Action Recommended\n';
    
    rep.analysis.allergies.forEach(a => {
      csvContent += `"Allergy Warning","${a.drug}","${a.reason} - Reaction: ${a.reaction}","${a.advice}"\n`;
    });

    rep.analysis.contraindications.forEach(c => {
      csvContent += `"Contraindication","${c.drug} vs ${c.condition}","${c.explanation}","${c.action}"\n`;
    });

    rep.analysis.interactions.forEach(i => {
      csvContent += `"Drug-to-Drug Interaction","${i.drugA} + ${i.drugB}","Severity: ${i.severity.toUpperCase()} - ${i.mechanism}","${i.recommendedAction}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `RXSheild_AI_Report_${rep.patient_name.replace(/\s+/g, '_')}_${rep.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addNotification('CSV exported successfully.', 'success');
  };

  // PDF Export
  const exportPDF = () => {
    window.print();
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in">
      
      {/* View Header */}
      <div className="no-print">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800">Reports Center</h1>
        <p className="text-sm text-slate-500">Review, print, and export saved clinical prescription advisories.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Reports list */}
        <div className="lg:col-span-5 flex flex-col gap-4 no-print">
          <div className="glass-panel p-5 flex flex-col gap-3">
            <span className="text-xs font-bold text-slate-550 uppercase tracking-wider pl-1">Saved Reports Database</span>
            
            <div className="flex flex-col gap-2 max-h-[460px] overflow-y-auto pr-1">
              {reports.length > 0 ? (
                reports.map((rep) => (
                  <button
                    key={rep.id}
                    onClick={() => handleSelectReport(rep)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex justify-between items-center ${
                      selectedReport && selectedReport.id === rep.id
                        ? 'bg-medical-cyan/10 border-medical-cyan/30 text-emerald-950 shadow-neon-cyan/5'
                        : 'bg-white/40 border-slate-200/50 hover:border-slate-300 hover:bg-white/80 text-slate-700'
                    }`}
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-bold flex items-center gap-1.5 text-slate-800"><User className="w-4 h-4 text-medical-cyan" /> {rep.patient_name}</span>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(rep.created_at).toLocaleString()}</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-end">
                        <span className="text-[9px] text-slate-500 uppercase font-bold">Safety Score</span>
                        <span className={`text-xs font-bold ${
                          rep.analysis.safetyScore >= 90 ? 'text-severity-low' : (rep.analysis.safetyScore >= 70 ? 'text-severity-moderate' : 'text-severity-critical')
                        }`}>{rep.analysis.safetyScore}%</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-center text-xs text-slate-500 py-12 italic">No saved reports found. Compile a prescription and select "Save Record" to create logs.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Detailed report layout */}
        <div className="lg:col-span-7">
          {selectedReport ? (
            <div className="glass-panel p-6 flex flex-col gap-6 animate-fade-in bg-white/40 border border-slate-200/50 rounded-2xl relative print:p-0 print:border-none print:shadow-none print:bg-transparent">
              
              {/* Actions Toolbar */}
              <div className="flex gap-2 justify-end border-b border-slate-200/50 pb-4 no-print">
                <button 
                  onClick={() => exportCSV(selectedReport)}
                  className="px-3 py-1.5 border border-slate-200 hover:border-medical-cyan/30 bg-white hover:bg-medical-cyan/5 text-slate-700 hover:text-medical-cyan rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" /> Export CSV
                </button>
                <button 
                  onClick={exportPDF}
                  className="px-3 py-1.5 border border-slate-200 hover:border-medical-purple/30 bg-white hover:bg-medical-purple/5 text-slate-700 hover:text-medical-purple rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" /> Export PDF / Print
                </button>
              </div>

              {/* Clinical report content wrapper */}
              <div id="clinical-print-area" className="flex flex-col gap-6 text-slate-700">
                
                {/* Printable Header - hidden digitally, active on print */}
                <div className="hidden print:flex justify-between items-center border-b-2 border-black pb-4 text-black">
                  <div>
                    <h1 className="text-xl font-bold">AEGISRX HEALTHCARE SYSTEMS</h1>
                    <p className="text-xs">Diagnostic Polypharmacy & Prescription Safety Advisor</p>
                  </div>
                  <div className="text-right text-xs">
                    <p>Report ID: #AE-{selectedReport.id}</p>
                    <p>Date: {new Date(selectedReport.created_at).toLocaleString()}</p>
                  </div>
                </div>

                {/* Patient Summary Header */}
                <div className="flex justify-between items-start gap-4">
                  <div className="flex flex-col gap-1">
                     <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Clinical Advisory Report</span>
                     <h2 className="text-xl font-black text-slate-800 print:text-black">{selectedReport.patient_name}</h2>
                     <span className="text-xs text-slate-500 print:text-slate-600">Created: {new Date(selectedReport.created_at).toLocaleString()}</span>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Safety Index</span>
                    <span className={`text-xl font-black ${
                      selectedReport.analysis.safetyScore >= 90 ? 'text-severity-low' : (selectedReport.analysis.safetyScore >= 70 ? 'text-severity-moderate' : 'text-severity-critical')
                    }`}>{selectedReport.analysis.safetyScore}/100</span>
                  </div>
                </div>

                {/* Prescription Table */}
                <div className="flex flex-col gap-2.5">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><ClipboardList className="w-4 h-4 text-medical-cyan" /> Prescription Regimen</span>
                  <div className="border border-slate-200 print:border-black rounded-xl overflow-hidden bg-white/50">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 print:bg-slate-200 print:text-black font-bold text-slate-500">
                          <th className="p-3">Medication Name</th>
                          <th className="p-3">Dosage</th>
                          <th className="p-3">Frequency</th>
                          <th className="p-3">Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedReport.prescription.map((d, idx) => (
                          <tr key={idx} className="border-b border-slate-100 last:border-0 print:border-black text-slate-700 print:text-black">
                            <td className="p-3 font-semibold">{d.name}</td>
                            <td className="p-3">{d.dosage}</td>
                            <td className="p-3">{d.frequency}</td>
                            <td className="p-3">{d.duration}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* AI warnings block */}
                <div className="flex flex-col gap-4">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><ShieldAlert className="w-4 h-4 text-severity-critical" /> Diagnostic Warnings</span>
                  
                  <div className="flex flex-col gap-3">
                    {selectedReport.analysis.allergies.length === 0 && 
                     selectedReport.analysis.contraindications.length === 0 && 
                     selectedReport.analysis.interactions.length === 0 && (
                      <div className="p-3 bg-severity-low/10 border border-severity-low/20 rounded-xl text-xs text-severity-low flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" /> Regimen is safe. No diagnostic warnings were compiled.
                      </div>
                    )}

                    {/* Allergies list */}
                    {selectedReport.analysis.allergies.map((a, idx) => (
                      <div key={idx} className="p-3 bg-severity-critical/10 border border-severity-critical/20 rounded-xl text-xs flex flex-col gap-1">
                        <span className="font-bold text-severity-critical">CRITICAL ALLERGY ALERT: {a.drug}</span>
                        <p className="text-slate-700 font-light">{a.reason}</p>
                        <p className="text-[10px] text-slate-650 italic mt-1 font-light"><span className="font-bold text-slate-700">Action:</span> {a.advice}</p>
                      </div>
                    ))}

                    {/* Contraindications list */}
                    {selectedReport.analysis.contraindications.map((c, idx) => (
                      <div key={idx} className="p-3 bg-severity-high/10 border border-severity-high/20 rounded-xl text-xs flex flex-col gap-1">
                        <span className="font-bold text-severity-high">Contraindication Warning: {c.drug} vs {c.condition}</span>
                        <p className="text-slate-700 font-light">{c.explanation}</p>
                        <p className="text-[10px] text-slate-650 italic mt-1 font-light"><span className="font-bold text-slate-700">Action:</span> {c.action}</p>
                      </div>
                    ))}

                    {/* Interactions list */}
                    {selectedReport.analysis.interactions.map((i, idx) => (
                      <div key={idx} className="p-3 bg-severity-moderate/10 border border-severity-moderate/20 rounded-xl text-xs flex flex-col gap-1">
                        <span className="font-bold text-severity-moderate">Drug Interaction: {i.drugA} + {i.drugB} ({i.severity.toUpperCase()})</span>
                        <p className="text-slate-700 font-light">{i.mechanism} - {i.clinicalImpact}</p>
                        <p className="text-[10px] text-slate-650 italic mt-1 font-light"><span className="font-bold text-slate-700">Action:</span> {i.recommendedAction}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><Activity className="w-4 h-4 text-medical-cyan" /> Advisor Summary</span>
                  <div className="p-3 bg-white/60 border border-slate-200 print:border-black rounded-xl text-xs text-slate-700 font-light leading-relaxed">
                    {selectedReport.analysis.recommendations}
                  </div>
                </div>

              </div>

            </div>
          ) : (
            <div className="glass-panel p-12 flex flex-col items-center justify-center text-center border border-dashed border-slate-200 rounded-2xl bg-white/40 h-96 no-print">
              <FileText className="w-12 h-12 text-slate-600 mb-4 animate-pulse-slow" />
              <h4 className="text-sm font-bold text-slate-700 mb-1">Clinical Reports Center</h4>
              <p className="text-xs text-slate-500 max-w-sm">
                Select a prescription log from the list on the left to read compiled warning parameters, export data, or print clinical charts.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default ReportTemplate;
