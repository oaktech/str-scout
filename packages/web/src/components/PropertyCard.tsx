import { useStore } from '../store';
import MetricBadge from './shared/MetricBadge';
import type { DashboardData } from '../types';

type PropertySummary = DashboardData['properties'][number];

const fmt = (v: number) => `$${Math.round(v).toLocaleString()}`;
const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

const STATUS_STYLES: Record<string, { dot: string; text: string }> = {
  analyzing: { dot: 'bg-gold',    text: 'text-gold-dark' },
  active:    { dot: 'bg-emerald', text: 'text-emerald-dark' },
  sold:      { dot: 'bg-stone',   text: 'text-stone' },
  archived:  { dot: 'bg-stone',   text: 'text-stone' },
};

export default function PropertyCard({ property }: { property: PropertySummary }) {
  const setPage = useStore((s) => s.setPage);
  const compareIds = useStore((s) => s.compareIds);
  const toggleCompare = useStore((s) => s.toggleCompare);
  const isComparing = compareIds.includes(property.id);
  const m = property.metrics;
  const status = STATUS_STYLES[property.status] || STATUS_STYLES.analyzing;

  return (
    <div
      className="bg-white rounded-lg shadow-card hover:shadow-card-hover
                 transition-all duration-300 cursor-pointer group
                 border border-sand/40 hover:border-emerald/20 animate-slide-up"
      onClick={() => setPage({ name: 'property', id: property.id })}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-sand/30">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-serif text-lg text-ink group-hover:text-emerald transition-colors truncate">
              {property.name}
            </h3>
            {property.city && property.state && (
              <p className="text-xs text-stone mt-0.5">{property.city}, {property.state}</p>
            )}
          </div>
          <div className="flex items-center gap-2 ml-3 shrink-0">
            <span className={`flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider ${status.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
              {property.status}
            </span>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="px-5 py-4">
        {m ? (
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-stone font-medium">Cash Flow</span>
              <span className={`font-mono text-base font-medium ${m.monthlyCashFlow >= 0 ? 'text-emerald-dark' : 'text-coral'}`}>
                {fmt(m.monthlyCashFlow)}
                <span className="text-stone text-xs font-normal">/mo</span>
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-sand/30">
              <div>
                <span className="text-[10px] text-stone uppercase tracking-wider block mb-0.5">CoC</span>
                <MetricBadge value={m.cashOnCash} thresholds={{ green: 0.1, yellow: 0.05 }} format={pct} />
              </div>
              <div>
                <span className="text-[10px] text-stone uppercase tracking-wider block mb-0.5">Cap Rate</span>
                <MetricBadge value={m.capRate} thresholds={{ green: 0.08, yellow: 0.05 }} format={pct} />
              </div>
              <div>
                <span className="text-[10px] text-stone uppercase tracking-wider block mb-0.5">DSCR</span>
                <MetricBadge value={m.dscr} thresholds={{ green: 1.5, yellow: 1.0 }} format={(v) => v === Infinity ? '\u221E' : v.toFixed(2)} />
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-stone italic py-2">No financial data yet</p>
        )}
      </div>

      {/* Compare toggle */}
      <div className="px-5 py-2.5 border-t border-sand/30 flex justify-end">
        <button
          onClick={(e) => { e.stopPropagation(); toggleCompare(property.id); }}
          className={`text-[11px] font-medium tracking-wide uppercase transition-colors
            ${isComparing
              ? 'text-emerald'
              : 'text-stone hover:text-ink'
            }`}
          title="Add to comparison"
        >
          {isComparing ? '\u2713 Comparing' : '+ Compare'}
        </button>
      </div>
    </div>
  );
}
