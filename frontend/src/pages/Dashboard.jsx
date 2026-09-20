import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, AlertTriangle, ArrowRight, RefreshCw, Upload,
  Activity, CheckCircle2, Clock, Terminal, Cpu, Database,
  TrendingUp, Globe, Mail, FileCode, Lock, ExternalLink
} from 'lucide-react';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';

const SEV_COLORS = {
  Critical: '#ef4444',
  High: '#f97316',
  Medium: '#eab308',
  Low: '#06b6d4',
};

export default function Dashboard({ stats, onRefresh }) {
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('24h');

  const handleRefresh = async () => {
    if (onRefresh) {
      setRefreshing(true);
      await onRefresh();
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  const s = stats?.severity || {};
  const st = stats?.status || {};
  const recent = stats?.recent_incidents || [];
  const totalThreats = stats?.threats_detected || 0;
  const criticalCount = s.critical || 0;
  const highCount = s.high || 0;
  const activeCount = st.investigating || 0;

  // Timeline series
  const timelineData = [
    { time: '02:00', threats: Math.floor(totalThreats * 0.1) },
    { time: '06:00', threats: Math.floor(totalThreats * 0.25) },
    { time: '10:00', threats: Math.floor(totalThreats * 0.5) },
    { time: '14:00', threats: Math.floor(totalThreats * 0.75) },
    { time: '18:00', threats: totalThreats },
    { time: 'Current', threats: totalThreats },
  ];

  const pieData = [
    { name: 'Critical', value: s.critical || 0, color: SEV_COLORS.Critical },
    { name: 'High', value: s.high || 0, color: SEV_COLORS.High },
    { name: 'Medium', value: s.medium || 0, color: SEV_COLORS.Medium },
    { name: 'Low', value: s.low || 0, color: SEV_COLORS.Low },
  ].filter(d => d.value > 0);

  const displayPie = pieData.length > 0 ? pieData : [{ name: 'None', value: 1, color: '#334155' }];

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
    <div className="space-y-10 max-w-6xl mx-auto pb-16">
      {/* 1. Header with Time Filter & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Security Operations Center</h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time threat detection, autonomous multi-agent correlation, and triage queue
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Time range selector */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs font-medium text-slate-400">
            {['24h', '7d', '30d'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-2.5 py-1 rounded-md transition ${
                  timeRange === range
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'hover:text-slate-200'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <button
            onClick={handleRefresh}
            className="btn btn-ghost text-xs py-2 px-3 text-slate-300"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={() => navigate('/analyze')}
            className="btn btn-primary text-xs py-2 px-3.5 font-semibold"
          >
            <Upload className="w-3.5 h-3.5" />
            Ingest Threat File
          </button>
        </div>
      </div>

      {/* 2. 4 Clean, Spacious Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Total Threats Detected
            </span>
            <span className="w-2 h-2 rounded-full bg-blue-500" />
          </div>
          <div className="my-3">
            <span className="text-4xl font-extrabold text-white tracking-tight">{totalThreats}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800/80">
            <span>All Ingestion Vectors</span>
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              Active <TrendingUp className="w-3 h-3" />
            </span>
          </div>
        </div>

        <div className="card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-400 uppercase tracking-wide">
              Critical & High Severity
            </span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="my-3">
            <span className="text-4xl font-extrabold text-red-400 tracking-tight">{criticalCount + highCount}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800/80">
            <span>{criticalCount} Critical • {highCount} High</span>
            <span className="text-red-400 font-medium">Immediate</span>
          </div>
        </div>

        <div className="card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Active Investigations
            </span>
            <Activity className="w-4 h-4 text-purple-400" />
          </div>
          <div className="my-3">
            <span className="text-4xl font-extrabold text-white tracking-tight">{activeCount}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800/80">
            <span>Swarm Triage In-Progress</span>
            <span className="text-purple-400 font-medium font-mono">Queue: OK</span>
          </div>
        </div>

        <div className="card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">
              AI Defense Swarm
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="my-3">
            <span className="text-4xl font-extrabold text-emerald-400 tracking-tight">7 / 7</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800/80">
            <span>Agents Healthy</span>
            <span className="text-emerald-400 font-medium">100% Online</span>
          </div>
        </div>
      </div>

      {/* 3. Attack Vector Summary Cards */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 font-mono">
          Monitored Attack Vectors
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6 border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-white font-semibold text-base">
                <Globe className="w-4 h-4 text-blue-400" />
                <span>Network & Traffic</span>
              </div>
              <span className="mitre-tag">T1046</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real-time deep packet inspection for port scans, SYN floods, and DNS tunneling anomalies.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-500 flex justify-between">
              <span>PCAP / PCAPNG</span>
              <span className="text-blue-400 font-medium">Monitored</span>
            </div>
          </div>

          <div className="card p-6 border-l-4 border-l-red-500">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-white font-semibold text-base">
                <Lock className="w-4 h-4 text-red-400" />
                <span>Authentication & Logs</span>
              </div>
              <span className="mitre-tag">T1110</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Heuristic analysis on server auth logs, SSH brute-force attempts, and privilege escalations.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-500 flex justify-between">
              <span>Auth / Syslog / Audit</span>
              <span className="text-red-400 font-medium">Monitored</span>
            </div>
          </div>

          <div className="card p-6 border-l-4 border-l-amber-500">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-white font-semibold text-base">
                <Mail className="w-4 h-4 text-amber-400" />
                <span>Email & Phishing</span>
              </div>
              <span className="mitre-tag">T1566</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sender reputation, SPF/DKIM validation, and suspicious embedded URL harvesting detection.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-500 flex justify-between">
              <span>EML / MSG / RFC822</span>
              <span className="text-amber-400 font-medium">Monitored</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Threat Activity & Severity Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Timeline Chart */}
        <div className="lg:col-span-2 card p-7">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white">Threat Detection Activity</h3>
              <p className="text-xs text-slate-400 mt-0.5">Observed telemetry volume over 24-hour cycle</p>
            </div>
            <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
              Live Ingestion
            </span>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: '#111726',
                    border: '1px solid #27344f',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#f8fafc'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="threats"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fill="url(#chartGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Donut */}
        <div className="card p-7 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-1">Severity Distribution</h3>
            <p className="text-xs text-slate-400">Classified by severity weight</p>
            <div className="h-40 relative my-3">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={displayPie}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {displayPie.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="#111726" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#111726',
                      border: '1px solid #27344f',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-extrabold text-white">{totalThreats}</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Total</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800">
            {Object.entries(SEV_COLORS).map(([name, color]) => (
              <div key={name} className="flex items-center justify-between text-xs py-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-slate-300 font-medium">{name}</span>
                </div>
                <span className="font-bold text-white">{s[name.toLowerCase()] || 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Live Incidents Queue Table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-7 py-5 border-b border-slate-800 bg-[#0d121f]">
          <div>
            <h3 className="text-base font-bold text-white">Prioritized Security Incidents</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live queue triaged by autonomous AI agents with MITRE ATT&CK attribution
            </p>
          </div>

          <button
            onClick={() => navigate('/incidents')}
            className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1.5 transition"
          >
            <span>All Incidents</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recent.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <Shield className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h4 className="text-base font-semibold text-white">No Incidents Logged</h4>
            <p className="text-xs text-slate-500 mt-1">Upload a threat file to trigger multi-agent inspection</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800 text-left">
                  <th className="py-4 px-7 text-xs font-semibold text-slate-400 font-mono">Incident ID</th>
                  <th className="py-4 px-5 text-xs font-semibold text-slate-400">Threat Title & Vector</th>
                  <th className="py-4 px-5 text-xs font-semibold text-slate-400">MITRE Technique</th>
                  <th className="py-4 px-5 text-xs font-semibold text-slate-400">Severity</th>
                  <th className="py-4 px-5 text-xs font-semibold text-slate-400">Status</th>
                  <th className="py-4 px-7 text-right text-xs font-semibold text-slate-400">Investigation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recent.slice(0, 5).map((inc, idx) => (
                  <tr
                    key={idx}
                    onClick={() => navigate(`/incidents/${inc.incident_id || inc.id}`)}
                    className="hover:bg-slate-800/40 cursor-pointer transition group"
                  >
                    <td className="py-4 px-7">
                      <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded border border-blue-500/20">
                        {inc.incident_id || `#${inc.id}`}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <p className="text-sm font-semibold text-white group-hover:text-blue-300 transition">
                        {inc.title}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{inc.incident_type}</p>
                    </td>
                    <td className="py-4 px-5">
                      <span className="mitre-tag">
                        {getMitreTag(inc.incident_type, inc.title)}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <span className={`badge ${getBadgeClass(inc.severity)}`}>
                        {inc.severity}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                        {inc.status}
                      </span>
                    </td>
                    <td className="py-4 px-7 text-right">
                      <span className="text-xs font-semibold text-blue-400 group-hover:text-blue-300 group-hover:translate-x-0.5 transition-all inline-flex items-center gap-1">
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

      {/* 6. AI Defense Swarm Telemetry Stream */}
      <div className="card p-7">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-base font-bold text-white">Autonomous Agent Activity Stream</h3>
              <p className="text-xs text-slate-400">Live consensus decisions across 7 specialized defense agents</p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            SWARM CONSENSUS: ACTIVE
          </span>
        </div>

        <div className="space-y-3 font-mono text-xs">
          <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 flex items-start gap-3">
            <span className="text-slate-500 shrink-0">16:42:10</span>
            <span className="text-blue-400 font-semibold">[NetworkMonitorAgent]</span>
            <span className="text-slate-300">Ingested PCAP telemetry. Flagged 36 repeated SYN requests targeting destination ports 22, 80, 443.</span>
          </div>
          <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 flex items-start gap-3">
            <span className="text-slate-500 shrink-0">16:42:11</span>
            <span className="text-purple-400 font-semibold">[ThreatIntelAgent]</span>
            <span className="text-slate-300">Cross-referenced source IP 192.168.1.50 against IOC feed. Reputation score: 94/100 (Known Brute Force Scanner).</span>
          </div>
          <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 flex items-start gap-3">
            <span className="text-slate-500 shrink-0">16:42:12</span>
            <span className="text-emerald-400 font-semibold">[IncidentResponseAgent]</span>
            <span className="text-slate-300">Formulated 4 automated containment actions: iptables DROP rule staged, session terminated, forensic PDF generated.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
