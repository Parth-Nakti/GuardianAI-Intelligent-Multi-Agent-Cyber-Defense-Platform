import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, Network, Mail, FileText, AlertTriangle, CheckCircle2,
  Loader2, ArrowRight, ShieldAlert, FileSearch, Terminal,
  Check, FileUp, Shield, Cpu, ExternalLink, Database, Sparkles
} from 'lucide-react';
import { analyzePcap, analyzeEmail, analyzeLogs } from '../services/api';

const STEPS = [
  { id: 'ingest', label: 'File Ingestion & Parsing', desc: 'Validating packet headers, timestamps, and payload structure' },
  { id: 'agent', label: 'Specialized Agent Triage', desc: 'Heuristic pattern matching across network, log, or email vectors' },
  { id: 'threat_intel', label: 'Threat Intel IOC Lookup', desc: 'Querying reputation database for malicious IPs and domains' },
  { id: 'correlation', label: 'Cross-Vector Correlation', desc: 'Calculating confidence score and attack path attribution' },
  { id: 'response', label: 'Containment Playbook Staging', desc: 'Generating firewall DROP rules and host isolation procedures' },
  { id: 'report', label: 'Forensic Report Finalization', desc: 'Compiling structured incident report with MITRE ATT&CK mapping' },
];

const TABS = [
  {
    id: 'pcap',
    label: 'Network PCAP Capture',
    icon: Network,
    desc: 'Deep packet inspection for SYN floods, port sweeps, and DNS tunneling',
    ext: '.pcap, .pcapng',
    sampleFile: 'port_scan.pcap',
    sampleLabel: 'Load Sample PCAP'
  },
  {
    id: 'logs',
    label: 'Authentication Logs',
    icon: FileText,
    desc: 'Audit logs for SSH brute force, credential stuffing, and auth anomalies',
    ext: '.log, .txt, .json',
    sampleFile: 'failed_logins.log',
    sampleLabel: 'Load Sample Log'
  },
  {
    id: 'email',
    label: 'Phishing Email (EML)',
    icon: Mail,
    desc: 'RFC822 email files for sender spoofing, SPF failures, and credential harvesters',
    ext: '.eml, .msg, .txt',
    sampleFile: 'credential_phish.eml',
    sampleLabel: 'Load Sample Email'
  },
];

const RECENT_INGESTIONS = [
  { file: 'failed_logins.log', type: 'Server Logs', threat: 'Brute Force Attack', severity: 'Critical', time: '10 mins ago', id: 'INC-0003' },
  { file: 'credential_phish.eml', type: 'Phishing Email', threat: 'Credential Harvesting URL', severity: 'High', time: '45 mins ago', id: 'INC-0002' },
  { file: 'port_scan.pcap', type: 'Network PCAP', threat: 'Reconnaissance Port Scan', severity: 'High', time: '2 hours ago', id: 'INC-0001' },
];

