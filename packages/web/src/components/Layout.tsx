import { useStore } from '../store';
import type { Page } from '../types';

const navItems: { label: string; page: Page; icon: string }[] = [
  { label: 'Portfolio', page: { name: 'dashboard' }, icon: 'grid' },
  { label: 'New Property', page: { name: 'add-property' }, icon: 'plus' },
  { label: 'Compare', page: { name: 'compare' }, icon: 'columns' },
];

const icons: Record<string, JSX.Element> = {
  grid: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1.5" y="1.5" width="5" height="5" rx="1" />
      <rect x="9.5" y="1.5" width="5" height="5" rx="1" />
      <rect x="1.5" y="9.5" width="5" height="5" rx="1" />
      <rect x="9.5" y="9.5" width="5" height="5" rx="1" />
    </svg>
  ),
  plus: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="8" y1="3" x2="8" y2="13" /><line x1="3" y1="8" x2="13" y2="8" />
    </svg>
  ),
  columns: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1.5" y="1.5" width="5" height="13" rx="1" />
      <rect x="9.5" y="1.5" width="5" height="13" rx="1" />
    </svg>
  ),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const page = useStore((s) => s.page);
  const setPage = useStore((s) => s.setPage);
  const compareIds = useStore((s) => s.compareIds);

  return (
    <div className="flex h-screen grain">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-sand/70 flex flex-col shrink-0">
        {/* Brand */}
        <div className="px-5 pt-6 pb-5">
          <h1
            className="font-serif text-2xl text-ink cursor-pointer tracking-tight leading-none"
            onClick={() => setPage({ name: 'dashboard' })}
          >
            STR Scout
          </h1>
          <p className="font-serif italic text-stone text-sm mt-0.5">Investment Analyzer</p>
        </div>

        {/* Divider */}
        <div className="mx-5 border-t border-sand/60" />

        {/* Navigation */}
        <nav className="flex-1 px-3 pt-4 space-y-0.5">
          {navItems.map((item) => {
            const isActive = page.name === item.page.name;
            return (
              <button
                key={item.label}
                onClick={() => setPage(item.page)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-150
                  ${isActive
                    ? 'bg-emerald/[0.07] text-emerald'
                    : 'text-walnut hover:text-ink hover:bg-parchment/60'
                  }`}
              >
                <span className={isActive ? 'text-emerald' : 'text-stone'}>
                  {icons[item.icon]}
                </span>
                {item.label}
                {item.page.name === 'compare' && compareIds.length > 0 && (
                  <span className="ml-auto bg-emerald text-white text-[10px] font-semibold w-4.5 h-4.5 flex items-center justify-center rounded-full min-w-[18px] min-h-[18px]">
                    {compareIds.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-5 py-4 border-t border-sand/40">
          <p className="text-[10px] tracking-widest uppercase text-stone/70 font-medium">
            STR Scout v0.1.0
          </p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-cream">
        <div className="max-w-[1100px] mx-auto px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
