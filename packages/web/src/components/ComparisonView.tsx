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
    )
      .then(setData)
      .finally(() => setLoading(false));
  }, [compareIds]);

  if (compareIds.length === 0) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold mb-3">Compare Properties</h2>
        <p className="text-scout-muted mb-4">Select 2-3 properties from the dashboard to compare side-by-side.</p>
        <button onClick={() => setPage({ name: 'dashboard' })} className="text-scout-accent hover:underline text-sm">
          Go to Dashboard
        </button>
      </div>
    );
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Property Comparison</h2>
        <button onClick={clearCompare} className="text-scout-muted hover:text-white text-sm">
          Clear Selection
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-scout-border">
              <th className="text-left py-3 pr-4 text-scout-muted font-medium">Metric</th>
              {data.map((d) => (
                <th key={d.property.id} className="text-right py-3 px-4 font-medium">
                  <button onClick={() => setPage({ name: 'property', id: d.property.id })}
                    className="text-scout-accent hover:underline">
                    {d.property.name}
                  </button>
                  {d.property.city && (
                    <div className="text-xs text-scout-muted font-normal">{d.property.city}, {d.property.state}</div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {METRIC_ROWS.map((row) => (
              <tr key={row.key} className="border-b border-scout-border/50">
                <td className="py-2.5 pr-4 text-scout-muted">{row.label}</td>
                {data.map((d) => {
                  const value = d.metrics[row.key] as number;
                  return (
                    <td key={d.property.id} className="py-2.5 px-4 text-right font-mono">
                      {row.thresholds ? (
                        <MetricBadge value={value} thresholds={row.thresholds} format={row.format} />
                      ) : (
                        <span className="text-white">{row.format(value)}</span>
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
  );
}
