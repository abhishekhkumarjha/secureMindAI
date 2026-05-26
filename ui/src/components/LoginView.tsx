import React, { useState, useEffect, useRef } from 'react';
import { Shield, Lock, Mail, CheckCircle2, AlertOctagon, Terminal, Sparkles, ChevronRight, HelpCircle } from 'lucide-react';
import { loginUser } from '../api';

interface LoginViewProps {
  onLoginSuccess: (email: string) => void;
  triggerSystemNotification: (message: string, type: 'info' | 'success' | 'warn' | 'error') => void;
}

export default function LoginView({ onLoginSuccess, triggerSystemNotification }: LoginViewProps) {
  const [email, setEmail] = useState('abhishek.jha@securemind.ai');
  const [password, setPassword] = useState('SOCOperational@2026!');
  const [rememberMe, setRememberMe] = useState(true);
  const [errorText, setErrorText] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // HTML5 Rain Canvas Effect - stream system metrics and bin signatures
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Words & Binary indices to stream
    const words = [
      'APT-39', 'CVE-2025-4421', 'SQLi', 'BLOCKED', 'MFA_OK', 'EDR_ACTIVE',
      '1010', '0x756e', 'WAF_GUARD', 'PORT_22', 'SHIELD_ON', 'SECURE',
      '01', '1', '0', 'KERBEROS', 'LSASS_DUMP', 'QUARANTINE'
    ];

    const fontSize = 11;
    const columns = Math.floor(width / fontSize) + 1;
    const drops = Array(columns).fill(1).map(() => Math.floor(Math.random() * -100));

    const draw = () => {
      // Semi-transparent black clear to create fade trail
      ctx.fillStyle = 'rgba(2, 6, 23, 0.25)';
      ctx.fillRect(0, 0, width, height);

      // Cyber Cyan font
      ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
      ctx.font = `bold ${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        // Randomly choose word
        const text = words[Math.floor(Math.random() * words.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Draw character
        ctx.fillText(text, x, y);

        // Reset drop on reach or randomly
        if (y > height && Math.random() > 0.98) {
          drops[i] = 0;
        }
        drops[i]++;
      }
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');

    if (!email.trim() || !password.trim()) {
      setErrorText('Please supply corporate email credentials to proceed.');
      return;
    }

    setLoggingIn(true);

    try {
      await loginUser(email, password);
      setLoggingIn(false);
      onLoginSuccess(email);
    } catch (error: any) {
      setLoggingIn(false);
      setErrorText(error.message || 'Unable to authenticate with SecureMind.');
      triggerSystemNotification('Login rejected by SecureMind authentication service.', 'error');
    }
  };

  return (
    <div id="soc-login-screen" className="relative min-h-screen bg-slate-950 flex items-center justify-center p-4 overflow-hidden font-sans">
      
      {/* 1. Behind-glass Binary Rain Matrix Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none opacity-60"></canvas>
      
      {/* Subtle overlays */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent to-slate-950/90 pointer-events-none z-0"></div>

      {/* 2. Main Double-Panel Card Frame */}
      <div className="relative z-10 w-full max-w-4xl bg-slate-900/40 border border-slate-800 rounded-2xl shadow-3xl overflow-hidden backdrop-blur-xl grid grid-cols-1 md:grid-cols-2">
        
        {/* Left Column: AI/Security illustration & Core value info */}
        <div className="relative p-8 bg-slate-950/60 border-r border-slate-850/40 hidden md:flex flex-col justify-between overflow-hidden">
          <div className="absolute inset-0 cyber-grid opacity-35"></div>

          {/* Top Logo */}
          <div className="relative z-10 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/30 flex items-center justify-center">
              <Shield className="w-4.5 h-4.5 text-cyan-400" />
            </div>
            <div>
              <span className="font-display font-black tracking-wider text-white text-base">SECURE<span className="text-cyan-400">MIND</span></span>
              <span className="text-[8px] font-mono tracking-widest text-cyan-400 block -mt-1 uppercase">SOC SENTINEL FRAME</span>
            </div>
          </div>

          {/* Central AI Security illustration rendered beautifully using interactive inline SVG */}
          <div className="relative z-10 flex items-center justify-center my-6 h-[220px]">
            <svg viewBox="0 0 400 400" className="w-[85%] h-auto">
              {/* Outer glowing orbits */}
              <circle cx="200" cy="200" r="160" stroke="rgba(6, 182, 212, 0.05)" strokeWidth="1" fill="none" />
              <circle cx="200" cy="200" r="130" stroke="rgba(6, 182, 212, 0.1)" strokeWidth="1.5" strokeDasharray="5, 3" fill="none" className="animate-spin" style={{ animationDuration: '30s' }} />
              <circle cx="200" cy="200" r="100" stroke="rgba(30, 41, 59, 0.4)" strokeWidth="1" fill="none" />
              
              {/* Secondary rotating dashboard radar sweep line */}
              <line x1="200" y1="200" x2="200" y2="70" stroke="rgba(6, 182, 212, 0.15)" strokeWidth="2" className="origin-[200px_200px]" style={{ animation: 'radar-sweep 8s linear infinite' }} />

              {/* Safe node structures */}
              <g fill="rgba(6, 182, 212, 0.2)" stroke="#22d3ee" strokeWidth="1">
                <circle cx="200" cy="70" r="6" />
                <circle cx="90" cy="230" r="4" />
                <circle cx="310" cy="200" r="5" />
                <circle cx="130" cy="310" r="5" className="animate-pulse" />
              </g>

              {/* Connection links */}
              <path d="M 200 70 L 200 140 M 90 230 L 160 200 M 310 200 L 240 200 M 130 310 L 200 250" stroke="rgba(6, 182, 212, 0.15)" strokeWidth="1" />

              {/* Pulsing Cryptographic lock and core shield symbol */}
              <g className="translate-y-4">
                {/* Shield background glow */}
                <path d="M 200 130 L 245 145 C 245 190, 230 230, 200 255 C 170 230, 155 190, 155 145 Z" fill="rgba(6, 182, 212, 0.1)" stroke="#22d3ee" strokeWidth="2" />
                <path d="M 200 140 L 235 152 C 235 185, 222 220, 200 242 C 178 220, 165 185, 165 152 Z" fill="rgba(30, 41, 59, 0.3)" stroke="rgba(6, 182, 212, 0.3)" strokeWidth="1" />
                
                {/* Small animated core lock hole */}
                <circle cx="200" cy="190" r="8" fill="#0f172a" stroke="#22d3ee" strokeWidth="1.5" />
                <path d="M 200 198 L 200 216" stroke="#22d3ee" strokeWidth="2.5" />
              </g>
            </svg>

            {/* Float badge indicators */}
            <div className="absolute bottom-2 left-6 p-2 bg-slate-900/80 border border-slate-800 rounded font-mono text-[9px] text-slate-400 flex items-center gap-1.5 leading-none">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>AUTO-MITIGATION: ACTIVE</span>
            </div>
          </div>

          {/* Bottom Security Info Tickers */}
          <div className="relative z-10 space-y-2 text-xs">
            <h4 className="font-semibold text-slate-200">Continuous AI Incident Correlation</h4>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              SecureMind ingest syslog aggregates from firewalls, clusters, and SSO directories inside a zero-trust model to quarantine zero-day threats instantly.
            </p>
          </div>

        </div>

        {/* Right Column: Secure login form sheet */}
        <div className="p-8 flex flex-col justify-between">
          
          <div className="space-y-1">
            <h2 className="font-display font-semibold text-xl text-white">SOC Secure Ingress</h2>
            <p className="text-xs text-slate-400">Authorize session token with credential profiles.</p>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4 my-8">
            
            {/* Display error if present */}
            {errorText && (
              <div className="p-3 rounded-lg bg-red-950/20 border border-red-500/30 text-red-400 font-mono text-[10.5px] leading-relaxed flex items-start gap-2">
                <AlertOctagon className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorText}</span>
              </div>
            )}

            {/* Email Field representation */}
            <div className="space-y-1.5 text-xs text-slate-350">
              <label className="text-[10px] font-mono text-slate-500 uppercase">Analyst Corporate Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Mail className="w-4 h-4 text-slate-500" />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs h-10 pl-9 rounded-lg bg-slate-950 border border-slate-850 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50"
                  placeholder="analyst@securemind.ai"
                />
              </div>
            </div>

            {/* Password Field representation */}
            <div className="space-y-1.5 text-xs text-slate-350">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono text-slate-500 uppercase">Secure Key Account Password</label>
                <button 
                  type="button"
                  onClick={() => triggerSystemNotification('MFA token requested out-of-band via registered mobile.', 'info')}
                  className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-slate-500" />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs h-10 pl-9 rounded-lg bg-slate-950 border border-slate-850 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50"
                  placeholder="Password token keys"
                />
              </div>
            </div>

            {/* Remember Me ToggleCheckbox */}
            <div className="flex items-center justify-between text-xs font-sans text-slate-400">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={rememberMe} 
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-800 bg-slate-950 text-cyan-500 focus:ring-0 focus:outline-none w-4.5 h-4.5 cursor-pointer"
                />
                <span>Save credentials token</span>
              </label>
            </div>

            {/* Submit Button */}
            <button 
              type="submit"
              disabled={loggingIn}
              className="w-full h-10 bg-gradient-to-r from-blue-700 to-cyan-700 hover:from-blue-600 hover:to-cyan-600 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white font-bold font-sans text-xs rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all uppercase"
            >
              {loggingIn ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Verifying HEC Session Key...</span>
                </>
              ) : (
                <>
                  <span>Authorize Secure Session</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>

          </form>

          {/* Quick Sandbox warning block */}
          <div className="p-3 bg-slate-950 border border-slate-900 rounded-lg text-[10px] font-mono text-slate-500 flex gap-2">
            <HelpCircle className="w-4.5 h-4.5 shrink-0 text-slate-600 mt-0.5" />
            <p className="leading-normal">
              Demo account loaded automatically. Click 'Authorize' directly to audit the active SOC platform.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
