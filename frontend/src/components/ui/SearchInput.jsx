import { Search } from 'lucide-react';

/** Shared search field: dark surface, subtle border, muted placeholder, cyan focus ring. */
export default function SearchInput({ value, onChange, placeholder = 'Search...', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-ink-faint" />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-9 pr-3 py-2 rounded-lg bg-surface border border-line text-[13px] text-ink placeholder-ink-faint transition focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent/50"
      />
    </div>
  );
}
