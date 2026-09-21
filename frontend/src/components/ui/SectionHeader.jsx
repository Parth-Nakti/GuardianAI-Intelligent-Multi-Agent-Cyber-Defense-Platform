/** Small uppercase section label, optionally numbered, with trailing meta text. */
export default function SectionHeader({ step, label, meta }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-[13px] font-semibold uppercase tracking-wider text-ink-muted flex items-center gap-2">
        {step && (
          <span className="w-4 h-4 rounded-full bg-accent/10 border border-accent/25 flex items-center justify-center text-accent text-[10px] font-semibold">
            {step}
          </span>
        )}
        {label}
      </h2>
      {meta && <span className="text-[12px] text-ink-faint">{meta}</span>}
    </div>
  );
}
