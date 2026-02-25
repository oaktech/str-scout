interface PercentInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
}

export default function PercentInput({ label, value, onChange, step = 0.5 }: PercentInputProps) {
  return (
    <div>
      <label className="block text-[11px] text-scout-drift uppercase tracking-[0.08em] font-medium mb-1.5">{label}</label>
      <div className="relative">
        <input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          step={step}
          className="w-full bg-scout-soot border border-scout-ash rounded-lg pl-3 pr-8 py-2.5 text-scout-bone
                     font-mono text-sm focus:outline-none focus:border-scout-mint/50 focus:ring-1 focus:ring-scout-mint/20
                     placeholder:text-scout-flint transition-colors"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-scout-fossil font-mono text-sm">%</span>
      </div>
    </div>
  );
}
