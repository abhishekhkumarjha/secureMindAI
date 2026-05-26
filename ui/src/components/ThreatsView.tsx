import { useEffect, useState } from 'react';
import { 
  ShieldAlert, Calendar, MapPin, Filter, Search, Download, 
  ChevronRight, AlertTriangle, PlayCircle, Eye, EyeOff, Layers, ExternalLink, Sparkles
} from 'lucide-react';
import { mockThreats } from '../mockData';
import { detectAnomaly, detectLoginBehavior, fetchThreats, getModelStatus, ModelStatus, predictThreat as runThreatPrediction, PredictionResult } from '../api';
import { Threat } from '../types';

interface ThreatsViewProps {
  triggerSystemNotification: (message: string, type: 'info' | 'success' | 'warn' | 'error') => void;
}

export default function ThreatsView({ triggerSystemNotification }: ThreatsViewProps) {
  const [threats, setThreats] = useState<Threat[]>(mockThreats);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [inspectedThreat, setInspectedThreat] = useState<Threat | null>(mockThreats[0]);
  const [predictionInput, setPredictionInput] = useState<string>('[0.1, 1.0, 0.0, 5.2]');
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [anomalyInput, setAnomalyInput] = useState<string>('[1.0, 0.5, 10.0, 0.0]');
  const [anomalyResult, setAnomalyResult] = useState<PredictionResult | null>(null);
  const [loginResult, setLoginResult] = useState<PredictionResult | null>(null);
  const [modelStatus, setModelStatus] = useState<ModelStatus | null>(null);
  const [predictionError, setPredictionError] = useState<string | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [loginPayload, setLoginPayload] = useState({
    login_time: 14,
    login_location: 'India',
    device_type: 'desktop',
    failed_attempts: 0,
    session_duration: 15,
  });

  useEffect(() => {
    fetchThreats()
      .then(data => {
        setThreats(data);
        if (data[0]) setInspectedThreat(data[0]);
      })
      .catch(() => triggerSystemNotification('Using local demo threats because the threat API is unavailable.', 'warn'));

    getModelStatus()
      .then(setModelStatus)
      .catch(() => triggerSystemNotification('Model status endpoint is unavailable.', 'warn'));
  }, []);

  // Unique lists for filters
  const categories: string[] = ['all', ...Array.from(new Set<string>(threats.map(t => t.category)))];

  // Filtering Logic
  const filteredThreats = threats.filter(threat => {
    const matchesSearch = 
      threat.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      threat.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      threat.source.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSeverity = selectedSeverity === 'all' || threat.severity === selectedSeverity;
    const matchesStatus = selectedStatus === 'all' || threat.status === selectedStatus;
    const matchesCategory = selectedCategory === 'all' || threat.category === selectedCategory;

    return matchesSearch && matchesSeverity && matchesStatus && matchesCategory;
  });

  const parseFeatureVector = (value: string) => {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed) || parsed.some(item => typeof item !== 'number')) {
      throw new Error('Feature input must be a JSON array of numbers.');
    }
    return parsed;
  };

  const predictThreat = async () => {
    setPredictionError(null);
    setPredictionResult(null);
    setIsPredicting(true);

    try {
      const data = await runThreatPrediction(parseFeatureVector(predictionInput));
      setPredictionResult(data);
      triggerSystemNotification('Threat classifier returned a prediction successfully.', 'success');
    } catch (error: any) {
      setPredictionError(error.message);
      triggerSystemNotification('Threat classifier call failed. Check model files and input format.', 'error');
    } finally {
      setIsPredicting(false);
    }
  };

  const predictAnomaly = async () => {
    setPredictionError(null);
    setAnomalyResult(null);
    setIsPredicting(true);

    try {
      const data = await detectAnomaly(parseFeatureVector(anomalyInput));
      setAnomalyResult(data);
      triggerSystemNotification('Anomaly detector returned a prediction successfully.', 'success');
    } catch (error: any) {
      setPredictionError(error.message);
      triggerSystemNotification('Anomaly detector call failed. Check model files and input format.', 'error');
    } finally {
      setIsPredicting(false);
    }
  };

  const predictLogin = async () => {
    setPredictionError(null);
    setLoginResult(null);
    setIsPredicting(true);

    try {
      const data = await detectLoginBehavior(loginPayload);
      setLoginResult(data);
      triggerSystemNotification('Login behavior model returned a prediction successfully.', 'success');
    } catch (error: any) {
      setPredictionError(error.message);
      triggerSystemNotification('Login behavior model call failed. Check TensorFlow and trained model files.', 'error');
    } finally {
      setIsPredicting(false);
    }
  };

  // Quarantine host mechanism
  const triggerQuarantine = (threatId: string, asset: string) => {
    triggerSystemNotification(`EDR Quarantine instruction dispatched for device [${asset}] linked with threat ${threatId}. Connection severed.`, 'success');
  };

  // CSV Exporter Simulation
  const exportToCSV = () => {
    const header = 'ID,Title,Category,RiskScore,Severity,Timestamp,Source,Status,CVE\n';
    const rows = filteredThreats.map(t => 
      `"${t.id}","${t.title}","${t.category}",${t.riskScore},"${t.severity}","${t.timestamp}","${t.source}","${t.status}","${t.cve || 'N/A'}"`
    ).join('\n');
    
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SecureMind_SOC_Threats_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    triggerSystemNotification(`Filtered list (${filteredThreats.length} records) successfully saved to CSV layout file.`, 'success');
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 pb-12">
      
      {/* LEFT 2/3: Active Threat Records Ledger */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 xl:col-span-2 space-y-4">
        
        {/* Header Block with Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-3">
          <div>
            <h2 className="font-display font-semibold text-lg text-white">Active Threat Intelligence Desk</h2>
            <p className="text-xs text-slate-400">Tactical listing of core security signatures flagged across security perimeter checkpoints.</p>
          </div>
          <button 
            onClick={exportToCSV}
            className="h-9 px-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg flex items-center gap-2 text-xs text-slate-300 font-medium cursor-pointer transition-colors"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>Save filtered CSV</span>
          </button>
        </div>

        {/* Tactical Search & Filter Bars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Keyword Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search threat title, ID, IP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
            />
          </div>

          {/* Severity Dropdown */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-2 h-9">
            <span className="text-[10px] font-mono text-slate-500 uppercase">SEV:</span>
            <select 
              value={selectedSeverity} 
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-transparent text-xs text-slate-300 focus:outline-none w-full"
            >
              <option value="all">ALL</option>
              <option value="critical">CRITICAL</option>
              <option value="high">HIGH</option>
              <option value="medium">MEDIUM</option>
              <option value="low">LOW</option>
            </select>
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-2 h-9">
            <span className="text-[10px] font-mono text-slate-500 uppercase">CAT:</span>
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-xs text-slate-300 focus:outline-none w-full truncate"
            >
              {categories.map((cat, idx) => (
                <option key={idx} value={cat}>{cat.toUpperCase()}</option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-2 h-9">
            <span className="text-[10px] font-mono text-slate-500 uppercase">STATUS:</span>
            <select 
              value={selectedStatus} 
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-xs text-slate-300 focus:outline-none w-full"
            >
              <option value="all">ALL STATUS</option>
              <option value="Active">Active</option>
              <option value="Investigating">Investigating</option>
              <option value="Mitigated">Mitigated</option>
            </select>
          </div>

        </div>

        {/* Model integrations */}
        <div className="mt-6 bg-slate-950/80 border border-slate-800 rounded-xl p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-900 pb-3 mb-4">
            <div>
              <h3 className="font-semibold text-slate-200">AI Model Console</h3>
              <p className="text-xs text-slate-400">Live calls to the FastAPI prediction services used by this UI.</p>
            </div>
            {modelStatus && (
              <span className={`text-[10px] font-mono rounded px-2 py-1 border ${
                modelStatus.ready
                  ? 'bg-emerald-950/30 text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-950/30 text-amber-400 border-amber-500/20'
              }`}>
                {modelStatus.ready ? 'ALL MODELS READY' : 'TRAINED MODEL FILES MISSING'}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-slate-200">Threat Classifier</span>
                <button
                  type="button"
                  onClick={predictThreat}
                  disabled={isPredicting}
                  className="h-8 px-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-xs text-slate-950 font-semibold disabled:opacity-60"
                >
                  {isPredicting ? 'Analyzing...' : 'Run'}
                </button>
              </div>
              <textarea
                value={predictionInput}
                onChange={(e) => setPredictionInput(e.target.value)}
                rows={4}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-slate-200 text-xs placeholder-slate-500 focus:outline-none"
              />
              {predictionResult && (
                <pre className="rounded-lg bg-slate-900 border border-cyan-700/20 p-3 text-xs text-slate-200 whitespace-pre-wrap">
                  {JSON.stringify(predictionResult, null, 2)}
                </pre>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-slate-200">Anomaly Detector</span>
                <button
                  type="button"
                  onClick={predictAnomaly}
                  disabled={isPredicting}
                  className="h-8 px-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-xs text-slate-950 font-semibold disabled:opacity-60"
                >
                  {isPredicting ? 'Analyzing...' : 'Run'}
                </button>
              </div>
              <textarea
                value={anomalyInput}
                onChange={(e) => setAnomalyInput(e.target.value)}
                rows={4}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-slate-200 text-xs placeholder-slate-500 focus:outline-none"
              />
              {anomalyResult && (
                <pre className="rounded-lg bg-slate-900 border border-cyan-700/20 p-3 text-xs text-slate-200 whitespace-pre-wrap">
                  {JSON.stringify(anomalyResult, null, 2)}
                </pre>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-slate-200">Login Behavior</span>
                <button
                  type="button"
                  onClick={predictLogin}
                  disabled={isPredicting}
                  className="h-8 px-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-xs text-slate-950 font-semibold disabled:opacity-60"
                >
                  {isPredicting ? 'Analyzing...' : 'Run'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={loginPayload.login_time}
                  onChange={(e) => setLoginPayload(prev => ({ ...prev, login_time: Number(e.target.value) }))}
                  className="h-9 bg-slate-900 border border-slate-800 rounded-lg px-3 text-xs text-slate-200 focus:outline-none"
                  placeholder="Hour"
                />
                <input
                  type="number"
                  value={loginPayload.failed_attempts}
                  onChange={(e) => setLoginPayload(prev => ({ ...prev, failed_attempts: Number(e.target.value) }))}
                  className="h-9 bg-slate-900 border border-slate-800 rounded-lg px-3 text-xs text-slate-200 focus:outline-none"
                  placeholder="Failed"
                />
                <input
                  type="text"
                  value={loginPayload.login_location}
                  onChange={(e) => setLoginPayload(prev => ({ ...prev, login_location: e.target.value }))}
                  className="h-9 bg-slate-900 border border-slate-800 rounded-lg px-3 text-xs text-slate-200 focus:outline-none"
                  placeholder="Location"
                />
                <input
                  type="text"
                  value={loginPayload.device_type}
                  onChange={(e) => setLoginPayload(prev => ({ ...prev, device_type: e.target.value }))}
                  className="h-9 bg-slate-900 border border-slate-800 rounded-lg px-3 text-xs text-slate-200 focus:outline-none"
                  placeholder="Device"
                />
                <input
                  type="number"
                  value={loginPayload.session_duration}
                  onChange={(e) => setLoginPayload(prev => ({ ...prev, session_duration: Number(e.target.value) }))}
                  className="h-9 bg-slate-900 border border-slate-800 rounded-lg px-3 text-xs text-slate-200 focus:outline-none col-span-2"
                  placeholder="Session minutes"
                />
              </div>
              {loginResult && (
                <pre className="rounded-lg bg-slate-900 border border-cyan-700/20 p-3 text-xs text-slate-200 whitespace-pre-wrap">
                  {JSON.stringify(loginResult, null, 2)}
                </pre>
              )}
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {predictionError && (
              <div className="rounded-lg bg-red-950 border border-red-500/20 p-3 text-xs text-red-300">
                {predictionError}
              </div>
            )}
            {modelStatus && !modelStatus.ready && (
              <div className="rounded-lg bg-amber-950/30 border border-amber-500/20 p-3 text-xs text-amber-200">
                Train the models with <span className="font-mono">python -m ai_models.train</span> after placing datasets in <span className="font-mono">ai_models/datasets</span>.
              </div>
            )}
          </div>
        </div>

        {/* Main threats table container */}
        <div className="border border-slate-900 rounded-lg overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="bg-slate-900/40 border-b border-slate-900 font-mono text-[9px] text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 px-4">Risk Identifier</th>
                <th className="py-2.5 px-4">Core Vector details</th>
                <th className="py-2.5 px-4 text-center">Severity Factor</th>
                <th className="py-2.5 px-4">Source Asset Origin</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">HUD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 text-xs text-slate-300">
              {filteredThreats.length > 0 ? (
                filteredThreats.map((threat) => {
                  const isCurrent = inspectedThreat?.id === threat.id;
                  return (
                    <tr 
                      key={threat.id}
                      onClick={() => setInspectedThreat(threat)}
                      className={`hover:bg-slate-900/30 transition-colors cursor-pointer ${
                        isCurrent ? 'bg-gradient-to-r from-blue-900/15 to-cyan-950/10' : 'bg-transparent'
                      }`}
                    >
                      <td className="py-3 px-4 font-mono">
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            threat.severity === 'critical' ? 'bg-red-500 animate-pulse' :
                            threat.severity === 'high' ? 'bg-orange-500' :
                            threat.severity === 'medium' ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}></span>
                          <span className="font-bold text-slate-200">{threat.id}</span>
                        </div>
                        <p className="text-[9px] text-slate-500 leading-none mt-1">SCORE: <span className="text-slate-400 font-bold">{threat.riskScore}</span></p>
                      </td>
                      
                      <td className="py-3 px-4 max-w-[200px]">
                        <p className="font-medium text-slate-200 truncate">{threat.title}</p>
                        <p className="text-[9px] text-slate-500 truncate mt-1">{threat.category}</p>
                      </td>

                      <td className="py-3 px-4 h-full align-middle">
                        <div className="flex justify-center">
                          <span className={`text-[8px] font-mono font-bold uppercase rounded px-1.5 py-0.5 border leading-none ${
                            threat.severity === 'critical' ? 'bg-red-950/40 text-red-400 border-red-500/20' :
                            threat.severity === 'high' ? 'bg-orange-950/40 text-orange-400 border-orange-500/20' :
                            threat.severity === 'medium' ? 'bg-yellow-950/40 text-yellow-400 border-yellow-500/20' :
                            'bg-green-950/40 text-green-400 border-green-500/20'
                          }`}>
                            {threat.severity}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400 max-w-[120px] truncate">
                        {threat.source}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-sans px-2 py-0.5 rounded-full border ${
                          threat.status === 'Active' ? 'bg-cyan-950/30 text-cyan-400 border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.05)]' :
                          threat.status === 'Investigating' ? 'bg-amber-950/30 text-amber-500 border-amber-500/20' :
                          threat.status === 'Mitigated' ? 'bg-emerald-950/30 text-emerald-500 border-emerald-500/20' :
                          'bg-slate-900 border-slate-800 text-slate-500'
                        }`}>
                          {threat.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end">
                          <ChevronRight className={`w-4 h-4 transition-transform ${isCurrent ? 'transform translate-x-1 text-cyan-400' : 'text-slate-600'}`} />
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500 font-mono text-xs">
                    <Layers className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                    No threats detected matching active selection targets.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* RIGHT 1/3: Deep Threat Details Inspector Sheet */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between min-h-[500px]">
        
        {inspectedThreat ? (
          <div className="space-y-5">
            
            {/* Inspector Top Summary */}
            <div className="flex items-start justify-between border-b border-slate-900 pb-3">
              <div className="space-y-1">
                <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">THREAT INTELLIGENCE DOSSIER</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm leading-tight text-white font-bold">{inspectedThreat.id}</span>
                  <span className={`text-[9px] font-mono font-bold uppercase rounded px-1.5 py-0.5 border ${
                    inspectedThreat.severity === 'critical' ? 'bg-red-950/40 text-red-400 border-red-500/20' :
                    inspectedThreat.severity === 'high' ? 'bg-orange-950/40 text-orange-400 border-orange-500/20' :
                    inspectedThreat.severity === 'medium' ? 'bg-yellow-950/40 text-yellow-400 border-yellow-500/20' :
                    'bg-green-950/40 text-green-400 border-green-500/20'
                  }`}>
                    {inspectedThreat.severity}
                  </span>
                </div>
              </div>

              {/* Dynamic Risk Meter Dial */}
              <div className="flex flex-col items-center">
                <span className="text-[20px] font-display font-black text-red-400">{inspectedThreat.riskScore}</span>
                <span className="text-[8px] font-mono text-slate-500 leading-none">RISK INDEX</span>
              </div>
            </div>

            {/* Core Info */}
            <div className="space-y-3.5 text-xs text-slate-300">
              
              <div>
                <p className="text-[10px] font-mono text-slate-500 uppercase mb-1">CAMPAIGN TITLE</p>
                <p className="font-semibold text-slate-100">{inspectedThreat.title}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-900">
                <div>
                  <p className="text-[10px] font-mono text-slate-500 uppercase mb-1">CATEGORY</p>
                  <p className="text-slate-300">{inspectedThreat.category}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono text-slate-500 uppercase mb-1">CVE REFERENCE</p>
                  <span className="font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] force-select text-slate-300 flex items-center gap-1 w-max">
                    {inspectedThreat.cve || 'N/A'}
                    {inspectedThreat.cve && <ExternalLink className="w-2.5 h-2.5 text-slate-500" />}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-mono text-slate-500 uppercase mb-1">SOURCE NETWORK ORIGIN</p>
                <p className="font-mono text-slate-200 bg-slate-900/60 p-1.5 rounded border border-slate-900 font-semibold truncate flex items-center justify-between">
                  <span>{inspectedThreat.source}</span>
                  <span className="text-[8px] font-mono text-slate-500">WAN ADDRESS</span>
                </p>
              </div>

              {inspectedThreat.destination && (
                <div>
                  <p className="text-[10px] font-mono text-slate-500 uppercase mb-1">TARGET COGNITIVE DESTINATION</p>
                  <p className="font-mono text-slate-400 bg-slate-900/30 p-1.5 rounded border border-slate-900 truncate">
                    {inspectedThreat.destination}
                  </p>
                </div>
              )}

              {inspectedThreat.affectedAssets.length > 0 && (
                <div>
                  <p className="text-[10px] font-mono text-slate-500 uppercase mb-1">CONSTRAINED ASSETS</p>
                  <div className="flex flex-wrap gap-1.5">
                    {inspectedThreat.affectedAssets.map((asset, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-850 text-slate-300 font-mono text-[10px]">
                        {asset}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-slate-900">
                <p className="text-[10px] font-mono text-slate-500 uppercase mb-1">INCIDENT DESCRIPTION</p>
                <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-900 text-slate-400 leading-relaxed text-[11.5px]">
                  {inspectedThreat.description}
                </div>
              </div>

              {/* SecureMind Gemini Heuristic panel */}
              {inspectedThreat.aiExplanation && (
                <div className="p-3.5 bg-cyan-950/20 border border-cyan-500/20 rounded-xl space-y-1.5 mt-3 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-400/5 rounded-full blur-xl pointer-events-none"></div>
                  <div className="flex items-center gap-1.5 font-display font-semibold text-xs text-cyan-400">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Gemini Core Heuristic Analysis</span>
                  </div>
                  <p className="text-slate-300 leading-normal text-[11px] italic">
                    "{inspectedThreat.aiExplanation}"
                  </p>
                </div>
              )}

            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 font-sans p-6">
            <ShieldAlert className="w-10 h-10 text-slate-700 mb-3" />
            <p className="text-xs font-semibold">Dossier Locked</p>
            <p className="text-[11px] mt-1 text-slate-600 max-w-[200px]">Select any active threat log in the ledger to authorize forensic inspect.</p>
          </div>
        )}

        {/* Action button triggers */}
        {inspectedThreat && (
          <div className="pt-4 border-t border-slate-900 flex md:flex-row flex-col gap-3 mt-6">
            <button 
              onClick={() => triggerQuarantine(inspectedThreat.id, inspectedThreat.affectedAssets[0] || 'Unknown Host')}
              className="flex-1 h-9 bg-red-900/20 hover:bg-red-900/40 border border-red-500/30 hover:border-red-500/50 rounded-lg text-xs font-semibold text-red-400 flex items-center justify-center gap-2 cursor-pointer transition-all uppercase"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Host Quarantine</span>
            </button>
            <button 
              onClick={() => triggerSystemNotification(`Playbook security rule set matching CVE lookup deployed for ${inspectedThreat.id}.`, 'info')}
              className="flex-1 h-9 bg-gradient-to-r from-blue-900 to-cyan-900 hover:from-blue-800 hover:to-cyan-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Patch Signature</span>
            </button>
          </div>
        )}

      </div>

    </div>
  );
}
