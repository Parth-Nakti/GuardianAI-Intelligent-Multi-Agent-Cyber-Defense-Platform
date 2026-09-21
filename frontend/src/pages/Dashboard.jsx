import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, AlertTriangle, ArrowRight, RefreshCw, Upload,
  Activity, CheckCircle2, Clock, Terminal, Cpu, Database,
  TrendingUp, Globe, Mail, FileCode, Lock, ExternalLink,
  Radio, Sparkles, Zap, ShieldAlert
} from 'lucide-react';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { useTheme } from '../context/ThemeContext';

const SEV_COLORS = {
  Critical: '#f43f5e',
  High: '#f97316',
  Medium: '#f59e0b',
  Low: '#06b6d4',
};

export default function Dashboard({ stats, onRefresh }) {
  const navigate = useNavigate();
  const { isDark } = useTheme();
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
  const st = stats?.status || {};
  const recent = stats?.recent_incidents || [];
  const totalThreats = stats?.threats_detected || 0;
  const criticalCount = s.critical || 0;
  const highCount = s.high || 0;
  const activeCount = st.investigating || 0;

  // Timeline series for visualization
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

  const displayPie = pieData.length > 0 ? pieData : [{ name: 'Nominal', value: 1, color: isDark ? '#1e293b' : '#cbd5e1' }];

  const getBadgeClass = (severity) => {
    const sev = (severity || '').toLowerCase();
    if (sev === 'critical') return 'badge-critical';
    if (sev === 'high') return 'badge-high';
    if (sev === 'medium') return 'badge-medium';
    return 'badge-low';
  };

  const getMitreTag = (type = '', title = '') => {
    const t = `${type} ${title}`.toLowerCase();
    if (t.includes('brute') || t.includes('auth')) return 'T1110 • Brute Force';
    if (t.includes('phish') || t.includes('email') || t.includes('url')) return 'T1566 • Phishing';
    if (t.includes('scan') || t.includes('port')) return 'T1046 • Network Service Discovery';
    return 'T1059 • Command Execution';
  };

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-20">
      {/* 1. Page Header & Action Controls */}
      <div
        className="flex flex-col md:flex-row md:items-center justify-between gap-5 pb-4 border-b"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div>
          <div className="flex items-center gap-3">
            <h1
              className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight"
              style={{
                fontFamily: 'var(--font-heading)',
                color: 'var(--text-heading)'
              }}
            >
              Security Operations Center
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-500 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              LIVE TELEMETRY
            </span>
          </div>
          <p className="text-sm mt-1.5" style={{ color: 'var(--text-secondary)' }}>
            Real-time multi-vector threat detection, correlation, and autonomous agent playbooks
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Time Range Filter */}
          <div
            className="flex items-center border rounded-xl p-1 text-xs"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-subtle)'
            }}
          >
            {['24h', '7d', '30d'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3.5 py-1.5 rounded-lg transition font-semibold cursor-pointer ${
                  timeRange === range
                    ? 'bg-cyan-500/20 text-cyan-500 shadow-sm'
                    : 'hover:text-cyan-500'
                }`}
                style={{
                  color: timeRange === range ? '#06b6d4' : 'var(--text-secondary)'
                }}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            className="btn btn-ghost text-xs py-2.5 px-4"
            title="Refresh dashboard stats"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-cyan-500' : ''}`} />
            <span className="hidden sm:inline font-semibold">Refresh</span>
          </button>

          {/* Ingest Telemetry Button */}
          <button
            onClick={() => navigate('/analyze')}
            className="btn btn-primary text-xs py-2.5 px-5 shadow-[0_0_20px_rgba(6,182,212,0.35)] cursor-pointer"
          >
            <Upload className="w-4 h-4 stroke-[2.2]" />
            Scan Telemetry
          </button>
        </div>
      </div>

      {/* 2. Hero KPI Metric Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Threats */}
        <div className="glass-card-interactive p-7 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none transition group-hover:bg-cyan-500/20" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              Threats Detected
            </span>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-cyan-500/15 border border-cyan-500/30 text-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div
            className="text-4xl font-extrabold font-mono tracking-tight"
            style={{ color: 'var(--text-heading)' }}
          >
            {totalThreats}
          </div>
          <div
            className="flex items-center justify-between text-xs pt-4 mt-4 border-t gap-2"
            style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
          >
            <span className="truncate">Multi-Vector Ingestion</span>
            <span className="text-cyan-500 font-semibold flex items-center gap-1 shrink-0">
              Active <TrendingUp className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Critical & High Alerts */}
        <div className="glass-card-interactive p-7 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-36 h-36 bg-rose-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none transition group-hover:bg-rose-500/20" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-500">
              Critical & High
            </span>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-500/15 border border-rose-500/30 text-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.2)]">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-4xl font-extrabold text-rose-500 font-mono tracking-tight">
            {criticalCount + highCount}
          </div>
          <div
            className="flex items-center justify-between text-xs pt-4 mt-4 border-t gap-2"
            style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
          >
            <span className="truncate">{criticalCount} Critical · {highCount} High</span>
            <span className="text-rose-500 font-semibold shrink-0">Immediate Triage</span>
          </div>
        </div>

        {/* Active Investigations */}
        <div className="glass-card-interactive p-7 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none transition group-hover:bg-indigo-500/20" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-500">
              Active Triage
            </span>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-500/15 border border-indigo-500/30 text-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.2)]">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div
            className="text-4xl font-extrabold font-mono tracking-tight"
            style={{ color: 'var(--text-heading)' }}
          >
            {activeCount}
          </div>
          <div
            className="flex items-center justify-between text-xs pt-4 mt-4 border-t gap-2"
            style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
          >
            <span className="truncate">Swarm Queue</span>
            <span className="text-indigo-500 font-semibold shrink-0">In Pipeline</span>
          </div>
        </div>

        {/* Swarm Health */}
        <div className="glass-card-interactive p-7 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none transition group-hover:bg-emerald-500/20" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">
              Swarm Health
            </span>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-4xl font-extrabold text-emerald-500 font-mono tracking-tight">
            7 / 7
          </div>
          <div
            className="flex items-center justify-between text-xs pt-4 mt-4 border-t gap-2"
            style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
          >
            <span className="truncate">Autonomous Agents</span>
            <span className="text-emerald-500 font-semibold shrink-0">100% Operational</span>
          </div>
        </div>
      </div>

      {/* 3. Attack Vector Sensors */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-5">
          <h2
            className="text-xs font-bold uppercase tracking-wider flex items-center gap-2"
            style={{ color: 'var(--text-secondary)' }}
          >
            <Radio className="w-4 h-4 text-cyan-500" />
            Monitored Attack Vectors
          </h2>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Deep packet, log & linguistic analysis
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Network Vector */}
          <div className="glass-card p-6 relative overflow-hidden border-t-2 border-t-cyan-500 hover:border-cyan-500/50 transition group">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 font-bold text-base" style={{ color: 'var(--text-heading)' }}>
                <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-500">
                  <Globe className="w-4 h-4" />
                </div>
                <span>Network Traffic</span>
              </div>
              <span className="mitre-tag">T1046</span>
            </div>
            <p className="text-sm leading-relaxed min-h-[44px]" style={{ color: 'var(--text-secondary)' }}>
              Deep packet inspection for stealth port sweeps, excessive SYN floods, and DNS tunneling anomalies.
            </p>
            <div
              className="mt-5 pt-4 border-t text-xs flex justify-between items-center font-mono"
              style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
            >
              <span style={{ color: 'var(--text-muted)' }}>PCAP / PCAPNG</span>
              <span className="text-cyan-500 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                MONITORED
              </span>
            </div>
          </div>

          {/* Auth Logs Vector */}
          <div className="glass-card p-6 relative overflow-hidden border-t-2 border-t-rose-500 hover:border-rose-500/50 transition group">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 font-bold text-base" style={{ color: 'var(--text-heading)' }}>
                <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-500">
                  <Lock className="w-4 h-4" />
                </div>
                <span>Authentication Logs</span>
              </div>
              <span className="mitre-tag">T1110</span>
            </div>
            <p className="text-sm leading-relaxed min-h-[44px]" style={{ color: 'var(--text-secondary)' }}>
              Heuristic analysis for SSH brute-force campaigns, credential spraying, and rapid privilege escalation.
            </p>
            <div
              className="mt-5 pt-4 border-t text-xs flex justify-between items-center font-mono"
              style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
            >
              <span style={{ color: 'var(--text-muted)' }}>Auth / Syslog / Audit</span>
              <span className="text-rose-500 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                MONITORED
              </span>
            </div>
          </div>

          {/* Email Phishing Vector */}
          <div className="glass-card p-6 relative overflow-hidden border-t-2 border-t-amber-500 hover:border-amber-500/50 transition group">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 font-bold text-base" style={{ color: 'var(--text-heading)' }}>
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
                  <Mail className="w-4 h-4" />
                </div>
                <span>Email Phishing</span>
              </div>
              <span className="mitre-tag">T1566</span>
            </div>
            <p className="text-sm leading-relaxed min-h-[44px]" style={{ color: 'var(--text-secondary)' }}>
              Sender reputation, SPF/DKIM verification, urgency linguistics, and credential-harvesting link triage.
            </p>
            <div
              className="mt-5 pt-4 border-t text-xs flex justify-between items-center font-mono"
              style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
            >
              <span style={{ color: 'var(--text-muted)' }}>EML / MSG / RFC822</span>
              <span className="text-amber-500 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                MONITORED
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Threat Activity & Severity Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline Area Chart */}
        <div className="lg:col-span-2 glass-card p-7">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold" style={{ color: 'var(--text-heading)' }}>Threat Detection Activity</h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Telemetry volume across current 24-hour cycle</p>
            </div>
            <span className="text-xs font-mono text-cyan-500 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/25 tracking-wide flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              LIVE TELEMETRY
            </span>
          </div>

          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="cyberAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="60%" stopColor="#06b6d4" stopOpacity={0.08} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke={isDark ? '#475569' : '#94a3b8'} fontSize={11} tickLine={false} axisLine={false} fontFamily="JetBrains Mono" />
                <YAxis stroke={isDark ? '#475569' : '#94a3b8'} fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} fontFamily="JetBrains Mono" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? 'rgba(9, 15, 31, 0.95)' : '#ffffff',
                    border: isDark ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid rgba(226, 232, 240, 0.9)',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontFamily: 'Plus Jakarta Sans',
                    color: isDark ? '#f8fafc' : '#0f172a',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="threats"
                  stroke="#06b6d4"
                  strokeWidth={3}
                  fill="url(#cyberAreaGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Donut */}
        <div className="glass-card p-7 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold mb-0.5" style={{ color: 'var(--text-heading)' }}>Severity Distribution</h3>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Classified by attack impact score</p>
            <div className="h-48 relative my-3">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={displayPie}
                    cx="50%"
                    cy="50%"
                    innerRadius={54}
                    outerRadius={78}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {displayPie.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke={isDark ? '#090f1f' : '#ffffff'} strokeWidth={3} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? 'rgba(9, 15, 31, 0.95)' : '#ffffff',
                      border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(226, 232, 240, 0.9)',
                      borderRadius: '10px',
                      fontSize: '12px',
                      fontFamily: 'Plus Jakarta Sans',
                      color: isDark ? '#f8fafc' : '#0f172a'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-extrabold font-mono" style={{ color: 'var(--text-heading)' }}>{totalThreats}</span>
                <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: 'var(--text-muted)' }}>TOTAL</span>
              </div>
            </div>
          </div>

          <div
            className="grid grid-cols-2 gap-2.5 pt-4 border-t"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            {Object.entries(SEV_COLORS).map(([name, color]) => (
              <div
                key={name}
                className="flex items-center justify-between text-xs py-1.5 px-3 rounded-xl border"
                style={{
                  backgroundColor: 'var(--bg-inset)',
                  borderColor: 'var(--border-subtle)'
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>{name}</span>
                </div>
                <span className="font-bold font-mono" style={{ color: 'var(--text-heading)' }}>{s[name.toLowerCase()] || 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Live Incidents Queue Table */}
      <div className="glass-card overflow-hidden">
        <div
          className="flex items-center justify-between px-7 py-5 border-b"
          style={{
            borderColor: 'var(--border-subtle)',
            backgroundColor: 'var(--table-th-bg)'
          }}
        >
          <div>
            <h3 className="text-base font-bold" style={{ color: 'var(--text-heading)' }}>Prioritized Security Incidents</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Live triage queue with automated MITRE ATT&CK technique mapping
            </p>
          </div>

          <button
            onClick={() => navigate('/incidents')}
            className="text-xs text-cyan-500 hover:text-cyan-600 dark:hover:text-cyan-400 font-bold flex items-center gap-1.5 transition group cursor-pointer"
          >
            <span>VIEW ALL INCIDENTS</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {recent.length === 0 ? (
          <div className="p-16 text-center">
            <div
              className="w-16 h-16 rounded-2xl border flex items-center justify-center mx-auto mb-4 text-cyan-500 shadow-sm"
              style={{
                backgroundColor: 'var(--bg-inset)',
                borderColor: 'var(--border-subtle)'
              }}
            >
              <Shield className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold" style={{ color: 'var(--text-heading)' }}>No Incidents Logged</h4>
            <p className="text-sm mt-1 max-w-sm mx-auto" style={{ color: 'var(--text-secondary)' }}>
              The perimeter is currently quiet. Ingest a PCAP, auth log, or email artifact to test the multi-agent swarm.
            </p>
            <button
              onClick={() => navigate('/analyze')}
              className="mt-5 btn btn-secondary text-xs cursor-pointer"
            >
              <Upload className="w-4 h-4 text-cyan-500" />
              Open Threat Scanner
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th>INCIDENT ID</th>
                  <th>THREAT TITLE & VECTOR</th>
                  <th>MITRE TTP</th>
                  <th>SEVERITY</th>
                  <th>STATUS</th>
                  <th className="text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                {recent.slice(0, 5).map((inc, idx) => (
                  <tr
                    key={idx}
                    onClick={() => navigate(`/incidents/${inc.incident_id || inc.id}`)}
                    className="cursor-pointer transition group"
                  >
                    <td>
                      <span className="font-mono text-xs font-bold text-cyan-500 px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/30">
                        {inc.incident_id || `#${inc.id}`}
                      </span>
                    </td>
                    <td>
                      <p className="text-sm font-bold group-hover:text-cyan-500 transition" style={{ color: 'var(--text-heading)' }}>
                        {inc.title}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{inc.incident_type}</p>
                    </td>
                    <td>
                      <span className="mitre-tag">
                        {getMitreTag(inc.incident_type, inc.title)}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getBadgeClass(inc.severity)}`}>
                        {inc.severity}
                      </span>
                    </td>
                    <td>
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                        {inc.status}
                      </span>
                    </td>
                    <td className="text-right">
                      <span className="text-xs font-bold text-cyan-500 group-hover:translate-x-0.5 transition inline-flex items-center gap-1">
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

      {/* 6. AI Defense Swarm Live Telemetry Stream */}
      <div className="glass-card p-7">
        <div
          className="flex items-center justify-between pb-5 mb-5 border-b"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold" style={{ color: 'var(--text-heading)' }}>Autonomous Agent Activity Stream</h3>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Live consensus & telemetry across 7 defense agents</p>
            </div>
          </div>
          <span className="flex items-center gap-2 text-xs text-emerald-500 font-bold px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            SWARM CONSENSUS: ACTIVE
          </span>
        </div>

        <div className="space-y-3 font-mono text-xs">
          <div
            className="p-3.5 rounded-xl border flex items-start gap-3.5 transition"
            style={{
              backgroundColor: 'var(--bg-inset)',
              borderColor: 'var(--border-subtle)'
            }}
          >
            <span className="shrink-0 mt-0.5" style={{ color: 'var(--text-muted)' }}>16:42:10</span>
            <span className="px-2.5 py-0.5 rounded bg-cyan-500/15 text-cyan-500 border border-cyan-500/30 font-bold shrink-0">
              [NetworkMonitorAgent]
            </span>
            <span style={{ color: 'var(--text-primary)' }}>
              Ingested PCAP telemetry. Detected 1,005 scanned destination ports targeting 192.168.1.1.
            </span>
          </div>

          <div
            className="p-3.5 rounded-xl border flex items-start gap-3.5 transition"
            style={{
              backgroundColor: 'var(--bg-inset)',
              borderColor: 'var(--border-subtle)'
            }}
          >
            <span className="shrink-0 mt-0.5" style={{ color: 'var(--text-muted)' }}>16:42:11</span>
            <span className="px-2.5 py-0.5 rounded bg-indigo-500/15 text-indigo-500 border border-indigo-500/30 font-bold shrink-0">
              [ThreatIntelAgent]
            </span>
            <span style={{ color: 'var(--text-primary)' }}>
              Cross-referenced source IP 192.168.1.50 against IOC feed. Confidence score: 94% (Known Brute Force Scanner).
            </span>
          </div>

          <div
            className="p-3.5 rounded-xl border flex items-start gap-3.5 transition"
            style={{
              backgroundColor: 'var(--bg-inset)',
              borderColor: 'var(--border-subtle)'
            }}
          >
            <span className="shrink-0 mt-0.5" style={{ color: 'var(--text-muted)' }}>16:42:12</span>
            <span className="px-2.5 py-0.5 rounded bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 font-bold shrink-0">
              [IncidentResponseAgent]
            </span>
            <span style={{ color: 'var(--text-primary)' }}>
              Synthesized defensive playbook: iptables DROP rule staged, session terminated, forensic incident dossier created.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
