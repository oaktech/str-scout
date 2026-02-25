interface CurrencyInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
}

export default function CurrencyInput({ label, value, onChange, placeholder }: CurrencyInputProps) {
  return (
    <div>
      <label className="block text-xs text-scout-muted mb-1">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-scout-muted">$</span>
        <input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          placeholder={placeholder}
          className="w-full bg-scout-bg border border-scout-border rounded-lg pl-7 pr-3 py-2 text-white
                     font-mono text-sm focus:outline-none focus:border-scout-accent"
        />
      </div>
    </div>
  );
}
