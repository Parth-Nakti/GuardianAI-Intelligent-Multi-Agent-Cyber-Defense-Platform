/** Shared page-level header: title (+ optional inline badge), subtitle, right-aligned actions. */
export default function PageHeader({ title, badge, description, actions }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-line">
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-[26px] font-semibold tracking-tight text-ink">{title}</h1>
          {badge}
        </div>
        {description && <p className="text-[13px] mt-1 text-ink-muted">{description}</p>}
      </div>

      {actions && <div className="flex items-center gap-3 flex-wrap">{actions}</div>}
    </div>
  );
}
