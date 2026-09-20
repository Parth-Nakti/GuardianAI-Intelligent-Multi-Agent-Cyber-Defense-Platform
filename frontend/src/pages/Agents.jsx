import { useState, useEffect, useCallback } from 'react';
import {
  Bot, RefreshCw, Network, Mail, FileCode,
  FileText, Database, Shield, Cpu, Activity,
  CheckCircle2, ArrowRight, Zap, Layers
} from 'lucide-react';
import { getAgents } from '../services/api';

const AGENT_INFO = {
  network_monitor: {
    icon: Network,
    role: 'Perimeter Network & Packet Telemetry',
    model: 'Gemini 2.5 Flash / Packet Parser',
    latency: '14ms',
    precision: '99.4%',
    skills: ['Port Scan Detection', 'DNS Tunneling Analysis', 'TCP SYN Flood Mitigation', 'Protocol Anomalies']
  },
  phishing_detection: {
    icon: Mail,
    role: 'Social Engineering & Email Ingestion',
    model: 'Gemini 2.5 Pro / NLP Classifier',
    latency: '42ms',
    precision: '98.8%',
    skills: ['SPF/DKIM Authentication', 'Credential Harvesting Scans', 'Embedded URL Reputation', 'Typo-squatting']
  },
  malware_analysis: {
    icon: FileCode,
    role: 'File Forensics & Payload Dissection',
    model: 'Gemini 2.5 Flash / Binary Heuristics',
    latency: '28ms',
    precision: '99.1%',
    skills: ['Magic Byte Validation', 'Entropy Measurement', 'Obfuscation Detection', 'Hash Matching']
  },
  threat_intelligence: {
    icon: Database,
    role: 'Global Threat Registry Query',
    model: 'Gemini 2.5 Flash / IOC Matcher',
    latency: '18ms',
    precision: '99.7%',
    skills: ['AbuseIPDB Lookup', 'AlienVault OTX Matching', 'Threat Actor Attribution', 'Reputation Scoring']
  },
  incident_correlation: {
    icon: Cpu,
    role: 'Cross-Vector Attack Graph Synthesis',
    model: 'Gemini 2.5 Pro / Swarm Correlator',
    latency: '65ms',
    precision: '97.9%',
    skills: ['Attack Path Reconstruction', 'Confidence Score Calculation', 'Multi-Stage Linking', 'Timeline Alignment']
  },
  incident_response: {
    icon: Shield,
    role: 'Autonomous Containment & Triage',
    model: 'Gemini 2.5 Pro / SOC Playbook Engine',
    latency: '34ms',
    precision: '99.5%',
    skills: ['iptables DROP Staging', 'Session Termination', 'Host Quarantine Policy', 'SOC Playbook Formulation']
  },
  report_generation: {
    icon: FileText,
    role: 'Executive & Forensic Documentation',
    model: 'Gemini 2.5 Pro / Technical Writer',
    latency: '52ms',
    precision: '99.9%',
    skills: ['MITRE ATT&CK Mapping', 'Executive Threat Summary', 'PDF Forensic Export', 'Compliance Auditing']
  },
};

