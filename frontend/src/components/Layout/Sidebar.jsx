import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Upload, AlertTriangle, Bot,
  FileText, ChevronLeft, ChevronRight, Shield, Activity
} from 'lucide-react';

export default function Sidebar({ collapsed, onToggle }) {
  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/analyze', icon: Upload, label: 'Threat Scanner' },
    { to: '/incidents', icon: AlertTriangle, label: 'Incidents' },
    { to: '/agents', icon: Bot, label: 'AI Swarm' },
    { to: '/reports', icon: FileText, label: 'Reports' },
  ];

  return (
    <aside
      className={`h-screen flex flex-col border-r border-slate-800/90 bg-[#0d1322] transition-all duration-200 shrink-0 select-none z-20 ${
        collapsed ? 'w-[72px]' : 'w-[240px]'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 border-b border-slate-800/90 flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shrink-0 shadow-md shadow-blue-600/20 border border-blue-400/30">
            <Shield className="w-5 h-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-base text-white tracking-tight leading-tight">
                SentinelAI
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                Cyber Defense Platform
              </span>
            </div>
          )}
        </div>

        <button
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/80 transition hidden md:flex"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[14px] font-medium transition ${
                isActive
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
              } ${collapsed ? 'justify-center px-0' : ''}`
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* SOC Station Health Footer */}
      <div className="p-3 border-t border-slate-800/90 bg-[#0a0f1c]">
        {!collapsed ? (
          <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-300 font-medium">SOC Engine Online</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">14ms</span>
          </div>
        ) : (
          <div className="flex justify-center py-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>
        )}
      </div>
    </aside>
  );
}
