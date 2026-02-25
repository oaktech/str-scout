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
    <div className="flex h-screen grain">
      {/* Sidebar */}
      <aside className="w-56 bg-scout-soot border-r border-scout-ash flex flex-col shrink-0">
        <div className="p-5 border-b border-scout-ash">
          <h1
            className="font-display text-xl text-scout-bone cursor-pointer hover:text-scout-mint transition-colors"
            onClick={() => setPage({ name: 'dashboard' })}
          >
            STR-Scout
          </h1>
          <p className="text-[10px] text-scout-drift uppercase tracking-[0.15em] mt-0.5 font-medium">Investment Analyzer</p>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive = page.name === item.page.name;
            return (
              <button
                key={item.label}
                onClick={() => setPage(item.page)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all duration-150
                  ${isActive
                    ? 'bg-scout-mint/8 text-scout-mint border-l-2 border-scout-mint pl-[10px]'
                    : 'text-scout-fossil hover:text-scout-chalk hover:bg-scout-carbon'}`}
              >
                {item.label}
                {item.page.name === 'compare' && compareIds.length > 0 && (
                  <span className="ml-2 bg-scout-mint/15 text-scout-mint text-[10px] px-1.5 py-0.5 rounded-full font-mono font-medium">
                    {compareIds.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-scout-ash">
          <p className="text-[10px] text-scout-flint font-mono">v0.1.0</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-scout-void">
        <div className="max-w-6xl mx-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
