import { useStore } from '../store';
import { useDashboard } from '../hooks/useProperties';
import MetricCard from './shared/MetricCard';
import PropertyCard from './PropertyCard';
import LoadingSpinner from './shared/LoadingSpinner';

const fmt = (v: number) => `$${Math.round(v).toLocaleString()}`;
const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

function metricColor(value: number, green: number, yellow: number): 'green' | 'yellow' | 'red' | 'default' {
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
    return <div className="text-stone text-center py-16">Failed to load dashboard</div>;
  }

  const { portfolio, properties } = data;

  return (
    <div className="animate-fade-in">
      {/* Page header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <h2 className="font-serif text-4xl text-ink tracking-tight">Portfolio</h2>
          <p className="font-serif italic text-stone text-lg mt-1">
            {portfolio.propertyCount > 0
              ? `${portfolio.propertyCount} ${portfolio.propertyCount === 1 ? 'property' : 'properties'} under management`
              : 'Your investment portfolio'}
          </p>
        </div>
        <button
          onClick={() => setPage({ name: 'add-property' })}
          className="bg-ink hover:bg-espresso text-cream px-5 py-2.5 rounded-md text-sm font-medium
                     transition-colors duration-200 shadow-card hover:shadow-card-hover"
        >
          Add Property
        </button>
      </div>

      {/* Portfolio summary */}
      {portfolio.propertyCount > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12 stagger">
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

      {/* Section header */}
      {properties.length > 0 && (
        <div className="flex items-baseline gap-3 mb-5">
          <h3 className="font-serif text-xl text-ink">Properties</h3>
          <div className="flex-1 border-t border-sand/60 translate-y-[-2px]" />
        </div>
      )}

      {/* Property grid */}
      {properties.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-sand rounded-lg bg-white/50">
          <div className="font-serif text-2xl text-ink mb-2">No properties yet</div>
          <p className="text-stone text-sm mb-5">Add your first property to begin analyzing returns.</p>
          <button
            onClick={() => setPage({ name: 'add-property' })}
            className="text-emerald hover:text-emerald-dark font-medium text-sm transition-colors"
          >
            Add your first property &rarr;
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 stagger">
          {properties.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      )}
    </div>
  );
}
