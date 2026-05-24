import React, { useState } from 'react';
import { 
  Settings, User, Bell, Shield, Key, Plus, Trash2, Check, CheckCircle2, 
  Terminal, ShieldCheck, Mail, Database, Eye, EyeOff
} from 'lucide-react';

interface SettingsViewProps {
  triggerSystemNotification: (message: string, type: 'info' | 'success' | 'warn' | 'error') => void;
}

export default function SettingsView({ triggerSystemNotification }: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'users' | 'security' | 'api'>('profile');
  const [showApiKey, setShowApiKey] = useState(false);
  
  // Simulated State for API keys
  const [splunkHost, setSplunkHost] = useState('syslog-collector.corp.securemind.ai');
  const [tokenKey, setTokenKey] = useState('••••••••••••••••••••••••••••••••');

  // Simulated Analysts user management
  const [analysts, setAnalysts] = useState([
    { name: 'Abhishek Kumar Jha', email: 'abhishek.jha@securemind.ai', role: 'SOC Analyst III', status: 'Active' },
    { name: 'Sarah Connor', email: 'sarah.c@securemind.ai', status: 'On Shift', role: 'Security Analyst II' },
    { name: 'John Doe', email: 'j.doe@securemind.ai', status: 'Inactive', role: 'L1 Responder' },
  ]);

  // Profile forms
  const [userName, setUserName] = useState('Abhishek Kumar Jha');
  const [userEmail, setUserEmail] = useState('avishekhjhaaj@gmail.com');
  const [userRole, setUserRole] = useState('SOC Analyst III');

  // Trigger form submit
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    triggerSystemNotification('Identity profile successfully updated.', 'success');
  };

  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    triggerSystemNotification('Security enforcement overrides committed successfully.', 'success');
  };

  const handleSaveAPI = (e: React.FormEvent) => {
    e.preventDefault();
    triggerSystemNotification('Splunk raw syslog stream endpoint saved and tested OK.', 'success');
  };

  // Add mock analyst
  const [newAnalystName, setNewAnalystName] = useState('');
  const [newAnalystEmail, setNewAnalystEmail] = useState('');
  const [newAnalystRole, setNewAnalystRole] = useState('L1 Responder');

  const addAnalyst = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnalystName.trim() || !newAnalystEmail.trim()) return;

    setAnalysts(prev => [
      ...prev,
      { name: newAnalystName, email: newAnalystEmail, role: newAnalystRole, status: 'Active' }
    ]);
    setNewAnalystName('');
    setNewAnalystEmail('');
    triggerSystemNotification(`New analyst register dispatched: [${newAnalystName}] authorized.`, 'success');
  };

  const deleteAnalyst = (idx: number) => {
    const target = analysts[idx];
    setAnalysts(prev => prev.filter((_, i) => i !== idx));
    triggerSystemNotification(`Credentials revoked for [${target.name}]. Access severed.`, 'info');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 pb-12" id="soc-settings-page">
      
      {/* 1. Left Selection Sidebar */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col gap-1.5 h-max select-none">
        <span className="px-3 text-[9px] font-mono tracking-widest text-slate-500 uppercase block mb-2">SOC CONFIG SHEETS</span>
        
        <button
          onClick={() => setActiveTab('profile')}
          className={`w-full h-9 flex items-center gap-3 px-3 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
            activeTab === 'profile' 
              ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profile Settings</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`w-full h-9 flex items-center gap-3 px-3 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
            activeTab === 'users' 
              ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>User Management</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`w-full h-9 flex items-center gap-3 px-3 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
            activeTab === 'security' 
              ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Security Rules</span>
        </button>

        <button
          onClick={() => setActiveTab('api')}
          className={`w-full h-9 flex items-center gap-3 px-3 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
            activeTab === 'api' 
              ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>API Configuration</span>
        </button>
      </div>

      {/* 2. Direct Content layout Sheet */}
      <div className="lg:col-span-3 bg-slate-950/80 border border-slate-800 rounded-xl p-6 min-h-[460px] flex flex-col justify-between">
        
        {/* Profile Settings Sheet */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div>
              <h3 className="font-display font-medium text-sm text-slate-200">Personal Identity Credentials</h3>
              <p className="text-xs text-slate-400 mt-0.5">Edit credentials, role logs, and personal email directories.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <label className="text-[10px] font-mono text-slate-500 uppercase">Analyst Full Name</label>
                <input 
                  type="text" 
                  value={userName} 
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full h-9 bg-slate-900 border border-slate-800 text-slate-200 rounded px-3 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                />
              </div>

              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <label className="text-[10px] font-mono text-slate-500 uppercase">Personal Email Address</label>
                <input 
                  type="email" 
                  value={userEmail} 
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full h-9 bg-slate-900 border border-slate-800 text-slate-200 rounded px-3 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                />
              </div>

              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <label className="text-[10px] font-mono text-slate-500 uppercase">Platform clearance level badge</label>
                <input 
                  type="text" 
                  value={userRole} 
                  disabled
                  className="w-full h-9 bg-slate-900/40 border border-slate-900 text-slate-500 cursor-not-allowed rounded px-3"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-900">
              <button 
                type="submit" 
                className="h-9 px-4 bg-gradient-to-r from-blue-700 to-cyan-700 hover:from-blue-600 hover:to-cyan-600 font-bold font-sans text-xs text-white rounded-lg cursor-pointer transition-all"
              >
                Save Identity profile
              </button>
            </div>
          </form>
        )}

        {/* User Management Settings Sheet */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-display font-medium text-sm text-slate-200">Tactical User Access lists</h3>
              <p className="text-xs text-slate-400 mt-0.5">Approve new responders, revoke access directories, and manage shift status flags.</p>
            </div>

            {/* Analysts ledger lists */}
            <div className="border border-slate-900 rounded-lg overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[400px]">
                <thead>
                  <tr className="bg-slate-900/40 border-b border-slate-900 text-[9px] font-mono text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-4">Authorized Analyst</th>
                    <th className="py-2.5 px-4">Clearance Role</th>
                    <th className="py-2.5 px-4">Shift Status</th>
                    <th className="py-2.5 px-4 text-right">Access Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 text-xs text-slate-350">
                  {analysts.map((a, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/20">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-200">{a.name}</p>
                        <p className="text-[9.5px] text-slate-500 font-mono mt-0.5">{a.email}</p>
                      </td>
                      <td className="py-3 px-4 font-mono text-[10.5px] text-slate-400">
                        {a.role}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          a.status === 'Active' || a.status === 'On Shift'
                            ? 'bg-emerald-950/20 text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-900 text-slate-500 border border-slate-850'
                        }`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button 
                          onClick={() => deleteAnalyst(idx)}
                          className="p-1 px-2.5 border bg-red-950/20 text-red-500 border-red-500/25 hover:bg-red-900/20 hover:border-red-500/60 rounded text-[9.5px] font-mono cursor-pointer transition-colors"
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Quick append analyst form */}
            <form onSubmit={addAnalyst} className="p-3.5 bg-slate-900/20 border border-slate-900 rounded-xl space-y-3">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold">DISPATCH NEW ANALYST REGISTRY</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <input 
                  type="text" 
                  placeholder="Analyst Full Name"
                  value={newAnalystName}
                  onChange={(e) => setNewAnalystName(e.target.value)}
                  className="h-9 bg-slate-900 border border-slate-800 text-slate-200 rounded px-2.5"
                />
                <input 
                  type="email" 
                  placeholder="Analyst Corporate Email Address"
                  value={newAnalystEmail}
                  onChange={(e) => setNewAnalystEmail(e.target.value)}
                  className="h-9 bg-slate-900 border border-slate-800 text-slate-200 rounded px-2.5"
                />
                <div className="flex gap-2">
                  <select
                    value={newAnalystRole}
                    onChange={(e) => setNewAnalystRole(e.target.value)}
                    className="h-9 bg-slate-900 border border-slate-800 text-slate-300 rounded px-2 w-full text-xs"
                  >
                    <option value="L1 Responder">L1 Responder</option>
                    <option value="Security Analyst II">Security Analyst II</option>
                    <option value="SOC Team Lead">SOC Team Lead</option>
                  </select>
                  <button 
                    type="submit"
                    className="h-9 px-3 bg-cyan-700 hover:bg-cyan-600 rounded text-stone-200 font-bold shrink-0 cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>
            </form>

          </div>
        )}

        {/* Security Rules configuration Sheet */}
        {activeTab === 'security' && (
          <form onSubmit={handleSaveSecurity} className="space-y-6 text-xs text-slate-300">
            <div>
              <h3 className="font-display font-medium text-sm text-slate-200">Global SOC Access Controls Policy</h3>
              <p className="text-xs text-slate-400 mt-0.5">Toggle multi-factor overrides, manage IP allowlist subnet pools, and config brute-force lockout filters.</p>
            </div>

            <div className="space-y-4 font-sans">
              
              <div className="flex items-start justify-between p-3 bg-slate-900/30 border border-slate-900 rounded-lg">
                <div className="space-y-1 max-w-lg">
                  <h4 className="font-semibold text-slate-200 leading-snug">Require FIDO2 Passwordless Keys (MFA Overrides)</h4>
                  <p className="text-slate-400 text-[11px] leading-normal">
                    Enforces physical device keys validation checks for all administrative views logins (disables default push notifications to prevent fatigue bypasses).
                  </p>
                </div>
                <div>
                  <input type="checkbox" defaultChecked className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 focus:outline-none w-4.5 h-4.5 cursor-pointer" />
                </div>
              </div>

              <div className="flex items-start justify-between p-3 bg-slate-900/30 border border-slate-900 rounded-lg">
                <div className="space-y-1 max-w-lg">
                  <h4 className="font-semibold text-slate-200 leading-snug">Deploy Autonomous Containment (SOAR)</h4>
                  <p className="text-slate-400 text-[11px] leading-normal">
                    Authorized our AI Engine to dispatch automatic quarantine controls via Crowdstrike endpoint API instantly when Critical SQLi or BYOVD threat vectors match 95% Confidence ratings.
                  </p>
                </div>
                <div>
                  <input type="checkbox" defaultChecked className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 focus:outline-none w-4.5 h-4.5 cursor-pointer" />
                </div>
              </div>

              <div className="space-y-1.5 col-span-2">
                <label className="text-[10px] font-mono text-slate-500 uppercase">IP Allowlist Subnets Block (CIDR Format, Comma Pack)</label>
                <textarea 
                  defaultValue="10.140.0.0/16, 172.56.21.0/24, 192.110.12.0/24"
                  className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded p-2.5 h-16 font-mono text-[11.5px] leading-normal"
                ></textarea>
              </div>

            </div>

            <div className="pt-6 border-t border-slate-900">
              <button 
                type="submit" 
                className="h-9 px-4 bg-gradient-to-r from-blue-700 to-cyan-700 hover:from-blue-600 hover:to-cyan-600 font-bold font-sans text-xs text-white rounded-lg cursor-pointer transition-all"
              >
                Save Security Policy
              </button>
            </div>
          </form>
        )}

        {/* API Integration Settings Sheet */}
        {activeTab === 'api' && (
          <form onSubmit={handleSaveAPI} className="space-y-6">
            <div>
              <h3 className="font-display font-medium text-sm text-slate-200">Syslog & SIEM Endpoint Integrations</h3>
              <p className="text-xs text-slate-400 mt-0.5">Integrate SecureMind engine with outward collector hubs like Splunk HEC, Datadog APIs, and AWS CloudTrail logs buckets.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans text-slate-300">
              <div className="space-y-1.5 col-span-2">
                <label className="text-[10px] font-mono text-slate-500 uppercase">Splunk HEC Collector URL Host</label>
                <input 
                  type="text" 
                  value={splunkHost} 
                  onChange={(e) => setSplunkHost(e.target.value)}
                  className="w-full h-9 bg-slate-900 border border-slate-800 text-slate-250 font-mono text-[11px] rounded px-3 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5 col-span-2">
                <label className="text-[10px] font-mono text-slate-500 uppercase">HEC Secret Access Token Key</label>
                <div className="relative">
                  <input 
                    type={showApiKey ? 'text' : 'password'} 
                    value={tokenKey} 
                    onChange={(e) => setTokenKey(e.target.value)}
                    className="w-full h-9 bg-slate-900 border border-slate-800 text-slate-200 font-mono text-[11px] rounded pl-3 pr-10 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  >
                    <span>{showApiKey ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-3 bg-cyan-950/20 border border-cyan-500/20 rounded-xl space-y-1.5 mt-3">
              <div className="flex items-center gap-1.5 font-semibold text-xs text-cyan-400">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>Integration Health Check</span>
              </div>
              <p className="text-[10.5px] text-slate-400 leading-normal font-mono">
                Splunk connection verified: Payload logs stream active. Latency average is 12ms. AWS S3 polling cycle is active.
              </p>
            </div>

            <div className="pt-6 border-t border-slate-900">
              <button 
                type="submit" 
                className="h-9 px-4 bg-gradient-to-r from-blue-700 to-cyan-700 hover:from-blue-600 hover:to-cyan-600 font-bold font-sans text-xs text-white rounded-lg cursor-pointer transition-all"
              >
                TEST & SAVE INTEGRATION
              </button>
            </div>
          </form>
        )}

      </div>

    </div>
  );
}
