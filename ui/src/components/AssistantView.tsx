import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, Send, ArrowRight, User, Terminal, ListTodo, 
  Layers, ShieldAlert, Cpu, Lightbulb, ChevronRight, CheckCircle2 
} from 'lucide-react';
import { mockChatHistory } from '../mockData';
import { ChatMessage } from '../types';

interface AssistantViewProps {
  triggerSystemNotification: (message: string, type: 'info' | 'success' | 'warn' | 'error') => void;
}

export default function AssistantView({ triggerSystemNotification }: AssistantViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(mockChatHistory);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Suggestions chips
  const suggestedPrompts = [
    { text: 'Why was that SQLi alert generated?', category: 'Exploration' },
    { text: 'Show current high-risk incidents list', category: 'Summary' },
    { text: 'Analyze recent login activities', category: 'Audit' },
    { text: 'Draft a remediation plan for LockBit ransomware', category: 'Playbooks' }
  ];

  // Auto scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Reply simulation engine based on prompt questions
  const simulateAIReply = (userPrompt: string) => {
    setIsTyping(true);

    setTimeout(() => {
      let replyText = '';
      let replyInsights: any = undefined;

      const pLower = userPrompt.toLowerCase();

      if (pLower.includes('sqli') || pLower.includes('sql') || pLower.includes('alert')) {
        replyText = `The **Union-based SQL Injection alert (THR-782)** was triggered because our Cloud Gateway WAF detected a raw hexadecimal concatenation query targeting our \`/api/v2/customer/billing\` endpoint.\n\nHistorically, union attacks imply that an adversary is attempting to concatenate unauthorized query records with our standard customer search indexes to retrieve encrypted user accounts. \n\nI have cross-checked the source IP **185.220.101.44** (which is registered as an active Tor routing relay) against our endpoint registries. No valid credentials have been verified yet, indicating the bypass block worked as configured.`;
        replyInsights = {
          type: 'threat',
          title: 'Threat Intel Match: CVE-2025-4421',
          items: [
            'Confidence Level: 98% (High Relevance SQLi Match)',
            'Affected Controller: billing-api-v2 query-endpoint',
            'Advised block rule: drop payloads matching sys.tables queries',
            'Source Reputation: Active Tor exit node blacklist recommended'
          ]
        };
      } else if (pLower.includes('high-risk') || pLower.includes('incidents') || pLower.includes('show')) {
        replyText = `Under active operations, we have **1 Critical Incident Case queue** requiring priority remediation:\n\n* **INC-2026-0041**: Multi-Stage Intrusion Investigation (APT-39) with a **Risk score of 96**. This maps a compromised administrator session lateral move running Kerberos tickets searches.\n\nI have isolated the compromised workstation via local SentinelOne EDR host commands. What forensic trace would you like me to map next?`;
        replyInsights = {
          type: 'summary',
          title: 'Active SOC Incident Hotlist',
          items: [
            'INC-2026-0041: APT-39 intrusion investigation (Score: 96)',
            'INC-2026-0042: High-velocity ransomware drop attempt (Score: 84 - QUARANTINED)',
            'INC-2026-0043: Kubernetes Kubelet scan (Score: 58 - CLOSED)'
          ]
        };
      } else if (pLower.includes('login') || pLower.includes('activity')) {
        replyText = `I have audited active SSO access directories from the last hour. \n\nWe observe **1 anomalous traveler access conflict**:\n\n* User **Corey Page** logged in from Frankfurt, Germany (IP: 45.143.20) only 30 minutes after completing a session from New York, US. \n\nThis constitutes a high-velocity physical impossibility discrepancy and is suspected as session hijack or push-fatigue MFA bypass.`;
        replyInsights = {
          type: 'remediation',
          title: 'SSO Escalation Workflows Recommended',
          items: [
            'Initiate EntraID session global revoke on User-Corey.Page Account.',
            'Issue SMS confirmation out-of-band token check.',
            'Block Frankfurt proxy range (45.143.20.0/24) on perimeter Cloud flare WAF.'
          ]
        };
      } else if (pLower.includes('lockbit') || pLower.includes('ransomware') || pLower.includes('plan')) {
        replyText = `To mitigate the **LockBit 3.0 Ransomware attempt (INC-2026-0042)**, I have structured an immediate tactical playbook sequence according to MITRE D3FEND patterns:\n\n1. **Credential Block**: Lock the local Active Directory domain controller account linked with workstation IP **10.140.24.112**.\n2. **Network Decouple**: Sever active SMB/CIFS network share pathways to prevent encryption files creeping onto file-servers.\n3. **Volume Check**: Call vssadmin checks to confirm shadow copies registries were not deleted prior to antivirus blocks.`;
        replyInsights = {
          type: 'remediation',
          title: 'LockBit mitigation checklists',
          items: [
            'Isolate Workstation IP 10.140.24.112 right now.',
            'Audit SMB logs originating from finance subnet 10.140.24.0/24.',
            'Deploy indicator hashes (md5/sha256) globally on endpoint manager.'
          ]
        };
      } else {
        replyText = `I have analyzed your prompt: "${userPrompt}". Based on the current SOC telemetry scope, I recommend checking our active Threats Ledger (THR-782) or querying syslog API endpoints related to that keyword. Let me know if you would like me to draft a custom CLI sanitization script for this.`;
      }

      const aiMessage: ChatMessage = {
        id: `c-reply-${Date.now()}`,
        role: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        insights: replyInsights
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
      triggerSystemNotification('AI analysis response synthesized.', 'success');
    }, 1500);
  };

  // Submit button event
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: `c-user-${Date.now()}`,
      role: 'user',
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    simulateAIReply(userMsg.text);
  };

  // Suggestion click
  const handleSuggestionClick = (promptText: string) => {
    if (isTyping) return;
    const userMsg: ChatMessage = {
      id: `c-user-${Date.now()}`,
      role: 'user',
      text: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    simulateAIReply(promptText);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 h-[calc(100vh-140px)] pb-6" id="ai-assistant-page">
      
      {/* LEFT 3/4: Principal Chat Window Interface */}
      <div className="xl:col-span-3 bg-slate-950/80 border border-slate-800 rounded-xl flex flex-col justify-between overflow-hidden relative">
        <div className="absolute inset-0 cyber-grid opacity-20 pointer-events-none"></div>

        {/* Chat Console Header */}
        <div className="p-4 bg-slate-900/60 border-b border-slate-850 flex items-center justify-between relative z-10 select-none">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-sm text-white">SecureMind Copilot</span>
                <span className="text-[8px] font-mono font-bold bg-cyan-950 text-cyan-400 px-1 py-0.5 rounded border border-cyan-500/30 animate-pulse">MODEL: FLASH-3.5-PRO</span>
              </div>
              <p className="text-[10px] text-slate-400">Autonomous LLM agent fine-tuned on SecOps forensic metrics and CVE indexes.</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500 hidden sm:flex">
            <div className="flex items-center gap-1.5 border-r border-slate-800 pr-3">
              <Cpu className="w-3.5 h-3.5" />
              <span>TOKEN CACHE: 94%</span>
            </div>
            <div>ACTIVE PLAYBOOKS: 42</div>
          </div>
        </div>

        {/* Conversation Message Logs history */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 relative z-10">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex gap-4 items-start max-w-3xl ${
                msg.role === 'user' ? 'ml-auto flex-row-reverse text-right' : ''
              }`}
            >
              {/* Avatar circular frame */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                msg.role === 'user' 
                  ? 'bg-indigo-950 border-indigo-500/30 text-indigo-400 font-bold text-xs' 
                  : 'bg-cyan-950 border-cyan-500/30 text-cyan-400'
              }`}>
                {msg.role === 'user' ? (
                  <span>AJ</span>
                ) : (
                  <Sparkles className="w-4 h-4 animate-pulse" />
                )}
              </div>

              {/* Text message box formatting */}
              <div className="space-y-3 flex-1 min-w-0">
                <div className={`p-4 rounded-xl text-slate-300 font-sans leading-relaxed text-xs md:text-[12.5px] ${
                  msg.role === 'user' 
                    ? 'bg-slate-900 border border-slate-800 text-left' 
                    : 'bg-slate-900/40 border border-slate-900 text-left'
                }`}>
                  
                  {/* Print standard body message */}
                  <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>

                </div>

                {/* Optional nested custom Insights visual card components */}
                {msg.insights && (
                  <div className="border border-slate-850 rounded-xl bg-slate-900/60 p-4 space-y-3 text-left">
                    <div className="flex items-center gap-2 border-b border-slate-950 pb-2">
                      <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-300">
                        {msg.insights.title}
                      </span>
                    </div>
                    
                    <div className="space-y-1.5">
                      {msg.insights.items.map((item, index) => (
                        <div key={index} className="flex items-start gap-2.5 text-[11px] text-slate-400 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-500 shrink-0 mt-0.5" />
                          <p>{item}</p>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button 
                        onClick={() => triggerSystemNotification(`Action pipeline matching "${msg.insights?.title}" initiated.`, 'success')}
                        className="text-[9px] font-mono px-2 py-1 bg-cyan-900/20 hover:bg-cyan-900/40 border border-cyan-500/20 text-cyan-400 rounded cursor-pointer transition-colors"
                      >
                        Apply AI Remediation Workflow →
                      </button>
                    </div>
                  </div>
                )}

                {/* Timestamp logs indicator */}
                <div className={`text-[8.5px] font-mono text-slate-500 px-1 mt-1 block uppercase ${
                  msg.role === 'user' ? 'text-right' : 'text-left'
                }`}>
                  {msg.role === 'user' ? 'Analyst Abhishek' : 'Copilot Sentinel'} • {msg.timestamp}
                </div>
              </div>

            </div>
          ))}

          {/* IsTyping Loader Skeleton */}
          {isTyping && (
            <div className="flex gap-4 items-start max-w-xl">
              <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/30 text-cyan-400 flex items-center justify-center animate-spin">
                <Sparkles className="w-4 h-4" />
              </div>
              
              <div className="space-y-2">
                <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-900 w-56 space-y-2 select-none">
                  <div className="h-2.5 bg-slate-800 rounded-full w-full animate-pulse"></div>
                  <div className="h-2.5 bg-slate-800 rounded-full w-5/6 animate-pulse" style={{ animationDelay: '0.15s' }}></div>
                  <div className="h-2.5 bg-slate-800 rounded-full w-4/5 animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                </div>
                <span className="text-[8px] font-mono text-slate-500 uppercase">Copilot is sorting logs...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef}></div>
        </div>

        {/* Input Bar Form controls */}
        <div className="p-4 bg-slate-950 border-t border-slate-900 relative z-10">
          <form onSubmit={handleSubmit} className="relative flex items-center">
            
            <input 
              type="text" 
              placeholder="Ask Copilot... (e.g. 'Why was THR-782 generated?', 'Draft mitigation rule')"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isTyping}
              className="w-full text-xs h-10 bg-slate-900 border border-slate-800 rounded-xl pl-4 pr-12 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
            />

            <button 
              type="submit"
              disabled={isTyping || !inputText.trim()}
              className={`absolute right-1.5 w-7.5 h-7.5 rounded-lg flex items-center justify-center text-white transition-colors uppercase ${
                inputText.trim() 
                  ? 'bg-cyan-600 hover:bg-cyan-500 cursor-pointer text-white' 
                  : 'bg-slate-800 text-slate-600 cursor-not-allowed'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
            </button>

          </form>
        </div>

      </div>

      {/* RIGHT 1/4: Interactive Prompts Desk Side helper */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between overflow-y-auto">
        
        <div className="space-y-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase block">SUGGESTED DISCOVERY QUERIES</span>
            <h3 className="font-display font-medium text-sm text-slate-200">Interactive Prompt Shortcuts</h3>
            <p className="text-[11px] text-slate-400">Click any shortcut below to inject query tokens into the LLM core.</p>
          </div>

          <div className="space-y-2.5 pt-2">
            {suggestedPrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSuggestionClick(p.text)}
                disabled={isTyping}
                className="w-full p-3 bg-slate-900/60 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 text-left rounded-lg text-[11px] font-medium text-slate-300 font-sans tracking-tight transition-all duration-200 cursor-pointer group flex items-start gap-2.5 disabled:opacity-40"
              >
                <Lightbulb className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <div className="space-y-1">
                  <p className="leading-snug text-slate-200 group-hover:text-white transition-colors">{p.text}</p>
                  <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block">{p.category}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Security reminders HUD */}
        <div className="pt-6 border-t border-slate-950/80">
          <div className="p-3 bg-cyan-950/15 border border-cyan-500/20 rounded-lg space-y-1.5">
            <h4 className="text-[11px] font-bold text-cyan-400 flex items-center gap-1.5 uppercase font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Copilot Guidelines
            </h4>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              All outputs are referenced automatically against MITRE ATT&CK catalogs. SecureMind logs conversations inside a local encrypted ring buffer.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
