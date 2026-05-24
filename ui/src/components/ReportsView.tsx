import { useState } from 'react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend 
} from 'recharts';
import { 
  FileText, Download, Calendar, Filter, Sparkles, TrendingUp, 
  Settings, CheckCircle2, ChevronRight, RefreshCw, AlertOctagon
} from 'lucide-react';
import { mockSystemStats } from '../mockData';

interface ReportsViewProps {
  triggerSystemNotification: (message: string, type: 'info' | 'success' | 'warn' | 'error') => void;
}

export default function ReportsView({ triggerSystemNotification }: ReportsViewProps) {
  const [downloadingType, setDownloadingType] = useState<'pdf' | 'csv' | null>(null);
  const [reportRange, setReportRange] = useState('30days');

  // Simulated reports catalog
  const reportsList = [
    { title: 'ISO-27001 Perimeter Compliance Audit', date: 'May 2026', size: '14.2 MB', author: 'SecureMind Heuristic', status: 'Approved' },
    { title: 'Q2 Targeted Attack Vulnerability Assessment', date: 'Apr 2026', size: '42.8 MB', author: 'Senior Engineer', status: 'Pending Review' },
    { title: 'Active Directory Kerberoasting Threat Mitigation Log', date: 'Mar 2026', size: '8.4 MB', author: 'System Automation', status: 'Archived' },
  ];

  // Static Monthly alerts count matching cyber reports
  const monthlyData = [
    { month: 'Dec 25', blocked: 45000, critical: 8, high: 22 },
    { month: 'Jan 26', blocked: 52000, critical: 12, high: 28 },
    { month: 'Feb 26', blocked: 48000, critical: 10, high: 18 },
    { month: 'Mar 26', blocked: 61000, critical: 15, high: 32 },
    { month: 'Apr 26', blocked: 68000, critical: 19, high: 41 },
    { month: 'May 26', blocked: 74200, critical: 4, high: 14 } // active
  ];

  // PDF Export Trigger
  const runExportFile = (format: 'pdf' | 'csv') => {
    setDownloadingType(format);
    
    setTimeout(() => {
      setDownloadingType(null);
      if (format === 'pdf') {
        // Mock PDF file trigger
        const blob = new Blob(['SecureMind SOC Cryptographic Report Draft Approved'], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `SecureMind_SOC_ExecutiveReport_${reportRange}.pdf`;
        a.click();
        triggerSystemNotification('PDF Executive Report compiled and exported.', 'success');
      } else {
        // Mock CSV dump
        const blob = new Blob(['Metric,Value\nOverall_Risk_Factor,78\nActive_Threats,14\nTotal_Firewall_Blocks_Weekly,45310'], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `SecureMind_ThreatStats_${reportRange}.csv`;
        a.click();
        triggerSystemNotification('Threat raw stats CSV file exported successfully.', 'success');
      }
    }, 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* 1. Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-4">
        <div>
          <span className="text-[10px] font-mono tracking-wider text-cyan-400 font-bold uppercase block">COMPLIANCE & RISK METRICS DESK</span>
          <h1 className="text-2xl font-display font-semibold text-white mt-1">SOC Reports & Executive Analytics</h1>
          <p className="text-xs text-slate-400">Download formatted compliance PDF briefs, analyze raw attack count statistics, and review monthly trend metrics.</p>
        </div>

        {/* Range selectors */}
        <div className="flex items-center gap-3 bg-slate-900 px-3 py-1.5 border border-slate-800 rounded-lg">
          <Calendar className="w-4 h-4 text-slate-500" />
          <select 
            value={reportRange} 
            onChange={(e) => setReportRange(e.target.value)}
            className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer font-sans"
          >
            <option value="today">Today (Last 24h)</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days (Standard Audit)</option>
            <option value="90days">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* 2. Top Executive Download Trigger HUD */}
      <div className="bg-gradient-to-r from-slate-950 to-blue-950/20 border border-slate-800 rounded-xl p-5 relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        
        <div className="absolute inset-0 cyber-grid opacity-30 pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-2xl pointer-events-none"></div>

        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest font-bold">Heuristic report draft generation</span>
          </div>
          <h3 className="font-sans font-semibold text-sm md:text-base text-slate-200 leading-snug">Generate Executive Threat Intelligence Briefing</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Our autonomous compiler will parse the current incident queue, aggregate active firewall logs, and build an ISO-compliant executive report containing complete MITRE playbook recommendations.
          </p>
        </div>

        {/* PDF/CSV Download Buttons */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => runExportFile('csv')}
            disabled={downloadingType !== null}
            className="h-10 px-4 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 font-semibold font-sans text-xs rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all uppercase"
          >
            {downloadingType === 'csv' ? (
              <>
                <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
                <span>compiling csv...</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 text-slate-400" />
                <span>Export CSV Brief</span>
              </>
            )}
          </button>
          
          <button
            onClick={() => runExportFile('pdf')}
            disabled={downloadingType !== null}
            className="h-10 px-4 bg-gradient-to-r from-blue-700 to-cyan-700 hover:from-blue-600 hover:to-cyan-600 text-white font-bold font-sans text-xs rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all uppercase"
          >
            {downloadingType === 'pdf' ? (
              <>
                <RefreshCw className="w-4 h-4 text-white animate-spin" />
                <span>formatting pdf...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-white" />
                <span>Download Executive PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3. Recharts statistics: monthly trends bar components */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left 2/3: Monthly Security blocks overview */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-900 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <h3 className="font-display font-medium text-sm text-slate-205">Monthly IDS Block Incidents</h3>
            </div>
            <span className="text-[9px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded uppercase font-semibold">
              6-Month scale
            </span>
          </div>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#475569" fontSize={10} fontFamily="monospace" tickLine={false} />
                <YAxis stroke="#475569" fontSize={10} fontFamily="monospace" tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '11px', color: '#f1f5f9' }}
                />
                <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace', marginTop: '10px' }} />
                <Bar dataKey="blocked" name="Total IP Attacks Dropped" fill="#0ea5e9" opacity={0.8} />
                <Bar dataKey="high" name="High Risk Vectors Mapped" fill="#f97316" />
                <Bar dataKey="critical" name="Critical Case Breaches Triggered" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 1/3: Simulated compliance requirements score */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-medium text-sm text-slate-200">ISO-27001 Security Score</h3>
              <span className="text-[10px] bg-slate-900 text-slate-400 font-mono px-2 py-0.5 rounded border border-slate-800 font-semibold uppercase">
                PASSING
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">Percent matches against standardized international cybersecurity frameworks.</p>
          </div>

          {/* Compliance targets bars */}
          <div className="space-y-4 my-4 flex-1">
            
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300">ISO-27001 Identity Controls</span>
                <span className="text-cyan-400 font-bold">100%</span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-405 h-full w-[100%]"></div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300">NIST Incident Response Plan</span>
                <span className="text-orange-400 font-bold">92%</span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-orange-400 h-full w-[92%]"></div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300">PCI-DSS Decryption Keys Audit</span>
                <span className="text-emerald-400 font-bold">85%</span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-emerald-405 h-full w-[85%]"></div>
              </div>
            </div>

          </div>

          <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-lg">
            <p className="text-[10.5px] text-slate-400 leading-normal font-mono">
              ★ RECOMMENDATION: MFA bypass metrics observed on Corey Page session indicates a need to enforce FIDO2 passwordless enforcement.
            </p>
          </div>
        </div>

      </div>

      {/* 4. Archival Reports Catalog Ledger */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-4">
        
        <div>
          <h3 className="font-display font-medium text-sm text-slate-200">Historical Compliance Reports Archives</h3>
          <p className="text-xs text-slate-400 mt-0.5">Access historic pentest reports and automated threat intelligence briefly logs.</p>
        </div>

        <div className="divide-y divide-slate-900 text-xs">
          {reportsList.map((rep, idx) => (
            <div key={idx} className="py-3 flex items-center justify-between hover:bg-slate-900/20 px-2 rounded-md transition-all group">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                <div>
                  <h4 className="font-semibold text-slate-200 leading-tight">{rep.title}</h4>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1 font-mono">
                    <span>Date: {rep.date}</span>
                    <span>•</span>
                    <span>File Size: {rep.size}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className={`text-[9px] font-mono border px-1.5 rounded uppercase ${
                  rep.status === 'Approved' ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/20' :
                  rep.status === 'Archived' ? 'bg-slate-900 text-slate-500 border-slate-850' :
                  'bg-yellow-950/20 text-yellow-500 border-yellow-500/20 animate-pulse'
                }`}>
                  {rep.status}
                </span>
                
                <button 
                  onClick={() => triggerSystemNotification(`Downloading index archive file: ${rep.title}`, 'info')}
                  className="p-1 px-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-850 hover:border-slate-700 text-[10px] font-mono text-slate-300 rounded cursor-pointer transition-colors"
                >
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>

    </div>
  );
}
