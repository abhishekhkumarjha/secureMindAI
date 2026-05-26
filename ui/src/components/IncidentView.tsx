import React, { useEffect, useState } from 'react';
import { 
  AlertTriangle, ShieldAlert, CheckCircle2, ListTodo, Plus, 
  Terminal, User, Activity, Flame, ArrowRight, ShieldCheck, 
  Trash2, HelpCircle, FileText, Sparkles
} from 'lucide-react';
import { mockIncidents } from '../mockData';
import { fetchIncidents, investigateIncident } from '../api';
import { Incident, IncidentGraphNode, IncidentGraphEdge } from '../types';

interface IncidentViewProps {
  selectedIncidentId: string | null;
  triggerSystemNotification: (message: string, type: 'info' | 'success' | 'warn' | 'error') => void;
}

export default function IncidentView({ 
  selectedIncidentId,
  triggerSystemNotification
}: IncidentViewProps) {
  
  // Choose requested incident, fallback to primary APT-39 core incident
  const initialIncident = mockIncidents.find(inc => inc.id === selectedIncidentId) || mockIncidents[0];
  const [incidents, setIncidents] = useState<Incident[]>(mockIncidents);
  const [activeIncidentId, setActiveIncidentId] = useState<string>(initialIncident.id);
  const currentIncident = incidents.find(inc => inc.id === activeIncidentId) || incidents[0];

  const [activeNode, setActiveNode] = useState<IncidentGraphNode | null>(currentIncident.nodes[0]);
  const [newNote, setNewNote] = useState('');
  const [completedRecs, setCompletedRecs] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchIncidents()
      .then(data => {
        if (data.length === 0) return;
        setIncidents(data);
        const nextIncident = data.find(inc => inc.id === selectedIncidentId) || data[0];
        setActiveIncidentId(nextIncident.id);
        setActiveNode(nextIncident.nodes[0] || null);
      })
      .catch(() => triggerSystemNotification('Using local demo incidents because the incident API is unavailable.', 'warn'));
  }, [selectedIncidentId]);

  // Change active incident
  const handleIncidentChange = (id: string) => {
    setActiveIncidentId(id);
    const targetInc = incidents.find(inc => inc.id === id) || incidents[0];
    setActiveNode(targetInc.nodes[0] || null);
    setCompletedRecs({});
  };

  // Append new note log
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    const noteText = newNote;
    setIncidents(prevIncidents => 
      prevIncidents.map(inc => {
        if (inc.id === currentIncident.id) {
          const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return {
            ...inc,
            notes: [`${timestamp} - Analyst: ${newNote}`, ...inc.notes]
          };
        }
        return inc;
      })
    );
    
    setNewNote('');
    triggerSystemNotification('Investigation note added to forensic file.', 'success');
    investigateIncident({ incident_id: currentIncident.id, note: noteText })
      .then(updated => {
        setIncidents(prev => prev.map(inc => inc.id === updated.id ? updated : inc));
      })
      .catch(() => triggerSystemNotification('Note saved locally; investigation API is unavailable.', 'warn'));
  };

  // Remove investigator note
  const handleDeleteNote = (idx: number) => {
    setIncidents(prevIncidents => 
      prevIncidents.map(inc => {
        if (inc.id === currentIncident.id) {
          const updatedNotes = [...inc.notes];
          updatedNotes.splice(idx, 1);
          return {
            ...inc,
            notes: updatedNotes
          };
        }
        return inc;
      })
    );
    triggerSystemNotification('Investigation note removed.', 'info');
  };

  // Checklist handler
  const toggleRec = (idx: number) => {
    const key = `${currentIncident.id}-${idx}`;
    setCompletedRecs(prev => {
      const nextVal = !prev[key];
      if (nextVal) {
        triggerSystemNotification('Mitigation step marked as COMPLETED.', 'success');
      }
      return {
        ...prev,
        [key]: nextVal
      };
    });
  };

  // Node position coordinates for clean representation inside responsive view
  // Generates 2D coordinates map for nodes positions to fit layout gracefully
  const getNodePosition = (nodeType: string, index: number, total: number) => {
    // Left-to-right flow diagram coords (max-width scaled 1000, height 300)
    switch(nodeType) {
      case 'attacker':
        return { cx: 80, cy: 150 };
      case 'firewall':
        return { cx: 240, cy: 150 };
      case 'user':
        return { cx: 440, cy: 70 };
      case 'server':
        return { cx: 440, cy: 230 };
      case 'database':
        return { cx: 680, cy: 230 };
      case 'cloud':
        return { cx: 680, cy: 70 };
      case 'ai':
        return { cx: 880, cy: 150 };
      default:
        // Circular math fallback on mismatch coordinates
        const theta = (2 * Math.PI * index) / total;
        return { 
          cx: 400 + 200 * Math.cos(theta), 
          cy: 150 + 100 * Math.sin(theta) 
        };
    }
  };

  // Render SVG Node styles
  const getNodeColor = (status: 'danger' | 'warning' | 'secure' | 'neutral') => {
    switch (status) {
      case 'danger': return '#ef4444';
      case 'warning': return '#f97316';
      case 'secure': return '#10b981';
      default: return '#64748b';
    }
  };

  // Resolve node target trigger
  const runNodeQuarantine = (nodeLabel: string) => {
    triggerSystemNotification(`Forensic containment script launched targeting asset [${nodeLabel}]. Syncing edge routers.`, 'success');
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* 1. Header Select & Core Meta stats */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-900 pb-4">
        <div>
          <span className="text-[10px] font-mono tracking-wider text-cyan-400 font-bold uppercase block">SECUREPLAY CORRELATION LABS</span>
          <h1 className="text-2xl font-display font-semibold text-white mt-1">Incident Graph & Root Cause Analyzer</h1>
          <p className="text-xs text-slate-400">Forensic reconstruction tree mapping compromised hosts, directory scopes, and unauth egress attempts.</p>
        </div>

        {/* Change Active Incident */}
        <div className="flex items-center gap-3 bg-slate-900 px-3 py-1.5 border border-slate-800 rounded-lg">
          <span className="text-[10px] font-mono text-slate-500 uppercase font-semibold">Active Incident Case:</span>
          <select 
            value={activeIncidentId} 
            onChange={(e) => handleIncidentChange(e.target.value)}
            className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer font-sans font-semibold"
          >
            {incidents.map((inc) => (
              <option key={inc.id} value={inc.id}>{inc.id}: {inc.title.slice(0, 36)}...</option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Interactive SVG Network Attack Correlation Diagram */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-4">
        
        <div className="flex items-center justify-between border-b border-slate-900 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h3 className="font-display font-medium text-sm text-slate-200">Interactive Attack Correlation Nodes</h3>
          </div>
          <p className="text-[10px] font-mono text-slate-500">
            CLICK GRAPH LABELS TO PIN TELEMETRY CONTROLS
          </p>
        </div>

        {/* Outer Grid for Graph + clicked node HUD details */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          
          {/* SVG canvas workspace layout */}
          <div className="relative xl:col-span-3 min-h-[300px] bg-slate-950 border border-slate-905 rounded-xl flex items-center justify-center overflow-hidden">
            
            {/* Overlay grid backdrops */}
            <div className="absolute inset-0 cyber-grid opacity-30 pointer-events-none"></div>

            <svg viewBox="0 0 960 300" className="w-[95%] h-auto relative z-10 select-none">
              
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="rgba(148, 163, 184, 0.5)" />
                </marker>
                <marker id="arrow-danger" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#ef4444" />
                </marker>
                <marker id="arrow-blocked" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
                </marker>
              </defs>

              {/* Edge connections paths */}
              {currentIncident.edges.map((edge, idx) => {
                const nodeFrom = currentIncident.nodes.find(n => n.id === edge.from);
                const nodeTo = currentIncident.nodes.find(n => n.id === edge.to);
                
                if (!nodeFrom || !nodeTo) return null;

                const fromIdx = currentIncident.nodes.indexOf(nodeFrom);
                const toIdx = currentIncident.nodes.indexOf(nodeTo);
                
                const start = getNodePosition(nodeFrom.type, fromIdx, currentIncident.nodes.length);
                const end = getNodePosition(nodeTo.type, toIdx, currentIncident.nodes.length);

                const isDanger = edge.type === 'compromised' || edge.type === 'active';
                const isBlocked = edge.type === 'blocked';

                return (
                  <g key={`edge-${idx}`}>
                    <path 
                      d={`M ${start.cx} ${start.cy} L ${end.cx} ${end.cy}`} 
                      stroke={isDanger ? '#ef4444' : isBlocked ? '#10b981' : '#475569'} 
                      strokeWidth={isDanger ? '2' : '1.5'}
                      strokeDasharray={isBlocked ? '3,3' : (edge.type === 'active' ? '5,1' : 'none')}
                      markerEnd={`url(#${isDanger ? 'arrow-danger' : isBlocked ? 'arrow-blocked' : 'arrow'})`}
                      className={isDanger ? 'animate-pulse' : ''}
                    />
                    {/* Tiny edge labels if hovered */}
                    {edge.label && (
                      <text 
                        x={(start.cx + end.cx) / 2} 
                        y={((start.cy + end.cy) / 2) - 8} 
                        textAnchor="middle" 
                        fill={isDanger ? '#f87171' : '#94a3b8'} 
                        fontSize="8" 
                        fontFamily="monospace"
                        className="bg-slate-950"
                      >
                        {edge.label}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Interactive Node circles */}
              {currentIncident.nodes.map((node, idx) => {
                const coord = getNodePosition(node.type, idx, currentIncident.nodes.length);
                const strokeColor = getNodeColor(node.status);
                const isSelected = activeNode?.id === node.id;

                return (
                  <g 
                    key={`node-${node.id}`} 
                    className="cursor-pointer group/cybernode"
                    onClick={() => setActiveNode(node)}
                  >
                    {/* Ring highlight if currently chosen */}
                    {isSelected && (
                      <circle cx={coord.cx} cy={coord.cy} r="25" stroke="#22d3ee" strokeWidth="1.5" strokeDasharray="3,2" fill="none" className="animate-spin" style={{ animationDuration: '10s' }} />
                    )}

                    {/* Outer pulse block */}
                    <circle cx={coord.cx} cy={coord.cy} r="18" fill="rgba(15, 23, 42, 0.9)" stroke={strokeColor} strokeWidth={isSelected ? '2.5' : '1.5'} className="group-hover/cybernode:scale-110 transition-transform duration-350" />
                    
                    {/* Dot Indicator inside */}
                    <circle cx={coord.cx} cy={coord.cy} r="4" fill={strokeColor} className={node.status === 'danger' ? 'animate-pulse' : ''} />
                    
                    {/* Custom asset icons labels underneath to stay highly legible */}
                    <rect x={coord.cx - 55} y={coord.cy + 22} width="110" height="24" rx="4" fill="rgba(8, 12, 24, 0.9)" stroke={isSelected ? '#22d3ee' : '#1e293b'} strokeWidth="1" />
                    <text x={coord.cx} y={coord.cy + 34} textAnchor="middle" fill="#f1f5f9" fontSize="8.5" fontWeight="semibold" fontFamily="sans-serif">
                      {node.label.length > 20 ? `${node.label.slice(0, 18)}..` : node.label}
                    </text>
                    <text x={coord.cx} y={coord.cy + 42} textAnchor="middle" fill="#64748b" fontSize="7" fontFamily="monospace">
                      {node.type.toUpperCase()}: {node.ip || 'INTERNAL'}
                    </text>
                  </g>
                );
              })}

            </svg>

            {/* Simulated instructions */}
            <div className="absolute bottom-3 left-4 p-2 bg-slate-900/60 border border-slate-800 rounded font-mono text-[9px] text-slate-500">
              Interactive attack path diagram. Blue dash circle represents query node scope index.
            </div>

          </div>

          {/* Right Selected Node diagnostic HUD */}
          <div className="bg-slate-900/40 border border-slate-850 rounded-xl p-4 flex flex-col justify-between">
            {activeNode ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <span className="text-[9px] font-mono tracking-wider text-slate-500 uppercase block">NODE DIAGNOSTIC DATA</span>
                  <h4 className="text-xs font-bold text-slate-200 font-sans tracking-wide leading-tight">{activeNode.label}</h4>
                  <p className="text-[10px] font-mono text-slate-400 bg-slate-950 p-1.5 rounded border border-slate-900 truncate">
                    IP: <span className="text-white font-semibold">{activeNode.ip || 'System Virtual Engine'}</span>
                  </p>
                </div>

                <div className="space-y-3.5 text-[11px] text-slate-300">
                  <div>
                    <span className="text-[9px] font-mono text-slate-500 uppercase block">ASSET TYPE THREAT LEVEL</span>
                    <span className="font-bold text-slate-200 capitalize">{activeNode.type}</span>
                  </div>

                  <div>
                    <span className="text-[9px] font-mono text-slate-500 uppercase block">DEVICE THREAT PROFILE</span>
                    <span className={`inline-flex items-center gap-1.5 font-bold font-mono text-[10px] mt-0.5 ${
                      activeNode.status === 'danger' ? 'text-red-400' :
                      activeNode.status === 'warning' ? 'text-orange-400' :
                      activeNode.status === 'secure' ? 'text-emerald-400' :
                      'text-slate-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        activeNode.status === 'danger' ? 'bg-red-500 animate-ping' :
                        activeNode.status === 'warning' ? 'bg-orange-500' :
                        activeNode.status === 'secure' ? 'bg-emerald-500' :
                        'bg-slate-500'
                      }`}></span>
                      {activeNode.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-slate-950 border border-slate-900">
                    <p className="text-[9px] font-mono text-slate-500 uppercase mb-0.5">FORENSIC REPORT STATUS</p>
                    <p className="text-slate-400 leading-normal">
                      {activeNode.status === 'danger' 
                        ? 'Continuous anomalies logged. Port-level scan triggered automatically. High relevance connections pending isolate.' 
                        : 'Baseline performance indices intact. Security filters applied regularly.'}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 space-y-2">
                  <button 
                    onClick={() => runNodeQuarantine(activeNode.label)}
                    className="w-full py-1.5 font-bold font-mono text-[9px] border bg-red-950/20 text-red-400 border-red-500/30 hover:bg-red-950/40 hover:border-red-500/50 rounded cursor-pointer transition-colors"
                  >
                    HOST QUARANTINE ON LAN
                  </button>
                  <button 
                    onClick={() => triggerSystemNotification(`Vulnerability audit scan complete for node [${activeNode.label}]. 0 patches found missing.`, 'info')}
                    className="w-full py-1.5 font-bold font-mono text-[9px] border bg-slate-800/40 text-slate-350 border-slate-700 hover:bg-slate-800/80 rounded cursor-pointer transition-colors"
                  >
                    TRIGGER AD HOC SEC-AUDIT
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-500 font-mono text-[10px] self-center py-12">
                <HelpCircle className="w-8 h-8 mx-auto mb-2 text-slate-700" />
                Select node label inside attack path map to load diagnostics.
              </div>
            )}
          </div>

        </div>

      </div>

      {/* 3. Bottom Columns: Timeline Tree VS Triage Checklist & Analyst Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Timetree Visual Analysis (Left col spans 2/3) */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-900 pb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <h3 className="font-display font-medium text-sm text-slate-200">Incident Event Correlation Timeline</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded">
              CHRONOLOGICAL LOGS
            </span>
          </div>

          {/* Chronological vertical steps */}
          <div className="space-y-4 max-h-[360px] overflow-y-auto pr-2 relative pl-2">
            
            {/* Center border rod */}
            <div className="absolute top-1 bottom-1 left-7 w-[2px] bg-slate-800 pointer-events-none"></div>

            {currentIncident.timeline.map((evt, idx) => (
              <div key={evt.id} className="relative flex gap-5 items-start pl-6 group">
                
                {/* Node type icon indicators */}
                <div className={`absolute left-4 w-7 h-7 -translate-x-1/2 rounded-full border flex items-center justify-center shrink-0 z-10 transition-colors ${
                  evt.type === 'alert' ? 'bg-red-950 text-red-400 border-red-500/40' :
                  evt.type === 'action' ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40' :
                  'bg-slate-950 text-slate-400 border-slate-800'
                }`}>
                  <span className="text-[9px] font-mono font-bold leading-none">{evt.timestamp}</span>
                </div>

                <div className="flex-1 bg-slate-900/30 border border-slate-900 rounded-lg p-3.5 space-y-1.5 hover:bg-slate-900/60 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <h4 className="text-xs font-bold text-slate-200 font-sans leading-snug">{evt.title}</h4>
                    <span className="text-[8px] font-mono text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-900 uppercase">
                      {evt.source}
                    </span>
                  </div>
                  <p className="text-[11.5px] text-slate-400 leading-normal">{evt.description}</p>
                </div>

              </div>
            ))}

          </div>
        </div>

        {/* Right 1/3: Response Recommendations Checklist & Live Notes Area */}
        <div className="space-y-6">
          
          {/* Action lists panel */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-4">
            
            <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
              <ListTodo className="w-4 h-4 text-cyan-400" />
              <h3 className="font-display font-medium text-sm text-slate-200">Mitigation Playbook Actions</h3>
            </div>

            <div className="space-y-2.5">
              {currentIncident.recommendations.map((rec, i) => {
                const key = `${currentIncident.id}-${i}`;
                const checked = !!completedRecs[key];
                return (
                  <div 
                    key={i} 
                    onClick={() => toggleRec(i)}
                    className={`flex items-start gap-3 p-2.5 rounded-lg border transition-all cursor-pointer ${
                      checked 
                        ? 'bg-emerald-950/10 border-emerald-500/20 text-slate-500 hover:bg-emerald-950/25' 
                        : 'bg-slate-900/40 border-slate-850 hover:bg-slate-900/80 text-slate-300'
                    }`}
                  >
                    <div className="mt-0.5">
                      <input 
                        type="checkbox" 
                        checked={checked} 
                        onChange={() => {}} // toggled on card click
                        className="rounded border-slate-700 bg-slate-850 text-cyan-500 focus:ring-cyan-500/20 focus:ring-offset-0 focus:ring-0 focus:outline-none pointer-events-none"
                      />
                    </div>
                    <p className={`text-[11px] leading-tight ${checked ? 'line-through text-slate-500 font-medium' : 'font-medium'}`}>
                      {rec}
                    </p>
                  </div>
                );
              })}
            </div>

          </div>

          {/* Analyst Case Notes panel with additions storage */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <h3 className="font-display font-medium text-sm text-slate-200">Investigation Logs & Notes</h3>
              </div>
              <span className="text-[8px] font-mono text-slate-500">
                OUT-OF-BAND SECURE
              </span>
            </div>

            {/* Note addition form */}
            <form onSubmit={handleAddNote} className="flex gap-2">
              <input 
                type="text" 
                placeholder="Append live discovery or node audit insight..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="w-full text-xs h-9 bg-slate-900 border border-slate-800 rounded-md pl-3 pr-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
              />
              <button 
                type="submit"
                className="w-9 h-9 shrink-0 bg-cyan-700 hover:bg-cyan-600 rounded-md flex items-center justify-center text-white cursor-pointer transition-colors"
                title="Append to Case Files"
              >
                <Plus className="w-4.5 h-4.5" />
              </button>
            </form>

            {/* Notes output */}
            <div className="divide-y divide-slate-900 max-h-[160px] overflow-y-auto pr-1 space-y-2">
              {currentIncident.notes.length > 0 ? (
                currentIncident.notes.map((note, idx) => (
                  <div key={idx} className="pt-2 text-[10.5px] font-mono text-slate-300 leading-relaxed flex items-start justify-between gap-3 group/note">
                    <p className="flex-1 text-slate-400 select-all leading-normal">
                      {note}
                    </p>
                    <button 
                      onClick={() => handleDeleteNote(idx)}
                      className="text-slate-600 hover:text-red-400 transition-colors shrink-0 md:opacity-0 group-hover/note:opacity-100 cursor-pointer pt-0.5"
                      title="Delete Note"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-600 text-[10px] font-mono">
                  No investigator notes logged for parent incident case.
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
