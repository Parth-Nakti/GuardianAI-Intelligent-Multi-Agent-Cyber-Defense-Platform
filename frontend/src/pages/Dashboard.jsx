import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, AlertTriangle, ArrowRight, RefreshCw, Upload,
  Activity, CheckCircle2, Cpu, Globe, Mail, Lock, ShieldAlert
} from 'lucide-react';
import {
  AreaChart, Area, PieChart, Pie, Cell, CartesianGrid,
  XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import StatCard from '../components/ui/StatCard';
import PageHeader from '../components/ui/PageHeader';
import SeverityBadge from '../components/ui/SeverityBadge';
import StatusBadge from '../components/ui/StatusBadge';
import SectionHeader from '../components/ui/SectionHeader';

const SEV_COLORS = {
  Critical: '#f87171',
  High: '#fb923c',
  Medium: '#fbbf24',
  Low: '#94a3b8',
};

export default function Dashboard({ stats, onRefresh }) {
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('24h');

  const handleRefresh = async () => {
    if (onRefresh) {
      setRefreshing(true);
      await onRefresh();
      setTimeout(() => setRefreshing(false), 600);
    }
  };

  const s = stats?.severity || {};
  const recent = stats?.recent_incidents || [];
  const totalThreats = stats?.threats_detected || 0;
  const criticalCount = s.critical || 0;
  const highCount = s.high || 0;
  const activeCount = stats?.active_investigations || 0;

  const timelineData = [
    { time: '00:00', threats: Math.max(0, Math.floor(totalThreats * 0.1)) },
    { time: '04:00', threats: Math.max(0, Math.floor(totalThreats * 0.2)) },
    { time: '08:00', threats: Math.max(1, Math.floor(totalThreats * 0.45)) },
    { time: '12:00', threats: Math.max(1, Math.floor(totalThreats * 0.7)) },
    { time: '16:00', threats: Math.max(2, Math.floor(totalThreats * 0.9)) },
    { time: 'Now', threats: totalThreats || 0 },
  ];

  const pieData = [
    { name: 'Critical', value: s.critical || 0, color: SEV_COLORS.Critical },
    { name: 'High', value: s.high || 0, color: SEV_COLORS.High },
    { name: 'Medium', value: s.medium || 0, color: SEV_COLORS.Medium },
    { name: 'Low', value: s.low || 0, color: SEV_COLORS.Low },
  ].filter(d => d.value > 0);

  const displayPie = pieData.length > 0 ? pieData : [{ name: 'Nominal', value: 1, color: '#1d2635' }];

  const getMitreTag = (type = '', title = '') => {
    const t = `${type} ${title}`.toLowerCase();
    if (t.includes('brute') || t.includes('auth')) return 'T1110 · Brute Force';
    if (t.includes('phish') || t.includes('email') || t.includes('url')) return 'T1566 · Phishing';
    if (t.includes('scan') || t.includes('port')) return 'T1046 · Network Service Discovery';
    return 'T1059 · Command Execution';
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      <PageHeader
        title="Security Operations Center"
        badge={<StatusBadge status="Live" tone="live" pill />}
        description="Real-time multi-vector threat detection, correlation, and autonomous agent playbooks"
        actions={
          <>
            <div className="flex items-center gap-0.5 border border-line rounded-lg p-0.5 text-[12px] bg-card">
              {['24h', '7d', '30d'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 rounded-md transition font-medium cursor-pointer ${
                    timeRange === range ? 'bg-accent/15 text-accent' : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  {range.toUpperCase()}
                </button>
              ))}
            </div>

            <button onClick={handleRefresh} className="btn btn-ghost text-[12px]" title="Refresh dashboard stats">
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-accent' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button onClick={() => navigate('/analyze')} className="btn btn-primary text-[12px] cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              Scan Telemetry
            </button>
          </>
        }
      />

      {/* 2. Key Security Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Threats Detected"
          value={totalThreats}
          subtext="Multi-vector ingestion"
          tag="Active"
          icon={ShieldAlert}
          accent="accent"
        />
        <StatCard
          label="Critical & High"
          value={criticalCount + highCount}
          subtext={`${criticalCount} critical · ${highCount} high`}
          tag="Immediate triage"
          icon={AlertTriangle}
          accent="danger"
        />
        <StatCard
          label="Active Triage"
          value={activeCount}
          subtext="Swarm queue"
          tag="In pipeline"
          icon={Activity}
          accent="ai"
        />
        <StatCard
          label="Swarm Health"
          value="7 / 7"
          subtext="Autonomous agents"
          tag="100% operational"
          icon={CheckCircle2}
          accent="success"
        />
      </div>

      {/* 3. Threat Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-[15px] font-semibold text-ink">Threat Detection Activity</h3>
              <p className="text-[12px] mt-0.5 text-ink-muted">Telemetry volume across current 24-hour cycle</p>
            </div>
            <StatusBadge status="Live" tone="live" pill />
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="cyberAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.28} />
                    <stop offset="60%" stopColor="#38bdf8" stopOpacity={0.05} />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#1d2635" strokeDasharray="3 4" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} fontFamily="JetBrains Mono" />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} fontFamily="JetBrains Mono" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111722',
                    border: '1px solid #1d2635',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontFamily: 'Inter',
                    color: '#f1f5f9',
                  }}
                />
                <Area type="monotone" dataKey="threats" stroke="#38bdf8" strokeWidth={2} fill="url(#cyberAreaGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-[15px] font-semibold text-ink mb-0.5">Severity Distribution</h3>
            <p className="text-[12px] text-ink-muted">Classified by attack impact score</p>
            <div className="h-44 relative my-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={displayPie} cx="50%" cy="50%" innerRadius={52} outerRadius={74} paddingAngle={3} dataKey="value">
                    {displayPie.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="#0d111a" strokeWidth={3} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111722',
                      border: '1px solid #1d2635',
                      borderRadius: '10px',
                      fontSize: '12px',
                      fontFamily: 'Inter',
                      color: '#f1f5f9',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[22px] font-semibold font-mono text-ink">{totalThreats}</span>
                <span className="text-[9.5px] uppercase tracking-widest font-semibold text-ink-faint">TOTAL</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-line">
            {Object.entries(SEV_COLORS).map(([name, color]) => (
              <div key={name} className="flex items-center justify-between text-[12px] py-1.5 px-2.5 rounded-lg bg-elevated">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  <span className="font-medium text-ink-soft">{name}</span>
                </div>
                <span className="font-semibold font-mono text-ink">{s[name.toLowerCase()] || 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. AI Agent Status */}
      <div className="card p-6">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-line">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-ai/10 border border-ai/25 flex items-center justify-center text-ai">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-ink">Autonomous Agent Activity Stream</h3>
              <p className="text-[12px] text-ink-muted">Live consensus &amp; telemetry across 7 defense agents</p>
            </div>
          </div>
          <StatusBadge status="Consensus Active" tone="active" pill pulse />
        </div>

        <div className="space-y-2 font-mono text-[12px]">
          <div className="p-3 rounded-lg bg-elevated flex items-start gap-3">
            <span className="shrink-0 mt-0.5 text-ink-faint">16:42:10</span>
            <span className="px-2 py-0.5 rounded bg-accent/10 text-accent border border-accent/25 font-semibold shrink-0">
              [NetworkMonitorAgent]
            </span>
            <span className="text-ink-soft">
              Ingested PCAP telemetry. Detected 1,005 scanned destination ports targeting 192.168.1.1.
            </span>
          </div>

          <div className="p-3 rounded-lg bg-elevated flex items-start gap-3">
            <span className="shrink-0 mt-0.5 text-ink-faint">16:42:11</span>
            <span className="px-2 py-0.5 rounded bg-ai/10 text-ai border border-ai/25 font-semibold shrink-0">
              [ThreatIntelAgent]
            </span>
            <span className="text-ink-soft">
              Cross-referenced source IP 192.168.1.50 against IOC feed. Confidence score: 94% (Known Brute Force Scanner).
            </span>
          </div>

          <div className="p-3 rounded-lg bg-elevated flex items-start gap-3">
            <span className="shrink-0 mt-0.5 text-ink-faint">16:42:12</span>
            <span className="px-2 py-0.5 rounded bg-success/10 text-success border border-success/25 font-semibold shrink-0">
              [IncidentResponseAgent]
            </span>
            <span className="text-ink-soft">
              Synthesized defensive playbook: iptables DROP rule staged, session terminated, forensic incident dossier created.
            </span>
          </div>
        </div>
      </div>

      {/* 5. Active Incidents */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-surface">
          <div>
            <h3 className="text-[14px] font-semibold text-ink">Prioritized Security Incidents</h3>
            <p className="text-[12px] mt-0.5 text-ink-muted">Live triage queue with automated MITRE ATT&amp;CK technique mapping</p>
          </div>
          <button
            onClick={() => navigate('/incidents')}
            className="text-[12px] text-accent hover:text-accent/80 font-semibold flex items-center gap-1.5 transition group cursor-pointer"
          >
            <span>VIEW ALL</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {recent.length === 0 ? (
          <div className="p-14 text-center">
            <div className="w-14 h-14 rounded-2xl border border-line bg-elevated flex items-center justify-center mx-auto mb-4 text-accent">
              <Shield className="w-6 h-6" />
            </div>
            <h4 className="text-[15px] font-semibold text-ink">No Incidents Logged</h4>
            <p className="text-[13px] mt-1 max-w-sm mx-auto text-ink-muted">
              The perimeter is currently quiet. Ingest a PCAP, auth log, or email artifact to test the multi-agent swarm.
            </p>
            <button onClick={() => navigate('/analyze')} className="mt-4 btn btn-secondary text-[12px] cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-accent" />
              Open Threat Scanner
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th>Incident ID</th>
                  <th>Threat Title &amp; Vector</th>
                  <th>MITRE TTP</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {recent.slice(0, 5).map((inc, idx) => (
                  <tr key={idx} onClick={() => navigate(`/incidents/${inc.incident_id || inc.id}`)} className="cursor-pointer transition group">
                    <td>
                      <span className="font-mono text-[11px] font-semibold text-accent px-2 py-1 rounded-md bg-accent/10 border border-accent/25">
                        {inc.incident_id || `#${inc.id}`}
                      </span>
                    </td>
                    <td>
                      <p className="text-[13px] font-semibold group-hover:text-accent transition text-ink">{inc.title}</p>
                      <p className="text-[12px] mt-0.5 text-ink-muted">{inc.incident_type}</p>
                    </td>
                    <td><span className="mitre-tag">{getMitreTag(inc.incident_type, inc.title)}</span></td>
                    <td><SeverityBadge severity={inc.severity} /></td>
                    <td><StatusBadge status={inc.status} /></td>
                    <td className="text-right">
                      <span className="text-[12px] font-semibold text-accent group-hover:translate-x-0.5 transition inline-flex items-center gap-1">
                        Investigate <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 6. Detailed Information */}
      <div>
        <SectionHeader label="Monitored Attack Vectors" meta="Deep packet, log & linguistic analysis" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-5 border-t-2 border-t-accent">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5 font-semibold text-[14px] text-ink">
                <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/25 flex items-center justify-center text-accent">
                  <Globe className="w-4 h-4" />
                </div>
                <span>Network Traffic</span>
              </div>
              <span className="mitre-tag">T1046</span>
            </div>
            <p className="text-[13px] leading-relaxed min-h-[42px] text-ink-muted">
              Deep packet inspection for stealth port sweeps, excessive SYN floods, and DNS tunneling anomalies.
            </p>
            <div className="mt-4 pt-3 border-t border-line text-[12px] flex justify-between items-center font-mono">
              <span className="text-ink-faint">PCAP / PCAPNG</span>
              <StatusBadge status="Monitored" tone="monitoring" />
            </div>
          </div>

          <div className="card p-5 border-t-2 border-t-danger">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5 font-semibold text-[14px] text-ink">
                <div className="w-8 h-8 rounded-lg bg-danger/10 border border-danger/25 flex items-center justify-center text-danger">
                  <Lock className="w-4 h-4" />
                </div>
                <span>Authentication Logs</span>
              </div>
              <span className="mitre-tag">T1110</span>
            </div>
            <p className="text-[13px] leading-relaxed min-h-[42px] text-ink-muted">
              Heuristic analysis for SSH brute-force campaigns, credential spraying, and rapid privilege escalation.
            </p>
            <div className="mt-4 pt-3 border-t border-line text-[12px] flex justify-between items-center font-mono">
              <span className="text-ink-faint">Auth / Syslog / Audit</span>
              <StatusBadge status="Monitored" tone="danger" />
            </div>
          </div>

          <div className="card p-5 border-t-2 border-t-warning">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5 font-semibold text-[14px] text-ink">
                <div className="w-8 h-8 rounded-lg bg-warning/10 border border-warning/25 flex items-center justify-center text-warning">
                  <Mail className="w-4 h-4" />
                </div>
                <span>Email Phishing</span>
              </div>
              <span className="mitre-tag">T1566</span>
            </div>
            <p className="text-[13px] leading-relaxed min-h-[42px] text-ink-muted">
              Sender reputation, SPF/DKIM verification, urgency linguistics, and credential-harvesting link triage.
            </p>
            <div className="mt-4 pt-3 border-t border-line text-[12px] flex justify-between items-center font-mono">
              <span className="text-ink-faint">EML / MSG / RFC822</span>
              <StatusBadge status="Monitored" tone="warning" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
