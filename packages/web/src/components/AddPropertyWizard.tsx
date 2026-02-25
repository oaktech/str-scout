import { useState } from 'react';
import { useStore } from '../store';
import * as api from '../services/api';
import CurrencyInput from './shared/CurrencyInput';
import PercentInput from './shared/PercentInput';
import type { PropertyType, ExpenseFrequency } from '../types';

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'single_family', label: 'Single Family' },
  { value: 'condo', label: 'Condo' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'multi_family', label: 'Multi-Family' },
  { value: 'cabin', label: 'Cabin' },
  { value: 'other', label: 'Other' },
];

const DEFAULT_EXPENSES: { category: string; label: string; amount: number; frequency: ExpenseFrequency }[] = [
  { category: 'management', label: 'Property Management', amount: 20, frequency: 'monthly' },
  { category: 'insurance', label: 'Insurance', amount: 0, frequency: 'annual' },
  { category: 'property_tax', label: 'Property Tax', amount: 0, frequency: 'annual' },
  { category: 'utilities', label: 'Utilities', amount: 0, frequency: 'monthly' },
  { category: 'cleaning', label: 'Cleaning', amount: 0, frequency: 'per_turnover' },
  { category: 'maintenance', label: 'Maintenance', amount: 0, frequency: 'monthly' },
  { category: 'supplies', label: 'Supplies', amount: 0, frequency: 'monthly' },
  { category: 'hoa', label: 'HOA', amount: 0, frequency: 'monthly' },
];

type Step = 'basics' | 'acquisition' | 'financing' | 'income' | 'expenses';
const STEPS: Step[] = ['basics', 'acquisition', 'financing', 'income', 'expenses'];
const STEP_LABELS: Record<Step, string> = {
  basics: 'Property',
  acquisition: 'Acquisition',
  financing: 'Financing',
  income: 'Income',
  expenses: 'Expenses',
};

