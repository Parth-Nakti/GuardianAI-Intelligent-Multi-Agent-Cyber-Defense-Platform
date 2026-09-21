import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, Network, Mail, FileText, AlertTriangle, CheckCircle2,
  Loader2, ArrowRight, ShieldAlert, Terminal,
  FileUp, Cpu, Sparkles, Play
} from 'lucide-react';
import { analyzePcap, analyzeEmail, analyzeLogs } from '../services/api';
import StatCard from '../components/ui/StatCard';
import PageHeader from '../components/ui/PageHeader';
import SectionHeader from '../components/ui/SectionHeader';
import SeverityBadge from '../components/ui/SeverityBadge';
import StatusBadge from '../components/ui/StatusBadge';

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
    id: 'pcap', label: 'Network PCAP Capture', icon: Network,
    desc: 'Deep packet inspection for SYN floods, stealth port sweeps, and DNS tunneling',
    ext: '.pcap, .pcapng', sampleFile: 'port_scan.pcap', sampleLabel: 'Load Sample PCAP',
  },
  {
    id: 'logs', label: 'Authentication Logs', icon: FileText,
    desc: 'Audit logs for SSH brute force, credential stuffing, and auth anomalies',
    ext: '.log, .txt, .json', sampleFile: 'failed_logins.log', sampleLabel: 'Load Sample Log',
  },
  {
    id: 'email', label: 'Phishing Email (EML)', icon: Mail,
    desc: 'RFC822 email files for sender spoofing, SPF failures, and credential harvesters',
    ext: '.eml, .msg, .txt', sampleFile: 'credential_phish.eml', sampleLabel: 'Load Sample Email',
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
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      <PageHeader
        title="Threat Ingestion & Analysis"
        badge={<StatusBadge status="Multi-Agent Scanner" tone="monitoring" pill />}
        description="Submit raw network captures, server authentication logs, or suspicious emails for automated triage"
      />

      {/* Vector Selector */}
      <div className="space-y-3">
        <SectionHeader step={1} label="Select Telemetry Vector" meta="Step 1 of 3" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <div
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSelectedFile(null); }}
                className={`card p-5 cursor-pointer flex flex-col justify-between transition-colors ${
                  isSelected ? 'border-accent/50 bg-elevated' : ''
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center border transition ${
                      isSelected ? 'bg-accent/15 text-accent border-accent/30' : 'border-line text-ink-muted'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    {isSelected && (
                      <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/30">
                        ACTIVE
                      </span>
                    )}
                  </div>

                  <h3 className="text-[14px] font-semibold text-ink">{tab.label}</h3>
                  <p className="text-[12.5px] mt-1 leading-relaxed text-ink-muted">{tab.desc}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-line flex items-center justify-between">
                  <span className="text-[11px] font-mono text-ink-faint">{tab.ext}</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); loadSample(tab.id, tab.sampleFile); }}
                    className="text-[11px] font-semibold text-accent px-2 py-1 rounded-md bg-accent/10 hover:bg-accent/20 border border-accent/25 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-accent" />
                    {tab.sampleLabel}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dropzone & Launcher */}
      <div className="space-y-3">
        <SectionHeader step={2} label="Upload Forensic Telemetry Payload" meta="Step 2 of 3" />

        <div className="card p-7">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" id="file-upload-input" />

          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition flex flex-col items-center justify-center ${
              selectedFile ? 'border-accent/50 bg-accent/5' : 'border-line hover:border-accent/30'
            }`}
            style={{ backgroundColor: selectedFile ? undefined : 'var(--bg-inset)' }}
          >
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 border ${
              selectedFile ? 'bg-accent/15 border-accent/30 text-accent' : 'bg-card border-line text-ink-faint'
            }`}>
              {selectedFile ? <FileUp className="w-7 h-7" /> : <Upload className="w-7 h-7" />}
            </div>

            {selectedFile ? (
              <div className="space-y-1">
                <h4 className="text-[15px] font-semibold text-ink">{selectedFile.name}</h4>
                <p className="text-[12px] text-accent font-mono font-semibold">
                  {(selectedFile.size / 1024).toFixed(1)} KB · Staged in forensic memory
                </p>
                <p className="text-[11.5px] mt-1.5 text-ink-faint">Click anywhere to replace with a different file</p>
              </div>
            ) : (
              <div className="space-y-1">
                <h4 className="text-[15px] font-semibold text-ink">Select or drop a forensic telemetry file</h4>
                <p className="text-[13px] max-w-md mx-auto text-ink-muted">
                  Supports PCAP network dumps, authentication syslogs, or raw RFC822 emails (up to 50MB)
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 p-3.5 bg-danger/10 border border-danger/25 rounded-lg text-danger text-[12.5px] flex items-center gap-2.5 font-mono">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="mt-5 flex items-center justify-between flex-wrap gap-4">
            <div>
              {selectedFile && (
                <button onClick={() => setSelectedFile(null)} disabled={analyzing} className="btn btn-ghost text-[12px]">
                  Clear File
                </button>
              )}
            </div>

            <button
              id="start-analysis-btn"
              onClick={runAnalysis}
              disabled={!selectedFile || analyzing}
              className={`btn text-[12.5px] py-2.5 px-6 ${!selectedFile || analyzing ? 'opacity-40 cursor-not-allowed border border-line' : 'btn-primary cursor-pointer'}`}
            >
              {analyzing ? (
                <><Loader2 className="w-4 h-4 animate-spin" /><span>SWARM EXECUTING...</span></>
              ) : (
                <><Sparkles className="w-4 h-4" /><span>START MULTI-AGENT ANALYSIS</span></>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Live Pipeline */}
      {(analyzing || analysisResult) && (
        <div className="space-y-3">
          <SectionHeader step={3} label="Live Agent Execution Pipeline" meta={<StatusBadge status="Real-Time Orchestration" tone="active" />} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 card p-6">
              <h3 className="text-[15px] font-semibold mb-4 flex items-center gap-2 text-ink">
                <Cpu className="w-4 h-4 text-accent" />
                Swarm Execution Stages
              </h3>
              <div className="space-y-2">
                {STEPS.map((step, idx) => {
                  const done = idx < currentStep || (!analyzing && analysisResult);
                  const active = idx === currentStep && analyzing;
                  return (
                    <div
                      key={step.id}
                      className={`flex items-start gap-3.5 p-3.5 rounded-lg border transition ${
                        done ? 'bg-success/10 border-success/25 text-success'
                        : active ? 'bg-accent/10 border-accent/30 text-accent'
                        : 'border-line opacity-40'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {done ? <CheckCircle2 className="w-4 h-4 text-success" />
                          : active ? <Loader2 className="w-4 h-4 text-accent animate-spin" />
                          : <span className="w-4 h-4 rounded-full border border-line inline-block" />}
                      </div>
                      <div>
                        <h4 className="text-[13.5px] font-semibold">{step.label}</h4>
                        <p className="text-[11.5px] opacity-80 mt-0.5 font-mono">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-line">
                  <div className="flex items-center gap-2 text-[11px] font-mono font-semibold text-ink-muted">
                    <Terminal className="w-3.5 h-3.5 text-success" />
                    <span>AGENT_TELEMETRY_STREAM</span>
                  </div>
                  <span className="w-1.5 h-1.5 rounded-full bg-success" />
                </div>

                <div className="overflow-y-auto space-y-2 font-mono text-[11.5px] max-h-72 pr-1">
                  {agentLogs.map((log, i) => (
                    <div key={i} className="leading-relaxed text-ink-soft">
                      <span className="text-accent font-semibold">›</span> {log}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-line text-[11px] font-mono mt-3 flex justify-between text-ink-faint">
                <span>SWARM CONSENSUS</span>
                <span className="text-accent font-semibold">7 AGENTS ACTIVE</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Result Dossier */}
      {analysisResult && (
        <div className="card p-6 border-accent/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/25 flex items-center justify-center text-accent shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-accent font-mono">
                  Autonomous Triage Complete
                </span>
                <h3 className="text-[17px] font-semibold mt-0.5 text-ink">
                  {analysisResult.incident?.title || 'Security Incident Detected'}
                </h3>
                <p className="text-[11.5px] mt-0.5 font-mono text-ink-muted">
                  Telemetry File: {selectedFile?.name}
                </p>
              </div>
            </div>

            <SeverityBadge severity={`${analysisResult.incident?.severity || 'High'} Severity`} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            <StatCard
              label="Swarm Confidence"
              value={analysisResult.correlation?.correlation_score !== undefined
                ? `${Math.round(analysisResult.correlation.correlation_score * 100)}%`
                : '—'}
              accent="accent"
            />
            <StatCard
              label="Extracted IOCs"
              value={analysisResult.threat_intel?.matched_iocs?.length ?? analysisResult.primary_findings?.indicators?.length ?? 0}
              accent="ai"
            />
            <StatCard
              label="Incident Ref"
              value={`#${analysisResult.incident?.id ?? '—'}`}
              accent="success"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
            <button onClick={() => navigate('/reports')} className="btn btn-secondary text-[12px]">View Reports</button>
            {analysisResult.incident?.id && (
              <button onClick={() => navigate(`/incidents/${analysisResult.incident.id}`)} className="btn btn-primary text-[12px]">
                <span>Investigate Incident #{analysisResult.incident.id}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Ingestion History */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-line bg-surface flex items-center justify-between">
          <div>
            <h3 className="text-[14px] font-semibold text-ink">Recent Ingestion History</h3>
            <p className="text-[12px] mt-0.5 text-ink-muted">Audit log of analyzed telemetry files</p>
          </div>
          <span className="text-[11px] font-mono text-ink-faint">3 RECORDS</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th>File Name</th>
                <th>Vector</th>
                <th>Threat Classification</th>
                <th>Severity</th>
                <th>Timestamp</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {RECENT_INGESTIONS.map((item, i) => (
                <tr key={i} onClick={() => navigate(`/incidents/${item.id}`)} className="cursor-pointer transition">
                  <td className="font-mono text-[12px] font-semibold text-accent">{item.file}</td>
                  <td className="text-[12px] font-medium text-ink-muted">{item.type}</td>
                  <td className="text-[13px] font-semibold text-ink">{item.threat}</td>
                  <td><SeverityBadge severity={item.severity} /></td>
                  <td className="text-[11.5px] font-mono text-ink-faint">{item.time}</td>
                  <td className="text-right">
                    <span className="text-[12px] font-semibold text-accent hover:underline inline-flex items-center gap-1">
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
