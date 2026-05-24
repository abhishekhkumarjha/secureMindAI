import { useState } from 'react';
import { 
  Terminal, Search, Download, ChevronDown, ChevronUp, Filter,
  ShieldCheck, ShieldAlert, AlertTriangle, PlayCircle, Minimize2, Copy, Check
} from 'lucide-react';
import { mockLogs } from '../mockData';
import { SecurityLog, SeverityType } from '../types';

interface LogsViewProps {
  triggerSystemNotification: (message: string, type: 'info' | 'success' | 'warn' | 'error') => void;
}

export default function LogsView({ triggerSystemNotification }: LogsViewProps) {
  const [logs, setLogs] = useState<SecurityLog[]>(mockLogs);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(mockLogs[0].id); // expand first by default
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Generate unique filter selectors
  const logTypes = ['all', ...Array.from(new Set(mockLogs.map(l => l.type)))];
  const logActions = ['all', ...Array.from(new Set(mockLogs.map(l => l.action)))];

  // Logs filters evaluation
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;
    const matchesType = typeFilter === 'all' || log.type === typeFilter;
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;

    return matchesSearch && matchesSeverity && matchesType && matchesAction;
  });

  // Toggle rows logic
  const toggleRow = (id: string) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  // Copy helper
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    triggerSystemNotification('Raw payload JSON copied to clipboard.', 'success');
    setTimeout(() => {
      setCopiedId(null);
    }, 1500);
  };

  // Safe file downloader
  const downloadLogsJSON = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `SecureMind_SOC_Syslogs_${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    triggerSystemNotification(`Saved ${filteredLogs.length} matching logging rows to local JSON file.`, 'success');
  };

  return (
    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-4 pb-12">
      
      {/* Page Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <h2 className="font-display font-semibold text-lg text-white">Central Security Syslog Vault</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">Real-time unauth access detection, SSO audit streams, and gateway VPC telemetry logs index.</p>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-3">
          <button 
            onClick={downloadLogsJSON}
            className="h-9 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg flex items-center gap-2 text-xs text-slate-300 font-medium cursor-pointer transition-colors"
            title="Download Syslog Payload CSV"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>Export Search JSON ({filteredLogs.length})</span>
          </button>
        </div>
      </div>

      {/* Grid controllers headers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        
        {/* Search Input bar */}
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search keywords, IPv4 address, rule IDs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9 bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
          />
        </div>

        {/* Severity selection */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-2.5 h-9">
          <span className="text-[9px] font-mono text-slate-500 uppercase shrink-0">SEVERITY:</span>
          <select 
            value={severityFilter} 
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-transparent text-xs text-slate-300 focus:outline-none w-full"
          >
            <option value="all">ALL</option>
            <option value="critical">CRITICAL</option>
            <option value="high">HIGH</option>
            <option value="medium">MEDIUM</option>
            <option value="low">LOW</option>
          </select>
        </div>

        {/* Log source/type selection */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-2.5 h-9">
          <span className="text-[9px] font-mono text-slate-500 uppercase shrink-0">TYPE:</span>
          <select 
            value={typeFilter} 
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-transparent text-xs text-slate-300 focus:outline-none w-full"
          >
            {logTypes.map((typ, index) => (
              <option key={index} value={typ}>{typ === 'all' ? 'ALL CORE' : typ}</option>
            ))}
          </select>
        </div>

        {/* Firewall action policy search selector */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-2.5 h-9">
          <span className="text-[9px] font-mono text-slate-500 uppercase shrink-0">ACTION:</span>
          <select 
            value={actionFilter} 
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-transparent text-xs text-slate-300 focus:outline-none w-full"
          >
            {logActions.map((act, index) => (
              <option key={index} value={act}>{act === 'all' ? 'ALL ACTIONS' : act}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Main expanded details grid layout table */}
      <div className="border border-slate-900 rounded-xl overflow-hidden mt-3">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900/45 border-b border-slate-900 font-mono text-[9px] text-slate-500 uppercase tracking-wider select-none">
              <th className="py-3 px-4 w-10"></th>
              <th className="py-3 px-4">Log Token</th>
              <th className="py-3 px-4">Syslog Payload & Rule Indicator</th>
              <th className="py-3 px-4">Internal Classification</th>
              <th className="py-3 px-4">Source Device</th>
              <th className="py-3 px-4">Policy Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900 text-xs text-slate-300">
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log) => {
                const isExpanded = expandedLogId === log.id;
                return (
                  <g key={`log-row-${log.id}`} className="contents">
                    {/* Primary row displaying basic elements */}
                    <tr 
                      onClick={() => toggleRow(log.id)}
                      className={`hover:bg-slate-900/40 transition-colors cursor-pointer select-none ${
                        isExpanded ? 'bg-slate-900/20' : 'bg-transparent'
                      }`}
                    >
                      <td className="py-3 px-4 text-center">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-500" />
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-slate-400">
                        {log.id}
                        <span className="block text-[8px] text-slate-600 font-normal mt-0.5">
                          {log.timestamp.slice(11, 19)} UTC
                        </span>
                      </td>

                      <td className="py-3 px-4 max-w-sm md:max-w-md">
                        <p className="text-slate-200 font-medium truncate leading-tight">{log.message}</p>
                        <p className="text-[10px] text-slate-500 truncate font-mono mt-1">Rule ID: {log.payload.ruleID || log.payload.firewallRule || log.payload.sha256Hash || 'DEFAULT_COMPLIANCE'}</p>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-[8.5px] font-mono font-extrabold uppercase rounded px-1.5 py-0.5 border leading-none ${
                            log.severity === 'critical' ? 'bg-red-950/40 text-red-400 border-red-500/20' :
                            log.severity === 'high' ? 'bg-orange-950/40 text-orange-400 border-orange-500/20' :
                            log.severity === 'medium' ? 'bg-yellow-950/40 text-yellow-400 border-yellow-500/20' :
                            'bg-green-950/40 text-green-400 border-green-500/20'
                          }`}>
                            {log.severity}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono hidden md:inline">{log.type}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                        {log.source}
                        <span className="block text-[8px] text-slate-600 mt-0.5">→ {log.destination}</span>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`text-[9.5px] font-mono font-semibold px-2 py-0.5 rounded border ${
                          log.action === 'BLOCKED' ? 'bg-red-950/20 text-red-400 border-red-500/25' :
                          log.action === 'ALLOWED' ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/25' :
                          log.action === 'QUARANTINED' ? 'bg-orange-950/20 text-orange-400 border-orange-500/25' :
                          'bg-yellow-950/20 text-yellow-400 border-yellow-500/25'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                    </tr>

                    {/* Secondary details collapsible container box nested nicely in table */}
                    {isExpanded && (
                      <tr className="bg-slate-950">
                        <td colSpan={6} className="py-4.5 px-6 border-t border-b border-slate-900">
                          
                          <div className="space-y-4">
                            
                            {/* Inner Header with actions inside detailed view */}
                            <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                              <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase flex items-center gap-1.5">
                                <Terminal className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                                RAW SECURITY DATA OBJECT (JSON METRICS FRAME)
                              </span>
                              
                              <div className="flex items-center gap-3">
                                <button 
                                  onClick={() => copyToClipboard(JSON.stringify(log.payload, null, 2), log.id)}
                                  className="px-2.5 py-1 text-[10px] font-mono bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-200 rounded flex items-center gap-1.5 cursor-pointer transition-colors"
                                  title="Copy raw JSON format payload"
                                >
                                  {copiedId === log.id ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-400" />
                                      <span className="text-emerald-400">Payload copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>Copy Payload</span>
                                    </>
                                  )}
                                </button>
                                <button 
                                  onClick={() => triggerSystemNotification(`IP ${log.source} added to permanent edge blacklist configuration.`, 'success')}
                                  className="px-2.5 py-1 text-[10px] font-mono bg-red-950/40 text-red-400 border border-red-500/20 hover:border-red-500/50 rounded flex items-center gap-1.5 cursor-pointer transition-colors"
                                >
                                  Block IP {log.source}
                                </button>
                              </div>
                            </div>

                            {/* Stylized raw structure wrapper */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                              
                              {/* Left Columns: Key Value grid */}
                              <div className="lg:col-span-2 space-y-2.5 text-xs text-slate-400">
                                <div className="grid grid-cols-3 gap-3 border-b border-slate-900 py-1 font-mono">
                                  <span className="text-slate-500 text-[10px]">TIMESTAMP:</span>
                                  <span className="col-span-2 text-slate-300 font-sans">{log.timestamp}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-3 border-b border-slate-900 py-1 font-mono">
                                  <span className="text-slate-500 text-[10px]">ATTACK CATEGORY:</span>
                                  <span className="col-span-2 text-slate-300 font-sans">{log.type} SYSTEM LOG</span>
                                </div>
                                <div className="grid grid-cols-3 gap-3 border-b border-slate-900 py-1 font-mono">
                                  <span className="text-slate-500 text-[10px]">SOURCE ADDR:</span>
                                  <span className="col-span-2 text-white font-bold">{log.source}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-3 border-b border-slate-900 py-1 font-mono">
                                  <span className="text-slate-500 text-[10px]">DEST PORT:</span>
                                  <span className="col-span-2 text-slate-300">
                                    {log.payload.port || log.payload.httpMethod || 'TCP 443 / HTTPS'}
                                  </span>
                                </div>
                                <div className="grid grid-cols-3 gap-3 border-b border-slate-900 py-1 font-mono">
                                  <span className="text-slate-500 text-[10px]">POLICY COMPLIANCE:</span>
                                  <span className="col-span-2 text-slate-300 font-sans">
                                    SecOps standard compliance policy #884A
                                  </span>
                                </div>
                              </div>

                              {/* Right Column: Code viewer containing beautiful JSON highlights */}
                              <div className="rounded-xl border border-slate-900 bg-slate-950 p-4 font-mono text-[11px] h-40 overflow-y-auto relative flex flex-col justify-between">
                                <span className="absolute top-2 right-2 text-[8px] text-slate-600 bg-slate-900 px-1 py-0.5 rounded">
                                  JSON OBJECT
                                </span>
                                
                                <pre className="text-cyan-400 select-all overflow-x-auto">
                                  {JSON.stringify(log.payload, null, 2)}
                                </pre>

                              </div>

                            </div>

                          </div>

                        </td>
                      </tr>
                    )}
                  </g>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="text-center py-16 text-slate-600 font-mono text-xs">
                  <Minimize2 className="w-10 h-10 text-slate-800 mx-auto mb-3 animate-pulse" />
                  No system logs found matching search terms.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
