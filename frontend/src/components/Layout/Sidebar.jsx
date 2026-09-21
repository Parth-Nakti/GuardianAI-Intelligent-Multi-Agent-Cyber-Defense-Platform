import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Upload, AlertTriangle, Bot,
  FileText, ChevronLeft, ChevronRight, Shield, Activity, Cpu, Sparkles
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function Sidebar({ collapsed, onToggle }) {
  const { isDark } = useTheme();

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'SOC Dashboard', tag: '01' },
    { to: '/analyze', icon: Upload, label: 'Threat Scanner', tag: '02' },
    { to: '/incidents', icon: AlertTriangle, label: 'Incidents Queue', tag: '03' },
    { to: '/agents', icon: Bot, label: 'AI Swarm Monitor', tag: '04' },
    { to: '/reports', icon: FileText, label: 'Audit Reports', tag: '05' },
  ];

  return (
    <aside
      className={`h-screen flex flex-col border-r transition-all duration-300 shrink-0 select-none z-30 shadow-xl ${
        collapsed ? 'w-[72px]' : 'w-[260px]'
      }`}
      style={{
        backgroundColor: 'var(--bg-sidebar)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      {/* Brand Header */}
      <div
        className="px-5 border-b flex items-center justify-between"
        style={{
          height: '72px',
          borderColor: 'var(--border-subtle)'
        }}
      >
        <div className="flex items-center gap-3.5 overflow-hidden">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-cyan-500 to-blue-600 shadow-[0_0_18px_rgba(6,182,212,0.35)] text-white shrink-0">
            <Shield className="w-5 h-5 fill-white/20 stroke-[2.2]" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span
                className="font-extrabold text-[15px] tracking-wide"
                style={{
                  fontFamily: 'var(--font-heading)',
                  color: 'var(--text-heading)'
                }}
              >
                SENTINEL AI
              </span>
              <span className="text-[11px] text-cyan-500 font-semibold tracking-wider flex items-center gap-1 mt-0.5">
                <Sparkles className="w-2.5 h-2.5" />
                CYBER DEFENSE SOC
              </span>
            </div>
          )}
        </div>

        <button
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-500 hover:bg-slate-500/10 transition hidden md:flex cursor-pointer"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3.5 py-6 space-y-2 overflow-y-auto">
        {!collapsed && (
          <div
            className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider font-mono"
            style={{ color: 'var(--text-muted)' }}
          >
            Navigation
          </div>
        )}
        {navItems.map(({ to, icon: Icon, label, tag }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `group flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                isActive
                  ? 'bg-cyan-500/15 text-cyan-500 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.12)]'
                  : 'hover:bg-slate-500/10 border border-transparent'
              } ${collapsed ? 'justify-center px-0' : ''}`
            }
            style={({ isActive }) => ({
              color: isActive ? '#06b6d4' : 'var(--text-secondary)'
            })}
          >
            <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
            {!collapsed && (
              <span className="flex items-center justify-between flex-1">
                <span>{label}</span>
                <span
                  className="font-mono text-[11px] px-2 py-0.5 rounded transition"
                  style={{
                    backgroundColor: 'var(--bg-inset)',
                    color: 'var(--text-muted)'
                  }}
                >
                  {tag}
                </span>
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* SOC Station Health Footer */}
      <div
        className="p-4 border-t"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        {!collapsed ? (
          <div
            className="p-3.5 rounded-xl border text-xs"
            style={{
              backgroundColor: 'var(--bg-inset)',
              borderColor: 'var(--border-subtle)'
            }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                </span>
                <span className="text-emerald-500 font-bold tracking-wide text-xs">SWARM ONLINE</span>
              </div>
              <span className="font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>14ms latency</span>
            </div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Consensus Engine: <span className="font-semibold text-emerald-500">Active (7/7)</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center py-2" title="Swarm Engine: 100% Online">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></span>
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
