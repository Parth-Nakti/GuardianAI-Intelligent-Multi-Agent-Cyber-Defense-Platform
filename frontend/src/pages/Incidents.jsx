import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Shield, ArrowRight } from 'lucide-react';
import { getIncidents, updateIncidentStatus } from '../services/api';
import StatCard from '../components/ui/StatCard';
import PageHeader from '../components/ui/PageHeader';
import SearchInput from '../components/ui/SearchInput';
import SeverityBadge from '../components/ui/SeverityBadge';

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
  const resolvedCount = incidents.filter(i => i.status === 'Resolved' || i.status === 'Closed').length;

  const getMitreTag = (type = '', title = '') => {
    const t = `${type} ${title}`.toLowerCase();
    if (t.includes('brute') || t.includes('auth')) return 'T1110 · Brute Force';
    if (t.includes('phish') || t.includes('email') || t.includes('url')) return 'T1566 · Phishing';
    if (t.includes('scan') || t.includes('port')) return 'T1046 · Network Discovery';
    return 'T1059 · Execution';
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
      <PageHeader
        title="Security Incident Queue"
        description="Prioritized threat queue categorized with MITRE ATT&CK techniques and autonomous containment staging"
        actions={
          <button onClick={fetchIncidents} disabled={loading} className="btn btn-ghost text-[12px]">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-accent' : ''}`} />
            Refresh
          </button>
        }
      />

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Incidents" value={incidents.length} subtext="Active ingestion" accent="ink" />
        <StatCard label="Critical Alerts" value={criticalCount} subtext={`${highCount} high severity`} accent="danger" />
        <StatCard label="In Investigation" value={openCount} subtext="Swarm triage" accent="ai" />
        <StatCard label="Resolved" value={resolvedCount} subtext="Closed out" accent="success" />
      </div>

      {/* Search & Filter Bar */}
      <div className="card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <SearchInput
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search incident ID, title, or asset..."
          className="w-full md:w-80"
        />

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1 overflow-x-auto bg-surface p-1 rounded-lg border border-line">
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-2.5 py-1.5 rounded-md text-[12px] font-medium transition cursor-pointer ${
                  severityFilter === sev ? 'bg-accent/15 text-accent' : 'text-ink-muted hover:text-ink'
                }`}
              >
                {sev === 'ALL' ? 'All' : sev.charAt(0) + sev.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-surface border border-line text-[12px] font-medium text-ink-soft focus:outline-none focus:border-accent/50"
          >
            <option value="ALL">All Statuses</option>
            <option value="Investigating">Investigating</option>
            <option value="Open">Open</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-ink-muted">
            <RefreshCw className="w-6 h-6 text-accent animate-spin mx-auto mb-3" />
            <p className="text-[13px]">Loading incident registry...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-ink-muted">
            <Shield className="w-10 h-10 text-ink-faint mx-auto mb-3" />
            <h4 className="text-[14px] font-semibold text-ink">No Incidents Match Filter</h4>
            <p className="text-[12px] mt-1 text-ink-faint">Try resetting search keywords or severity criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th>Incident ID</th>
                  <th>Threat Title &amp; Vector</th>
                  <th>MITRE Technique</th>
                  <th>Target Asset</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((inc) => (
                  <tr key={inc.id} onClick={() => navigate(`/incidents/${inc.incident_id || inc.id}`)} className="cursor-pointer transition group">
                    <td>
                      <span className="font-mono text-[11px] font-semibold text-accent bg-accent/10 px-2 py-1 rounded-md border border-accent/25">
                        {inc.incident_id || `#${inc.id}`}
                      </span>
                    </td>
                    <td>
                      <p className="text-[13px] font-semibold text-ink group-hover:text-accent transition">{inc.title}</p>
                      <p className="text-[12px] text-ink-muted mt-0.5">{inc.incident_type}</p>
                    </td>
                    <td><span className="mitre-tag">{getMitreTag(inc.incident_type, inc.title)}</span></td>
                    <td className="font-mono text-[12px] text-ink-soft">{getTargetAsset(inc.incident_id, inc.title)}</td>
                    <td><SeverityBadge severity={inc.severity} /></td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <select
                        value={inc.status}
                        disabled={updatingId === inc.id}
                        onChange={(e) => handleStatusChange(e, inc.id, e.target.value)}
                        className="px-2 py-1 rounded-md bg-surface border border-line text-[12px] font-medium text-ink-soft focus:outline-none focus:border-accent/50"
                      >
                        <option value="Investigating">Investigating</option>
                        <option value="Open">Open</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </td>
                    <td className="text-right">
                      <span className="text-[12px] font-semibold text-accent group-hover:translate-x-0.5 transition-all inline-flex items-center gap-1">
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
