import { useStore } from '../store';
import type { Page } from '../types';

const navItems: { label: string; page: Page }[] = [
  { label: 'Dashboard', page: { name: 'dashboard' } },
  { label: 'Add Property', page: { name: 'add-property' } },
  { label: 'Compare', page: { name: 'compare' } },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const page = useStore((s) => s.page);
  const setPage = useStore((s) => s.setPage);
  const compareIds = useStore((s) => s.compareIds);

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-56 bg-scout-surface border-r border-scout-border flex flex-col shrink-0">
        <div className="p-4 border-b border-scout-border">
          <h1
            className="text-lg font-bold text-scout-accent cursor-pointer"
            onClick={() => setPage({ name: 'dashboard' })}
          >
            STR-Scout
          </h1>
          <p className="text-xs text-scout-muted mt-0.5">Investment Analyzer</p>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => {
            const isActive = page.name === item.page.name;
            return (
              <button
                key={item.label}
                onClick={() => setPage(item.page)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
                  ${isActive ? 'bg-scout-accent/10 text-scout-accent' : 'text-scout-muted hover:text-white hover:bg-white/5'}`}
              >
                {item.label}
                {item.page.name === 'compare' && compareIds.length > 0 && (
                  <span className="ml-2 bg-scout-accent/20 text-scout-accent text-xs px-1.5 py-0.5 rounded">
                    {compareIds.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