export default function AddPropertyWizard() {
  const setPage = useStore((s) => s.setPage);
  const showToast = useStore((s) => s.showToast);
  const [step, setStep] = useState<Step>('basics');
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [propertyType, setPropertyType] = useState<PropertyType>('single_family');
  const [unitCount, setUnitCount] = useState(1);
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [closingCosts, setClosingCosts] = useState(0);
  const [renovation, setRenovation] = useState(0);
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [interestRate, setInterestRate] = useState(7);
  const [loanTermYears, setLoanTermYears] = useState(30);
  const [isCashPurchase, setIsCashPurchase] = useState(false);
  const [nightlyRate, setNightlyRate] = useState(0);
  const [occupancyPct, setOccupancyPct] = useState(65);
  const [avgStayNights, setAvgStayNights] = useState(3);
  const [expenses, setExpenses] = useState(DEFAULT_EXPENSES.map((e) => ({ ...e })));

  const stepIndex = STEPS.indexOf(step);
  const canPrev = stepIndex > 0;
  const canNext = stepIndex < STEPS.length - 1;
  const isLast = stepIndex === STEPS.length - 1;

  const prev = () => canPrev && setStep(STEPS[stepIndex - 1]);
  const next = () => {
    if (step === 'basics' && !name.trim()) {
      showToast('Property name is required', 'error');
      return;
    }
    if (canNext) setStep(STEPS[stepIndex + 1]);
  };

  const save = async () => {
    setSaving(true);
    try {
      const property = await api.createProperty({
        name, address, city, state, zip, property_type: propertyType, unit_count: unitCount,
      });
      const id = property.id;
      await Promise.all([
        api.updateAcquisition(id, { purchase_price: purchasePrice, closing_costs: closingCosts, renovation }),
        api.updateFinancing(id, { down_payment_pct: downPaymentPct, interest_rate: interestRate, loan_term_years: loanTermYears, is_cash_purchase: isCashPurchase }),
        api.updateIncome(id, { nightly_rate: nightlyRate, occupancy_pct: occupancyPct, avg_stay_nights: avgStayNights }),
      ]);
      for (const exp of expenses) {
        if (exp.amount > 0) await api.createExpense(id, exp);
      }
      showToast('Property created!', 'success');
      setPage({ name: 'property', id });
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <button onClick={() => setPage({ name: 'dashboard' })} className="text-stone hover:text-ink text-xs font-medium mb-3 block transition-colors">
          &larr; Back to Portfolio
        </button>
        <h2 className="font-serif text-3xl text-ink tracking-tight">New Property</h2>
        <p className="font-serif italic text-stone mt-0.5">Step {stepIndex + 1} of {STEPS.length}</p>
      </div>

      {/* Step indicator — connected dots */}
      <div className="flex items-center mb-10">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <button
              onClick={() => i < stepIndex && setStep(STEPS[i])}
              className="flex flex-col items-center relative group"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-medium
                    transition-all duration-300 border-2
                    ${i < stepIndex ? 'bg-emerald border-emerald text-white' :
                      i === stepIndex ? 'bg-white border-emerald text-emerald shadow-card' :
                      'bg-parchment border-sand text-stone'}`}>
                {i < stepIndex ? '\u2713' : i + 1}
              </div>
              <span className={`text-[10px] font-medium uppercase tracking-wider mt-2 transition-colors
                    ${i === stepIndex ? 'text-emerald' : i < stepIndex ? 'text-ink' : 'text-stone'}`}>
                {STEP_LABELS[s]}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-2 transition-colors ${i < stepIndex ? 'bg-emerald' : 'bg-sand'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="bg-white border border-sand/50 rounded-lg p-7 shadow-card mb-8 animate-scale-in" key={step}>
        {step === 'basics' && (
          <div className="space-y-5">
            <div>
              <label className="field-label">Property Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Mountain Cabin Retreat" className="input-field" />
            </div>
            <div>
              <label className="field-label">Address</label>
              <input value={address} onChange={(e) => setAddress(e.target.value)} className="input-field" />
            </div>
            <div className="grid grid-cols-6 gap-3">
              <div className="col-span-3">
                <label className="field-label">City</label>
                <input value={city} onChange={(e) => setCity(e.target.value)} className="input-field" />
              </div>
              <div className="col-span-1">
                <label className="field-label">State</label>
                <input value={state} onChange={(e) => setState(e.target.value)} maxLength={2}
                  className="input-field uppercase" />
              </div>
              <div className="col-span-2">
                <label className="field-label">Zip</label>
                <input value={zip} onChange={(e) => setZip(e.target.value)} className="input-field" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="field-label">Type</label>
                <select value={propertyType} onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                  className="input-field">
                  {PROPERTY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="field-label">Unit Count</label>
                <input type="number" value={unitCount} onChange={(e) => setUnitCount(parseInt(e.target.value) || 1)}
                  min={1} className="input-mono" />
              </div>
            </div>
          </div>
        )}

        {step === 'acquisition' && (
          <div className="space-y-5">
            <CurrencyInput label="Purchase Price" value={purchasePrice} onChange={setPurchasePrice} />
            <CurrencyInput label="Closing Costs" value={closingCosts} onChange={setClosingCosts} />
            <CurrencyInput label="Renovation / Furnishing" value={renovation} onChange={setRenovation} />
            {purchasePrice > 0 && (
              <div className="pt-4 border-t border-sand/50">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-stone font-medium">Total Investment</span>
                  <span className="font-mono font-medium text-lg text-ink">
                    ${(purchasePrice + closingCosts + renovation).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 'financing' && (
          <div className="space-y-5">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all
                ${isCashPurchase ? 'bg-emerald border-emerald text-white' : 'border-sand group-hover:border-stone'}`}>
                {isCashPurchase && <span className="text-xs">&#10003;</span>}
              </div>
              <input type="checkbox" checked={isCashPurchase} onChange={(e) => setIsCashPurchase(e.target.checked)}
                className="hidden" />
              <span className="text-sm text-ink font-medium">Cash Purchase <span className="text-stone font-normal">(no loan)</span></span>
            </label>
            {!isCashPurchase && (
              <>
                <PercentInput label="Down Payment" value={downPaymentPct} onChange={setDownPaymentPct} step={5} />
                <PercentInput label="Interest Rate" value={interestRate} onChange={setInterestRate} step={0.125} />
                <div>
                  <label className="field-label">Loan Term</label>
                  <select value={loanTermYears} onChange={(e) => setLoanTermYears(parseInt(e.target.value))}
                    className="input-field">
                    <option value={15}>15 Years</option>
                    <option value={20}>20 Years</option>
                    <option value={25}>25 Years</option>
                    <option value={30}>30 Years</option>
                  </select>
                </div>
                {purchasePrice > 0 && (
                  <div className="pt-4 border-t border-sand/50 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-stone">Down Payment</span>
                      <span className="font-mono text-ink">${Math.round(purchasePrice * downPaymentPct / 100).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-stone">Loan Amount</span>
                      <span className="font-mono text-ink">${Math.round(purchasePrice * (1 - downPaymentPct / 100)).toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {step === 'income' && (
          <div className="space-y-5">
            <CurrencyInput label="Nightly Rate" value={nightlyRate} onChange={setNightlyRate} />
            <PercentInput label="Expected Occupancy" value={occupancyPct} onChange={setOccupancyPct} step={5} />
            <div>
              <label className="field-label">Average Stay (Nights)</label>
              <input type="number" value={avgStayNights} onChange={(e) => setAvgStayNights(parseFloat(e.target.value) || 3)}
                step={0.5} min={1} className="input-mono" />
            </div>
            {nightlyRate > 0 && (
              <div className="pt-4 border-t border-sand/50 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-stone">Monthly Revenue</span>
                  <span className="font-mono text-emerald-dark">${Math.round(nightlyRate * 30 * occupancyPct / 100).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone">Annual Revenue</span>
                  <span className="font-mono text-emerald-dark">${Math.round(nightlyRate * 30 * occupancyPct / 100 * 12).toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 'expenses' && (
          <div className="space-y-4">
            <p className="text-sm text-stone">
              Costs that occur each guest checkout (cleaning, laundry) should use <em className="font-serif">per turnover</em>.
            </p>
            <div className="space-y-2.5">
              {expenses.map((exp, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-4">
                    {i === 0 && <label className="field-label">Category</label>}
                    <input value={exp.label} readOnly className="input-field bg-parchment/50 text-charcoal" />
                  </div>
                  <div className="col-span-4">
                    {i === 0 && <label className="field-label">Amount</label>}
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone font-mono text-xs">$</span>
                      <input type="number" value={exp.amount || ''} onChange={(e) => {
                        const updated = [...expenses];
                        updated[i] = { ...exp, amount: parseFloat(e.target.value) || 0 };
                        setExpenses(updated);
                      }} className="input-mono pl-7" />
                    </div>
                  </div>
                  <div className="col-span-4">
                    {i === 0 && <label className="field-label">Frequency</label>}
                    <select value={exp.frequency} onChange={(e) => {
                      const updated = [...expenses];
                      updated[i] = { ...exp, frequency: e.target.value as ExpenseFrequency };
                      setExpenses(updated);
                    }} className="input-field">
                      <option value="monthly">Monthly</option>
                      <option value="annual">Annual</option>
                      <option value="per_turnover">Per Turnover</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button onClick={prev} disabled={!canPrev}
          className="text-sm text-stone hover:text-ink font-medium disabled:opacity-0 transition-all">
          &larr; Back
        </button>
        {isLast ? (
          <button onClick={save} disabled={saving}
            className="bg-emerald hover:bg-emerald-dark text-white px-7 py-2.5 rounded-md text-sm font-semibold
                       disabled:opacity-50 transition-colors shadow-card">
            {saving ? 'Creating...' : 'Create Property'}
          </button>
        ) : (
          <button onClick={next}
            className="bg-ink hover:bg-espresso text-cream px-7 py-2.5 rounded-md text-sm font-medium
                       transition-colors shadow-card">
            Continue &rarr;
          </button>
        )}
      </div>
    </div>
  );
}
