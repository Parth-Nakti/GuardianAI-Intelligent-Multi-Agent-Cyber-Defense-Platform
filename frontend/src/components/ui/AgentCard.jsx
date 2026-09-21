import { Bot } from 'lucide-react';
import StatusBadge from './StatusBadge';

/** Single agent dossier card: identity, live status, current activity, skill tags, precision/task tally. */
export default function AgentCard({ agent, info, isSelected, onSelect }) {
  const Icon = info.icon || Bot;
  const isOnline = agent.status === 'online';

  return (
    <div
      onClick={onSelect}
      className={`card p-5 cursor-pointer flex flex-col justify-between transition-colors ${
        isSelected ? 'border-accent/50 bg-elevated' : ''
      }`}
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${
            isSelected ? 'bg-accent/15 text-accent border-accent/30' : 'bg-elevated text-ink-muted border-line'
          }`}>
            <Icon className="w-4 h-4" />
          </div>
          <StatusBadge status={isOnline ? 'Online' : (agent.status || 'Idle')} pill pulse={isOnline} />
        </div>

        <h3 className="text-[14px] font-semibold text-ink">{agent.name}</h3>
        <p className="text-[12px] text-ink-muted mt-1 line-clamp-2 leading-relaxed">
          {agent.description || info.role}
        </p>

        <div className="mt-3 p-2 rounded-lg bg-elevated border border-line flex items-center justify-between text-[11px] font-mono">
          <span className="text-ink-muted truncate">{agent.last_task_status || 'idle'}</span>
          <span className="text-accent font-semibold shrink-0">{info.latency}</span>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-3">
          {info.skills.map((skill, i) => (
            <span key={i} className="text-[10.5px] px-2 py-0.5 rounded-md bg-elevated text-ink-soft border border-line font-medium">
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-line flex items-center justify-between text-[11.5px] text-ink-muted">
        <span>Precision: <strong className="text-ink font-mono">{info.precision}</strong></span>
        <span>Tasks: <strong className="text-accent font-mono">{agent.total_analyses ?? 0}</strong></span>
      </div>
    </div>
  );
}
