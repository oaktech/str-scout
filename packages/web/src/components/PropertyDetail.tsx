import { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store';
import { useProperty } from '../hooks/useProperties';
import * as api from '../services/api';
import MetricCard from './shared/MetricCard';
import MetricBadge from './shared/MetricBadge';
import CurrencyInput from './shared/CurrencyInput';
import PercentInput from './shared/PercentInput';
import LoadingSpinner from './shared/LoadingSpinner';
import DocumentUploadZone from './DocumentUploadZone';
import AlosAnalysis from './AlosAnalysis';
import type { PropertyStatus, ExpenseFrequency, OperatingExpense } from '../types';

const fmt = (v: number) => `$${Math.round(v).toLocaleString()}`;
const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

function metricColor(value: number, green: number, yellow: number): 'green' | 'yellow' | 'red' {
  return value > green ? 'green' : value > yellow ? 'yellow' : 'red';
}

type Tab = 'overview' | 'financials' | 'alos' | 'documents';

function ExpenseSection({ propertyId, expenses: serverExpenses, onSaved, showToast }: {
  propertyId: number;
  expenses: OperatingExpense[];
  onSaved: () => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}) {
  const [localExpenses, setLocalExpenses] = useState<OperatingExpense[]>(serverExpenses);
  const debounceTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  // Sync from server only when the set of IDs changes (add/delete), not on field edits
  const serverIds = serverExpenses.map((e) => e.id).join(',');
  useEffect(() => {
    setLocalExpenses(serverExpenses);
  }, [serverIds]); // eslint-disable-line react-hooks/exhaustive-deps

  const debouncedSave = useCallback((expenseId: number, data: Partial<OperatingExpense>) => {
    const existing = debounceTimers.current.get(expenseId);
    if (existing) clearTimeout(existing);
    debounceTimers.current.set(expenseId, setTimeout(async () => {
      debounceTimers.current.delete(expenseId);
      try {
        await api.updateExpense(propertyId, expenseId, data);
        onSaved();
      } catch (err: any) {
        showToast(err.message, 'error');
      }
    }, 500));
  }, [propertyId, onSaved, showToast]);

  const updateLocal = (expenseId: number, field: keyof OperatingExpense, value: any) => {
    setLocalExpenses((prev) => prev.map((e) => e.id === expenseId ? { ...e, [field]: value } : e));
    debouncedSave(expenseId, { [field]: value });
  };

  const handleFrequencyChange = async (expenseId: number, frequency: ExpenseFrequency) => {
    setLocalExpenses((prev) => prev.map((e) => e.id === expenseId ? { ...e, frequency } : e));
    try {
      await api.updateExpense(propertyId, expenseId, { frequency });
      onSaved();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleAdd = async () => {
    try {
      const created = await api.createExpense(propertyId, { category: 'other', label: 'New Expense', amount: 0, frequency: 'monthly' });
      setLocalExpenses((prev) => [...prev, created]);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = async (expenseId: number) => {
    setLocalExpenses((prev) => prev.filter((e) => e.id !== expenseId));
    try {
      await api.deleteExpense(propertyId, expenseId);
      onSaved();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const expInputClass = `w-full bg-scout-soot border border-scout-ash rounded-lg pl-5 pr-2 py-2 text-sm font-mono text-scout-chalk
                          focus:outline-none focus:border-scout-mint/50 transition-colors`;

  return (
    <section className="bg-scout-carbon border border-scout-ash rounded-lg p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-4">
          <h3 className="font-display text-lg text-scout-bone">Operating Expenses</h3>
          <div className="divider flex-1 min-w-[40px]" />
        </div>
        <button onClick={handleAdd} className="text-scout-mint text-xs hover:text-scout-mint-dim transition-colors font-medium">
          + Add Expense
        </button>
      </div>
      {localExpenses.length === 0 ? (
        <p className="text-xs text-scout-drift italic">No expenses added yet</p>
      ) : (
        <div className="space-y-2">
          {localExpenses.map((exp) => (
            <div key={exp.id} className="grid grid-cols-12 gap-2 items-center">
              <input value={exp.label} onChange={(e) => updateLocal(exp.id, 'label', e.target.value)}
                className="col-span-4 bg-scout-soot border border-scout-ash rounded-lg px-2.5 py-2 text-sm text-scout-chalk
                           focus:outline-none focus:border-scout-mint/50 transition-colors" />
              <div className="col-span-3 relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-scout-fossil text-xs font-mono">$</span>
                <input type="number" value={Number(exp.amount) || ''} onChange={(e) =>
                  updateLocal(exp.id, 'amount', parseFloat(e.target.value) || 0)}
                  className={expInputClass} />
              </div>
              <select value={exp.frequency} onChange={(e) => handleFrequencyChange(exp.id, e.target.value as ExpenseFrequency)}
                className="col-span-3 bg-scout-soot border border-scout-ash rounded-lg px-2 py-2 text-sm text-scout-chalk
                           focus:outline-none focus:border-scout-mint/50 transition-colors">
                <option value="monthly">Monthly</option>
                <option value="annual">Annual</option>
                <option value="per_turnover">Per Turnover</option>
              </select>
              <button onClick={() => handleDelete(exp.id)}
                className="col-span-2 text-scout-rose/60 hover:text-scout-rose text-xs text-center transition-colors">
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

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
        <p className="text-scout-fossil font-display text-xl mb-3">Property not found</p>
        <button onClick={() => setPage({ name: 'dashboard' })} className="text-scout-mint hover:text-scout-chalk text-sm transition-colors">
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

  const inputClass = `w-full bg-scout-soot border border-scout-ash rounded-lg px-3 py-2.5 text-scout-bone text-sm
                       focus:outline-none focus:border-scout-mint/50 focus:ring-1 focus:ring-scout-mint/20 transition-colors`;

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <button onClick={() => setPage({ name: 'dashboard' })}
            className="text-scout-drift hover:text-scout-chalk text-xs mb-3 block transition-colors">
            &larr; Dashboard
          </button>
          <h2 className="font-display text-3xl text-scout-bone">{property.name}</h2>
          {property.city && property.state && (
            <p className="text-scout-fossil text-sm mt-1">{property.address ? `${property.address}, ` : ''}{property.city}, {property.state} {property.zip}</p>
          )}
          <div className="divider mt-4 w-24" />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={property.status}
            onChange={(e) => handleStatusChange(e.target.value as PropertyStatus)}
            className="bg-scout-carbon border border-scout-ash rounded-lg px-3 py-1.5 text-sm text-scout-chalk
                       focus:outline-none focus:border-scout-mint/50 transition-colors"
          >
            <option value="analyzing">Analyzing</option>
            <option value="active">Active</option>
            <option value="sold">Sold</option>
            <option value="archived">Archived</option>
          </select>
          <button onClick={handleDeleteProperty}
            className="text-scout-rose/70 hover:text-scout-rose text-sm px-3 py-1.5 border border-scout-rose/20
                       rounded-lg hover:bg-scout-rose/5 transition-colors">
            Delete
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mb-8">
        {((['overview', 'financials', ...(c ? ['alos'] as Tab[] : []), 'documents'] as Tab[])).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-medium transition-all duration-200 border-b-2
              ${tab === t
                ? 'border-scout-mint text-scout-mint'
                : 'border-transparent text-scout-fossil hover:text-scout-chalk'}`}>
            {t === 'alos' ? 'ALOS' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
        <div className="flex-1 border-b-2 border-scout-ash" />
      </div>

      {/* Tab content */}
      {tab === 'overview' && c && (
        <div className="space-y-8 animate-fade-in">
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

          {/* Cash flow breakdown */}
          <div className="bg-scout-carbon border border-scout-ash rounded-lg p-5">
            <div className="flex items-center gap-4 mb-4">
              <h3 className="font-display text-lg text-scout-bone">Annual Cash Flow</h3>
              <div className="divider flex-1" />
            </div>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-scout-fossil">Revenue</span>
                <span className="text-scout-mint font-mono">{fmt(c.annualRevenue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-scout-fossil">Operating Expenses</span>
                <span className="text-scout-rose font-mono">-{fmt(c.annualExpenses)}</span>
              </div>
              <div className="divider my-2" />
              <div className="flex justify-between items-center">
                <span className="text-scout-fossil">NOI</span>
                <span className="font-mono text-scout-chalk">{fmt(c.noi)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-scout-fossil">Debt Service</span>
                <span className="text-scout-rose font-mono">-{fmt(c.annualDebtService)}</span>
              </div>
              <div className="divider my-2" />
              <div className="flex justify-between items-center font-semibold">
                <span className="text-scout-chalk">Annual Cash Flow</span>
                <span className={`font-mono ${c.annualCashFlow >= 0 ? 'text-scout-mint' : 'text-scout-rose'}`}>{fmt(c.annualCashFlow)}</span>
              </div>
            </div>
          </div>

          {/* 10-year projection table */}
          <div className="bg-scout-carbon border border-scout-ash rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <h3 className="font-display text-lg text-scout-bone">10-Year Projection</h3>
                <div className="divider flex-1 min-w-[40px]" />
              </div>
              <div className="flex gap-4 text-xs text-scout-fossil">
                <span>Net Return: <span className="text-scout-mint font-mono">{fmt(c.tenYearNetReturn)}</span></span>
                <span>CAGR: <MetricBadge value={c.cagr} thresholds={{ green: 0.1, yellow: 0.05 }} format={pct} /></span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-scout-drift border-b border-scout-ash">
                    <th className="text-left py-2.5 pr-4 uppercase tracking-[0.08em] font-medium text-[10px]">Year</th>
                    <th className="text-right py-2.5 px-2 uppercase tracking-[0.08em] font-medium text-[10px]">Revenue</th>
                    <th className="text-right py-2.5 px-2 uppercase tracking-[0.08em] font-medium text-[10px]">Expenses</th>
                    <th className="text-right py-2.5 px-2 uppercase tracking-[0.08em] font-medium text-[10px]">Cash Flow</th>
                    <th className="text-right py-2.5 px-2 uppercase tracking-[0.08em] font-medium text-[10px]">Prop Value</th>
                    <th className="text-right py-2.5 pl-2 uppercase tracking-[0.08em] font-medium text-[10px]">Equity</th>
                  </tr>
                </thead>
                <tbody>
                  {c.tenYearProjection.map((yr) => (
                    <tr key={yr.year} className="border-b border-scout-ash/40 hover:bg-scout-ash/20 transition-colors">
                      <td className="py-2 pr-4 font-mono text-scout-fossil">{yr.year}</td>
                      <td className="py-2 px-2 text-right font-mono text-scout-mint">{fmt(yr.revenue)}</td>
                      <td className="py-2 px-2 text-right font-mono text-scout-rose">{fmt(yr.expenses)}</td>
                      <td className={`py-2 px-2 text-right font-mono ${yr.cashFlow >= 0 ? 'text-scout-mint' : 'text-scout-rose'}`}>{fmt(yr.cashFlow)}</td>
                      <td className="py-2 px-2 text-right font-mono text-scout-chalk">{fmt(yr.propertyValue)}</td>
                      <td className="py-2 pl-2 text-right font-mono text-scout-blue">{fmt(yr.equity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'overview' && !c && (
        <div className="text-center py-16 animate-fade-in">
          <p className="text-scout-fossil font-display text-xl mb-3">No calculations available yet</p>
          <button onClick={() => setTab('financials')} className="text-scout-mint hover:text-scout-chalk text-sm transition-colors">
            Add financial data &rarr;
          </button>
        </div>
      )}

      {tab === 'financials' && (
        <div className="space-y-6 max-w-2xl animate-fade-in">
          {/* Acquisition */}
          <section className="bg-scout-carbon border border-scout-ash rounded-lg p-5">
            <div className="flex items-center gap-4 mb-5">
              <h3 className="font-display text-lg text-scout-bone">Acquisition Costs</h3>
              <div className="divider flex-1" />
            </div>
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
          <section className="bg-scout-carbon border border-scout-ash rounded-lg p-5">
            <div className="flex items-center gap-4 mb-5">
              <h3 className="font-display text-lg text-scout-bone">Financing</h3>
              <div className="divider flex-1" />
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={financing?.is_cash_purchase || false}
                  onChange={(e) => saveField(() => api.updateFinancing(id, { is_cash_purchase: e.target.checked }))}
                  className="rounded border-scout-flint bg-scout-soot accent-scout-mint" />
                <span className="text-sm text-scout-chalk">Cash Purchase</span>
              </label>
              {!financing?.is_cash_purchase && (
                <>
                  <PercentInput label="Down Payment" value={Number(financing?.down_payment_pct) || 20}
                    onChange={(v) => saveField(() => api.updateFinancing(id, { down_payment_pct: v }))} step={5} />
                  <PercentInput label="Interest Rate" value={Number(financing?.interest_rate) || 7}
                    onChange={(v) => saveField(() => api.updateFinancing(id, { interest_rate: v }))} step={0.125} />
                  <div>
                    <label className="block text-[11px] text-scout-drift uppercase tracking-[0.08em] font-medium mb-1.5">Loan Term</label>
                    <select value={financing?.loan_term_years || 30}
                      onChange={(e) => saveField(() => api.updateFinancing(id, { loan_term_years: parseInt(e.target.value) }))}
                      className={inputClass}>
                      <option value={15}>15 Years</option><option value={20}>20 Years</option>
                      <option value={25}>25 Years</option><option value={30}>30 Years</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Income */}
          <section className="bg-scout-carbon border border-scout-ash rounded-lg p-5">
            <div className="flex items-center gap-4 mb-5">
              <h3 className="font-display text-lg text-scout-bone">Rental Income</h3>
              <div className="divider flex-1" />
            </div>
            <div className="space-y-3">
              <CurrencyInput label="Nightly Rate" value={Number(income?.nightly_rate) || 0}
                onChange={(v) => saveField(() => api.updateIncome(id, { nightly_rate: v }))} />
              <PercentInput label="Occupancy" value={Number(income?.occupancy_pct) || 65}
                onChange={(v) => saveField(() => api.updateIncome(id, { occupancy_pct: v }))} step={5} />
              <div>
                <label className="block text-[11px] text-scout-drift uppercase tracking-[0.08em] font-medium mb-1.5">Avg Stay (Nights)</label>
                <input type="number" value={Number(income?.avg_stay_nights) || 3}
                  onChange={(e) => saveField(() => api.updateIncome(id, { avg_stay_nights: parseFloat(e.target.value) || 3 }))}
                  step={0.5} min={1}
                  className={`${inputClass} font-mono`} />
              </div>
            </div>
          </section>

          {/* Expenses */}
          <ExpenseSection propertyId={id} expenses={expenses} onSaved={refresh} showToast={showToast} />

          {saving && <div className="text-xs text-scout-drift font-mono animate-pulse">Saving...</div>}
        </div>
      )}

      {tab === 'alos' && c && income && (
        <div className="animate-fade-in">
          <AlosAnalysis income={income} expenses={expenses} calculations={c} />
        </div>
      )}

      {tab === 'documents' && (
        <div className="animate-fade-in">
          <DocumentUploadZone propertyId={id} onExtracted={refresh} />
        </div>
      )}
    </div>
  );
}
