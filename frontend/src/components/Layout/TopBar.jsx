import { Search, AlertTriangle, ShieldCheck, User } from 'lucide-react';

export default function TopBar({ stats }) {
  const threats = stats?.threats_detected || 0;
  const critical = stats?.severity?.critical || 0;

  return (
    <header className="h-14 px-6 border-b border-slate-800/90 bg-[#0c1220]/90 backdrop-blur-md flex items-center justify-between shrink-0 z-10">
      {/* Search Input */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search threats, incidents, IP addresses... (⌘K)"
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition"
          />
        </div>
      </div>

      {/* Right Telemetry Controls & Analyst Profile */}
      <div className="flex items-center gap-4">
        {critical > 0 ? (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{critical} Critical Alert</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Telemetry Normal</span>
          </div>
        )}

        <div className="text-xs text-slate-400 border-l border-slate-800 pl-4">
          Active Threats: <strong className="text-white font-bold">{threats}</strong>
        </div>

        {/* Analyst Pill */}
        <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
            SOC
          </div>
          <span className="hidden sm:inline text-xs font-medium text-slate-300">
            SOC Analyst
          </span>
        </div>
      </div>
    </header>
  );
}
