import { useState, useEffect } from 'react';
import { useStore } from '../store';
import * as api from '../services/api';
import MetricBadge from './shared/MetricBadge';
import LoadingSpinner from './shared/LoadingSpinner';
import type { Property, CalculationResult } from '../types';

const fmt = (v: number) => `$${Math.round(v).toLocaleString()}`;
const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

interface ComparisonData {
  property: Property;
  metrics: CalculationResult;
}

const METRIC_ROWS: {
  label: string;
  key: keyof CalculationResult;
  format: (v: number) => string;
  thresholds?: { green: number; yellow: number; invert?: boolean };
}[] = [
  { label: 'Monthly Revenue', key: 'monthlyRevenue', format: fmt },
  { label: 'Monthly Cash Flow', key: 'monthlyCashFlow', format: fmt, thresholds: { green: 500, yellow: 0 } },
  { label: 'Annual Cash Flow', key: 'annualCashFlow', format: fmt },
  { label: 'NOI', key: 'noi', format: fmt },
  { label: 'Cash on Cash', key: 'cashOnCash', format: pct, thresholds: { green: 0.1, yellow: 0.05 } },
  { label: 'Cap Rate', key: 'capRate', format: pct, thresholds: { green: 0.08, yellow: 0.05 } },
  { label: 'DSCR', key: 'dscr', format: (v) => v === Infinity ? '\u221E' : v.toFixed(2), thresholds: { green: 1.5, yellow: 1.0 } },
  { label: 'Gross Yield', key: 'grossYield', format: pct },
  { label: 'Break-Even Occ.', key: 'breakEvenOccupancy', format: pct, thresholds: { green: 0.5, yellow: 0.7, invert: true } },
  { label: 'Monthly P&I', key: 'monthlyPI', format: fmt },
  { label: 'GRM', key: 'grm', format: (v) => v.toFixed(1) },
  { label: 'Price per Door', key: 'pricePerDoor', format: fmt },
  { label: 'Total Invested', key: 'totalCashInvested', format: fmt },
  { label: '10yr Net Return', key: 'tenYearNetReturn', format: fmt },
  { label: 'CAGR', key: 'cagr', format: pct, thresholds: { green: 0.1, yellow: 0.05 } },
];

export default function ComparisonView() {
  const compareIds = useStore((s) => s.compareIds);
  const clearCompare = useStore((s) => s.clearCompare);
  const setPage = useStore((s) => s.setPage);
  const [data, setData] = useState<ComparisonData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (compareIds.length === 0) return;
    setLoading(true);
    Promise.all(
      compareIds.map(async (id) => {
        const [property, metrics] = await Promise.all([
          api.getProperty(id),
          api.getCalculations(id),
        ]);
        return { property, metrics };
      }),
    ).then(setData).finally(() => setLoading(false));
  }, [compareIds]);

  if (compareIds.length === 0) {
    return (
      <div className="text-center py-20 animate-fade-in">
        <h2 className="font-serif text-3xl text-ink mb-2">Compare Properties</h2>
        <p className="text-stone mb-5 font-serif italic">Select 2&ndash;3 properties from the portfolio to compare side-by-side.</p>
        <button onClick={() => setPage({ name: 'dashboard' })}
          className="text-emerald hover:text-emerald-dark font-medium text-sm transition-colors">
          Go to Portfolio &rarr;
        </button>
      </div>
    );
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="font-serif text-3xl text-ink tracking-tight">Comparison</h2>
          <p className="font-serif italic text-stone mt-0.5">{data.length} properties selected</p>
        </div>
        <button onClick={clearCompare}
          className="text-stone hover:text-ink text-xs font-semibold uppercase tracking-wider transition-colors">
          Clear
        </button>
      </div>

      <div className="bg-white border border-sand/50 rounded-lg shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sand/60">
                <th className="text-left py-4 px-6 text-[10px] uppercase tracking-wider text-stone font-semibold w-48">Metric</th>
                {data.map((d) => (
                  <th key={d.property.id} className="text-right py-4 px-6">
                    <button onClick={() => setPage({ name: 'property', id: d.property.id })}
                      className="font-serif text-base text-emerald hover:text-emerald-dark transition-colors text-right">
                      {d.property.name}
                    </button>
                    {d.property.city && (
                      <div className="text-[10px] text-stone font-body font-normal mt-0.5">
                        {d.property.city}, {d.property.state}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {METRIC_ROWS.map((row, i) => (
                <tr key={row.key}
                  className={`border-b border-sand/20 ${i % 2 === 0 ? '' : 'bg-parchment/20'}`}>
                  <td className="py-3 px-6 text-charcoal text-xs font-medium">{row.label}</td>
                  {data.map((d) => {
                    const value = d.metrics[row.key] as number;
                    return (
                      <td key={d.property.id} className="py-3 px-6 text-right">
                        {row.thresholds ? (
                          <MetricBadge value={value} thresholds={row.thresholds} format={row.format} />
                        ) : (
                          <span className="font-mono text-sm text-ink">{row.format(value)}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