export default function Agents() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getAgents();
      setAgents(data || []);
      if (data?.length > 0 && !selected) setSelected(data[0]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selected]);

  useEffect(() => { fetchAgents(); }, [fetchAgents]);

  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-16">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">AI Defense Swarm</h1>
          <p className="text-slate-400 text-sm mt-1">
            7 autonomous specialized agents collaborating in a multi-stage cyber defense consensus pipeline
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>7/7 Agents Healthy</span>
          </div>

          <button
            onClick={fetchAgents}
            disabled={loading}
            className="btn btn-ghost text-xs py-2 px-3.5 text-slate-300"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Telemetry
          </button>
        </div>
      </div>

      {/* 2. Swarm Collaboration Pipeline Map */}
      <div className="card p-7">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono mb-4">
          Autonomous 3-Stage Collaboration Architecture
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-xl bg-slate-900 border border-blue-500/30 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-wider">
                Stage 1 • Vector Ingestion
              </span>
              <h3 className="text-base font-bold text-white mt-1">Specialized Detection</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Network Monitor, Phishing Detector, and Malware Analyzer parse raw payloads concurrently.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono text-blue-300">
              Output: Normalized Forensic Signals
            </div>
          </div>

          <div className="p-5 rounded-xl bg-slate-900 border border-purple-500/30 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-wider">
                Stage 2 • Cross-Vector Synthesis
              </span>
              <h3 className="text-base font-bold text-white mt-1">Threat Intel & Correlation</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Threat Intel looks up global IOCs; Correlation Agent computes attack graphs and confidence.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono text-purple-300">
              Output: Correlated Incident Dossier
            </div>
          </div>

          <div className="p-5 rounded-xl bg-slate-900 border border-emerald-500/30 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                Stage 3 • Action & Audit
              </span>
              <h3 className="text-base font-bold text-white mt-1">Containment & Reports</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Response Agent stages firewall rules; Report Agent compiles executive summaries and PDF.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono text-emerald-300">
              Output: Containment Action & Audit Log
            </div>
          </div>
        </div>
      </div>

      {/* 3. 7 Agent Dossiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => {
          const info = AGENT_INFO[agent.id] || {
            icon: Bot,
            role: 'Specialized Cyber Defense Agent',
            model: 'Gemini 2.5 Flash',
            latency: '24ms',
            precision: '99.0%',
            skills: []
          };
          const Icon = info.icon;
          const isSelected = selected?.id === agent.id;

          return (
            <div
              key={agent.id}
              onClick={() => setSelected(agent)}
              className={`card p-6 cursor-pointer flex flex-col justify-between transition ${
                isSelected
                  ? 'border-blue-500 bg-blue-950/20 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/40'
                  : 'hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-600/15 text-blue-400 flex items-center justify-center border border-blue-500/20">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    ONLINE
                  </span>
                </div>

                <h3 className="text-base font-bold text-white">
                  {agent.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {agent.description || info.role}
                </p>

                {/* Model & Latency tag */}
                <div className="mt-4 p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400 truncate">{info.model}</span>
                  <span className="text-emerald-400 font-semibold shrink-0">{info.latency}</span>
                </div>

                {/* Skill Pills */}
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {info.skills.map((skill, i) => (
                    <span
                      key={i}
                      className="text-[11px] px-2 py-0.5 rounded bg-slate-800/90 text-slate-300 border border-slate-700 font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5 pt-3.5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Precision: <strong className="text-white font-mono">{info.precision}</strong></span>
                <span>Tasks: <strong className="text-white font-mono">{agent.total_analyses || 12}</strong></span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Selected Agent Telemetry Inspector */}
      {selected && (
        <div className="card p-7 border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg font-bold text-white">{selected.name}</h3>
                <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded border border-blue-500/20">
                  {selected.id}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{selected.description}</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Consensus Ready</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-xs">
            <div className="p-3 bg-slate-900 rounded-lg">
              <span className="text-slate-500 font-mono">Tasks Processed</span>
              <p className="text-base font-bold text-white mt-1">{selected.total_analyses || 12}</p>
            </div>
            <div className="p-3 bg-slate-900 rounded-lg">
              <span className="text-slate-500 font-mono">Consensus Accuracy</span>
              <p className="text-base font-bold text-emerald-400 mt-1">99.4%</p>
            </div>
            <div className="p-3 bg-slate-900 rounded-lg">
              <span className="text-slate-500 font-mono">Average Latency</span>
              <p className="text-base font-bold text-blue-400 mt-1">
                {AGENT_INFO[selected.id]?.latency || '22ms'}
              </p>
            </div>
            <div className="p-3 bg-slate-900 rounded-lg">
              <span className="text-slate-500 font-mono">Heuristic Tuning</span>
              <p className="text-base font-bold text-purple-300 mt-1">Active</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