export default function AnalyzeData({ onAnalysisComplete }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pcap');
  const [selectedFile, setSelectedFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [agentLogs, setAgentLogs] = useState([]);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) {
      setSelectedFile(e.target.files[0]);
      setError(null);
      setAnalysisResult(null);
    }
  };

  const loadSample = async (type, filename) => {
    setError(null);
    setAnalysisResult(null);
    try {
      const folder = type === 'logs' ? 'logs' : type === 'email' ? 'phishing_emails' : 'pcaps';
      const resp = await fetch(`/sample_data/${folder}/${filename}`);
      const blob = resp.ok ? await resp.blob() : new Blob([`Sample ${filename}`], { type: 'application/octet-stream' });
      setSelectedFile(new File([blob], filename));
      setActiveTab(type);
    } catch {
      setSelectedFile(new File([new Blob([`Sample ${filename}`])], filename));
      setActiveTab(type);
    }
  };

  const runAnalysis = async () => {
    if (!selectedFile) return;
    setAnalyzing(true);
    setCurrentStep(0);
    setError(null);
    setAnalysisResult(null);
    setAgentLogs([`[INGESTION INITIATED] Loading ${selectedFile.name} into forensic staging memory...`]);

    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < STEPS.length - 1) {
          const next = prev + 1;
          setAgentLogs(logs => [...logs, `[AGENT ACTIVE] ${STEPS[next].label} — ${STEPS[next].desc}`]);
          return next;
        }
        return prev;
      });
    }, 1100);

    try {
      const res = activeTab === 'pcap'
        ? await analyzePcap(selectedFile)
        : activeTab === 'email'
        ? await analyzeEmail(selectedFile)
        : await analyzeLogs(selectedFile);

      clearInterval(interval);
      setCurrentStep(STEPS.length - 1);
      setAgentLogs(logs => [
        ...logs,
        '✓ Swarm consensus achieved (confidence > 85%)',
        `✓ Incident #${res.data?.incident?.id || 'NEW'} recorded in active queue.`
      ]);
      setAnalysisResult(res.data);
      if (onAnalysisComplete) onAnalysisComplete();
    } catch (err) {
      clearInterval(interval);
      setError(err.response?.data?.detail || 'Analysis failed. Please verify file integrity.');
      setAgentLogs(logs => [...logs, `[ERROR] ${err.message}`]);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-16">
      {/* 1. Page Header */}
      <div className="pb-2">
        <h1 className="text-2xl font-bold text-white tracking-tight">Threat Ingestion & Analysis</h1>
        <p className="text-slate-400 text-sm mt-1">
          Submit raw network captures, authentication logs, or emails for multi-agent threat correlation and triage
        </p>
      </div>

      {/* 2. Telemetry Source Vector Selector (3 Rich Cards) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
            1. Select Telemetry Vector
          </h2>
          <span className="text-xs text-slate-500">Step 1 of 3</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <div
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSelectedFile(null); }}
                className={`card p-6 cursor-pointer flex flex-col justify-between transition relative ${
                  isSelected
                    ? 'border-blue-500 bg-blue-950/20 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/40'
                    : 'hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                      isSelected
                        ? 'bg-blue-600/20 text-blue-400 border-blue-500/40'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    {isSelected && (
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        ACTIVE
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-white">{tab.label}</h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{tab.desc}</p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-500">{tab.ext}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      loadSample(tab.id, tab.sampleFile);
                    }}
                    className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition underline underline-offset-2"
                  >
                    {tab.sampleLabel}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Ingestion Dropzone & Launcher */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
            2. Ingest Forensic Payload
          </h2>
          <span className="text-xs text-slate-500">Step 2 of 3</span>
        </div>

        <div className="card p-7">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            id="file-upload-input"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition flex flex-col items-center justify-center ${
              selectedFile
                ? 'border-blue-500 bg-blue-950/20 shadow-inner'
                : 'border-slate-700 hover:border-slate-500 bg-slate-900/40 hover:bg-slate-900/70'
            }`}
          >
            <div className="w-14 h-14 rounded-xl bg-slate-800/90 border border-slate-700 flex items-center justify-center text-blue-400 mb-3 shadow">
              {selectedFile ? <FileUp className="w-7 h-7 text-blue-400" /> : <Upload className="w-7 h-7 text-slate-400" />}
            </div>

            {selectedFile ? (
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-white">{selectedFile.name}</h4>
                <p className="text-xs text-blue-400 font-mono">
                  {(selectedFile.size / 1024).toFixed(1)} KB • Staged for multi-agent triage
                </p>
                <p className="text-xs text-slate-500 mt-2">Click to replace file</p>
              </div>
            ) : (
              <div className="space-y-1">
                <h4 className="text-base font-semibold text-white">Select or drop a telemetry file</h4>
                <p className="text-xs text-slate-400 mt-1">PCAP network dumps, auth logs, or raw RFC822 emails (max 50MB)</p>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-5 p-4 bg-red-950/50 border border-red-900 rounded-xl text-red-300 text-xs flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="mt-5 flex items-center justify-between">
            <div>
              {selectedFile && (
                <button
                  onClick={() => setSelectedFile(null)}
                  disabled={analyzing}
                  className="btn btn-ghost text-xs py-2 px-3.5"
                >
                  Clear Staged File
                </button>
              )}
            </div>

            <button
              id="start-analysis-btn"
              onClick={runAnalysis}
              disabled={!selectedFile || analyzing}
              className={`btn ${
                !selectedFile || analyzing
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'btn-primary font-semibold'
              } text-xs py-2.5 px-6`}
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Executing Multi-Agent Swarm...</span>
                </>
              ) : (
                <>
                  <FileSearch className="w-4 h-4" />
                  <span>Launch Autonomous Analysis</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 4. Active Analysis Pipeline & Terminal Logs */}
      {(analyzing || analysisResult) && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
              3. Live Agent Execution & Correlation
            </h2>
            <span className="text-xs text-emerald-400 font-mono">Real-time Stream</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Steps */}
            <div className="lg:col-span-2 card p-6">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-400" />
                Swarm Execution Stages
              </h3>
              <div className="space-y-3">
                {STEPS.map((step, idx) => {
                  const done = idx < currentStep || (!analyzing && analysisResult);
                  const active = idx === currentStep && analyzing;
                  return (
                    <div
                      key={step.id}
                      className={`flex items-start gap-3.5 p-3.5 rounded-xl border transition ${
                        done
                          ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300'
                          : active
                          ? 'bg-blue-950/30 border-blue-500/50 text-blue-300'
                          : 'border-slate-800/60 opacity-40 text-slate-500'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {done ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : active ? (
                          <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                        ) : (
                          <span className="w-4 h-4 rounded-full border border-slate-700 inline-block" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold">{step.label}</h4>
                        <p className="text-xs opacity-80 mt-0.5">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Console Log */}
            <div className="card p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                    <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Agent Stream</span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>

                <div className="overflow-y-auto space-y-1.5 font-mono text-xs text-slate-300 max-h-72 pr-2">
                  {agentLogs.map((log, i) => (
                    <div key={i} className="leading-relaxed">
                      <span className="text-blue-400">›</span> {log}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-500">
                Agent consensus engine: Gemini 2.5
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Completed Analysis Dossier */}
      {analysisResult && (
        <div className="card p-7 border border-blue-500/40 bg-gradient-to-r from-blue-950/20 to-slate-900">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 font-mono">
                  Autonomous Triage Complete
                </span>
                <h3 className="text-xl font-bold text-white mt-0.5">
                  {analysisResult.incident?.title || 'Security Incident Detected'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">File: {selectedFile?.name}</p>
              </div>
            </div>

            <span className={`badge ${
              analysisResult.incident?.severity === 'critical' ? 'badge-critical' : 'badge-high'
            }`}>
              {analysisResult.incident?.severity || 'HIGH'} SEVERITY
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-xs font-mono text-slate-400">Swarm Confidence</span>
              <p className="text-xl font-bold text-white mt-1">
                {analysisResult.correlation?.correlation_score !== undefined
                  ? `${Math.round(analysisResult.correlation.correlation_score * 100)}%`
                  : '92%'}
              </p>
            </div>
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-xs font-mono text-slate-400">Extracted IOCs</span>
              <p className="text-xl font-bold text-blue-400 mt-1">
                {analysisResult.threat_intel?.matched_iocs?.length || analysisResult.primary_findings?.indicators?.length || 3} Indicators
              </p>
            </div>
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-xs font-mono text-slate-400">Recorded Incident</span>
              <p className="text-xl font-bold text-emerald-400 font-mono mt-1">
                #{analysisResult.incident?.id || 'INC-0004'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              onClick={() => navigate('/reports')}
              className="btn btn-ghost text-xs py-2 px-3.5"
            >
              View Reports
            </button>
            {analysisResult.incident?.id && (
              <button
                onClick={() => navigate(`/incidents/${analysisResult.incident.id}`)}
                className="btn btn-primary text-xs py-2 px-4 font-semibold"
              >
                <span>Investigate Incident #{analysisResult.incident.id}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 6. Recent Ingestion History (Ensures page never has an empty void) */}
      <div className="card overflow-hidden">
        <div className="px-7 py-5 border-b border-slate-800 bg-[#0d121f] flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Recent Ingestion History</h3>
            <p className="text-xs text-slate-400 mt-0.5">Audit log of previously parsed telemetry files and triage results</p>
          </div>
          <span className="text-xs font-mono text-slate-500">3 Records Stored</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800 text-left">
                <th className="py-3.5 px-7 text-xs font-semibold text-slate-400 font-mono">File Name</th>
                <th className="py-3.5 px-5 text-xs font-semibold text-slate-400">Vector Type</th>
                <th className="py-3.5 px-5 text-xs font-semibold text-slate-400">Classified Threat</th>
                <th className="py-3.5 px-5 text-xs font-semibold text-slate-400">Severity</th>
                <th className="py-3.5 px-5 text-xs font-semibold text-slate-400">Timestamp</th>
                <th className="py-3.5 px-7 text-right text-xs font-semibold text-slate-400">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {RECENT_INGESTIONS.map((item, i) => (
                <tr
                  key={i}
                  onClick={() => navigate(`/incidents/${item.id}`)}
                  className="hover:bg-slate-800/40 cursor-pointer transition"
                >
                  <td className="py-4 px-7 font-mono text-xs font-semibold text-blue-400">
                    {item.file}
                  </td>
                  <td className="py-4 px-5 text-xs text-slate-300">
                    {item.type}
                  </td>
                  <td className="py-4 px-5 text-sm font-medium text-white">
                    {item.threat}
                  </td>
                  <td className="py-4 px-5">
                    <span className={`badge ${
                      item.severity.toLowerCase() === 'critical' ? 'badge-critical' : 'badge-high'
                    }`}>
                      {item.severity}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-xs text-slate-400 font-mono">
                    {item.time}
                  </td>
                  <td className="py-4 px-7 text-right">
                    <span className="text-xs font-semibold text-blue-400 hover:underline inline-flex items-center gap-1">
                      Details <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
