import { useStore } from '../store';
import { useDashboard } from '../hooks/useProperties';
import MetricCard from './shared/MetricCard';
import PropertyCard from './PropertyCard';
import LoadingSpinner from './shared/LoadingSpinner';

const fmt = (v: number) => `$${Math.round(v).toLocaleString()}`;
const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

function metricColor(value: number, green: number, yellow: number, invert = false): 'green' | 'yellow' | 'red' | 'default' {
  if (invert) return value < green ? 'green' : value < yellow ? 'yellow' : 'red';
  return value > green ? 'green' : value > yellow ? 'yellow' : 'red';
}

export default function Dashboard() {
  const setPage = useStore((s) => s.setPage);
  const { data, loading } = useDashboard();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!data) {
    return <div className="text-scout-drift text-center py-12 font-body">Failed to load dashboard</div>;
  }

  const { portfolio, properties } = data;

  return (
    <div>
      {/* Header */}
      <div className="flex items-end justify-between mb-8 animate-fade-up">
        <div>
          <h2 className="font-display text-3xl text-scout-bone">Portfolio Overview</h2>
          <div className="divider mt-3 w-24" />
        </div>
        <button
          onClick={() => setPage({ name: 'add-property' })}
          className="bg-scout-mint/10 border border-scout-mint/20 text-scout-mint hover:bg-scout-mint/20
                     px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
        >
          + Add Property
        </button>
      </div>

      {/* Portfolio summary cards */}
      {portfolio.propertyCount > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 animate-fade-up stagger-1">
          <MetricCard label="Properties" value={String(portfolio.propertyCount)} />
          <MetricCard label="Annual Revenue" value={fmt(portfolio.totalRevenue)} />
          <MetricCard
            label="Annual Cash Flow"
            value={fmt(portfolio.totalCashFlow)}
            color={portfolio.totalCashFlow > 0 ? 'green' : 'red'}
          />
          <MetricCard
            label="Portfolio CoC"
            value={pct(portfolio.cashOnCash)}
            color={metricColor(portfolio.cashOnCash, 0.1, 0.05)}
          />
        </div>
      )}

      {/* Section divider */}
      {portfolio.propertyCount > 0 && (
        <div className="flex items-center gap-4 mb-6 animate-fade-up stagger-2">
          <h3 className="text-[11px] text-scout-drift uppercase tracking-[0.15em] font-medium shrink-0">Properties</h3>
          <div className="divider flex-1" />
        </div>
      )}

      {/* Property grid */}
      {properties.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-scout-ash rounded-lg animate-fade-up stagger-2">
          <p className="text-scout-fossil font-display text-xl mb-3">No properties yet</p>
          <p className="text-scout-drift text-sm mb-5">Add your first property to start analyzing</p>
          <button
            onClick={() => setPage({ name: 'add-property' })}
            className="text-scout-mint hover:text-scout-bone text-sm transition-colors"
          >
            Add your first property &rarr;
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((p, i) => (
            <div key={p.id} className={`animate-fade-up stagger-${Math.min(i + 2, 8)}`}>
              <PropertyCard property={p} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
