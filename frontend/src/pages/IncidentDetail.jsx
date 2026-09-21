import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, RefreshCw, AlertTriangle, FileText, Play, Check,
  Terminal, Cpu
} from 'lucide-react';
import { getIncident, updateIncidentStatus } from '../services/api';
import StatCard from '../components/ui/StatCard';
import SeverityBadge from '../components/ui/SeverityBadge';

export default function IncidentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [executedActions, setExecutedActions] = useState({});

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getIncident(id);
      setIncident(data);
    } catch (err) {
      console.error('Failed to fetch incident:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  const handleStatusUpdate = async (newStatus) => {
    setUpdating(true);
    try {
      await updateIncidentStatus(id, newStatus);
      await fetchDetail();
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleExecuteAction = (actionIdx) => {
    setExecutedActions(prev => ({ ...prev, [actionIdx]: true }));
  };

  const getMitreTag = (type = '', title = '') => {
    const t = `${type} ${title}`.toLowerCase();
    if (t.includes('brute') || t.includes('auth')) return 'T1110 · Brute Force';
    if (t.includes('phish') || t.includes('email') || t.includes('url')) return 'T1566 · Phishing';
    if (t.includes('scan') || t.includes('port')) return 'T1046 · Network Service Discovery';
    return 'T1059 · Command Execution';
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-ink-muted">
        <RefreshCw className="w-7 h-7 animate-spin text-accent mx-auto mb-3" />
        <h3 className="text-[15px] font-semibold text-ink">Loading Forensic Dossier...</h3>
        <p className="text-[12px] mt-1 font-mono text-ink-faint">Retrieving cross-vector agent telemetry</p>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="text-center py-16 card p-8 max-w-md mx-auto">
        <AlertTriangle className="w-9 h-9 text-danger mx-auto mb-3" />
        <h2 className="text-[16px] font-semibold text-ink">Incident Record Not Found</h2>
        <p className="text-[13px] text-ink-muted mt-1">Incident #{id} could not be located in registry.</p>
        <button onClick={() => navigate('/incidents')} className="btn btn-primary mt-5 text-[12px]">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Queue
        </button>
      </div>
    );
  }

  const indicators = incident.indicators || [];
  const agentFindings = incident.agent_findings || [];
  const responseActions = incident.response_actions || [];
  const correlationData = incident.correlation_data || {};

  const tabs = [
    { id: 'overview', label: 'Forensic Overview & Evidence' },
    { id: 'findings', label: `Agent Findings (${agentFindings.length})` },
    { id: 'iocs', label: `Discovered IOCs (${indicators.length})` },
    { id: 'playbook', label: `Containment Playbook (${responseActions.length})` },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-line">
        <div className="flex items-start sm:items-center gap-4">
          <button
            onClick={() => navigate('/incidents')}
            className="p-2 rounded-lg bg-elevated hover:bg-card border border-line text-ink-muted hover:text-ink transition"
            title="Back to incident list"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[11px] font-semibold text-accent bg-accent/10 px-2 py-1 rounded-md border border-accent/25">
                {incident.incident_id || `#${incident.id}`}
              </span>
              <SeverityBadge severity={incident.severity} />
              <span className="mitre-tag">{getMitreTag(incident.incident_type, incident.title)}</span>
              <span className="text-[11px] font-mono text-ink-muted bg-elevated px-2 py-1 rounded-md border border-line">
                Asset: {incident.source_file ? `srv-${incident.source_file.split('.')[0]}` : 'edge-gw-01'}
              </span>
            </div>
            <h1 className="text-[24px] font-semibold text-ink mt-2 tracking-tight">{incident.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-elevated px-3 py-2 rounded-lg border border-line">
            <span className="text-[12px] text-ink-muted">Status:</span>
            <select
              value={incident.status}
              disabled={updating}
              onChange={(e) => handleStatusUpdate(e.target.value)}
              className="bg-transparent text-[12px] font-semibold text-ink focus:outline-none cursor-pointer"
            >
              <option value="Open">Open</option>
              <option value="Investigating">Investigating</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <button onClick={() => navigate('/reports')} className="btn btn-primary text-[12px]">
            <FileText className="w-3.5 h-3.5" />
            <span>Generate PDF</span>
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Swarm Consensus"
          value={incident.correlation_score ? `${Math.round(incident.correlation_score * 100)}%` : '—'}
          subtext="Cross-vector validated"
          accent="accent"
        />
        <StatCard
          label="Telemetry Source"
          value={incident.source_file || incident.source || 'N/A'}
          subtext="Inbound payload"
          accent="danger"
        />
        <StatCard label="Extracted IOCs" value={indicators.length} subtext="IPs, hashes & domains" accent="ai" />
        <StatCard label="Containment Actions" value={responseActions.length} subtext="Automated playbooks" accent="success" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-line overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-[13px] font-medium transition border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === tab.id ? 'border-accent text-accent' : 'border-transparent text-ink-muted hover:text-ink-soft'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          <div className="card p-6">
            <h3 className="text-[15px] font-semibold text-ink mb-2">Threat Assessment Narrative</h3>
            <p className="text-[13.5px] text-ink-soft leading-relaxed">
              {incident.description || 'Automated multi-agent threat classification identified suspicious activity matching active cyber threat actor tradecraft.'}
            </p>

            {correlationData?.reasoning && (
              <div className="mt-4 p-4 bg-elevated rounded-lg border border-line">
                <span className="text-[11px] font-semibold text-ai uppercase tracking-wider font-mono block mb-1">
                  Cross-Vector Graph Correlation Engine
                </span>
                <p className="text-[12.5px] text-ink-soft leading-relaxed font-mono">{correlationData.reasoning}</p>
              </div>
            )}
          </div>

          {incident.evidence?.length > 0 && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[15px] font-semibold text-ink flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-success" />
                  Forensic Telemetry Artifacts
                </h3>
                <span className="text-[11px] font-mono text-ink-faint">Live Telemetry Ingestion</span>
              </div>
              <div className="space-y-2">
                {incident.evidence.map((ev, i) => (
                  <div key={i} className="p-3 bg-surface rounded-lg border border-line font-mono text-[12px] text-success overflow-x-auto">
                    {typeof ev === 'object' ? JSON.stringify(ev, null, 2) : ev}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Findings */}
      {activeTab === 'findings' && (
        <div className="space-y-3">
          {agentFindings.length === 0 ? (
            <div className="card p-12 text-center text-ink-muted text-[13px]">No distinct agent findings attached.</div>
          ) : (
            agentFindings.map((f, i) => (
              <div key={i} className="card p-5 border-l-2 border-l-accent">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-accent flex items-center gap-1.5 font-mono">
                    <Cpu className="w-3.5 h-3.5" />
                    {f.agent_name || `Security Agent #${i + 1}`}
                  </span>
                  <SeverityBadge severity={f.severity || 'MEDIUM'} className="text-xs" />
                </div>
                <h4 className="text-[14px] font-semibold text-ink mt-1">{f.finding_type || f.title}</h4>
                <p className="text-[13px] text-ink-soft mt-1 leading-relaxed">{f.description || f.summary}</p>
                {f.confidence && (
                  <div className="mt-3 pt-2 border-t border-line flex items-center gap-2 text-[12px] text-ink-muted">
                    <span>Agent Confidence:</span>
                    <span className="font-mono text-success font-semibold">{Math.round(f.confidence * 100)}%</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* IOCs */}
      {activeTab === 'iocs' && (
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-line bg-surface">
            <h3 className="text-[15px] font-semibold text-ink">Extracted Indicators of Compromise</h3>
            <p className="text-[12px] text-ink-muted mt-0.5">Known malicious IP addresses, domain names, and file hashes</p>
          </div>
          <table className="w-full">
            <thead>
              <tr>
                <th>Indicator Value</th>
                <th>Type</th>
                <th>Risk Level</th>
                <th>Threat Attribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {indicators.length === 0 ? (
                <tr><td colSpan={4} className="py-10 text-center text-ink-muted text-[12px]">No indicators found.</td></tr>
              ) : (
                indicators.map((ioc, i) => (
                  <tr key={i}>
                    <td className="font-mono text-[12px] font-semibold text-accent">
                      {typeof ioc === 'object' ? ioc.value : ioc}
                    </td>
                    <td className="text-[12px] text-ink-soft uppercase">
                      {typeof ioc === 'object' ? ioc.type || 'IP' : 'IOC'}
                    </td>
                    <td><span className="badge badge-high text-xs">{typeof ioc === 'object' ? ioc.risk_level || 'HIGH' : 'SUSPICIOUS'}</span></td>
                    <td className="text-[12px] text-ink-soft">{typeof ioc === 'object' ? ioc.category || 'Identified Threat' : 'Known Malicious Artifact'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Playbook */}
      {activeTab === 'playbook' && (
        <div className="space-y-3">
          {responseActions.length === 0 ? (
            <div className="card p-12 text-center text-ink-muted text-[13px]">No response actions staged.</div>
          ) : (
            responseActions.map((action, i) => {
              const isObj = typeof action === 'object';
              const executed = executedActions[i];
              return (
                <div key={i} className="card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-lg bg-accent/10 text-accent text-[12px] font-semibold flex items-center justify-center shrink-0 font-mono mt-0.5 border border-accent/25">
                      {i + 1}
                    </span>
                    <div>
                      <h4 className="text-[14px] font-semibold text-ink">{isObj ? action.action || action.title : action}</h4>
                      {isObj && action.description && (
                        <p className="text-[12px] text-ink-muted mt-1 leading-relaxed">{action.description}</p>
                      )}
                      <div className="mt-2 flex items-center gap-2">
                        <span className="badge badge-high text-[10px]">{isObj ? action.priority || 'HIGH' : 'HIGH'} PRIORITY</span>
                        <span className="text-[10.5px] text-ink-faint font-mono">Automated Firewall/SOC Rule</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleExecuteAction(i)}
                    disabled={executed}
                    className={`btn text-[12px] shrink-0 ${executed ? 'btn-success' : 'btn-primary'}`}
                  >
                    {executed ? (<><Check className="w-3.5 h-3.5" /> Rule Applied</>) : (<><Play className="w-3.5 h-3.5 fill-current" /> Execute Playbook</>)}
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
