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
      <div className="text-center py-12">
        <p className="text-scout-muted mb-3">Property not found</p>
        <button onClick={() => setPage({ name: 'dashboard' })} className="text-scout-accent hover:underline text-sm">
          Back to Dashboard
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
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <button onClick={() => setPage({ name: 'dashboard' })} className="text-scout-muted hover:text-white text-xs mb-2 block">
            &larr; Dashboard
          </button>
          <h2 className="text-2xl font-bold">{property.name}</h2>
          {property.city && property.state && (
            <p className="text-scout-muted text-sm">{property.address ? `${property.address}, ` : ''}{property.city}, {property.state} {property.zip}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={property.status}
            onChange={(e) => handleStatusChange(e.target.value as PropertyStatus)}
            className="bg-scout-surface border border-scout-border rounded-lg px-3 py-1.5 text-sm text-white"
          >
            <option value="analyzing">Analyzing</option>
            <option value="active">Active</option>
            <option value="sold">Sold</option>
            <option value="archived">Archived</option>
          </select>
          <button onClick={handleDeleteProperty}
            className="text-red-400 hover:text-red-300 text-sm px-3 py-1.5 border border-red-400/30 rounded-lg">
            Delete
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-scout-border">
        {(['overview', 'financials', 'documents'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize -mb-px border-b-2 transition-colors
              ${tab === t ? 'border-scout-accent text-scout-accent' : 'border-transparent text-scout-muted hover:text-white'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && c && (
        <div className="space-y-6">
          {/* Key metrics grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label="Monthly Cash Flow" value={fmt(c.monthlyCashFlow)} color={c.monthlyCashFlow > 500 ? 'green' : c.monthlyCashFlow > 0 ? 'yellow' : 'red'} />
            <MetricCard label="Cash on Cash" value={pct(c.cashOnCash)} color={metricColor(c.cashOnCash, 0.1, 0.05)} />
            <MetricCard label="Cap Rate" value={pct(c.capRate)} color={metricColor(c.capRate, 0.08, 0.05)} />
            <MetricCard label="DSCR" value={c.dscr === Infinity ? '\u221E' : c.dscr.toFixed(2)} color={metricColor(c.dscr, 1.5, 1.0)} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label="Monthly Revenue" value={fmt(c.monthlyRevenue)} />
            <MetricCard label="NOI" value={fmt(c.noi)} color={c.noi > 0 ? 'green' : 'red'} />
            <MetricCard label="Gross Yield" value={pct(c.grossYield)} />
            <MetricCard label="Break-Even Occ." value={pct(c.breakEvenOccupancy)} color={c.breakEvenOccupancy < 0.5 ? 'green' : c.breakEvenOccupancy < 0.7 ? 'yellow' : 'red'} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label="Monthly P&I" value={fmt(c.monthlyPI)} />
            <MetricCard label="GRM" value={c.grm.toFixed(1)} />
            <MetricCard label="Price per Door" value={fmt(c.pricePerDoor)} />
            <MetricCard label="Total Cash Invested" value={fmt(c.totalCashInvested)} />
          </div>

          {/* Cash flow breakdown bar */}
          <div className="bg-scout-surface border border-scout-border rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-3">Annual Cash Flow Breakdown</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-scout-muted">Revenue</span>
                <span className="text-green-400 font-mono">{fmt(c.annualRevenue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-scout-muted">Operating Expenses</span>
                <span className="text-red-400 font-mono">-{fmt(c.annualExpenses)}</span>
              </div>
              <div className="flex justify-between border-t border-scout-border pt-2">
                <span className="text-scout-muted">NOI</span>
                <span className="font-mono">{fmt(c.noi)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-scout-muted">Debt Service</span>
                <span className="text-red-400 font-mono">-{fmt(c.annualDebtService)}</span>
              </div>
              <div className="flex justify-between border-t border-scout-border pt-2 font-semibold">
                <span>Annual Cash Flow</span>
                <span className={c.annualCashFlow >= 0 ? 'text-green-400' : 'text-red-400'}>{fmt(c.annualCashFlow)}</span>
              </div>
            </div>
          </div>

          {/* 10-year projection table */}
          <div className="bg-scout-surface border border-scout-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">10-Year Projection</h3>
              <div className="flex gap-4 text-xs text-scout-muted">
                <span>Net Return: <span className="text-green-400 font-mono">{fmt(c.tenYearNetReturn)}</span></span>
                <span>CAGR: <MetricBadge value={c.cagr} thresholds={{ green: 0.1, yellow: 0.05 }} format={pct} /></span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-scout-muted border-b border-scout-border">
                    <th className="text-left py-2 pr-4">Year</th>
                    <th className="text-right py-2 px-2">Revenue</th>
                    <th className="text-right py-2 px-2">Expenses</th>
                    <th className="text-right py-2 px-2">Cash Flow</th>
                    <th className="text-right py-2 px-2">Prop Value</th>
                    <th className="text-right py-2 pl-2">Equity</th>
                  </tr>
                </thead>
                <tbody>
                  {c.tenYearProjection.map((yr) => (
                    <tr key={yr.year} className="border-b border-scout-border/50">
                      <td className="py-1.5 pr-4 font-mono">{yr.year}</td>
                      <td className="py-1.5 px-2 text-right font-mono text-green-400">{fmt(yr.revenue)}</td>
                      <td className="py-1.5 px-2 text-right font-mono text-red-400">{fmt(yr.expenses)}</td>
                      <td className={`py-1.5 px-2 text-right font-mono ${yr.cashFlow >= 0 ? 'text-green-400' : 'text-red-400'}`}>{fmt(yr.cashFlow)}</td>
                      <td className="py-1.5 px-2 text-right font-mono">{fmt(yr.propertyValue)}</td>
                      <td className="py-1.5 pl-2 text-right font-mono text-blue-400">{fmt(yr.equity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'overview' && !c && (
        <div className="text-center py-12 text-scout-muted">
          <p>No calculations available yet.</p>
          <button onClick={() => setTab('financials')} className="text-scout-accent hover:underline text-sm mt-2">
            Add financial data
          </button>
        </div>
      )}

      {tab === 'financials' && (
        <div className="space-y-6 max-w-2xl">
          {/* Acquisition */}
          <section className="bg-scout-surface border border-scout-border rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-4">Acquisition Costs</h3>
            <div className="space-y-3">
              <CurrencyInput label="Purchase Price" value={Number(acquisition?.purchase_price) || 0}
                onChange={(v) => saveField(() => api.updateAcquisition(id, { purchase_price: v }))} />
              <CurrencyInput label="Closing Costs" value={Number(acquisition?.closing_costs) || 0}
                onChange={(v) => saveField(() => api.updateAcquisition(id, { closing_costs: v }))} />
              <CurrencyInput label="Renovation / Furnishing" value={Number(acquisition?.renovation) || 0}
                onChange={(v) => saveField(() => api.updateAcquisition(id, { renovation: v }))} />
            </div>
          </section>

          {/* Financing */}
          <section className="bg-scout-surface border border-scout-border rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-4">Financing</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={financing?.is_cash_purchase || false}
                  onChange={(e) => saveField(() => api.updateFinancing(id, { is_cash_purchase: e.target.checked }))}
                  className="rounded border-scout-border" />
                <span className="text-sm">Cash Purchase</span>
              </label>
              {!financing?.is_cash_purchase && (
                <>
                  <PercentInput label="Down Payment" value={Number(financing?.down_payment_pct) || 20}
                    onChange={(v) => saveField(() => api.updateFinancing(id, { down_payment_pct: v }))} step={5} />
                  <PercentInput label="Interest Rate" value={Number(financing?.interest_rate) || 7}
                    onChange={(v) => saveField(() => api.updateFinancing(id, { interest_rate: v }))} step={0.125} />
                  <div>
                    <label className="block text-xs text-scout-muted mb-1">Loan Term</label>
                    <select value={financing?.loan_term_years || 30}
                      onChange={(e) => saveField(() => api.updateFinancing(id, { loan_term_years: parseInt(e.target.value) }))}
                      className="w-full bg-scout-bg border border-scout-border rounded-lg px-3 py-2 text-white text-sm">
                      <option value={15}>15 Years</option><option value={20}>20 Years</option>
                      <option value={25}>25 Years</option><option value={30}>30 Years</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Income */}
          <section className="bg-scout-surface border border-scout-border rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-4">Rental Income</h3>
            <div className="space-y-3">
              <CurrencyInput label="Nightly Rate" value={Number(income?.nightly_rate) || 0}
                onChange={(v) => saveField(() => api.updateIncome(id, { nightly_rate: v }))} />
              <PercentInput label="Occupancy" value={Number(income?.occupancy_pct) || 65}
                onChange={(v) => saveField(() => api.updateIncome(id, { occupancy_pct: v }))} step={5} />
              <div>
                <label className="block text-xs text-scout-muted mb-1">Avg Stay (Nights)</label>
                <input type="number" value={Number(income?.avg_stay_nights) || 3}
                  onChange={(e) => saveField(() => api.updateIncome(id, { avg_stay_nights: parseFloat(e.target.value) || 3 }))}
                  step={0.5} min={1}
                  className="w-full bg-scout-bg border border-scout-border rounded-lg px-3 py-2 text-white text-sm font-mono" />
              </div>
            </div>
          </section>

          {/* Expenses */}
          <section className="bg-scout-surface border border-scout-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Operating Expenses</h3>
              <button onClick={async () => {
                await api.createExpense(id, { category: 'other', label: 'New Expense', amount: 0, frequency: 'monthly' });
                refresh();
              }} className="text-scout-accent text-xs hover:underline">
                + Add Expense
              </button>
            </div>
            {expenses.length === 0 ? (
              <p className="text-xs text-scout-muted italic">No expenses added yet</p>
            ) : (
              <div className="space-y-2">
                {expenses.map((exp) => (
                  <div key={exp.id} className="grid grid-cols-12 gap-2 items-center">
                    <input value={exp.label} onChange={(e) => saveField(() => api.updateExpense(id, exp.id, { label: e.target.value }))}
                      className="col-span-4 bg-scout-bg border border-scout-border rounded px-2 py-1.5 text-sm text-white" />
                    <div className="col-span-3 relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-scout-muted text-xs">$</span>
                      <input type="number" value={Number(exp.amount) || ''} onChange={(e) =>
                        saveField(() => api.updateExpense(id, exp.id, { amount: parseFloat(e.target.value) || 0 }))}
                        className="w-full bg-scout-bg border border-scout-border rounded pl-5 pr-2 py-1.5 text-sm font-mono text-white" />
                    </div>
                    <select value={exp.frequency} onChange={(e) =>
                      saveField(() => api.updateExpense(id, exp.id, { frequency: e.target.value as ExpenseFrequency }))}
                      className="col-span-3 bg-scout-bg border border-scout-border rounded px-2 py-1.5 text-sm text-white">
                      <option value="monthly">Monthly</option>
                      <option value="annual">Annual</option>
                      <option value="per_turnover">Per Turnover</option>
                    </select>
                    <button onClick={async () => { await api.deleteExpense(id, exp.id); refresh(); }}
                      className="col-span-2 text-red-400 hover:text-red-300 text-xs text-center">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {saving && <div className="text-xs text-scout-muted">Saving...</div>}
        </div>
      )}

      {tab === 'documents' && (
        <DocumentUploadZone propertyId={id} onExtracted={refresh} />
      )}
    </div>
  );
}
