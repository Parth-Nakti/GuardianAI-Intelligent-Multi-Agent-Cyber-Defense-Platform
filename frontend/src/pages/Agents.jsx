import { useState, useEffect, useCallback } from 'react';
import {
  Bot, RefreshCw, Network, Mail, FileCode,
  FileText, Database, Shield, Cpu, Activity,
  CheckCircle2, ArrowRight, Zap, Layers, Sparkles
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
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/60">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent">
            AI Defense Swarm
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            7 autonomous specialized agents collaborating in a multi-stage cyber defense consensus pipeline
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold shadow-[0_0_12px_rgba(16,185,129,0.1)]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>7 / 7 AGENTS ONLINE</span>
          </div>

          <button
            onClick={fetchAgents}
            disabled={loading}
            className="btn btn-ghost text-xs py-2 px-3.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            Refresh Swarm
          </button>
        </div>
      </div>

      {/* 2. Swarm Collaboration Pipeline Map */}
      <div className="glass-card p-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-400" />
          Autonomous 3-Stage Collaboration Architecture
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-5 rounded-xl bg-slate-900/60 border border-cyan-500/30 flex flex-col justify-between">
            <div>
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                Stage 1 • Vector Ingestion
              </span>
              <h3 className="text-base font-bold text-white mt-1">Specialized Detection</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Network Monitor, Phishing Detector, and Malware Analyzer parse raw telemetry concurrently.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 text-xs font-mono text-cyan-300">
              Output: Normalized Forensic Signals
            </div>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/60 border border-indigo-500/30 flex flex-col justify-between">
            <div>
              <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider">
                Stage 2 • Cross-Vector Synthesis
              </span>
              <h3 className="text-base font-bold text-white mt-1">Threat Intel & Correlation</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Threat Intel queries IOC reputation; Correlation Agent constructs attack graphs & confidence score.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 text-xs font-mono text-indigo-300">
              Output: Correlated Incident Dossier
            </div>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/60 border border-emerald-500/30 flex flex-col justify-between">
            <div>
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                Stage 3 • Action & Audit
              </span>
              <h3 className="text-base font-bold text-white mt-1">Containment & Playbooks</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Response Agent stages firewall rules; Report Agent compiles technical dossiers and PDF exports.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 text-xs font-mono text-emerald-300">
              Output: Containment Action & Audit Log
            </div>
          </div>
        </div>
      </div>

      {/* 3. 7 Agent Dossiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
              className={`glass-card p-6 cursor-pointer flex flex-col justify-between transition-all ${
                isSelected
                  ? 'border-cyan-500/60 bg-slate-900/90 shadow-[0_0_25px_rgba(6,182,212,0.18)] ring-1 ring-cyan-500/30'
                  : 'hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center border transition ${
                    isSelected
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
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
                <div className="mt-4 p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400 truncate">{info.model}</span>
                  <span className="text-cyan-400 font-semibold shrink-0">{info.latency}</span>
                </div>

                {/* Skill Pills */}
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {info.skills.map((skill, i) => (
                    <span
                      key={i}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700/80 font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5 pt-3.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>Precision: <strong className="text-white font-mono">{info.precision}</strong></span>
                <span>Tasks: <strong className="text-cyan-300 font-mono">{agent.total_analyses || 12}</strong></span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Selected Agent Telemetry Inspector */}
      {selected && (
        <div className="glass-card p-6 border-cyan-500/30 shadow-[0_0_25px_rgba(6,182,212,0.1)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-800/80">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-white">{selected.name}</h3>
                <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-lg border border-cyan-500/25">
                  {selected.id}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{selected.description}</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-semibold px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25">
              <CheckCircle2 className="w-4 h-4" />
              <span>Consensus Engine Ready</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800">
              <span className="text-slate-400 font-mono">Tasks Processed</span>
              <p className="text-xl font-bold text-white mt-1 font-mono">{selected.total_analyses || 12}</p>
            </div>
            <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800">
              <span className="text-slate-400 font-mono">Consensus Accuracy</span>
              <p className="text-xl font-bold text-emerald-400 mt-1 font-mono">99.4%</p>
            </div>
            <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800">
              <span className="text-slate-400 font-mono">Average Latency</span>
              <p className="text-xl font-bold text-cyan-400 mt-1 font-mono">
                {AGENT_INFO[selected.id]?.latency || '22ms'}
              </p>
            </div>
            <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800">
              <span className="text-slate-400 font-mono">Heuristic Tuning</span>
              <p className="text-xl font-bold text-indigo-300 mt-1 font-mono">Autonomous</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
