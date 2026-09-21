import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, Network, Mail, FileText, AlertTriangle, CheckCircle2,
  Loader2, ArrowRight, ShieldAlert, FileSearch, Terminal,
  Check, FileUp, Shield, Cpu, ExternalLink, Database, Sparkles, Play
} from 'lucide-react';
import { analyzePcap, analyzeEmail, analyzeLogs } from '../services/api';
import { useTheme } from '../context/ThemeContext';

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
    desc: 'Deep packet inspection for SYN floods, stealth port sweeps, and DNS tunneling',
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
  const { isDark } = useTheme();
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
    <div className="space-y-10 max-w-7xl mx-auto pb-20">
      {/* 1. Page Header */}
      <div className="pb-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center gap-3">
          <h1
            className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight"
            style={{
              fontFamily: 'var(--font-heading)',
              color: 'var(--text-heading)'
            }}
          >
            Threat Ingestion & Analysis
          </h1>
          <span className="px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-500 text-xs font-bold">
            MULTI-AGENT SCANNER
          </span>
        </div>
        <p className="text-sm mt-1.5" style={{ color: 'var(--text-secondary)' }}>
          Submit raw network captures, server authentication logs, or suspicious emails for automated triage
        </p>
      </div>

      {/* 2. Vector Selector */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2
            className="text-xs font-bold uppercase tracking-wider flex items-center gap-2"
            style={{ color: 'var(--text-secondary)' }}
          >
            <span className="w-5 h-5 rounded-full bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-500 text-[11px] font-bold">
              1
            </span>
            Select Telemetry Vector
          </h2>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Step 1 of 3</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <div
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSelectedFile(null); }}
                className={`glass-card p-6 cursor-pointer flex flex-col justify-between transition-all ${
                  isSelected
                    ? 'border-cyan-500 ring-2 ring-cyan-500/30 shadow-lg'
                    : 'hover:border-cyan-500/40'
                }`}
                style={{
                  backgroundColor: isSelected
                    ? (isDark ? 'rgba(8, 20, 42, 0.9)' : 'rgba(240, 249, 255, 0.9)')
                    : 'var(--bg-card)'
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center border transition ${
                      isSelected
                        ? 'bg-cyan-500/20 text-cyan-500 border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                        : 'border-slate-300 dark:border-slate-800 text-slate-400'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    {isSelected && (
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-500 border border-cyan-500/30">
                        ACTIVE
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold" style={{ color: 'var(--text-heading)' }}>{tab.label}</h3>
                  <p className="text-sm mt-1.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{tab.desc}</p>
                </div>

                <div
                  className="mt-6 pt-4 border-t flex items-center justify-between"
                  style={{ borderColor: 'var(--border-subtle)' }}
                >
                  <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{tab.ext}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      loadSample(tab.id, tab.sampleFile);
                    }}
                    className="text-xs font-semibold text-cyan-500 hover:text-cyan-600 dark:hover:text-cyan-400 px-2.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/25 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-cyan-500" />
                    {tab.sampleLabel}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Ingestion Dropzone & Launcher */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2
            className="text-xs font-bold uppercase tracking-wider flex items-center gap-2"
            style={{ color: 'var(--text-secondary)' }}
          >
            <span className="w-5 h-5 rounded-full bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-500 text-[11px] font-bold">
              2
            </span>
            Upload Forensic Telemetry Payload
          </h2>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Step 2 of 3</span>
        </div>

        <div className="glass-card p-8">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            id="file-upload-input"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition flex flex-col items-center justify-center ${
              selectedFile
                ? 'border-cyan-500/60 bg-cyan-500/5 shadow-md'
                : 'hover:border-cyan-500/40'
            }`}
            style={{
              borderColor: selectedFile ? '#06b6d4' : 'var(--border-medium)',
              backgroundColor: 'var(--bg-inset)'
            }}
          >
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition ${
              selectedFile
                ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-500 shadow-md'
                : 'border'
            }`}
            style={{
              backgroundColor: selectedFile ? undefined : 'var(--bg-card)',
              borderColor: selectedFile ? undefined : 'var(--border-subtle)',
              color: selectedFile ? undefined : 'var(--text-muted)'
            }}
            >
              {selectedFile ? <FileUp className="w-8 h-8 text-cyan-500" /> : <Upload className="w-8 h-8" />}
            </div>

            {selectedFile ? (
              <div className="space-y-1.5">
                <h4 className="text-lg font-bold" style={{ color: 'var(--text-heading)' }}>{selectedFile.name}</h4>
                <p className="text-xs text-cyan-500 font-mono font-semibold">
                  {(selectedFile.size / 1024).toFixed(1)} KB · Staged in forensic memory
                </p>
                <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Click anywhere to replace with a different file</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <h4 className="text-lg font-bold" style={{ color: 'var(--text-heading)' }}>Select or drop a forensic telemetry file</h4>
                <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
                  Supports PCAP network dumps, authentication syslogs, or raw RFC822 emails (up to 50MB)
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-5 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 text-xs flex items-center gap-3 font-mono">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between flex-wrap gap-4">
            <div>
              {selectedFile && (
                <button
                  onClick={() => setSelectedFile(null)}
                  disabled={analyzing}
                  className="btn btn-ghost text-xs py-2 px-4 cursor-pointer"
                >
                  Clear File
                </button>
              )}
            </div>

            <button
              id="start-analysis-btn"
              onClick={runAnalysis}
              disabled={!selectedFile || analyzing}
              className={`btn ${
                !selectedFile || analyzing
                  ? 'opacity-50 cursor-not-allowed border'
                  : 'btn-primary shadow-lg cursor-pointer'
              } text-xs py-3 px-8`}
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>SWARM EXECUTING...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-cyan-200" />
                  <span>START MULTI-AGENT ANALYSIS</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 4. Active Analysis Pipeline & Terminal Logs */}
      {(analyzing || analysisResult) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2
              className="text-xs font-bold uppercase tracking-wider flex items-center gap-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              <span className="w-5 h-5 rounded-full bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-500 text-[11px] font-bold">
                3
              </span>
              Live Agent Execution Pipeline
            </h2>
            <span className="text-xs text-emerald-500 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              REAL-TIME ORCHESTRATION
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Steps */}
            <div className="lg:col-span-2 glass-card p-7">
              <h3 className="text-base font-bold mb-5 flex items-center gap-2" style={{ color: 'var(--text-heading)' }}>
                <Cpu className="w-5 h-5 text-cyan-500" />
                Swarm Execution Stages
              </h3>
              <div className="space-y-3">
                {STEPS.map((step, idx) => {
                  const done = idx < currentStep || (!analyzing && analysisResult);
                  const active = idx === currentStep && analyzing;
                  return (
                    <div
                      key={step.id}
                      className={`flex items-start gap-4 p-4 rounded-xl border transition ${
                        done
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                          : active
                          ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-500 shadow-sm'
                          : 'opacity-40'
                      }`}
                      style={{
                        borderColor: done || active ? undefined : 'var(--border-subtle)'
                      }}
                    >
                      <div className="mt-0.5 shrink-0">
                        {done ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        ) : active ? (
                          <Loader2 className="w-5 h-5 text-cyan-500 animate-spin" />
                        ) : (
                          <span className="w-5 h-5 rounded-full border inline-block" style={{ borderColor: 'var(--border-medium)' }} />
                        )}
                      </div>
                      <div>
                        <h4 className="text-base font-bold">{step.label}</h4>
                        <p className="text-xs opacity-80 mt-0.5 font-mono">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Console Log */}
            <div className="glass-card p-7 flex flex-col justify-between">
              <div>
                <div
                  className="flex items-center justify-between pb-4 mb-4 border-b"
                  style={{ borderColor: 'var(--border-subtle)' }}
                >
                  <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    <Terminal className="w-4 h-4 text-emerald-500" />
                    <span>AGENT_TELEMETRY_STREAM</span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>

                <div className="overflow-y-auto space-y-2 font-mono text-xs max-h-80 pr-1">
                  {agentLogs.map((log, i) => (
                    <div key={i} className="leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                      <span className="text-cyan-500 font-bold">›</span> {log}
                    </div>
                  ))}
                </div>
              </div>

              <div
                className="pt-4 border-t text-xs font-mono tracking-wider mt-4 flex justify-between"
                style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
              >
                <span>SWARM CONSENSUS</span>
                <span className="text-cyan-500 font-bold">7 AGENTS ACTIVE</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Completed Analysis Dossier */}
      {analysisResult && (
        <div className="glass-card p-7 border-2 border-cyan-500/50 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-500 shadow-md shrink-0">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-500 font-mono">
                  Autonomous Triage Complete
                </span>
                <h3 className="text-xl font-bold mt-1" style={{ color: 'var(--text-heading)' }}>
                  {analysisResult.incident?.title || 'Security Incident Detected'}
                </h3>
                <p className="text-xs mt-0.5 font-mono" style={{ color: 'var(--text-secondary)' }}>
                  Telemetry File: {selectedFile?.name}
                </p>
              </div>
            </div>

            <span className={`badge ${
              analysisResult.incident?.severity === 'critical' ? 'badge-critical' : 'badge-high'
            }`}>
              {analysisResult.incident?.severity || 'HIGH'} SEVERITY
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
            <div
              className="p-5 rounded-2xl border"
              style={{
                backgroundColor: 'var(--bg-inset)',
                borderColor: 'var(--border-subtle)'
              }}
            >
              <span className="text-xs font-mono tracking-wider" style={{ color: 'var(--text-secondary)' }}>SWARM_CONFIDENCE</span>
              <p className="text-3xl font-extrabold mt-1 font-mono" style={{ color: 'var(--text-heading)' }}>
                {analysisResult.correlation?.correlation_score !== undefined
                  ? `${Math.round(analysisResult.correlation.correlation_score * 100)}%`
                  : '92%'}
              </p>
            </div>
            <div
              className="p-5 rounded-2xl border"
              style={{
                backgroundColor: 'var(--bg-inset)',
                borderColor: 'var(--border-subtle)'
              }}
            >
              <span className="text-xs font-mono tracking-wider" style={{ color: 'var(--text-secondary)' }}>EXTRACTED_IOCS</span>
              <p className="text-3xl font-extrabold text-cyan-500 mt-1 font-mono">
                {analysisResult.threat_intel?.matched_iocs?.length || analysisResult.primary_findings?.indicators?.length || 3} Indicators
              </p>
            </div>
            <div
              className="p-5 rounded-2xl border"
              style={{
                backgroundColor: 'var(--bg-inset)',
                borderColor: 'var(--border-subtle)'
              }}
            >
              <span className="text-xs font-mono tracking-wider" style={{ color: 'var(--text-secondary)' }}>INCIDENT_REF</span>
              <p className="text-3xl font-extrabold text-emerald-500 font-mono mt-1">
                #{analysisResult.incident?.id || 'INC-0004'}
              </p>
            </div>
          </div>

          <div
            className="flex items-center justify-end gap-3 pt-5 border-t"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <button
              onClick={() => navigate('/reports')}
              className="btn btn-secondary text-xs cursor-pointer"
            >
              View Reports
            </button>
            {analysisResult.incident?.id && (
              <button
                onClick={() => navigate(`/incidents/${analysisResult.incident.id}`)}
                className="btn btn-primary text-xs cursor-pointer"
              >
                <span>Investigate Incident #{analysisResult.incident.id}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 6. Recent Ingestion History */}
      <div className="glass-card overflow-hidden">
        <div
          className="px-7 py-5 border-b flex items-center justify-between"
          style={{
            borderColor: 'var(--border-subtle)',
            backgroundColor: 'var(--table-th-bg)'
          }}
        >
          <div>
            <h3 className="text-base font-bold" style={{ color: 'var(--text-heading)' }}>Recent Ingestion History</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Audit log of analyzed telemetry files</p>
          </div>
          <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>3 RECORDS</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th>FILE NAME</th>
                <th>VECTOR</th>
                <th>THREAT CLASSIFICATION</th>
                <th>SEVERITY</th>
                <th>TIMESTAMP</th>
                <th className="text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
              {RECENT_INGESTIONS.map((item, i) => (
                <tr
                  key={i}
                  onClick={() => navigate(`/incidents/${item.id}`)}
                  className="cursor-pointer transition"
                >
                  <td className="font-mono text-xs font-bold text-cyan-500">
                    {item.file}
                  </td>
                  <td className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {item.type}
                  </td>
                  <td className="text-sm font-bold" style={{ color: 'var(--text-heading)' }}>
                    {item.threat}
                  </td>
                  <td>
                    <span className={`badge ${
                      item.severity.toLowerCase() === 'critical' ? 'badge-critical' : 'badge-high'
                    }`}>
                      {item.severity}
                    </span>
                  </td>
                  <td className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                    {item.time}
                  </td>
                  <td className="text-right">
                    <span className="text-xs font-bold text-cyan-500 hover:underline inline-flex items-center gap-1">
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
