import { useState } from 'react';
import { useStore } from '../store';
import { useProperty } from '../hooks/useProperties';
import * as api from '../services/api';
import MetricCard from './shared/MetricCard';
import MetricBadge from './shared/MetricBadge';
import CurrencyInput from './shared/CurrencyInput';
import PercentInput from './shared/PercentInput';
import LoadingSpinner from './shared/LoadingSpinner';
import DocumentUploadZone from './DocumentUploadZone';
import type { PropertyStatus, ExpenseFrequency } from '../types';

const fmt = (v: number) => `$${Math.round(v).toLocaleString()}`;
const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

function metricColor(value: number, green: number, yellow: number): 'green' | 'yellow' | 'red' {
  return value > green ? 'green' : value > yellow ? 'yellow' : 'red';
}

type Tab = 'overview' | 'financials' | 'documents';

const TAB_LABELS: Record<Tab, string> = {
  overview: 'Overview',
  financials: 'Financials',
  documents: 'Documents',
};

export default function PropertyDetail({ id }: { id: number }) {
  const setPage = useStore((s) => s.setPage);
  const showToast = useStore((s) => s.showToast);
  const { property, acquisition, financing, income, expenses, calculations, loading, refresh } = useProperty(id);
  const [tab, setTab] = useState<Tab>('overview');
  const [saving, setSaving] = useState(false);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>;
  }

  if (!property) {
    return (
      <div className="text-center py-16">
        <div className="font-serif text-2xl text-ink mb-2">Property not found</div>
        <button onClick={() => setPage({ name: 'dashboard' })}
          className="text-emerald hover:text-emerald-dark text-sm font-medium">
          Back to Portfolio
        </button>
      </div>
    );
  }

  const c = calculations;

  const saveField = async (fn: () => Promise<any>) => {
    setSaving(true);
    try {
      await fn();
      await refresh();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = (status: PropertyStatus) => {
    saveField(() => api.updateProperty(id, { status }));
  };

  const handleDeleteProperty = async () => {
    if (!confirm(`Delete "${property.name}"? This cannot be undone.`)) return;
    try {
      await api.deleteProperty(id);
      showToast('Property deleted', 'success');
      setPage({ name: 'dashboard' });
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <button onClick={() => setPage({ name: 'dashboard' })}
          className="text-stone hover:text-ink text-xs font-medium mb-4 block transition-colors">
          &larr; Portfolio
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-serif text-4xl text-ink tracking-tight">{property.name}</h2>
            {property.city && property.state && (
              <p className="font-serif italic text-stone text-lg mt-1">
                {property.address ? `${property.address}, ` : ''}{property.city}, {property.state} {property.zip}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0 ml-6">
            <select
              value={property.status}
              onChange={(e) => handleStatusChange(e.target.value as PropertyStatus)}
              className="input-field !w-auto !py-1.5 text-xs"
            >
              <option value="analyzing">Analyzing</option>
              <option value="active">Active</option>
              <option value="sold">Sold</option>
              <option value="archived">Archived</option>
            </select>
            <button onClick={handleDeleteProperty}
              className="text-coral/70 hover:text-coral text-xs font-medium px-3 py-1.5 border border-coral/20
                         rounded-md hover:bg-coral-light transition-colors">
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0 mb-8 border-b border-sand/60">
        {(['overview', 'financials', 'documents'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-3 text-sm font-medium -mb-px border-b-2 transition-all duration-200
              ${tab === t
                ? 'border-emerald text-emerald'
                : 'border-transparent text-stone hover:text-ink'
              }`}>
            {TAB_LABELS[t]}
          </button>
        ))}
        {saving && (
          <div className="ml-auto flex items-center gap-2 text-xs text-stone">
            <LoadingSpinner size="sm" />
            Saving...
          </div>
        )}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && c && (
        <div className="space-y-8">
          {/* Key metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
            <MetricCard label="Monthly Cash Flow" value={fmt(c.monthlyCashFlow)}
              color={c.monthlyCashFlow > 500 ? 'green' : c.monthlyCashFlow > 0 ? 'yellow' : 'red'} />
            <MetricCard label="Cash on Cash Return" value={pct(c.cashOnCash)} color={metricColor(c.cashOnCash, 0.1, 0.05)} />
            <MetricCard label="Cap Rate" value={pct(c.capRate)} color={metricColor(c.capRate, 0.08, 0.05)} />
            <MetricCard label="DSCR" value={c.dscr === Infinity ? '\u221E' : c.dscr.toFixed(2)} color={metricColor(c.dscr, 1.5, 1.0)} />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
            <MetricCard label="Monthly Revenue" value={fmt(c.monthlyRevenue)} />
            <MetricCard label="Net Operating Income" value={fmt(c.noi)} color={c.noi > 0 ? 'green' : 'red'} />
            <MetricCard label="Gross Yield" value={pct(c.grossYield)} />
            <MetricCard label="Break-Even Occupancy" value={pct(c.breakEvenOccupancy)}
              color={c.breakEvenOccupancy < 0.5 ? 'green' : c.breakEvenOccupancy < 0.7 ? 'yellow' : 'red'} />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
            <MetricCard label="Monthly P&I" value={fmt(c.monthlyPI)} />
            <MetricCard label="GRM" value={c.grm.toFixed(1)} />
            <MetricCard label="Price per Door" value={fmt(c.pricePerDoor)} />
            <MetricCard label="Total Cash Invested" value={fmt(c.totalCashInvested)} />
          </div>

          {/* Cash flow breakdown */}
          <div className="bg-white border border-sand/50 rounded-lg shadow-card overflow-hidden">
            <div className="px-6 py-4 border-b border-sand/40">
              <h3 className="font-serif text-lg text-ink">Annual Cash Flow</h3>
            </div>
            <div className="px-6 py-5 space-y-3 text-sm">
              <div className="flex justify-between items-baseline">
                <span className="text-charcoal">Revenue</span>
                <span className="font-mono text-emerald-dark font-medium">{fmt(c.annualRevenue)}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-charcoal">Operating Expenses</span>
                <span className="font-mono text-coral font-medium">&minus;{fmt(c.annualExpenses)}</span>
              </div>
              <div className="border-t border-sand/50 pt-3 flex justify-between items-baseline">
                <span className="text-ink font-medium">NOI</span>
                <span className="font-mono text-ink font-medium">{fmt(c.noi)}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-charcoal">Debt Service</span>
                <span className="font-mono text-coral font-medium">&minus;{fmt(c.annualDebtService)}</span>
              </div>
              <div className="border-t-2 border-ink/10 pt-3 flex justify-between items-baseline">
                <span className="text-ink font-semibold">Net Cash Flow</span>
                <span className={`font-mono text-lg font-semibold ${c.annualCashFlow >= 0 ? 'text-emerald-dark' : 'text-coral'}`}>
                  {fmt(c.annualCashFlow)}
                </span>
              </div>
            </div>
          </div>

          {/* 10-year projection */}
          <div className="bg-white border border-sand/50 rounded-lg shadow-card overflow-hidden">
            <div className="px-6 py-4 border-b border-sand/40 flex items-baseline justify-between">
              <h3 className="font-serif text-lg text-ink">10-Year Projection</h3>
              <div className="flex gap-5 text-xs">
                <span className="text-stone">Net Return: <span className="font-mono font-medium text-emerald-dark">{fmt(c.tenYearNetReturn)}</span></span>
                <span className="text-stone">CAGR: <MetricBadge value={c.cagr} thresholds={{ green: 0.1, yellow: 0.05 }} format={pct} /></span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-stone border-b border-sand/40">
                    <th className="text-left py-3 px-6 font-semibold">Year</th>
                    <th className="text-right py-3 px-4 font-semibold">Revenue</th>
                    <th className="text-right py-3 px-4 font-semibold">Expenses</th>
                    <th className="text-right py-3 px-4 font-semibold">Cash Flow</th>
                    <th className="text-right py-3 px-4 font-semibold">Property Value</th>
                    <th className="text-right py-3 px-6 font-semibold">Equity</th>
                  </tr>
                </thead>
                <tbody>
                  {c.tenYearProjection.map((yr) => (
                    <tr key={yr.year} className="border-b border-sand/20 hover:bg-parchment/30 transition-colors">
                      <td className="py-3 px-6 font-mono text-charcoal">{yr.year}</td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-dark">{fmt(yr.revenue)}</td>
                      <td className="py-3 px-4 text-right font-mono text-coral">{fmt(yr.expenses)}</td>
                      <td className={`py-3 px-4 text-right font-mono font-medium ${yr.cashFlow >= 0 ? 'text-emerald-dark' : 'text-coral'}`}>
                        {fmt(yr.cashFlow)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-charcoal">{fmt(yr.propertyValue)}</td>
                      <td className="py-3 px-6 text-right font-mono text-ink font-medium">{fmt(yr.equity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'overview' && !c && (
        <div className="text-center py-16 bg-white/50 border border-dashed border-sand rounded-lg">
          <div className="font-serif text-xl text-ink mb-2">No calculations yet</div>
          <p className="text-stone text-sm mb-4">Add financial data to see investment metrics.</p>
          <button onClick={() => setTab('financials')}
            className="text-emerald hover:text-emerald-dark font-medium text-sm">
            Add financials &rarr;
          </button>
        </div>
      )}

      {/* Financials Tab */}
      {tab === 'financials' && (
        <div className="space-y-6 max-w-2xl">
          <section className="bg-white border border-sand/50 rounded-lg shadow-card overflow-hidden">
            <div className="px-6 py-4 border-b border-sand/40">
              <h3 className="font-serif text-lg text-ink">Acquisition Costs</h3>
            </div>
            <div className="px-6 py-5 space-y-4">
              <CurrencyInput label="Purchase Price" value={Number(acquisition?.purchase_price) || 0}
                onChange={(v) => saveField(() => api.updateAcquisition(id, { purchase_price: v }))} />
              <CurrencyInput label="Closing Costs" value={Number(acquisition?.closing_costs) || 0}
                onChange={(v) => saveField(() => api.updateAcquisition(id, { closing_costs: v }))} />
              <CurrencyInput label="Renovation / Furnishing" value={Number(acquisition?.renovation) || 0}
                onChange={(v) => saveField(() => api.updateAcquisition(id, { renovation: v }))} />
            </div>
          </section>

          <section className="bg-white border border-sand/50 rounded-lg shadow-card overflow-hidden">
            <div className="px-6 py-4 border-b border-sand/40">
              <h3 className="font-serif text-lg text-ink">Financing</h3>
            </div>
            <div className="px-6 py-5 space-y-4">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all
                  ${financing?.is_cash_purchase ? 'bg-emerald border-emerald text-white' : 'border-sand group-hover:border-stone'}`}>
                  {financing?.is_cash_purchase && <span className="text-xs">&#10003;</span>}
                </div>
                <input type="checkbox" checked={financing?.is_cash_purchase || false}
                  onChange={(e) => saveField(() => api.updateFinancing(id, { is_cash_purchase: e.target.checked }))}
                  className="hidden" />
                <span className="text-sm text-ink font-medium">Cash Purchase</span>
              </label>
              {!financing?.is_cash_purchase && (
                <>
                  <PercentInput label="Down Payment" value={Number(financing?.down_payment_pct) || 20}
                    onChange={(v) => saveField(() => api.updateFinancing(id, { down_payment_pct: v }))} step={5} />
                  <PercentInput label="Interest Rate" value={Number(financing?.interest_rate) || 7}
                    onChange={(v) => saveField(() => api.updateFinancing(id, { interest_rate: v }))} step={0.125} />
                  <div>
                    <label className="field-label">Loan Term</label>
                    <select value={financing?.loan_term_years || 30}
                      onChange={(e) => saveField(() => api.updateFinancing(id, { loan_term_years: parseInt(e.target.value) }))}
                      className="input-field">
                      <option value={15}>15 Years</option><option value={20}>20 Years</option>
                      <option value={25}>25 Years</option><option value={30}>30 Years</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </section>

          <section className="bg-white border border-sand/50 rounded-lg shadow-card overflow-hidden">
            <div className="px-6 py-4 border-b border-sand/40">
              <h3 className="font-serif text-lg text-ink">Rental Income</h3>
            </div>
            <div className="px-6 py-5 space-y-4">
              <CurrencyInput label="Nightly Rate" value={Number(income?.nightly_rate) || 0}
                onChange={(v) => saveField(() => api.updateIncome(id, { nightly_rate: v }))} />
              <PercentInput label="Occupancy" value={Number(income?.occupancy_pct) || 65}
                onChange={(v) => saveField(() => api.updateIncome(id, { occupancy_pct: v }))} step={5} />
              <div>
                <label className="field-label">Avg Stay (Nights)</label>
                <input type="number" value={Number(income?.avg_stay_nights) || 3}
                  onChange={(e) => saveField(() => api.updateIncome(id, { avg_stay_nights: parseFloat(e.target.value) || 3 }))}
                  step={0.5} min={1} className="input-mono" />
              </div>
            </div>
          </section>

          <section className="bg-white border border-sand/50 rounded-lg shadow-card overflow-hidden">
            <div className="px-6 py-4 border-b border-sand/40 flex items-center justify-between">
              <h3 className="font-serif text-lg text-ink">Operating Expenses</h3>
              <button onClick={async () => {
                await api.createExpense(id, { category: 'other', label: 'New Expense', amount: 0, frequency: 'monthly' });
                refresh();
              }} className="text-emerald text-xs font-semibold uppercase tracking-wider hover:text-emerald-dark transition-colors">
                + Add
              </button>
            </div>
            <div className="px-6 py-5">
              {expenses.length === 0 ? (
                <p className="text-sm text-stone italic">No expenses added yet</p>
              ) : (
                <div className="space-y-2.5">
                  {expenses.map((exp) => (
                    <div key={exp.id} className="grid grid-cols-12 gap-2 items-center">
                      <input value={exp.label}
                        onChange={(e) => saveField(() => api.updateExpense(id, exp.id, { label: e.target.value }))}
                        className="col-span-4 input-field !py-1.5 text-xs" />
                      <div className="col-span-3 relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone font-mono text-xs">$</span>
                        <input type="number" value={Number(exp.amount) || ''}
                          onChange={(e) => saveField(() => api.updateExpense(id, exp.id, { amount: parseFloat(e.target.value) || 0 }))}
                          className="w-full input-mono !py-1.5 pl-6 text-xs" />
                      </div>
                      <select value={exp.frequency}
                        onChange={(e) => saveField(() => api.updateExpense(id, exp.id, { frequency: e.target.value as ExpenseFrequency }))}
                        className="col-span-3 input-field !py-1.5 text-xs">
                        <option value="monthly">Monthly</option>
                        <option value="annual">Annual</option>
                        <option value="per_turnover">Per Turnover</option>
                      </select>
                      <button onClick={async () => { await api.deleteExpense(id, exp.id); refresh(); }}
                        className="col-span-2 text-coral/60 hover:text-coral text-xs text-center font-medium transition-colors">
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* Documents Tab */}
      {tab === 'documents' && (
        <DocumentUploadZone propertyId={id} onExtracted={refresh} />
      )}
    </div>
  );
}
