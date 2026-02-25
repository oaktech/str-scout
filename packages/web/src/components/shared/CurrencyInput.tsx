interface CurrencyInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
}

export default function CurrencyInput({ label, value, onChange, placeholder }: CurrencyInputProps) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone font-mono text-sm">$</span>
        <input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          placeholder={placeholder}
          className="input-mono pl-7"
        />
      </div>
    </div>
  );
}
