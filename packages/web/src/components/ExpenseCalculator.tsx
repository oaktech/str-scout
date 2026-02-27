import { useMemo } from 'react';
import type { ExpenseFrequency } from '../types';

export type { ExpenseFrequency };

export interface ExpenseItem {
  key: string;
  label: string;
  group: string;
  amount: number;
  frequency: ExpenseFrequency;
}

export const DEFAULT_EXPENSE_ITEMS: ExpenseItem[] = [
  // Property
  { key: 'insurance', label: 'Insurance', group: 'Property', amount: 0, frequency: 'annual' },
  { key: 'property_tax', label: 'Property Tax', group: 'Property', amount: 0, frequency: 'annual' },
  { key: 'hoa', label: 'HOA', group: 'Property', amount: 0, frequency: 'monthly' },
  // Maintenance
  { key: 'maintenance', label: 'Maintenance Reserve', group: 'Maintenance', amount: 0, frequency: 'monthly' },
  { key: 'repairs', label: 'Repairs', group: 'Maintenance', amount: 0, frequency: 'annual' },
  { key: 'pest_control', label: 'Pest Control', group: 'Maintenance', amount: 0, frequency: 'monthly' },
  { key: 'pool', label: 'Pool Service', group: 'Maintenance', amount: 0, frequency: 'monthly' },
  { key: 'lawn', label: 'Lawn Care', group: 'Maintenance', amount: 0, frequency: 'monthly' },
  // Utilities
  { key: 'utilities', label: 'Total Utilities', group: 'Utilities', amount: 0, frequency: 'monthly' },
  // Operations
  { key: 'management', label: 'Property Management', group: 'Operations', amount: 0, frequency: 'monthly' },
  { key: 'cleaning', label: 'Cleaning (per turnover)', group: 'Operations', amount: 0, frequency: 'per_stay' },
  { key: 'supplies', label: 'Supplies', group: 'Operations', amount: 0, frequency: 'monthly' },
];

const GROUPS = ['Property', 'Maintenance', 'Utilities', 'Operations'];

const FREQ_LABELS: Record<ExpenseFrequency, string> = {
  monthly: 'mo',
  annual: 'yr',
  per_stay: 'stay',
};

const FREQ_CYCLE: Record<ExpenseFrequency, ExpenseFrequency> = {
  monthly: 'annual',
  annual: 'monthly',
  per_stay: 'monthly',
};

interface Props {
  open: boolean;
  onClose: () => void;
  items: ExpenseItem[];
  onChange: (items: ExpenseItem[]) => void;
  onApply: (total: number) => void;
  staysPerYear: number;
  onStaysChange: (stays: number) => void;
}

export function calcAnnualTotal(items: ExpenseItem[], staysPerYear: number): number {
  return items.reduce((sum, item) => {
    if (!item.amount) return sum;
    if (item.frequency === 'monthly') return sum + item.amount * 12;
    if (item.frequency === 'per_stay') return sum + item.amount * staysPerYear;
    return sum + item.amount;
  }, 0);
}

