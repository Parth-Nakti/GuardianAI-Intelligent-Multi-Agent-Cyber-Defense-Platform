import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, AlertTriangle, Bot, Upload, FileText,
  ChevronLeft, ChevronRight, ShieldHalf
} from 'lucide-react';

export default function Sidebar({ collapsed, onToggle, stats }) {
  const incidentCount = stats?.threats_detected ?? null;
  const agentCount = stats?.agents?.length ?? 7;

  // Below the `md` breakpoint the sidebar always renders narrow (icon-only),
  // regardless of the manual toggle, so it never crowds out page content on
  // small screens. At `md` and up, the manual `collapsed` toggle applies as before.
  const expandedVisible = collapsed ? 'hidden' : 'hidden md:flex';
  const expandedVisibleBlock = collapsed ? 'hidden' : 'hidden md:block';
  const narrowNavClasses = `justify-center px-0 ${collapsed ? '' : 'md:justify-start md:px-2.5'}`;

  const sections = [
    {
      label: 'Command',
      items: [
        { to: '/', icon: LayoutDashboard, label: 'Overview' },
        { to: '/incidents', icon: AlertTriangle, label: 'Incidents', count: incidentCount },
        { to: '/agents', icon: Bot, label: 'Agents', count: agentCount },
      ],
    },
    {
      label: 'Operations',
      items: [
        { to: '/analyze', icon: Upload, label: 'Analyze' },
        { to: '/reports', icon: FileText, label: 'Reports' },
      ],
    },
  ];

  return (
    <aside
      className={`h-screen flex flex-col border-r transition-all duration-200 shrink-0 select-none z-30 w-17 ${
        collapsed ? '' : 'md:w-58'
      }`}
      style={{
        backgroundColor: 'var(--bg-sidebar)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      {/* Brand */}
      <div
        className="px-4 border-b flex items-center justify-between shrink-0"
        style={{ height: '64px', borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-accent/15 border border-accent/30 text-accent shrink-0">
            <ShieldHalf className="w-4 h-4" />
          </div>
          <div className={`flex-col leading-tight ${expandedVisible}`}>
            <span className="font-semibold text-[13.5px] tracking-wide text-ink">
              GUARDIAN AI
            </span>
            <span className="text-[10.5px] text-ink-muted font-medium tracking-wider">
              CYBER DEFENSE
            </span>
          </div>
        </div>

        <button
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="p-1 rounded-md text-ink-muted hover:text-accent hover:bg-elevated transition hidden md:flex cursor-pointer"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 overflow-y-auto">
        {sections.map((section, si) => (
          <div key={section.label} className={si > 0 ? 'mt-6' : ''}>
            <div className={`px-2.5 pb-2 text-[10.5px] font-semibold uppercase tracking-wider text-ink-faint ${expandedVisibleBlock}`}>
              {section.label}
            </div>
            <div className="space-y-0.5">
              {section.items.map(({ to, icon: Icon, label, count }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                      isActive ? 'bg-accent/10 text-accent' : 'text-ink-soft hover:bg-elevated hover:text-ink'
                    } ${narrowNavClasses}`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-[2.5px] rounded-full bg-accent" />
                      )}
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className={`items-center justify-between flex-1 ${expandedVisible}`}>
                        <span>{label}</span>
                        {count !== undefined && count !== null && (
                          <span
                            className={`font-mono text-[10.5px] px-1.5 py-0.5 rounded ${
                              isActive ? 'bg-accent/15 text-accent' : 'bg-elevated text-ink-muted'
                            }`}
                          >
                            {count}
                          </span>
                        )}
                      </span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Status Footer */}
      <div className="p-3 border-t shrink-0" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className={`items-center gap-2.5 px-2.5 py-2.5 rounded-lg bg-elevated ${expandedVisible}`}>
          <span className="relative flex h-1.5 w-1.5 shrink-0">
            <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-60" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success" />
          </span>
          <div className="leading-tight">
            <div className="text-[11.5px] font-semibold text-ink-soft">System Operational</div>
            <div className="text-[10.5px] text-ink-faint">7 / 7 agents online</div>
          </div>
        </div>

        <div className={`justify-center py-1.5 ${collapsed ? 'flex' : 'flex md:hidden'}`} title="System Operational · 7/7 agents online">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
          </span>
        </div>
      </div>
    </aside>
  );
}
