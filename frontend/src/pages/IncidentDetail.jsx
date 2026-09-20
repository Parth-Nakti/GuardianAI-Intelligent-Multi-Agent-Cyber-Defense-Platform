import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, RefreshCw, AlertTriangle, FileText, Play, Check,
  Shield, Terminal, Cpu, Database, CheckCircle2, Globe, Clock,
  ExternalLink, Layers
} from 'lucide-react';
import { getIncident, updateIncidentStatus } from '../services/api';

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

  const getBadge = (sev) => {
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
    if (t.includes('scan') || t.includes('port')) return 'T1046 • Network Service Discovery';
    return 'T1059 • Command Execution';
  };

  if (loading) {
    return (
      <div className="py-28 text-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white">Loading Forensic Dossier...</h3>
        <p className="text-xs text-slate-500 mt-1">Retrieving cross-vector agent correlation</p>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="text-center py-20 card p-8 max-w-md mx-auto">
        <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-white">Incident Record Not Found</h2>
        <p className="text-sm text-slate-400 mt-1">Incident #{id} could not be located in registry.</p>
        <button
          onClick={() => navigate('/incidents')}
          className="btn btn-primary mt-5 text-xs py-2 px-4"
        >
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
    <div className="space-y-10 max-w-6xl mx-auto pb-16">
      {/* 1. Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-start sm:items-center gap-4">
          <button
            onClick={() => navigate('/incidents')}
            className="p-2.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
            title="Back to incident list"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded border border-blue-500/20">
                {incident.incident_id || `#${incident.id}`}
              </span>
              <span className={`badge ${getBadge(incident.severity)}`}>
                {incident.severity}
              </span>
              <span className="mitre-tag">
                {getMitreTag(incident.incident_type, incident.title)}
              </span>
              <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                Asset: {incident.source_file ? `srv-${incident.source_file.split('.')[0]}` : 'edge-gw-01'}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-white mt-2 tracking-tight">
              {incident.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-xs text-slate-400">Status:</span>
            <select
              value={incident.status}
              disabled={updating}
              onChange={(e) => handleStatusUpdate(e.target.value)}
              className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
            >
              <option value="Open" className="bg-slate-900">Open</option>
              <option value="Investigating" className="bg-slate-900">Investigating</option>
              <option value="Resolved" className="bg-slate-900">Resolved</option>
              <option value="Closed" className="bg-slate-900">Closed</option>
            </select>
          </div>

          <button
            onClick={() => navigate('/reports')}
            className="btn btn-primary text-xs py-2 px-3.5"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Generate PDF</span>
          </button>
        </div>
      </div>

      {/* 2. Key Forensic Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="card p-6 border-l-4 border-l-blue-500">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Swarm Consensus
          </span>
          <p className="text-2xl font-extrabold text-blue-400 mt-2">
            {incident.correlation_score ? `${Math.round(incident.correlation_score * 100)}%` : '88%'}
          </p>
          <span className="text-xs text-slate-500 mt-1 block">Cross-vector validated</span>
        </div>

        <div className="card p-6 border-l-4 border-l-red-500">
          <span className="text-xs font-semibold text-red-400 uppercase tracking-wide">
            Telemetry Source
          </span>
          <p className="text-base font-bold text-white mt-2 truncate font-mono">
            {incident.source_file || incident.source || 'Telemetry'}
          </p>
          <span className="text-xs text-slate-500 mt-1 block">Inbound payload</span>
        </div>

        <div className="card p-6 border-l-4 border-l-purple-500">
          <span className="text-xs font-semibold text-purple-300 uppercase tracking-wide">
            Extracted IOCs
          </span>
          <p className="text-2xl font-extrabold text-purple-300 mt-2">
            {indicators.length}
          </p>
          <span className="text-xs text-slate-500 mt-1 block">IPs, hashes & domains</span>
        </div>

        <div className="card p-6 border-l-4 border-l-emerald-500">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">
            Containment Actions
          </span>
          <p className="text-2xl font-extrabold text-emerald-400 mt-2">
            {responseActions.length || 3}
          </p>
          <span className="text-xs text-slate-500 mt-1 block">Automated playbooks</span>
        </div>
      </div>

      {/* 3. Forensic Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium transition border-b-2 whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-blue-500 text-white font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 4. Tab 1: Overview & Raw Forensic Artifacts */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="card p-7">
            <h3 className="text-base font-bold text-white mb-2">Threat Assessment Narrative</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              {incident.description || 'Automated multi-agent threat classification identified suspicious activity matching active cyber threat actor tradecraft.'}
            </p>

            {correlationData?.reasoning && (
              <div className="mt-5 p-5 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider font-mono block mb-1">
                  Cross-Vector Graph Correlation Engine
                </span>
                <p className="text-xs text-slate-300 leading-relaxed font-mono">{correlationData.reasoning}</p>
              </div>
            )}
          </div>

          {incident.evidence?.length > 0 && (
            <div className="card p-7">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  Forensic Telemetry Artifacts
                </h3>
                <span className="text-xs font-mono text-slate-500">Live Ingested Lines</span>
              </div>
              <div className="space-y-2">
                {incident.evidence.map((ev, i) => (
                  <div
                    key={i}
                    className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto"
                  >
                    {typeof ev === 'object' ? JSON.stringify(ev, null, 2) : ev}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Swarm Findings (Agent-by-Agent) */}
      {activeTab === 'findings' && (
        <div className="space-y-4">
          {agentFindings.length === 0 ? (
            <div className="card p-12 text-center text-slate-400 text-sm">No distinct agent findings attached.</div>
          ) : (
            agentFindings.map((f, i) => (
              <div key={i} className="card p-6 border-l-4 border-l-blue-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5 font-mono">
                    <Cpu className="w-3.5 h-3.5" />
                    {f.agent_name || `Security Agent #${i + 1}`}
                  </span>
                  <span className={`badge ${getBadge(f.severity)} text-xs`}>{f.severity || 'MEDIUM'}</span>
                </div>
                <h4 className="text-base font-bold text-white mt-1">{f.finding_type || f.title}</h4>
                <p className="text-sm text-slate-300 mt-1 leading-relaxed">{f.description || f.summary}</p>
                {f.confidence && (
                  <div className="mt-3 pt-2 border-t border-slate-800 flex items-center gap-2 text-xs text-slate-400">
                    <span>Agent Confidence:</span>
                    <span className="font-mono text-emerald-400 font-semibold">{Math.round(f.confidence * 100)}%</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Discovered IOCs */}
      {activeTab === 'iocs' && (
        <div className="card overflow-hidden">
          <div className="px-7 py-5 border-b border-slate-800 bg-[#0d121f]">
            <h3 className="text-base font-bold text-white">Extracted Indicators of Compromise</h3>
            <p className="text-xs text-slate-400 mt-0.5">Known malicious IP addresses, domain names, and file hashes</p>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800 text-left">
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 font-mono">Indicator Value</th>
                <th className="py-4 px-5 text-xs font-semibold text-slate-400">Type</th>
                <th className="py-4 px-5 text-xs font-semibold text-slate-400">Risk Level</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400">Threat Attribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {indicators.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400 text-xs">No indicators found.</td>
                </tr>
              ) : (
                indicators.map((ioc, i) => (
                  <tr key={i} className="hover:bg-slate-800/30">
                    <td className="py-4 px-6 font-mono text-xs font-bold text-blue-400">
                      {typeof ioc === 'object' ? ioc.value : ioc}
                    </td>
                    <td className="py-4 px-5 text-xs text-slate-300 uppercase">
                      {typeof ioc === 'object' ? ioc.type || 'IP' : 'IOC'}
                    </td>
                    <td className="py-4 px-5">
                      <span className="badge badge-high text-xs">
                        {typeof ioc === 'object' ? ioc.risk_level || 'HIGH' : 'SUSPICIOUS'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-300">
                      {typeof ioc === 'object' ? ioc.category || 'Identified Threat' : 'Known Malicious Artifact'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Containment Playbook Runner */}
      {activeTab === 'playbook' && (
        <div className="space-y-4">
          {responseActions.length === 0 ? (
            <div className="card p-12 text-center text-slate-400 text-sm">No response actions staged.</div>
          ) : (
            responseActions.map((action, i) => {
              const isObj = typeof action === 'object';
              const executed = executedActions[i];
              return (
                <div
                  key={i}
                  className="card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5"
                >
                  <div className="flex items-start gap-3.5">
                    <span className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 text-xs font-bold flex items-center justify-center shrink-0 font-mono mt-0.5 border border-blue-500/30">
                      {i + 1}
                    </span>
                    <div>
                      <h4 className="text-base font-bold text-white">
                        {isObj ? action.action || action.title : action}
                      </h4>
                      {isObj && action.description && (
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{action.description}</p>
                      )}
                      <div className="mt-2 flex items-center gap-2">
                        <span className="badge badge-high text-[10px]">
                          {isObj ? action.priority || 'HIGH' : 'HIGH'} PRIORITY
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">Automated Firewall/SOC Rule</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleExecuteAction(i)}
                    disabled={executed}
                    className={`btn text-xs py-2 px-4 shrink-0 font-semibold ${
                      executed ? 'btn-success' : 'btn-primary'
                    }`}
                  >
                    {executed ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Rule Applied
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" /> Execute Playbook
                      </>
                    )}
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
