import { useLocation } from 'react-router-dom';
import { Globe } from 'lucide-react';
import SearchInput from '../ui/SearchInput';
import StatusBadge from '../ui/StatusBadge';

const PAGE_NAMES = {
  '/': 'Overview',
  '/analyze': 'Analyze',
  '/incidents': 'Incidents',
  '/agents': 'Agents',
  '/reports': 'Reports',
};

function getPageName(pathname) {
  if (PAGE_NAMES[pathname]) return PAGE_NAMES[pathname];
  if (pathname.startsWith('/incidents/')) return 'Incident Detail';
  return 'Overview';
}

export default function TopBar({ stats }) {
  const location = useLocation();
  const critical = stats?.severity?.critical || 0;

  const now = new Date();
  const utc = now.toISOString().slice(11, 19);

  return (
    <header
      className="border-b flex items-center justify-between shrink-0 z-20 bg-surface"
      style={{
        height: '64px',
        paddingLeft: '28px',
        paddingRight: '28px',
        borderColor: 'var(--border-subtle)',
      }}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[13px] font-medium shrink-0 mr-6">
        <span className="text-ink-faint">Guardian AI</span>
        <span className="text-ink-faint">/</span>
        <span className="text-ink">{getPageName(location.pathname)}</span>
      </div>

      {/* Search */}
      <SearchInput placeholder="Search incidents, IPs, hashes..." className="hidden sm:flex flex-1 max-w-md" />

      {/* Right controls */}
      <div className="flex items-center gap-3 text-sm shrink-0">
        <div className="hidden xl:flex items-center gap-1.5 font-mono text-[11.5px] px-2.5 py-1.5 rounded-lg text-ink-faint">
          <Globe className="w-3.5 h-3.5" />
          <span>UTC {utc}</span>
        </div>

        {critical > 0 ? (
          <StatusBadge status={`${critical} Critical`} tone="critical" pill pulse />
        ) : (
          <StatusBadge status="Operational" pill />
        )}

        <div className="flex items-center gap-2.5 pl-3 border-l" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="relative">
            <div className="w-8 h-8 rounded-lg bg-elevated border border-line flex items-center justify-center text-ink text-[11px] font-semibold">
              SA
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-success border-2 border-surface" />
          </div>
          <div className="hidden sm:flex flex-col text-left leading-tight">
            <span className="font-medium text-[12px] text-ink">SOC Analyst</span>
            <span className="text-[10.5px] text-ink-faint">Tier-2</span>
          </div>
        </div>
      </div>
    </header>
  );
}
