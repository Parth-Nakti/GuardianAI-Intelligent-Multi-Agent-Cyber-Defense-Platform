const ACCENT_CLASSES = {
  accent: 'text-accent',
  ai: 'text-ai',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  ink: 'text-ink',
};

export default function StatCard({ label, value, subtext, tag, icon: Icon, accent = 'ink' }) {
  const valueClass = ACCENT_CLASSES[accent] || ACCENT_CLASSES.ink;

  return (
    <div className="card p-5 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
          {label}
        </span>
        {Icon && (
          <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-elevated text-ink-muted shrink-0">
            <Icon className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      <div className={`text-[30px] font-semibold font-mono tracking-tight leading-none ${valueClass}`}>
        {value}
      </div>

      {(subtext || tag) && (
        <div className="flex items-center justify-between text-[12px] pt-3 mt-3 border-t border-line gap-2">
          {subtext && <span className="text-ink-muted truncate">{subtext}</span>}
          {tag && <span className={`font-medium shrink-0 ${valueClass}`}>{tag}</span>}
        </div>
      )}
    </div>
  );
}
