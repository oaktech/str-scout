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
    return <div className="text-scout-muted text-center py-12">Failed to load dashboard</div>;
  }

  const { portfolio, properties } = data;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Portfolio Overview</h2>
        <button
          onClick={() => setPage({ name: 'add-property' })}
          className="bg-scout-accent hover:bg-scout-accent/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Add Property
        </button>
      </div>

      {/* Portfolio summary cards */}
      {portfolio.propertyCount > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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

      {/* Property grid */}
      {properties.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-scout-border rounded-lg">
          <p className="text-scout-muted mb-3">No properties yet</p>
          <button
            onClick={() => setPage({ name: 'add-property' })}
            className="text-scout-accent hover:underline text-sm"
          >
            Add your first property
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      )}
    </div>
  );
}
