const STATUS_STYLES = {
  active: { dot: 'bg-success', text: 'text-success', bg: 'bg-success/10', border: 'border-success/25' },
  online: { dot: 'bg-success', text: 'text-success', bg: 'bg-success/10', border: 'border-success/25' },
  operational: { dot: 'bg-success', text: 'text-success', bg: 'bg-success/10', border: 'border-success/25' },
  resolved: { dot: 'bg-success', text: 'text-success', bg: 'bg-success/10', border: 'border-success/25' },
  monitoring: { dot: 'bg-accent', text: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/25' },
  live: { dot: 'bg-accent', text: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/25' },
  investigating: { dot: 'bg-accent', text: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/25' },
  open: { dot: 'bg-ai', text: 'text-ai', bg: 'bg-ai/10', border: 'border-ai/25' },
  critical: { dot: 'bg-danger', text: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/25' },
  danger: { dot: 'bg-danger', text: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/25' },
  warning: { dot: 'bg-warning', text: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/25' },
  offline: { dot: 'bg-ink-faint', text: 'text-ink-muted', bg: 'bg-elevated', border: 'border-line' },
  idle: { dot: 'bg-ink-faint', text: 'text-ink-muted', bg: 'bg-elevated', border: 'border-line' },
  closed: { dot: 'bg-ink-faint', text: 'text-ink-muted', bg: 'bg-elevated', border: 'border-line' },
};

const DEFAULT_STYLE = { dot: 'bg-ink-faint', text: 'text-ink-muted', bg: 'bg-elevated', border: 'border-line' };

/** Consistent "dot + text" status indicator — never relies on color alone.
 *  `tone` overrides the style lookup when `status` is a free-form label (e.g. "3 Critical"). */
export default function StatusBadge({ status, tone, pill = false, pulse = false }) {
  const style = STATUS_STYLES[(tone || status || '').toLowerCase()] || DEFAULT_STYLE;
  const dot = <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot} ${pulse ? 'pulse-dot' : ''}`} />;

  if (pill) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${style.bg} ${style.border} ${style.text}`}>
        {dot}
        {status}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${style.text}`}>
      {dot}
      {status}
    </span>
  );
}