export default function ExpenseCalculator({ open, onClose, items, onChange, onApply, staysPerYear, onStaysChange }: Props) {
  const grouped = useMemo(() => {
    const map = new Map<string, ExpenseItem[]>();
    for (const g of GROUPS) map.set(g, []);
    for (const item of items) {
      const list = map.get(item.group);
      if (list) list.push(item);
    }
    return map;
  }, [items]);

  const total = useMemo(() => calcAnnualTotal(items, staysPerYear), [items, staysPerYear]);

  const updateItem = (key: string, amount: number) => {
    onChange(items.map((item) => (item.key === key ? { ...item, amount } : item)));
  };

  const toggleFrequency = (key: string) => {
    onChange(items.map((item) => (item.key === key ? { ...item, frequency: FREQ_CYCLE[item.frequency] } : item)));
  };

  const handleApply = () => {
    onApply(total);
    onClose();
  };

  function annualized(item: ExpenseItem): number | null {
    if (!item.amount || item.frequency === 'annual') return null;
    if (item.frequency === 'monthly') return item.amount * 12;
    if (item.frequency === 'per_stay') return item.amount * staysPerYear;
    return null;
  }

  const inputClass = `w-full bg-scout-soot border border-scout-ash rounded-lg pl-7 pr-3 py-2 text-scout-bone
                       font-mono text-sm focus:outline-none focus:border-scout-mint/50 focus:ring-1 focus:ring-scout-mint/20
                       placeholder:text-scout-flint transition-colors`;

  return (
    <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`}>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`absolute right-0 top-0 h-full w-[440px] max-w-full bg-scout-carbon border-l border-scout-ash
                     flex flex-col transform transition-transform duration-300 ease-out
                     ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-scout-ash shrink-0">
          <div>
            <h3 className="font-display text-lg text-scout-bone">Expense Calculator</h3>
            <p className="text-[11px] text-scout-drift mt-0.5">Enter known amounts &mdash; click frequency to toggle</p>
          </div>
          <button onClick={onClose} className="text-scout-flint hover:text-scout-fossil text-xl leading-none">&times;</button>
        </div>

        {/* Stays per year */}
        <div className="px-6 py-3 border-b border-scout-ash/50 flex items-center gap-3">
          <label className="text-[11px] text-scout-drift uppercase tracking-[0.08em] font-medium whitespace-nowrap">Est. stays / year</label>
          <input
            type="number"
            value={staysPerYear || ''}
            onChange={(e) => onStaysChange(parseInt(e.target.value) || 0)}
            className="w-20 bg-scout-soot border border-scout-ash rounded-lg px-2.5 py-1.5 text-scout-bone
                       font-mono text-sm text-center focus:outline-none focus:border-scout-mint/50 focus:ring-1 focus:ring-scout-mint/20 transition-colors"
          />
          <span className="text-[11px] text-scout-flint">used for per-stay costs</span>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {GROUPS.map((group) => {
            const groupItems = grouped.get(group) || [];
            return (
              <div key={group}>
                <h4 className="text-[10px] text-scout-drift uppercase tracking-[0.12em] font-medium mb-2">{group}</h4>
                <div className="space-y-1.5">
                  {groupItems.map((item) => {
                    const ann = annualized(item);
                    return (
                      <div key={item.key} className="flex items-center gap-2">
                        <span className="text-xs text-scout-chalk w-40 shrink-0">{item.label}</span>
                        <div className="relative flex-1">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-scout-fossil font-mono text-xs">$</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={item.amount ? item.amount.toLocaleString('en-US') : ''}
                            onChange={(e) => updateItem(item.key, parseFloat(e.target.value.replace(/[^0-9.]/g, '')) || 0)}
                            placeholder="0"
                            className={inputClass}
                          />
                        </div>
                        {item.frequency === 'per_stay' ? (
                          <span className="text-[10px] text-scout-flint w-10 shrink-0 text-right">
                            /{FREQ_LABELS[item.frequency]}
                          </span>
                        ) : (
                          <button
                            onClick={() => toggleFrequency(item.key)}
                            className="text-[10px] text-scout-flint hover:text-scout-mint w-10 shrink-0 text-right transition-colors"
                            title="Click to change frequency"
                          >
                            /{FREQ_LABELS[item.frequency]}
                          </button>
                        )}
                        <span className="text-[10px] text-scout-fossil w-16 shrink-0 text-right font-mono">
                          {ann != null && item.amount > 0 ? `$${Math.round(ann).toLocaleString()}/yr` : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer — total + apply */}
        <div className="border-t border-scout-ash px-6 py-4 shrink-0 space-y-3">
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-scout-drift uppercase tracking-[0.08em] font-medium">Total Annual Expenses</span>
            <span className="text-lg text-scout-bone font-mono font-medium">${Math.round(total).toLocaleString()}</span>
          </div>
          {total > 0 && (
            <div className="flex justify-between text-xs text-scout-fossil">
              <span>Monthly</span>
              <span className="font-mono">${Math.round(total / 12).toLocaleString()}/mo</span>
            </div>
          )}
          <button
            onClick={handleApply}
            className="w-full bg-scout-mint text-scout-void py-2.5 rounded-lg text-sm font-semibold
                       hover:bg-scout-mint/90 transition-colors"
          >
            Apply ${Math.round(total).toLocaleString()} to expenses
          </button>
        </div>
      </div>
    </div>
  );
}
