interface PercentInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
}

export default function PercentInput({ label, value, onChange, step = 0.5 }: PercentInputProps) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <div className="relative">
        <input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          step={step}
          className="input-mono pr-8"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone font-mono text-sm">%</span>
      </div>
    </div>
  );
}
