import { useState, useEffect } from 'react';
import { 
  ShieldAlert, Bell, Cpu, Terminal, 
  Settings, Bot, FileText, CheckCircle2, AlertOctagon, 
  Info, AlertTriangle, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Components imports
import LoginView from './components/LoginView';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import ThreatsView from './components/ThreatsView';
import IncidentView from './components/IncidentView';
import LogsView from './components/LogsView';
import AssistantView from './components/AssistantView';
import ReportsView from './components/ReportsView';
import SettingsView from './components/SettingsView';

import { ActiveView } from './types';
import { mockThreats, mockIncidents } from './mockData';
import { clearAuthToken, getAuthToken, getProfile } from './api';

interface SystemNotification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warn' | 'error';
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [currentView, setCurrentView] = useState<ActiveView>('dashboard');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  
  // Real-time toast notifications
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);

  useEffect(() => {
    if (!getAuthToken()) return;
    getProfile()
      .then(({ user }) => {
        setUserEmail(user.email);
        setIsAuthenticated(true);
      })
      .catch(() => clearAuthToken());
  }, []);

  // Push notification helper
  const triggerSystemNotification = (message: string, type: 'info' | 'success' | 'warn' | 'error') => {
    const newNotif: SystemNotification = {
      id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      message,
      type
    };
    
    setNotifications(prev => [...prev, newNotif]);

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      dismissNotification(newNotif.id);
    }, 4500);
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Welcome banner on Login
  const handleLoginSuccess = (email: string) => {
    setUserEmail(email);
    setIsAuthenticated(true);
    setCurrentView('dashboard');
    
    // Staggered welcome notifications to set the mood
    setTimeout(() => {
      triggerSystemNotification(`Authorized session established with ${email}.`, 'success');
    }, 400);

    setTimeout(() => {
      triggerSystemNotification('Continuous SecOps thread discovery matrices sync completed.', 'info');
    }, 1500);
  };

  const handleLogout = () => {
    triggerSystemNotification('Security session destroyed.', 'info');
    clearAuthToken();
    setIsAuthenticated(false);
    setUserEmail('');
    setCurrentView('dashboard');
    setSelectedIncidentId(null);
  };

  const handleSelectIncidentFromDashboard = (incId: string) => {
    setSelectedIncidentId(incId);
    setCurrentView('incident');
    triggerSystemNotification(`Locking target forensic timeline for INC-2026-${incId.split('-').pop()}...`, 'info');
  };

  // Safe checks counts
  const activeThreatsCount = mockThreats.filter(t => t.status === 'Active' || t.status === 'Investigating').length;
  const openIncidentsCount = mockIncidents.filter(i => i.status === 'Open' || i.status === 'Investigating').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Dynamic Background Grid Pattern */}
      <div className="fixed inset-0 cyber-grid opacity-20 pointer-events-none z-0"></div>

      <AnimatePresence mode="wait">
        {!isAuthenticated ? (
          /* Render Secure Login Gateway */
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative z-10"
          >
            <LoginView onLoginSuccess={handleLoginSuccess} triggerSystemNotification={triggerSystemNotification} />
          </motion.div>
        ) : (
          /* Main Platform View - Authenticated */
          <motion.div
            key="platform"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col min-h-screen select-none relative z-10"
          >
            {/* Top Corporate Navbar */}
            <Navbar 
              currentView={currentView} 
              onViewChange={(v) => setCurrentView(v)} 
              activeThreatCount={activeThreatsCount}
            />

            <div className="flex flex-1 relative">
              {/* Left sidebar controller menu */}
              <Sidebar 
                currentView={currentView}
                onViewChange={(v) => {
                  setCurrentView(v);
                  if (v !== 'incident') setSelectedIncidentId(null);
                }}
                activeThreatCount={activeThreatsCount}
                openIncidentCount={openIncidentsCount}
                onLogout={handleLogout}
              />

              {/* Main Contents Window Section */}
              <main id="soc-main-content" className="flex-1 px-6 py-6 overflow-y-auto h-[calc(100vh-64px)]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentView}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.2 }}
                    className="h-full"
                  >
                    {currentView === 'dashboard' && (
                      <DashboardView 
                        onViewChange={(v) => {
                          setCurrentView(v);
                          if (v !== 'incident') setSelectedIncidentId(null);
                        }}
                        onSelectIncident={handleSelectIncidentFromDashboard}
                        triggerSystemNotification={triggerSystemNotification}
                      />
                    )}

                    {currentView === 'threats' && (
                      <ThreatsView 
                        triggerSystemNotification={triggerSystemNotification}
                      />
                    )}

                    {currentView === 'incident' && (
                      <IncidentView 
                        selectedIncidentId={selectedIncidentId}
                        triggerSystemNotification={triggerSystemNotification}
                      />
                    )}

                    {currentView === 'logs' && (
                      <LogsView 
                        triggerSystemNotification={triggerSystemNotification}
                      />
                    )}

                    {currentView === 'assistant' && (
                      <AssistantView 
                        triggerSystemNotification={triggerSystemNotification}
                      />
                    )}

                    {currentView === 'reports' && (
                      <ReportsView 
                        triggerSystemNotification={triggerSystemNotification}
                      />
                    )}

                    {currentView === 'settings' && (
                      <SettingsView 
                        triggerSystemNotification={triggerSystemNotification}
                      />
                    )}

                  </motion.div>
                </AnimatePresence>
              </main>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating System Notifications Desk Banner */}
      <div id="soc-notifications-desk" className="fixed bottom-6 right-6 z-50 flex flex-col gap-3.5 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {notifications.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.95 }}
              transition={{ duration: 0.25, type: 'spring', damping: 20 }}
              className={`p-4 rounded-xl border shadow-2xl flex gap-3.5 pointer-events-auto backdrop-blur-md transition-all ${
                notif.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/25 shadow-emerald-500/5' :
                notif.type === 'warn' ? 'bg-yellow-950/90 border-yellow-500/25 shadow-yellow-500/5' :
                notif.type === 'error' ? 'bg-red-950/90 border-red-500/25 shadow-red-500/5' :
                'bg-slate-900/90 border-slate-800 shadow-slate-950/40'
              }`}
            >
              {/* Type Icons */}
              <div className="shrink-0 mt-0.5">
                {notif.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {notif.type === 'warn' && <AlertTriangle className="w-5 h-5 text-yellow-400" />}
                {notif.type === 'error' && <AlertOctagon className="w-5 h-5 text-red-400" />}
                {notif.type === 'info' && <Info className="w-5 h-5 text-cyan-400" />}
              </div>

              {/* Message text content */}
              <div className="flex-1 text-xs">
                <span className="font-mono text-[9px] text-slate-500 font-bold block uppercase mb-1">{notif.id}</span>
                <p className="text-slate-205 leading-relaxed font-sans">{notif.message}</p>
              </div>

              {/* Dismiss cross */}
              <button 
                onClick={() => dismissNotification(notif.id)}
                className="shrink-0 text-slate-500 hover:text-slate-300 transition-colors self-start cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
}
