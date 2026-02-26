import { useState } from 'react';
import { useStore } from '../store';
import * as api from '../services/api';
import CurrencyInput from './shared/CurrencyInput';
import PercentInput from './shared/PercentInput';
import AddressAutocomplete from './shared/AddressAutocomplete';
import type { PropertyType, ExpenseFrequency } from '../types';
import type { PropertyLookupData } from '../services/api';

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
  basics: 'Basics',
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

  // Basics
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [propertyType, setPropertyType] = useState<PropertyType>('single_family');
  const [unitCount, setUnitCount] = useState(1);

  // Acquisition
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [closingCosts, setClosingCosts] = useState(0);
  const [renovation, setRenovation] = useState(0);

  // Financing
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [interestRate, setInterestRate] = useState(7);
  const [loanTermYears, setLoanTermYears] = useState(30);
  const [isCashPurchase, setIsCashPurchase] = useState(false);

  // Income
  const [nightlyRate, setNightlyRate] = useState(0);
  const [occupancyPct, setOccupancyPct] = useState(65);
  const [avgStayNights, setAvgStayNights] = useState(3);

  // Expenses
  const [expenses, setExpenses] = useState(DEFAULT_EXPENSES.map((e) => ({ ...e })));

  // Property lookup — store raw data, apply per-step on user action
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupData, setLookupData] = useState<PropertyLookupData | null>(null);
  const [dismissedSteps, setDismissedSteps] = useState<Set<Step>>(new Set());
  const [appliedFields, setAppliedFields] = useState<Set<string>>(new Set());

  const hasLookupForStep = (s: Step): boolean => {
    if (!lookupData || dismissedSteps.has(s)) return false;
    if (s === 'basics') return !!(lookupData.propertyType || (lookupData.unitCount && lookupData.unitCount > 1));
    if (s === 'acquisition') return !!lookupData.estimatedValue;
    if (s === 'expenses') return !!(lookupData.taxAssessment || lookupData.insuranceEstimate);
    return false;
  };

  const dismissLookup = (s: Step) => {
    setDismissedSteps((prev) => new Set(prev).add(s));
  };

  const applyBasicsLookup = () => {
    if (!lookupData) return;
    const applied = new Set(appliedFields);
    if (lookupData.propertyType) {
      setPropertyType(lookupData.propertyType as PropertyType);
      applied.add('propertyType');
    }
    if (lookupData.unitCount && lookupData.unitCount > 0) {
      setUnitCount(lookupData.unitCount);
      applied.add('unitCount');
    }
    setAppliedFields(applied);
    setDismissedSteps((prev) => new Set(prev).add('basics'));
  };

  const applyAcquisitionLookup = () => {
    if (!lookupData) return;
    const applied = new Set(appliedFields);
    if (lookupData.estimatedValue) {
      setPurchasePrice(lookupData.estimatedValue);
      applied.add('purchasePrice');
    }
    setAppliedFields(applied);
    setDismissedSteps((prev) => new Set(prev).add('acquisition'));
  };

  const applyExpensesLookup = () => {
    if (!lookupData) return;
    const applied = new Set(appliedFields);
    setExpenses((prev) => prev.map((exp) => {
      if (exp.category === 'property_tax' && lookupData.taxAssessment) {
        applied.add('property_tax');
        return { ...exp, amount: lookupData.taxAssessment };
      }
      if (exp.category === 'insurance' && lookupData.insuranceEstimate) {
        applied.add('insurance');
        return { ...exp, amount: lookupData.insuranceEstimate };
      }
      return exp;
    }));
    setAppliedFields(applied);
    setDismissedSteps((prev) => new Set(prev).add('expenses'));
  };

  const handleAddressSelect = async ({ address: addr, city: c, state: s, zip: z }: { address: string; city: string; state: string; zip: string }) => {
    setAddress(addr);
    if (c) setCity(c);
    if (s) setState(s);
    if (z) setZip(z);

    // Reset previous lookup state
    setLookupData(null);
    setDismissedSteps(new Set());
    setAppliedFields(new Set());

    if (addr) {
      setLookingUp(true);
      try {
        const data = await api.lookupProperty(addr, c, s, z);
        if (data) {
          setLookupData(data);
          showToast('Property records found — review on each step', 'info');
        }
      } catch {
        // Lookup is optional — silently ignore errors
      } finally {
        setLookingUp(false);
      }
    }
  };

  const fmtDollars = (n: number) => '$' + n.toLocaleString();

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
        if (exp.amount > 0) {
          await api.createExpense(id, exp);
        }
      }

      showToast('Property created!', 'success');
      setPage({ name: 'property', id });
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = `w-full bg-scout-soot border border-scout-ash rounded-lg px-3 py-2.5 text-scout-bone text-sm
                       focus:outline-none focus:border-scout-mint/50 focus:ring-1 focus:ring-scout-mint/20
                       placeholder:text-scout-flint transition-colors`;

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div className="mb-8">
        <h2 className="font-display text-3xl text-scout-bone">Add Property</h2>
        <div className="divider mt-3 w-24" />
      </div>

      {/* Connected dot step indicator */}
      <div className="flex items-center mb-10 max-w-xl">
        {STEPS.map((s, i) => {
          const isActive = i === stepIndex;
          const isComplete = i < stepIndex;
          return (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              {/* Dot */}
              <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full border-2 transition-all duration-300
                  ${isActive
                    ? 'border-scout-mint bg-scout-mint scale-125'
                    : isComplete
                      ? 'border-scout-mint bg-scout-mint/30'
                      : 'border-scout-flint bg-transparent'}`}
                />
                <span className={`text-[10px] mt-2 uppercase tracking-[0.08em] font-medium whitespace-nowrap
                  ${isActive ? 'text-scout-mint' : isComplete ? 'text-scout-fossil' : 'text-scout-flint'}`}>
                  {STEP_LABELS[s]}
                </span>
              </div>
              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-2 mt-[-18px] transition-colors duration-300
                  ${i < stepIndex ? 'bg-scout-mint/40' : 'bg-scout-ash'}`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <div className="bg-scout-carbon border border-scout-ash rounded-lg p-6 mb-6 animate-fade-in">
        {step === 'basics' && (
          <div className="space-y-4 max-w-lg">
            <div>
              <label className="block text-[11px] text-scout-drift uppercase tracking-[0.08em] font-medium mb-1.5">Property Name *</label>
              <input
                value={name} onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Mountain Cabin Retreat"
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-[11px] text-scout-drift uppercase tracking-[0.08em] font-medium mb-1.5">Address</label>
                <AddressAutocomplete
                  value={address}
                  onChange={setAddress}
                  onSelect={handleAddressSelect}
                />
                {lookingUp && (
                  <p className="text-xs text-scout-drift mt-1.5 animate-pulse">Looking up property details...</p>
                )}
              </div>
              <div>
                <label className="block text-[11px] text-scout-drift uppercase tracking-[0.08em] font-medium mb-1.5">City</label>
                <input value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-scout-drift uppercase tracking-[0.08em] font-medium mb-1.5">State</label>
                  <input value={state} onChange={(e) => setState(e.target.value)} maxLength={2} className={inputClass} />
                </div>
                <div>
                  <label className="block text-[11px] text-scout-drift uppercase tracking-[0.08em] font-medium mb-1.5">Zip</label>
                  <input value={zip} onChange={(e) => setZip(e.target.value)} className={inputClass} />
                </div>
              </div>
            </div>

            {/* Lookup banner — basics */}
            {hasLookupForStep('basics') && lookupData && (
              <div className="border border-scout-mint/20 bg-scout-mint/5 rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <p className="text-xs font-medium text-scout-mint uppercase tracking-[0.08em]">Property Records Found</p>
                  <button onClick={() => dismissLookup('basics')} className="text-[10px] text-scout-flint hover:text-scout-fossil">dismiss</button>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                  {lookupData.propertyType && (
                    <div className="flex justify-between"><span className="text-scout-drift">Type</span><span className="text-scout-bone font-mono">{PROPERTY_TYPES.find((t) => t.value === lookupData.propertyType)?.label ?? lookupData.propertyType}</span></div>
                  )}
                  {lookupData.unitCount != null && lookupData.unitCount > 0 && (
                    <div className="flex justify-between"><span className="text-scout-drift">Units</span><span className="text-scout-bone font-mono">{lookupData.unitCount}</span></div>
                  )}
                  {lookupData.bedrooms != null && (
                    <div className="flex justify-between"><span className="text-scout-drift">Beds</span><span className="text-scout-bone font-mono">{lookupData.bedrooms}</span></div>
                  )}
                  {lookupData.bathrooms != null && (
                    <div className="flex justify-between"><span className="text-scout-drift">Baths</span><span className="text-scout-bone font-mono">{lookupData.bathrooms}</span></div>
                  )}
                  {lookupData.sqft != null && (
                    <div className="flex justify-between"><span className="text-scout-drift">Sq Ft</span><span className="text-scout-bone font-mono">{lookupData.sqft.toLocaleString()}</span></div>
                  )}
                  {lookupData.yearBuilt != null && (
                    <div className="flex justify-between"><span className="text-scout-drift">Year Built</span><span className="text-scout-bone font-mono">{lookupData.yearBuilt}</span></div>
                  )}
                </div>
                <button onClick={applyBasicsLookup}
                  className="w-full text-center text-xs font-medium text-scout-mint border border-scout-mint/30 rounded-md py-1.5 hover:bg-scout-mint/10 transition-colors">
                  Use type &amp; unit count
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] text-scout-drift uppercase tracking-[0.08em] font-medium mb-1.5">
                  Type{appliedFields.has('propertyType') && <span className="text-scout-mint/70 normal-case tracking-normal font-normal ml-1">from records</span>}
                </label>
                <select value={propertyType} onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                  className={`${inputClass} ${appliedFields.has('propertyType') ? 'border-scout-mint/30' : ''}`}>
                  {PROPERTY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-scout-drift uppercase tracking-[0.08em] font-medium mb-1.5">
                  Units{appliedFields.has('unitCount') && <span className="text-scout-mint/70 normal-case tracking-normal font-normal ml-1">from records</span>}
                </label>
                <input type="number" value={unitCount} onChange={(e) => setUnitCount(parseInt(e.target.value) || 1)} min={1}
                  className={`${inputClass} font-mono ${appliedFields.has('unitCount') ? 'border-scout-mint/30' : ''}`} />
              </div>
            </div>
          </div>
        )}

        {step === 'acquisition' && (
          <div className="space-y-4 max-w-lg">
            {/* Lookup banner — acquisition */}
            {hasLookupForStep('acquisition') && lookupData && (
              <div className="border border-scout-mint/20 bg-scout-mint/5 rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <p className="text-xs font-medium text-scout-mint uppercase tracking-[0.08em]">Estimated Value Found</p>
                  <button onClick={() => dismissLookup('acquisition')} className="text-[10px] text-scout-flint hover:text-scout-fossil">dismiss</button>
                </div>
                <div className="text-xs text-scout-drift space-y-1">
                  <div className="flex justify-between"><span>Estimated Value</span><span className="text-scout-bone font-mono">{fmtDollars(lookupData.estimatedValue!)}</span></div>
                  {lookupData.sqft != null && lookupData.estimatedValue != null && (
                    <div className="flex justify-between"><span>Price / Sq Ft</span><span className="text-scout-bone font-mono">{fmtDollars(Math.round(lookupData.estimatedValue / lookupData.sqft))}</span></div>
                  )}
                </div>
                <button onClick={applyAcquisitionLookup}
                  className="w-full text-center text-xs font-medium text-scout-mint border border-scout-mint/30 rounded-md py-1.5 hover:bg-scout-mint/10 transition-colors">
                  Use as purchase price
                </button>
              </div>
            )}

            <CurrencyInput
              label={appliedFields.has('purchasePrice') ? 'Purchase Price (from records)' : 'Purchase Price'}
              value={purchasePrice}
              onChange={setPurchasePrice}
            />
            <CurrencyInput label="Closing Costs" value={closingCosts} onChange={setClosingCosts} />
            <CurrencyInput label="Renovation / Furnishing" value={renovation} onChange={setRenovation} />
            {purchasePrice > 0 && (
              <div className="text-xs text-scout-drift border-t border-scout-ash pt-3 mt-4">
                Total Investment: <span className="text-scout-bone font-mono">${(purchasePrice + closingCosts + renovation).toLocaleString()}</span>
              </div>
            )}
          </div>
        )}

        {step === 'financing' && (
          <div className="space-y-4 max-w-lg">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={isCashPurchase} onChange={(e) => setIsCashPurchase(e.target.checked)}
                className="rounded border-scout-flint bg-scout-soot accent-scout-mint" />
              <span className="text-sm text-scout-chalk">Cash Purchase (no loan)</span>
            </label>
            {!isCashPurchase && (
              <>
                <PercentInput label="Down Payment" value={downPaymentPct} onChange={setDownPaymentPct} step={5} />
                <PercentInput label="Interest Rate" value={interestRate} onChange={setInterestRate} step={0.125} />
                <div>
                  <label className="block text-[11px] text-scout-drift uppercase tracking-[0.08em] font-medium mb-1.5">Loan Term (Years)</label>
                  <select value={loanTermYears} onChange={(e) => setLoanTermYears(parseInt(e.target.value))}
                    className={inputClass}>
                    <option value={15}>15 Years</option>
                    <option value={20}>20 Years</option>
                    <option value={25}>25 Years</option>
                    <option value={30}>30 Years</option>
                  </select>
                </div>
                {purchasePrice > 0 && (
                  <div className="text-xs text-scout-drift border-t border-scout-ash pt-3 space-y-1">
                    <div>Down Payment: <span className="text-scout-bone font-mono">${Math.round(purchasePrice * downPaymentPct / 100).toLocaleString()}</span></div>
                    <div>Loan Amount: <span className="text-scout-bone font-mono">${Math.round(purchasePrice * (1 - downPaymentPct / 100)).toLocaleString()}</span></div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {step === 'income' && (
          <div className="space-y-4 max-w-lg">
            <CurrencyInput label="Nightly Rate" value={nightlyRate} onChange={setNightlyRate} />
            <PercentInput label="Expected Occupancy" value={occupancyPct} onChange={setOccupancyPct} step={5} />
            <div>
              <label className="block text-[11px] text-scout-drift uppercase tracking-[0.08em] font-medium mb-1.5">Average Stay (Nights)</label>
              <input type="number" value={avgStayNights} onChange={(e) => setAvgStayNights(parseFloat(e.target.value) || 3)} step={0.5} min={1}
                className={`${inputClass} font-mono`} />
            </div>
            {nightlyRate > 0 && (
              <div className="text-xs text-scout-drift border-t border-scout-ash pt-3 space-y-1">
                <div>Monthly Revenue: <span className="text-scout-mint font-mono">${Math.round(nightlyRate * 30 * occupancyPct / 100).toLocaleString()}</span></div>
                <div>Annual Revenue: <span className="text-scout-mint font-mono">${Math.round(nightlyRate * 30 * occupancyPct / 100 * 12).toLocaleString()}</span></div>
              </div>
            )}
          </div>
        )}

        {step === 'expenses' && (
          <div className="space-y-3">
            <p className="text-xs text-scout-drift mb-4">
              Enter your expected operating expenses. Use "per turnover" for costs that occur each guest checkout (e.g., cleaning).
            </p>

            {/* Lookup banner — expenses */}
            {hasLookupForStep('expenses') && lookupData && (
              <div className="border border-scout-mint/20 bg-scout-mint/5 rounded-lg p-4 space-y-3 mb-2">
                <div className="flex items-start justify-between">
                  <p className="text-xs font-medium text-scout-mint uppercase tracking-[0.08em]">Tax &amp; Insurance Estimates</p>
                  <button onClick={() => dismissLookup('expenses')} className="text-[10px] text-scout-flint hover:text-scout-fossil">dismiss</button>
                </div>
                <div className="text-xs text-scout-drift space-y-1">
                  {lookupData.taxAssessment != null && (
                    <div className="flex justify-between"><span>Property Tax (annual)</span><span className="text-scout-bone font-mono">{fmtDollars(lookupData.taxAssessment)}</span></div>
                  )}
                  {lookupData.insuranceEstimate != null && (
                    <div className="flex justify-between"><span>Insurance est. (annual, ~0.5% of value)</span><span className="text-scout-bone font-mono">{fmtDollars(lookupData.insuranceEstimate)}</span></div>
                  )}
                </div>
                <button onClick={applyExpensesLookup}
                  className="w-full text-center text-xs font-medium text-scout-mint border border-scout-mint/30 rounded-md py-1.5 hover:bg-scout-mint/10 transition-colors">
                  Use these amounts
                </button>
              </div>
            )}

            {expenses.map((exp, i) => {
              const isApplied = appliedFields.has(exp.category);
              return (
                <div key={i} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-4">
                    {i === 0 && <label className="block text-[10px] text-scout-drift uppercase tracking-[0.08em] font-medium mb-1.5">Category</label>}
                    <input value={exp.label} readOnly
                      className={`${inputClass} cursor-default`} />
                  </div>
                  <div className="col-span-4">
                    {i === 0 && <label className="block text-[10px] text-scout-drift uppercase tracking-[0.08em] font-medium mb-1.5">Amount ($){isApplied ? '' : ''}</label>}
                    <input type="number" value={exp.amount || ''} onChange={(e) => {
                      const updated = [...expenses];
                      updated[i] = { ...exp, amount: parseFloat(e.target.value) || 0 };
                      setExpenses(updated);
                    }}
                      className={`${inputClass} font-mono ${isApplied ? 'border-scout-mint/30' : ''}`} />
                  </div>
                  <div className="col-span-4">
                    {i === 0 && <label className="block text-[10px] text-scout-drift uppercase tracking-[0.08em] font-medium mb-1.5">Frequency</label>}
                    <select value={exp.frequency} onChange={(e) => {
                      const updated = [...expenses];
                      updated[i] = { ...exp, frequency: e.target.value as ExpenseFrequency };
                      setExpenses(updated);
                    }}
                      className={inputClass}>
                      <option value="monthly">Monthly</option>
                      <option value="annual">Annual</option>
                      <option value="per_turnover">Per Turnover</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between">
        <button onClick={prev} disabled={!canPrev}
          className="px-4 py-2.5 rounded-lg text-sm font-medium text-scout-fossil hover:text-scout-chalk
                     disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          &larr; Back
        </button>
        {isLast ? (
          <button onClick={save} disabled={saving}
            className="bg-scout-mint text-scout-void px-6 py-2.5 rounded-lg text-sm font-semibold
                       hover:bg-scout-mint/90 disabled:opacity-50 transition-colors">
            {saving ? 'Creating...' : 'Create Property'}
          </button>
        ) : (
          <button onClick={next}
            className="bg-scout-mint/10 border border-scout-mint/20 text-scout-mint px-6 py-2.5 rounded-lg text-sm
                       font-medium hover:bg-scout-mint/20 transition-colors">
            Next &rarr;
          </button>
        )}
      </div>
    </div>
  );
}
