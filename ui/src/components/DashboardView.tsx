import { useState, useEffect } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { 
  ShieldCheck, ShieldAlert, AlertOctagon, Flame, MapPin, 
  Activity, ArrowUpRight, ArrowDownRight, Terminal, Sparkles, 
  ChevronRight, RefreshCw, Layers, ShieldHalf, Play
} from 'lucide-react';
import { mockThreats, mockIncidents, mockSystemStats, mockLogs } from '../mockData';
import { Threat, Incident, SeverityType } from '../types';

interface DashboardViewProps {
  onViewChange: (view: any) => void;
  onSelectIncident: (incId: string) => void;
  triggerSystemNotification: (message: string, type: 'info' | 'success' | 'warn' | 'error') => void;
}

export default function DashboardView({ 
  onViewChange, 
  onSelectIncident,
  triggerSystemNotification
}: DashboardViewProps) {
  
  const [liveStats, setLiveStats] = useState(mockSystemStats);
  const [activeTab, setActiveTab] = useState<'trends' | 'heatmap'>('trends');
  const [liveLogs, setLiveLogs] = useState(mockLogs.slice(0, 5));
  const [hoveredCountry, setHoveredCountry] = useState<any>(null);
  const [selectedIncident, setSelectedIncident] = useState<any>(mockIncidents[0]);

  // Simulate a live attack feed in real-time
  useEffect(() => {
    const interval = setInterval(() => {
      // Pick random security log template or generate random threat ping
      const randomIPs = ['198.51.100.12', '203.0.113.88', '195.201.8.14', '85.25.101.4', '109.244.1.99'];
      const actions = ['BLOCKED', 'ALLOWED', 'QUARANTINED', 'ALERTED'];
      const messageTypes = [
        'Brute-force SSH logs overload detected at router pool',
        'VPC Flow: Outbound UDP stream matched high-risk TOR network gateway',
        'EDR Agent: High privilege credential read on system process memory',
        'WAF: Suspicious SQL signature sanitization bypassed on custom checkout endpoint',
        'Kubernetes API probe blocked: RBAC rule mismatch on user-manager config'
      ];
      const types = ['Firewall', 'VPC Flows', 'EDR Agent', 'SSO Auth', 'WAF'] as const;
      const severities = ['low', 'medium', 'high', 'critical'] as const;

      const randomIP = randomIPs[Math.floor(Math.random() * randomIPs.length)];
      const randomAction = actions[Math.floor(Math.random() * actions.length)] as any;
      const randomMsg = messageTypes[Math.floor(Math.random() * messageTypes.length)];
      const randomType = types[Math.floor(Math.random() * types.length)];
      const randomSeverity = severities[Math.floor(Math.random() * severities.length)];

      const newLog = {
        id: `LOG-LIVE-${Math.floor(Math.random() * 80000) + 10000}`,
        timestamp: new Date().toISOString(),
        message: randomMsg,
        source: randomIP,
        destination: '10.140.10.1',
        severity: randomSeverity as SeverityType,
        type: randomType,
        action: randomAction,
        payload: { eventId: Math.floor(Math.random() * 9999) + 1000 }
      };

      setLiveLogs(prev => [newLog, ...prev.slice(0, 4)]);

      // Randomly update system metrics to simulate changing SOC workloads
      setLiveStats(prev => {
        const change = Math.random() > 0.5 ? 1 : -1;
        const newActive = Math.max(10, Math.min(30, prev.activeThreats + (Math.random() > 0.7 ? change : 0)));
        return {
          ...prev,
          activeThreats: newActive
        };
      });

      // Show alert under critical additions
      if (randomSeverity === 'critical' && Math.random() > 0.60) {
        triggerSystemNotification(`Critical event: ${randomMsg} [Source: ${randomIP}]`, 'error');
      }

    }, 4500);

    return () => clearInterval(interval);
  }, [triggerSystemNotification]);

  // Risk Score Color Computation
  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-500';
    if (score >= 50) return 'text-orange-500';
    if (score >= 30) return 'text-yellow-500';
    return 'text-green-500';
  };

  // Mitigation Playbook triggers
  const runMitigationPlaybook = (playbookName: string, targetAsset: string) => {
    triggerSystemNotification(`Mitigation Playbook "${playbookName}" successfully executed on asset "${targetAsset}".`, 'success');
  };

  // Generate 7 (days) x 12 (hours) Heatmap cells
  const heatmapDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const heatmapHours = ['00-02', '02-04', '04-06', '06-08', '08-10', '10-12', '12-14', '14-16', '16-18', '18-20', '20-22', '22-00'];
  
  // Simulated heatmap incident density
  const getHeatmapColor = (day: string, hour: string) => {
    const seed = (day.charCodeAt(0) + hour.charCodeAt(3)) % 10;
    if (seed > 8) return 'bg-red-500/85 text-red-100'; // Critical block
    if (seed > 6) return 'bg-orange-500/70 text-orange-100';
    if (seed > 4) return 'bg-yellow-500/50 text-yellow-100';
    if (seed > 2) return 'bg-cyan-500/30 text-cyan-100';
    return 'bg-slate-900/40 text-slate-500';
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* 1. Header & Live SOC Broadcast Status */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono tracking-wider text-cyan-400 font-bold uppercase block">VIRTUAL SECURITY OPERATIONS CENTER CONTROLS</span>
          <h1 className="text-2xl font-display font-semibold tracking-tight text-white mt-1">Enterprise Security Status Map</h1>
          <p className="text-xs text-slate-400">Continuous AI correlation across cloud architecture namespaces and perimeter points.</p>
        </div>

        {/* Global Security Summary Card */}
        <div className="flex items-center gap-3.5 px-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl max-w-sm">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-200">Mitigation Shields Armed</span>
              <span className="px-1 py-0.5 rounded text-[8px] font-bold font-mono bg-emerald-500 text-slate-950">ACTIVE</span>
            </div>
            <p className="text-[10px] text-slate-400">All firewalls syncing dynamically with AI threat vectors.</p>
          </div>
        </div>
      </div>

      {/* 2. Quad Corporate Key Metric Telemetries */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" id="stats-panel-grid">
        
        {/* Metric 1: Overall Risk Score Radial Visual */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between relative overflow-hidden group">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase">SYS RISK FACTOR</span>
            <div className="text-2xl font-display font-semibold text-white">78<span className="text-xs text-slate-500 font-sans">/100</span></div>
            <div className="flex items-center gap-1 font-mono text-[10px] text-red-400">
              <ArrowUpRight className="w-3 h-3" />
              <span>+4.2% (Hourly spike)</span>
            </div>
          </div>
          {/* Radial visual meter */}
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="32" cy="32" r="26" stroke="#1e293b" strokeWidth="4" fill="transparent" />
              <circle cx="32" cy="32" r="26" stroke="#f97316" strokeWidth="5" fill="transparent" 
                strokeDasharray={163} strokeDashoffset={163 - (163 * 78) / 100}
                className="transition-all duration-1000" />
            </svg>
            <div className="absolute font-mono text-xs text-orange-400 font-bold">HIGH</div>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-xl pointer-events-none"></div>
        </div>

        {/* Metric 2: Active Threats */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between relative overflow-hidden group">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase">THREAT ARTIFACT QUEUE</span>
            <div className="text-2xl font-display font-semibold text-white">{liveStats.activeThreats}</div>
            <div className="flex items-center gap-1 font-mono text-[10px] text-emerald-400">
              <ArrowDownRight className="w-3 h-3" />
              <span>-3 Resolved last hour</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl pointer-events-none"></div>
        </div>

        {/* Metric 3: Critical Unresolved Incidents */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between relative overflow-hidden group">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase">CRITICAL INCIDENTS</span>
            <div className="text-2xl font-display font-semibold text-red-500">{liveStats.criticalIncidents}</div>
            <div className="flex items-center gap-1 font-mono text-[10px] text-rose-400">
              <Activity className="w-3.5 h-3.5 text-red-500 animate-pulse" />
              <span>APT-39 Active Session</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <Flame className="w-5 h-5 text-red-400 animate-pulse" />
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-xl pointer-events-none"></div>
        </div>

        {/* Metric 4: Automated Playbook Status */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between relative overflow-hidden group">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase">SOAR REMEDIATIONS</span>
            <div className="text-2xl font-display font-semibold text-emerald-400">{liveStats.incidentsResolvedToday}</div>
            <div className="flex items-center gap-1 font-mono text-[10px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>100% Success integration</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Layers className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none"></div>
        </div>

      </div>

      {/* 3. Combined Interactive Map Panel and Severity Distribution PIE */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left 2/3: Interactive Geo Attack Map using custom vector lines & pulsing targets */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 xl:col-span-2 flex flex-col justify-between min-h-[400px]">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <h3 className="font-display font-medium text-sm text-slate-200">Global Cyber Threat Vector Map</h3>
              </div>
              <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                LIVE TRAJECTORIES SHOWN (MAPPED TO IP REPUTATION)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Select or hover pinpoint targets to lock threat coordinates and review historical firewall blocks.
            </p>
          </div>

          {/* Map display representation (Clean corporate style) */}
          <div className="relative my-4 flex-1 w-full min-h-[220px] bg-slate-900/30 border border-slate-900 rounded-lg overflow-hidden flex items-center justify-center">
            
            {/* World Grid Map Backdrop Pattern */}
            <div className="absolute inset-0 cyber-grid opacity-60"></div>
            
            {/* Elegant SVG simplified world outline with neon hubs */}
            <svg viewBox="0 0 1000 480" className="w-[90%] h-auto opacity-75 relative z-10 select-none">
              {/* North America */}
              <path d="M120 100 C 150 90, 220 110, 250 140 C 270 160, 240 190, 220 220 C 180 250, 160 210, 140 210 C 110 210, 80 180, 120 100 Z" fill="rgba(30, 41, 59, 0.4)" stroke="rgba(51, 65, 85, 0.5)" strokeWidth="1" />
              {/* South America */}
              <path d="M220 260 C 240 280, 260 380, 220 420 C 180 440, 170 380, 180 340 C 180 300, 200 280, 220 260 Z" fill="rgba(30, 41, 59, 0.4)" stroke="rgba(51, 65, 85, 0.5)" strokeWidth="1" />
              {/* Europe/Africa */}
              <path d="M430 110 C 480 80, 520 120, 530 150 C 510 180, 480 200, 490 240 C 500 280, 540 380, 490 420 C 470 410, 450 360, 430 320 C 400 300, 390 240, 410 200 C 400 170, 410 130, 430 110 Z" fill="rgba(30, 41, 59, 0.4)" stroke="rgba(51, 65, 85, 0.5)" strokeWidth="1" />
              {/* Asia / Russia */}
              <path d="M540 100 C 650 60, 850 80, 880 150 C 850 200, 800 180, 780 240 C 740 280, 820 320, 780 360 C 720 380, 680 320, 640 300 C 580 300, 560 220, 540 200 C 530 160, 520 120, 540 100 Z" fill="rgba(30, 41, 59, 0.4)" stroke="rgba(51, 65, 85, 0.5)" strokeWidth="1" />
              {/* Australia */}
              <path d="M780 340 C 820 340, 860 360, 840 410 C 800 420, 760 400, 780 340 Z" fill="rgba(30, 41, 59, 0.4)" stroke="rgba(51, 65, 85, 0.5)" strokeWidth="1" />

              {/* Target (Center Hub - US Primary SOC / Servers) */}
              <g className="cursor-pointer">
                <circle cx="200" cy="180" r="16" fill="rgba(6, 182, 212, 0.15)" />
                <circle cx="200" cy="180" r="8" fill="rgba(6, 182, 212, 0.3)" />
                <circle cx="200" cy="180" r="3" fill="#22d3ee" className="animate-pulse" />
                {/* Ping rings */}
                <circle cx="200" cy="180" r="24" stroke="rgba(6, 182, 212, 0.2)" strokeWidth="1" fill="none" className="scale-100 transform origin-center animate-ping" />
              </g>

              {/* Threat trajectories (Curved paths using quadratic bezier curves) */}
              {/* Point 1: Germany SSH Botnet Host */}
              <path d="M 480 140 Q 340 110 200 180" fill="none" stroke="#f97316" strokeWidth="1.5" strokeDasharray="5,3" className="animate-pulse" />
              {/* Point 2: Tor SQLi Attacker (Mid-Atlantic/Europe) */}
              <path d="M 410 200 Q 300 160 200 180" fill="none" stroke="#ef4444" strokeWidth="2" />
              <circle cx="410" cy="200" r="4" fill="#ef4444" className="animate-pulse" />
              {/* Point 3: Singapore SSH Probe */}
              <path d="M 720 280 Q 460 190 200 180" fill="none" stroke="#eab308" strokeWidth="1" strokeDasharray="3,3" />

              {/* Threat Source Pinpoints with Hover triggers */}
              {liveStats.geographies.map((geo, idx) => {
                // Map logical points onto standard SVG coordinates
                let cx = 200;
                let cy = 180;
                let color = "#10b981"; // Low

                if (geo.risk === 'critical') { cx = 410; cy = 200; color = "#ef4444"; }
                else if (geo.risk === 'high') { cx = 480; cy = 140; color = "#f97316"; }
                else if (geo.risk === 'medium') { cx = 720; cy = 280; color = "#eab308"; }
                else if (geo.country === 'Brazil') { cx = 220; cy = 340; color = "#22c55e"; }
                else if (geo.country === 'United States') { cx = 150; cy = 160; color = "#3b82f6"; }

                return (
                  <g 
                    key={idx} 
                    className="cursor-pointer group/node"
                    onMouseEnter={() => setHoveredCountry(geo)}
                    onMouseLeave={() => setHoveredCountry(null)}
                  >
                    <circle cx={cx} cy={cy} r="10" fill={`${color}0F`} className="group-hover/node:scale-150 transition-all duration-300" />
                    <circle cx={cx} cy={cy} r="6" stroke={color} strokeWidth="1" fill="transparent" />
                    <circle cx={cx} cy={cy} r="3" fill={color} />
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip display HUD */}
            {hoveredCountry ? (
              <div className="absolute bottom-4 left-4 p-3.5 rounded-lg border border-slate-700 bg-slate-950/90 shadow-2xl space-y-1.5 max-w-[240px] z-20 font-mono text-[10px]">
                <div className="flex items-center justify-between gap-3 text-slate-200">
                  <span className="font-bold font-sans text-xs">{hoveredCountry.country}</span>
                  <span className={`px-1 rounded text-[8px] font-bold font-mono uppercase ${
                    hoveredCountry.risk === 'critical' ? 'bg-red-950 text-red-400 border border-red-500/30' :
                    hoveredCountry.risk === 'high' ? 'bg-orange-950 text-orange-400 border border-orange-500/30' :
                    hoveredCountry.risk === 'medium' ? 'bg-yellow-950 text-yellow-400 border border-yellow-500/30' :
                    'bg-slate-900 text-slate-400'
                  }`}>
                    {hoveredCountry.risk}
                  </span>
                </div>
                <div className="space-y-0.5 text-slate-400">
                  <div>IP: {hoveredCountry.ip}</div>
                  <div>ACTIVITY: <span className="text-slate-300">{hoveredCountry.type}</span></div>
                  <div>BLOCKED SCAN COUNT: <span className="text-cyan-400">{hoveredCountry.hits}</span></div>
                </div>
              </div>
            ) : (
              <div className="absolute bottom-4 left-4 p-3 border border-slate-800 rounded bg-slate-950/70 text-[9px] font-mono text-slate-500">
                Hover geographic node hubs to inspect telemetry logs.
              </div>
            )}

            {/* Simulated Live Alert Overlay Ticker */}
            <div className="absolute top-4 right-4 max-w-[200px] text-[10px] font-mono p-2.5 bg-slate-950/80 border border-slate-800 rounded space-y-1">
              <span className="text-[8px] text-red-500 font-bold block animate-pulse">● RADAR DISPATCH FEED</span>
              <p className="text-slate-400 leading-normal">
                SQLi Payload blocked on Tor interface. Active source quarantine completed within 140ms.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-2">
            {liveStats.geographies.map((geo, idx) => (
              <div key={idx} className="bg-slate-900/40 border border-slate-900 p-2 rounded relative group hover:border-slate-800 transition-all">
                <p className="text-[10px] font-mono text-slate-500 truncate">{geo.country}</p>
                <p className="font-sans font-semibold text-slate-200 text-xs truncate mt-0.5">{geo.ip}</p>
                <div className="flex items-center gap-1 mt-1 font-mono text-[9px]">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    geo.risk === 'critical' ? 'bg-red-500' :
                    geo.risk === 'high' ? 'bg-orange-500' :
                    geo.risk === 'medium' ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}></span>
                  <span className="text-slate-400">{geo.hits} blocks</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1/3: Threat Severity Distribution PIE Chart */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-medium text-sm text-slate-200">Threat Distribution</h3>
              <span className="text-[9px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                BY CRIME CLASSIFICATION
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Total detected signatures organized inside core neural classifiers.</p>
          </div>

          {/* Pie Chart Display */}
          <div className="h-[200px] flex items-center justify-center relative my-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={liveStats.threatDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {liveStats.threatDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '11px', color: '#e2e8f0', fontFamily: 'monospace' }}
                  labelStyle={{ display: 'none' }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Direct Center overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
              <span className="text-[24px] font-display font-bold text-white">100%</span>
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest leading-none">Classified</span>
            </div>
          </div>

          {/* Color Indicators Legend */}
          <div className="space-y-1.5">
            {liveStats.threatDistribution.map((threat, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs font-mono py-1 border-b border-slate-900 last:border-0 hover:bg-slate-900/30 px-1 rounded transition-colors">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: threat.color }}></span>
                  <span className="text-slate-300 font-sans">{threat.name}</span>
                </div>
                <div className="text-slate-400 font-normal">
                  {threat.value}% of queue
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 4. Attack Activity Trends & Grid Heatmap Toggle & AI Recommendations */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left 2/3: Line Chart trend or Incident Heatmap */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 xl:col-span-2">
          
          <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-4">
            <div>
              <h3 className="font-display font-medium text-sm text-slate-200">Incident Load Grid Matrix</h3>
              <p className="text-[11px] text-slate-400">Analysis of daily system pressure points and threat mitigation peaks.</p>
            </div>
            
            {/* Tabs Toggle buttons */}
            <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-800">
              <button 
                onClick={() => setActiveTab('trends')}
                className={`px-3 py-1 text-[10px] font-mono rounded-md font-semibold cursor-pointer transition-all ${
                  activeTab === 'trends' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Weekly Trend
              </button>
              <button 
                onClick={() => setActiveTab('heatmap')}
                className={`px-3 py-1 text-[10px] font-mono rounded-md font-semibold cursor-pointer transition-all ${
                  activeTab === 'heatmap' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                SOC Load Heatmap
              </button>
            </div>
          </div>

          <div className="min-h-[260px]">
            {activeTab === 'trends' ? (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={liveStats.weeklyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#475569" fontSize={10} fontFamily="monospace" tickLine={false} />
                    <YAxis stroke="#475569" fontSize={10} fontFamily="monospace" tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '8px' }}
                      labelStyle={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace' }}
                      itemStyle={{ fontSize: '11px', color: '#f1f5f9' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace', marginTop: '10px' }} />
                    <Area type="monotone" dataKey="blocked" name="IDS Block Attacks" stroke="#22d3ee" fillOpacity={1} fill="url(#colorBlocked)" strokeWidth={2} />
                    <Area type="monotone" dataKey="high" name="High-Severity Actions" stroke="#f97316" fillOpacity={1} fill="url(#colorHigh)" strokeWidth={1.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              /* High-fidelity SOC Activity Grid Heatmap */
              <div className="space-y-4">
                <div className="grid grid-cols-13 gap-1 overflow-x-auto pb-2 select-none">
                  <div className="col-span-1"></div>
                  {heatmapHours.map((hour, idx) => (
                    <div key={idx} className="text-center font-mono text-[8px] text-slate-500 py-1 min-w-[32px]">{hour}</div>
                  ))}

                  {heatmapDays.map((day, dIdx) => (
                    <div key={dIdx} className="contents">
                      <div className="col-span-1 self-center font-mono text-[9px] text-slate-400 font-semibold">{day}</div>
                      {heatmapHours.map((hour, hIdx) => {
                        const styleClass = getHeatmapColor(day, hour);
                        return (
                          <div 
                            key={hIdx} 
                            className={`h-7 rounded-sm flex items-center justify-center font-mono text-[9px] font-bold ${styleClass} transition-all duration-300 hover:scale-110 hover:shadow-lg cursor-help`}
                            title={`${day} @ ${hour}: Alerts Density Alert Factor`}
                          >
                            {(day.charCodeAt(0) + hour.charCodeAt(3)) % 10}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
                
                {/* Heatmap Legend indicator */}
                <div className="flex items-center justify-end gap-4 font-mono text-[9px] pt-2 border-t border-slate-900 text-slate-500">
                  <span>LOAD INDEX: </span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-slate-900/40 border border-slate-800"></span>
                    <span>Minimal</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500/30"></span>
                    <span>Low</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-yellow-500/50"></span>
                    <span>Medium</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-orange-500/70"></span>
                    <span>High</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-red-500/85"></span>
                    <span>Critical</span>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Right 1/3: AI Security Recommendation HUD Panel */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h3 className="font-display font-medium text-sm text-slate-200">AI Recommendation Engine</h3>
              </div>
              <span className="text-[8px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-500/30 px-1 py-0.5 rounded uppercase -top-0.5 animate-pulse">
                HEURISTIC OK
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Cognitive playbooks calculated on core incidents queues.</p>
          </div>

          {/* Multi-Recommendation Cards */}
          <div className="space-y-3 my-4 flex-1">
            
            <div className="p-3 bg-slate-900/50 border border-orange-500/20 rounded-lg space-y-2 group/card hover:bg-slate-900/80 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex gap-2 items-start">
                  <AlertOctagon className="w-4 h-4 text-orange-400 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200 leading-tight">Revoke Abhishek Jha Active Tokens</h4>
                    <p className="text-[10px] font-mono text-slate-400 mt-1">Matched: INC-2026-0041 (APT-39)</p>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-800/80">
                <span className="text-[9px] font-mono text-slate-500">Playbook: AD-LOCK-V2</span>
                <button 
                  onClick={() => runMitigationPlaybook('AD-LOCK-V2', 'abhishek.jha@securemind.ai')}
                  className="px-2 py-1 bg-orange-500/10 hover:bg-orange-500/25 border border-orange-500/30 rounded text-[9px] font-mono text-orange-400 font-bold cursor-pointer transition-colors"
                >
                  Apply Rule
                </button>
              </div>
            </div>

            <div className="p-3 bg-slate-900/50 border border-red-500/20 rounded-lg space-y-2 group/card hover:bg-slate-900/80 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex gap-2 items-start">
                  <ShieldHalf className="w-4 h-4 text-red-400 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200 leading-tight">WAF Filter Code injecting Payload</h4>
                    <p className="text-[10px] font-mono text-slate-400 mt-1">Blocks raw `UNION SELECT` statements</p>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-800/80">
                <span className="text-[9px] font-mono text-slate-500">Playbook: WAF-REGEX-9</span>
                <button 
                  onClick={() => runMitigationPlaybook('WAF-REGEX-9', 'billing-api-v2')}
                  className="px-2 py-1 bg-red-500/10 hover:bg-red-500/25 border border-red-500/30 rounded text-[9px] font-mono text-red-400 font-bold cursor-pointer transition-colors"
                >
                  Apply Rule
                </button>
              </div>
            </div>

          </div>

          <div className="p-2 border border-dashed border-slate-800 rounded bg-slate-900/10">
            <button 
              onClick={() => onViewChange('assistant')}
              className="text-[10px] font-mono text-cyan-400 flex items-center justify-center gap-1.5 w-full py-1 cursor-pointer group hover:text-cyan-300"
            >
              <span>Consult Copilot for custom SQL remediation</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

        </div>

      </div>

      {/* 5. Live Events Terminal & Real-Time Firewall Feed */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5">
        
        <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-4.5 h-4.5 text-cyan-400" />
            <h3 className="font-display font-medium text-sm text-slate-200">Real-Time Core Firewall & Syslog Stream</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[9px] font-mono text-slate-500 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></span>
              SOCKET SYNCHRONIZED
            </span>
            <button 
              onClick={() => onViewChange('logs')}
              className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 cursor-pointer"
            >
              Analyze in Log Viewer →
            </button>
          </div>
        </div>

        {/* Console line style stream readout */}
        <div className="p-4 bg-slate-950 border border-slate-900 rounded-lg font-mono text-[11px] leading-relaxed text-slate-400 divide-y divide-slate-900/60 h-60 overflow-y-auto">
          {liveLogs.map((log) => (
            <div key={log.id} className="py-2.5 flex items-start justify-between hover:bg-slate-900/20 px-2 rounded-md transition-colors gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <span className="text-slate-600 shrink-0 select-none">[{log.timestamp.slice(11, 19)}]</span>
                <span className={`text-[9px] leading-tight font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                  log.severity === 'critical' ? 'bg-red-950/40 text-red-500 border border-red-500/20' :
                  log.severity === 'high' ? 'bg-orange-950/40 text-orange-400 border border-orange-500/20' :
                  log.severity === 'medium' ? 'bg-yellow-950/40 text-yellow-400 border border-yellow-500/20' :
                  'bg-green-950/40 text-green-400 border border-green-500/20'
                }`}>
                  {log.severity}
                </span>
                <span className="font-bold text-slate-300 shrink-0">{log.type}</span>
                <p className="text-slate-200 truncate flex-1 min-w-0">{log.message}</p>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <span className="text-slate-500 text-right font-semibold hidden md:inline truncate">{log.source}</span>
                <span className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded border ${
                  log.action === 'BLOCKED' ? 'bg-red-950/20 text-red-400 border-red-500/30' :
                  log.action === 'ALLOWED' ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/30' :
                  log.action === 'QUARANTINED' ? 'bg-orange-950/20 text-orange-400 border-orange-500/30' :
                  'bg-yellow-950/20 text-yellow-400 border-yellow-500/30'
                }`}>
                  {log.action}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>

    </div>
  );
}
