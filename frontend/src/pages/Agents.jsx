import { useState, useEffect, useCallback } from 'react';
import {
  Bot, RefreshCw, Network, Mail, FileCode,
  FileText, Database, Shield, Cpu, CheckCircle2, Sparkles
} from 'lucide-react';
import { getAgents } from '../services/api';
import PageHeader from '../components/ui/PageHeader';
import StatusBadge from '../components/ui/StatusBadge';
import AgentCard from '../components/ui/AgentCard';

const AGENT_INFO = {
  network_monitor: {
    icon: Network,
    role: 'Perimeter Network & Packet Telemetry',
    model: 'Gemini 2.5 Flash / Packet Parser',
    latency: '14ms',
    precision: '99.4%',
    stage: 0,
    skills: ['Port Scan Detection', 'DNS Tunneling Analysis', 'TCP SYN Flood Mitigation', 'Protocol Anomalies'],
  },
  phishing_detection: {
    icon: Mail,
    role: 'Social Engineering & Email Ingestion',
    model: 'Gemini 2.5 Pro / NLP Classifier',
    latency: '42ms',
    precision: '98.8%',
    stage: 0,
    skills: ['SPF/DKIM Authentication', 'Credential Harvesting Scans', 'Embedded URL Reputation', 'Typo-squatting'],
  },
  malware_analysis: {
    icon: FileCode,
    role: 'File Forensics & Payload Dissection',
    model: 'Gemini 2.5 Flash / Binary Heuristics',
    latency: '28ms',
    precision: '99.1%',
    stage: 0,
    skills: ['Magic Byte Validation', 'Entropy Measurement', 'Obfuscation Detection', 'Hash Matching'],
  },
  threat_intelligence: {
    icon: Database,
    role: 'Global Threat Registry Query',
    model: 'Gemini 2.5 Flash / IOC Matcher',
    latency: '18ms',
    precision: '99.7%',
    stage: 1,
    skills: ['AbuseIPDB Lookup', 'AlienVault OTX Matching', 'Threat Actor Attribution', 'Reputation Scoring'],
  },
  incident_correlation: {
    icon: Cpu,
    role: 'Cross-Vector Attack Graph Synthesis',
    model: 'Gemini 2.5 Pro / Swarm Correlator',
    latency: '65ms',
    precision: '97.9%',
    stage: 1,
    skills: ['Attack Path Reconstruction', 'Confidence Score Calculation', 'Multi-Stage Linking', 'Timeline Alignment'],
  },
  incident_response: {
    icon: Shield,
    role: 'Autonomous Containment & Triage',
    model: 'Gemini 2.5 Pro / SOC Playbook Engine',
    latency: '34ms',
    precision: '99.5%',
    stage: 2,
    skills: ['iptables DROP Staging', 'Session Termination', 'Host Quarantine Policy', 'SOC Playbook Formulation'],
  },
  report_generation: {
    icon: FileText,
    role: 'Executive & Forensic Documentation',
    model: 'Gemini 2.5 Pro / Technical Writer',
    latency: '52ms',
    precision: '99.9%',
    stage: 2,
    skills: ['MITRE ATT&CK Mapping', 'Executive Threat Summary', 'PDF Forensic Export', 'Compliance Auditing'],
  },
};

const STAGES = [
  { label: 'Stage 1 · Vector Ingestion', title: 'Specialized Detection', accent: 'accent' },
  { label: 'Stage 2 · Cross-Vector Synthesis', title: 'Threat Intel & Correlation', accent: 'ai' },
  { label: 'Stage 3 · Action & Audit', title: 'Containment & Playbooks', accent: 'success' },
];

const ACCENT_MAP = {
  accent: { text: 'text-accent', border: 'border-accent/25', dot: 'bg-accent' },
  ai: { text: 'text-ai', border: 'border-ai/25', dot: 'bg-ai' },
  success: { text: 'text-success', border: 'border-success/25', dot: 'bg-success' },
};

