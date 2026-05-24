import { useState } from 'react';
import { Shield, ShieldAlert, Bell, Search, User, CheckCircle2, AlertTriangle, Cpu, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NavbarProps {
  currentView: string;
  onViewChange: (view: any) => void;
  activeThreatCount: number;
}

export default function Navbar({ currentView, onViewChange, activeThreatCount }: NavbarProps) {
  const [showAlarms, setShowAlarms] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchVal, setSearchVal] = useState('');

  // Live triggered alarm alerts mock
  const [alerts, setAlerts] = useState([
    { id: 1, title: 'Tor node brute-force SSH blocked', time: '1m ago', severity: 'medium', unread: true },
    { id: 2, title: 'SQL Injection signature detected on API v2', time: '3m ago', severity: 'critical', unread: true },
    { id: 3, title: 'Abnormal AD privilege enumeration', time: '15m ago', severity: 'high', unread: false },
  ]);

  const markAllAsRead = () => {
    setAlerts(alerts.map(a => ({ ...a, unread: false })));
  };

  const unreadCount = alerts.filter(a => a.unread).length;

  return (
    <header id="soc-top-navbar" className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      
      {/* Branding Logo Area */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-blue-900/30 border border-cyan-500/30 group cursor-pointer" onClick={() => onViewChange('dashboard')}>
          <Shield className="w-5 h-5 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
          <span className="absolute -inset-0.5 rounded-lg bg-cyan-500/20 blur opacity-30 group-hover:opacity-50 transition-opacity"></span>
          <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 animate-ping"></div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-display font-bold tracking-wider text-white text-lg">SECURE<span className="text-cyan-400">MIND</span></span>
            <span className="text-[9px] tracking-widest font-mono uppercase px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/20">AI SOC</span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            CORE SEC-ENGINE STATUS: <span className="text-emerald-400 font-bold">OPERATIONAL</span>
          </p>
        </div>
      </div>

      {/* Center Search Block */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
        <div className={`relative w-full transition-all duration-300 ${searchFocused ? 'scale-[1.01]' : ''}`}>
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className={`w-4 h-4 transition-colors ${searchFocused ? 'text-cyan-400' : 'text-slate-500'}`} />
          </div>
          <input
            type="text"
            placeholder="Search assets, threat IDs, CVE-hash records..."
            className={`w-full h-9 pl-9 pr-12 rounded-lg bg-slate-900/60 border text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all ${
              searchFocused ? 'border-cyan-500/50 bg-slate-900/90' : 'border-slate-800'
            }`}
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
            <kbd className="text-[9px] font-mono bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">Ctrl K</kbd>
          </div>
        </div>
      </div>

      {/* Right Actions Block */}
      <div className="flex items-center gap-4">
        
        {/* System telemetry ticker */}
        <div className="hidden lg:flex items-center gap-4 px-3 py-1 bg-slate-900/40 border border-slate-800/60 rounded-md font-mono text-[10px] text-slate-400">
          <div className="flex items-center gap-1.5 border-r border-slate-800 pr-3">
            <Cpu className="w-3.5 h-3.5 text-slate-500" />
            <span>AI ENGINE LOAD:</span>
            <span className="text-cyan-400 font-bold">14.8%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-slate-500" />
            <span>ACTIVE FEED:</span>
            <span className="text-amber-500 font-bold">96 EVTS/SEC</span>
          </div>
        </div>

        {/* Live Alarms Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowAlarms(!showAlarms)}
            className={`p-2 rounded-lg border transition-all relative group ${
              showAlarms 
                ? 'bg-slate-900 text-cyan-400 border-cyan-500/40' 
                : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Alarm Notifications Popover */}
          <AnimatePresence>
            {showAlarms && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowAlarms(false)}></div>
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-80 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-dark-600 bg-slate-900/60 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200">Real-time SOC Alarms</span>
                    <button 
                      onClick={markAllAsRead}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono cursor-pointer"
                    >
                      Clear Notifications
                    </button>
                  </div>
                  
                  <div className="divide-y divide-slate-900 max-h-80 overflow-y-auto">
                    {alerts.map((al) => (
                      <div 
                        key={al.id} 
                        className={`p-3.5 flex items-start gap-3 transition-colors ${
                          al.unread ? 'bg-slate-900/30' : 'bg-transparent'
                        } hover:bg-slate-900/50`}
                      >
                        <div className="mt-0.5">
                          {al.severity === 'critical' ? (
                            <ShieldAlert className="w-4 h-4 text-red-500" />
                          ) : al.severity === 'high' ? (
                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-yellow-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <span className={`text-slate-400 absolute h-1 w-1 right-2 rounded-full ${al.unread ? 'bg-cyan-400': 'bg-transparent'}`}></span>
                          <p className="text-xs font-medium text-slate-200 leading-tight">{al.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-mono text-slate-500">{al.time}</span>
                            <span className={`text-[8px] font-mono font-bold uppercase rounded px-1 py-0.5 ${
                              al.severity === 'critical' ? 'bg-red-950/40 text-red-400 border border-red-500/20' :
                              al.severity === 'high' ? 'bg-orange-950/40 text-orange-400 border border-orange-500/20' :
                              'bg-yellow-950/40 text-yellow-400 border border-yellow-500/20'
                            }`}>
                              {al.severity}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-2 border-t border-slate-900 bg-slate-900/20 text-center">
                    <button 
                      onClick={() => { setShowAlarms(false); onViewChange('threats'); }} 
                      className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 w-full py-1 cursor-pointer"
                    >
                      View All Threat Feeds →
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* User Card Badge */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
          <div className="relative">
            <div className="w-9 h-9 rounded-lg bg-indigo-950 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-400 text-sm">
              AJ
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-950"></div>
          </div>
          <div className="hidden xl:block text-left">
            <p className="text-xs font-semibold text-slate-200">Abhishek K. Jha</p>
            <p className="text-[10px] text-cyan-400 font-mono tracking-wider flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5" />
              SOC ANALYST III
            </p>
          </div>
        </div>

      </div>

    </header>
  );
}
