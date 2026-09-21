import { Search, AlertTriangle, ShieldCheck, User, Globe, Radio, Bell, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function TopBar({ stats }) {
  const { theme, isDark, toggleTheme } = useTheme();
  const threats = stats?.threats_detected || 0;
  const critical = stats?.severity?.critical || 0;

  const now = new Date();
  const utc = now.toISOString().slice(11, 19);

  return (
    <header
      className="border-b flex items-center justify-between shrink-0 z-20 transition-colors duration-200"
      style={{
        height: '72px',
        paddingLeft: '32px',
        paddingRight: '32px',
        backgroundColor: 'var(--bg-topbar)',
        borderColor: 'var(--border-subtle)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)'
      }}
    >
      {/* Search Bar */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
          <input
            type="text"
            placeholder="Search IOCs, malicious IPs, hashes, incidents..."
            className="w-full pl-11 pr-12 py-2.5 rounded-xl text-sm transition shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-subtle)',
              borderWidth: '1px',
              color: 'var(--text-primary)'
            }}
          />
          <kbd
            className="absolute right-3.5 top-1/2 -translate-y-1/2 px-2 py-0.5 text-xs font-mono rounded border pointer-events-none"
            style={{
              backgroundColor: 'var(--bg-inset)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-muted)'
            }}
          >
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Controls & Telemetry Indicators */}
      <div className="flex items-center gap-4 text-sm">
        {/* UTC Clock */}
        <div
          className="hidden xl:flex items-center gap-2 font-mono text-xs px-3.5 py-2 rounded-xl border"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-secondary)'
          }}
        >
          <Globe className="w-4 h-4 text-cyan-500" />
          <span>UTC {utc}</span>
        </div>

        {/* Threat Status Pill */}
        {critical > 0 ? (
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 font-bold shadow-sm animate-pulse">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <span className="text-xs">{critical} CRITICAL ALERTS</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 font-bold shadow-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="hidden sm:inline text-xs">PERIMETER NOMINAL</span>
          </div>
        )}

        {/* Threats Counter Pill */}
        <div
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-secondary)'
          }}
        >
          <span>Threats:</span>
          <span className="font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-500 border border-cyan-500/30 text-xs">
            {threats}
          </span>
        </div>

        {/* Dark / Day Mode Toggle Button */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'Switch to Day / Light Mode' : 'Switch to Cyber Dark Mode'}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl border transition group cursor-pointer shadow-sm hover:scale-105 active:scale-95"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-primary)'
          }}
        >
          {isDark ? (
            <>
              <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform" />
              <span className="text-xs font-bold text-amber-300">Day Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-600 group-hover:-rotate-12 transition-transform" />
              <span className="text-xs font-bold text-slate-700">Dark Mode</span>
            </>
          )}
        </button>

        {/* Analyst Profile Chip */}
        <div
          className="flex items-center gap-3 pl-3 border-l"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-cyan-500/20 ring-2 ring-cyan-500/30">
              SA
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white dark:border-[#090f1f]"></span>
          </div>
          <div className="hidden sm:flex flex-col text-left leading-tight">
            <span className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>SOC Analyst</span>
            <span className="text-[11px] font-mono text-cyan-500">Tier-2 Swarm</span>
          </div>
        </div>
      </div>
    </header>
  );
}