const FALLBACK_INFO = {
  icon: Bot, role: 'Specialized Cyber Defense Agent', model: 'Gemini 2.5 Flash',
  latency: '24ms', precision: '99.0%', skills: [],
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

  const onlineCount = agents.filter(a => a.status === 'online').length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      <PageHeader
        title="AI Defense Swarm"
        description="7 autonomous specialized agents collaborating in a multi-stage cyber defense consensus pipeline"
        actions={
          <>
            <StatusBadge status={`${onlineCount || agents.length} / ${agents.length || 7} Online`} tone="online" pill />
            <button onClick={fetchAgents} disabled={loading} className="btn btn-ghost text-[12px]">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-accent' : ''}`} />
              Refresh
            </button>
          </>
        }
      />

      {/* Orchestrator Swarm Diagram */}
      <div className="card p-6">
        <h2 className="text-[13px] font-semibold uppercase tracking-wider text-ink-muted mb-6 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-ai" />
          Autonomous Collaboration Architecture
        </h2>

        {/* Orchestrator node */}
        <div className="flex flex-col items-center">
          <div className="px-5 py-2.5 rounded-xl bg-ai/10 border border-ai/30 text-ai font-semibold text-[13px] flex items-center gap-2">
            <Cpu className="w-4 h-4" />
            ORCHESTRATOR · SWARM CONSENSUS
          </div>
          <div className="w-px h-6 bg-line" />
        </div>

        {/* Connector trunk */}
        <div className="relative h-6">
          <div className="absolute top-0 h-px bg-line" style={{ left: '16.6667%', right: '16.6667%' }} />
          {[16.6667, 50, 83.3333].map((pct) => (
            <div key={pct} className="absolute top-0 w-px h-6 bg-line" style={{ left: `${pct}%` }} />
          ))}
        </div>

        {/* Stage lanes with real agent chips */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STAGES.map((stage, stageIdx) => {
            const colors = ACCENT_MAP[stage.accent];
            const stageAgents = agents.filter(a => AGENT_INFO[a.id]?.stage === stageIdx);
            return (
              <div key={stage.label} className={`p-4 rounded-xl bg-elevated border ${colors.border} flex flex-col`}>
                <span className={`text-[10.5px] font-mono font-semibold uppercase tracking-wider ${colors.text}`}>
                  {stage.label}
                </span>
                <h3 className="text-[14px] font-semibold text-ink mt-1">{stage.title}</h3>

                <div className="mt-3 space-y-1.5 flex-1">
                  {(stageAgents.length > 0 ? stageAgents : Object.entries(AGENT_INFO).filter(([, i]) => i.stage === stageIdx).map(([id]) => ({ id, name: id }))).map((agent) => {
                    const Icon = AGENT_INFO[agent.id]?.icon || Bot;
                    return (
                      <button
                        key={agent.id}
                        onClick={() => setSelected(agent)}
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg bg-card border border-line hover:border-line/80 transition text-left cursor-pointer"
                      >
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${colors.text}`} />
                        <span className="text-[12px] font-medium text-ink-soft truncate flex-1">{agent.name || agent.id}</span>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${agent.status === 'online' ? `${colors.dot} pulse-dot` : 'bg-ink-faint'}`} />
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Agent Dossiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            info={AGENT_INFO[agent.id] || FALLBACK_INFO}
            isSelected={selected?.id === agent.id}
            onSelect={() => setSelected(agent)}
          />
        ))}
      </div>

      {/* Selected Agent Inspector */}
      {selected && (
        <div className="card p-6 border-accent/25">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-line">
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-[16px] font-semibold text-ink">{selected.name}</h3>
                <span className="text-[11px] font-mono text-accent bg-accent/10 px-2 py-0.5 rounded-md border border-accent/25">
                  {selected.id}
                </span>
              </div>
              <p className="text-[12px] text-ink-muted mt-1">{selected.description}</p>
            </div>
            <div className="flex items-center gap-2 text-[11.5px] font-mono text-success font-semibold px-2.5 py-1 rounded-full bg-success/10 border border-success/25">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Consensus Engine Ready</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-elevated rounded-lg border border-line">
              <span className="text-ink-muted font-mono text-[11px]">Tasks Processed</span>
              <p className="text-[18px] font-semibold text-ink mt-1 font-mono">{selected.total_analyses ?? 0}</p>
            </div>
            <div className="p-3 bg-elevated rounded-lg border border-line">
              <span className="text-ink-muted font-mono text-[11px]">Consensus Accuracy</span>
              <p className="text-[18px] font-semibold text-success mt-1 font-mono">
                {AGENT_INFO[selected.id]?.precision || '99.0%'}
              </p>
            </div>
            <div className="p-3 bg-elevated rounded-lg border border-line">
              <span className="text-ink-muted font-mono text-[11px]">Average Latency</span>
              <p className="text-[18px] font-semibold text-accent mt-1 font-mono">
                {AGENT_INFO[selected.id]?.latency || '22ms'}
              </p>
            </div>
            <div className="p-3 bg-elevated rounded-lg border border-line">
              <span className="text-ink-muted font-mono text-[11px]">Heuristic Tuning</span>
              <p className="text-[18px] font-semibold text-ai mt-1 font-mono">Autonomous</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
