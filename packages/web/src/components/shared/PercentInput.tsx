interface PercentInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
}

export default function PercentInput({ label, value, onChange, step = 0.5 }: PercentInputProps) {
  return (
    <div>
      <label className="block text-xs text-scout-muted mb-1">{label}</label>
      <div className="relative">
        <input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          step={step}
          className="w-full bg-scout-bg border border-scout-border rounded-lg pl-3 pr-8 py-2 text-white
                     font-mono text-sm focus:outline-none focus:border-scout-accent"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-scout-muted">%</span>
      </div>
    </div>
  );
}
