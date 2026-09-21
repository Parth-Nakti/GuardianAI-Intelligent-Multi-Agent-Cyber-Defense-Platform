function severityClass(severity) {
  const sev = (severity || '').toLowerCase();
  if (sev.includes('critical')) return 'badge-critical';
  if (sev.includes('high')) return 'badge-high';
  if (sev.includes('medium')) return 'badge-medium';
  return 'badge-low';
}

/** Compact critical/high/medium/low badge — colored dot (via CSS) + text, shared across every table and card. */
export default function SeverityBadge({ severity, className = '' }) {
  return <span className={`badge ${severityClass(severity)} ${className}`}>{severity}</span>;
}
