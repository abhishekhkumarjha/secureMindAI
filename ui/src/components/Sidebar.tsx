import { LayoutDashboard, ShieldAlert, AlertTriangle, Terminal, Sparkles, FileText, Settings, LogOut, Disc } from 'lucide-react';
import { ActiveView } from '../types';

interface SidebarProps {
  currentView: ActiveView;
  onViewChange: (view: ActiveView) => void;
  activeThreatCount: number;
  openIncidentCount: number;
  onLogout: () => void;
}

export default function Sidebar({
  currentView,
  onViewChange,
  activeThreatCount,
  openIncidentCount,
  onLogout
}: SidebarProps) {
  
  const menuItems: Array<{ id: ActiveView; label: string; icon: any; badge: any; badgeColor?: string }> = [
    { id: 'dashboard', label: 'SOC Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'threats', label: 'Threat Monitoring', icon: ShieldAlert, badge: activeThreatCount },
    { id: 'incident', label: 'Incidents & Graphs', icon: AlertTriangle, badge: openIncidentCount, badgeColor: 'bg-red-500/10 text-red-400 border border-red-500/30' },
    { id: 'logs', label: 'Security Logs', icon: Terminal, badge: null },
    { id: 'assistant', label: 'AI Cyber Copilot', icon: Sparkles, badge: 'AI', badgeColor: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 animate-pulse' },
    { id: 'reports', label: 'Reports & Analytics', icon: FileText, badge: null },
    { id: 'settings', label: 'SOC Administration', icon: Settings, badge: null },
  ];

  return (
    <nav id="soc-sidebar" className="w-[240px] border-r border-slate-800 bg-slate-950 flex flex-col justify-between shrink-0 h-[calc(100vh-64px)] sticky top-16">
      
      {/* Top Sidebar Menu Items */}
      <div className="py-6 px-4 flex-1 space-y-1.5 overflow-y-auto">
        <span className="px-3 text-[10px] font-mono tracking-widest text-slate-500 uppercase block mb-3">SECENG NAVIGATION</span>
        
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center justify-between px-3 h-10 rounded-lg text-xs font-medium font-sans tracking-wide transition-all group cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-blue-900/40 to-cyan-950/20 text-cyan-400 border border-cyan-500/20 shadow-[inset_0_0_8px_rgba(6,182,212,0.1)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 transition-colors ${
                  isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
                }`} />
                <span>{item.label}</span>
              </div>
              
              {item.badge !== null && (
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded leading-none ${
                  item.badgeColor || 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Sidebar Footer System telemetry */}
      <div className="p-4 border-t border-slate-900 bg-slate-950/40 space-y-4">
        
        {/* Core Engine status readout */}
        <div className="p-3 bg-slate-900/30 border border-slate-900 rounded-lg font-mono text-[9px] line text-slate-400 space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Disc className="w-3 h-3 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} /> 
              TELEMETRY BUS
            </span>
            <span className="text-emerald-400 font-bold">ONLINE</span>
          </div>
          <div className="w-full bg-slate-800 h-1 rounded overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full w-[84%] animate-pulse"></div>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>NODE INST: 01A</span>
            <span>PING: 14ms</span>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="w-full h-9 flex items-center gap-3 px-3 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/20 hover:border-red-500/20 transition-all text-xs font-medium border border-transparent cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Exit Secure Session</span>
        </button>
      </div>

    </nav>
  );
}
