import { useStore } from '../store';
import MetricBadge from './shared/MetricBadge';
import type { DashboardData } from '../types';

type PropertySummary = DashboardData['properties'][number];

const fmt = (v: number) => `$${Math.round(v).toLocaleString()}`;
const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

const STATUS_STYLES: Record<string, string> = {
  analyzing: 'bg-scout-blue/10 text-scout-blue border border-scout-blue/20',
  active: 'bg-scout-mint/10 text-scout-mint border border-scout-mint/20',
  sold: 'bg-scout-fossil/10 text-scout-fossil border border-scout-fossil/20',
  archived: 'bg-scout-flint/10 text-scout-drift border border-scout-flint/20',
};

export default function PropertyCard({ property }: { property: PropertySummary }) {
  const setPage = useStore((s) => s.setPage);
  const compareIds = useStore((s) => s.compareIds);
  const toggleCompare = useStore((s) => s.toggleCompare);
  const isComparing = compareIds.includes(property.id);
  const m = property.metrics;

  return (
    <div
      className="bg-scout-carbon border border-scout-ash rounded-lg p-5 hover:border-scout-mint/30
                 transition-all duration-200 cursor-pointer group hover:shadow-lg hover:shadow-scout-mint/[0.03]"
      onClick={() => setPage({ name: 'property', id: property.id })}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-display text-lg text-scout-bone group-hover:text-scout-mint transition-colors">
            {property.name}
          </h3>
          {property.city && property.state && (
            <p className="text-[11px] text-scout-drift mt-0.5">{property.city}, {property.state}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[property.status] || STATUS_STYLES.analyzing}`}>
            {property.status}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); toggleCompare(property.id); }}
            className={`w-5 h-5 rounded border text-xs flex items-center justify-center transition-all duration-150
              ${isComparing
                ? 'bg-scout-mint border-scout-mint text-scout-void'
                : 'border-scout-flint text-scout-drift hover:border-scout-mint hover:text-scout-mint'}`}
            title="Add to comparison"
          >
            {isComparing ? '\u2713' : '+'}
          </button>
        </div>
      </div>

      {m ? (
        <>
          <div className="divider mb-3" />
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-[10px] text-scout-drift uppercase tracking-[0.08em]">Cash Flow</span>
              <div className={`font-mono text-sm mt-0.5 ${m.monthlyCashFlow >= 0 ? 'text-scout-mint' : 'text-scout-rose'}`}>
                {fmt(m.monthlyCashFlow)}/mo
              </div>
            </div>
            <div>
              <span className="text-[10px] text-scout-drift uppercase tracking-[0.08em]">CoC Return</span>
              <div className="mt-0.5">
                <MetricBadge value={m.cashOnCash} thresholds={{ green: 0.1, yellow: 0.05 }} format={pct} />
              </div>
            </div>
            <div>
              <span className="text-[10px] text-scout-drift uppercase tracking-[0.08em]">Cap Rate</span>
              <div className="mt-0.5">
                <MetricBadge value={m.capRate} thresholds={{ green: 0.08, yellow: 0.05 }} format={pct} />
              </div>
            </div>
            <div>
              <span className="text-[10px] text-scout-drift uppercase tracking-[0.08em]">DSCR</span>
              <div className="mt-0.5">
                <MetricBadge value={m.dscr} thresholds={{ green: 1.5, yellow: 1.0 }} format={(v) => v === Infinity ? '\u221E' : v.toFixed(2)} />
              </div>
            </div>
          </div>
        </>
      ) : (
        <p className="text-xs text-scout-drift italic">No financial data yet</p>
      )}
    </div>
  );
}
