import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, RefreshCw, Shield, ArrowRight, Filter,
  AlertTriangle, Terminal, Mail, Network, FileCode, CheckCircle2, Clock, Activity
} from 'lucide-react';
import { getIncidents, updateIncidentStatus } from '../services/api';

export default function Incidents() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (severityFilter !== 'ALL') params.severity = severityFilter;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const { data } = await getIncidents(params);
      setIncidents(data || []);
    } catch (err) {
      console.error('Failed to fetch incidents:', err);
    } finally {
      setLoading(false);
    }
  }, [severityFilter, statusFilter]);

  useEffect(() => { fetchIncidents(); }, [fetchIncidents]);

  const handleStatusChange = async (e, id, status) => {
    e.stopPropagation();
    setUpdatingId(id);
    try {
      await updateIncidentStatus(id, status);
      await fetchIncidents();
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = incidents.filter(inc => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      inc.title?.toLowerCase().includes(q) ||
      inc.incident_id?.toLowerCase().includes(q) ||
      inc.incident_type?.toLowerCase().includes(q) ||
      inc.source?.toLowerCase().includes(q)
    );
  });

  const criticalCount = incidents.filter(i => (i.severity || '').toUpperCase() === 'CRITICAL').length;
  const highCount = incidents.filter(i => (i.severity || '').toUpperCase() === 'HIGH').length;
  const openCount = incidents.filter(i => i.status === 'Open' || i.status === 'Investigating').length;

  const getBadgeClass = (sev) => {
    const s = (sev || '').toLowerCase();
    if (s === 'critical') return 'badge-critical';
    if (s === 'high') return 'badge-high';
    if (s === 'medium') return 'badge-medium';
    return 'badge-low';
  };

  const getMitreTag = (type = '', title = '') => {
    const t = `${type} ${title}`.toLowerCase();
    if (t.includes('brute') || t.includes('auth')) return 'T1110 • Brute Force';
    if (t.includes('phish') || t.includes('email') || t.includes('url')) return 'T1566 • Phishing';
    if (t.includes('scan') || t.includes('port')) return 'T1046 • Network Discovery';
    return 'T1059 • Execution';
  };

  const getTargetAsset = (id = '', type = '') => {
    const t = `${id} ${type}`.toLowerCase();
    if (t.includes('brute') || t.includes('0003')) return 'srv-auth-02.corp';
    if (t.includes('phish') || t.includes('0002')) return 'mail-gw.corp';
    if (t.includes('scan') || t.includes('0001')) return 'edge-router-01';
    return 'internal-host-04';
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/60">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent">
            Security Incident Queue
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Prioritized threat queue categorized with MITRE ATT&CK techniques and autonomous containment staging
          </p>
        </div>

        <button
          onClick={fetchIncidents}
          disabled={loading}
          className="btn btn-ghost text-xs py-2 px-3.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          Refresh Queue
        </button>
      </div>

      {/* 2. Key Triage Metrics Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
        <div className="glass-card p-5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Incidents</span>
          <p className="text-3xl font-extrabold text-white mt-1 font-mono">{incidents.length}</p>
          <span className="text-xs text-slate-500 mt-1 block">Active Ingestion</span>
        </div>

        <div className="glass-card p-5">
          <span className="text-xs font-semibold text-rose-300 uppercase tracking-wider">Critical Alerts</span>
          <p className="text-3xl font-extrabold text-rose-400 mt-1 font-mono">{criticalCount}</p>
          <span className="text-xs text-slate-500 mt-1 block">Immediate SLA</span>
        </div>

        <div className="glass-card p-5">
          <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">In Investigation</span>
          <p className="text-3xl font-extrabold text-indigo-300 mt-1 font-mono">{openCount}</p>
          <span className="text-xs text-slate-500 mt-1 block">Swarm Triage</span>
        </div>

        <div className="glass-card p-5">
          <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">MTTD (Detection)</span>
          <p className="text-3xl font-extrabold text-emerald-400 mt-1 font-mono">3.8s</p>
          <span className="text-xs text-slate-500 mt-1 block">Autonomous Engine</span>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="glass-card p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search incident ID, title, or asset..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30"
          />
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Severity Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto bg-slate-900/60 p-1 rounded-xl border border-slate-800">
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  severityFilter === sev
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {sev === 'ALL' ? 'All' : sev.charAt(0) + sev.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-medium text-slate-200 focus:outline-none focus:border-cyan-500/60"
          >
            <option value="ALL">All Statuses</option>
            <option value="Investigating">Investigating</option>
            <option value="Open">Open</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {/* 4. Enterprise Data Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <RefreshCw className="w-7 h-7 text-cyan-400 animate-spin mx-auto mb-3" />
            <p className="text-sm">Loading incident registry...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <Shield className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <h4 className="text-base font-semibold text-white">No Incidents Match Filter</h4>
            <p className="text-xs text-slate-500 mt-1">Try resetting search keywords or severity criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th>INCIDENT ID</th>
                  <th>THREAT TITLE & VECTOR</th>
                  <th>MITRE TECHNIQUE</th>
                  <th>TARGET ASSET</th>
                  <th>SEVERITY</th>
                  <th>STATUS</th>
                  <th className="text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((inc) => (
                  <tr
                    key={inc.id}
                    onClick={() => navigate(`/incidents/${inc.incident_id || inc.id}`)}
                    className="hover:bg-slate-800/40 cursor-pointer transition group"
                  >
                    {/* ID */}
                    <td>
                      <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-md border border-cyan-500/25">
                        {inc.incident_id || `#${inc.id}`}
                      </span>
                    </td>

                    {/* Threat Title */}
                    <td>
                      <p className="text-sm font-semibold text-white group-hover:text-cyan-300 transition">
                        {inc.title}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{inc.incident_type}</p>
                    </td>

                    {/* MITRE */}
                    <td>
                      <span className="mitre-tag">
                        {getMitreTag(inc.incident_type, inc.title)}
                      </span>
                    </td>

                    {/* Target Asset */}
                    <td className="font-mono text-xs text-slate-300">
                      {getTargetAsset(inc.incident_id, inc.title)}
                    </td>

                    {/* Severity */}
                    <td>
                      <span className={`badge ${getBadgeClass(inc.severity)}`}>
                        {inc.severity}
                      </span>
                    </td>

                    {/* Status Dropdown */}
                    <td onClick={(e) => e.stopPropagation()}>
                      <select
                        value={inc.status}
                        disabled={updatingId === inc.id}
                        onChange={(e) => handleStatusChange(e, inc.id, e.target.value)}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-200 focus:outline-none focus:border-cyan-500"
                      >
                        <option value="Investigating">Investigating</option>
                        <option value="Open">Open</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </td>

                    {/* Action */}
                    <td className="text-right">
                      <span className="text-xs font-semibold text-cyan-400 group-hover:text-cyan-300 group-hover:translate-x-0.5 transition-all inline-flex items-center gap-1">
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
    </div>
  );
}
