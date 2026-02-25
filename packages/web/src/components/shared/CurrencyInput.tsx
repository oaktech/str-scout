interface CurrencyInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
}

export default function CurrencyInput({ label, value, onChange, placeholder }: CurrencyInputProps) {
  return (
    <div>
      <label className="block text-[11px] text-scout-drift uppercase tracking-[0.08em] font-medium mb-1.5">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-scout-fossil font-mono text-sm">$</span>
        <input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          placeholder={placeholder}
          className="w-full bg-scout-soot border border-scout-ash rounded-lg pl-7 pr-3 py-2.5 text-scout-bone
                     font-mono text-sm focus:outline-none focus:border-scout-mint/50 focus:ring-1 focus:ring-scout-mint/20
                     placeholder:text-scout-flint transition-colors"
        />
      </div>
    </div>
  );
}
