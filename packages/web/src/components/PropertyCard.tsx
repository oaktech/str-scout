import { useStore } from '../store';
import MetricBadge from './shared/MetricBadge';
import type { DashboardData } from '../types';

type PropertySummary = DashboardData['properties'][number];

const fmt = (v: number) => `$${Math.round(v).toLocaleString()}`;
const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

const STATUS_COLORS: Record<string, string> = {
  analyzing: 'bg-blue-500/20 text-blue-400',
  active: 'bg-green-500/20 text-green-400',
  sold: 'bg-gray-500/20 text-gray-400',
  archived: 'bg-gray-500/20 text-gray-400',
};

export default function PropertyCard({ property }: { property: PropertySummary }) {
  const setPage = useStore((s) => s.setPage);
  const compareIds = useStore((s) => s.compareIds);
  const toggleCompare = useStore((s) => s.toggleCompare);
  const isComparing = compareIds.includes(property.id);
  const m = property.metrics;

  return (
    <div
      className="bg-scout-surface border border-scout-border rounded-lg p-4 hover:border-scout-accent/50
                 transition-colors cursor-pointer group"
      onClick={() => setPage({ name: 'property', id: property.id })}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-white group-hover:text-scout-accent transition-colors">
            {property.name}
          </h3>
          {property.city && property.state && (
            <p className="text-xs text-scout-muted">{property.city}, {property.state}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[property.status] || STATUS_COLORS.analyzing}`}>
            {property.status}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); toggleCompare(property.id); }}
            className={`w-5 h-5 rounded border text-xs flex items-center justify-center transition-colors
              ${isComparing ? 'bg-scout-accent border-scout-accent text-white' : 'border-scout-border text-scout-muted hover:border-scout-accent'}`}
            title="Add to comparison"
          >
            {isComparing ? '\u2713' : '+'}
          </button>
        </div>
      </div>

      {m ? (
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-scout-muted text-xs">Cash Flow</span>
            <div className={`font-mono ${m.monthlyCashFlow >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {fmt(m.monthlyCashFlow)}/mo
            </div>
          </div>
          <div>
            <span className="text-scout-muted text-xs">CoC Return</span>
            <div>
              <MetricBadge value={m.cashOnCash} thresholds={{ green: 0.1, yellow: 0.05 }} format={pct} />
            </div>
          </div>
          <div>
            <span className="text-scout-muted text-xs">Cap Rate</span>
            <div>
              <MetricBadge value={m.capRate} thresholds={{ green: 0.08, yellow: 0.05 }} format={pct} />
            </div>
          </div>
          <div>
            <span className="text-scout-muted text-xs">DSCR</span>
            <div>
              <MetricBadge value={m.dscr} thresholds={{ green: 1.5, yellow: 1.0 }} format={(v) => v === Infinity ? '\u221E' : v.toFixed(2)} />
            </div>
          </div>
        </div>
      ) : (
        <p className="text-xs text-scout-muted italic">No financial data yet</p>
      )}
    </div>
  );
}
