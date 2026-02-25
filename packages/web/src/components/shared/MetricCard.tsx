interface MetricCardProps {
  label: string;
  value: string;
  subtext?: string;
  color?: 'green' | 'yellow' | 'red' | 'default';
}

const BORDER_COLORS = {
  green: 'border-l-scout-mint',
  yellow: 'border-l-scout-amber',
  red: 'border-l-scout-rose',
  default: 'border-l-scout-flint',
};

const VALUE_COLORS = {
  green: 'text-scout-mint',
  yellow: 'text-scout-amber',
  red: 'text-scout-rose',
  default: 'text-scout-bone',
};

export default function MetricCard({ label, value, subtext, color = 'default' }: MetricCardProps) {
  return (
    <div className={`bg-scout-carbon border border-scout-ash rounded-lg p-4 border-l-2 ${BORDER_COLORS[color]}
                      hover:bg-scout-ash/50 transition-colors duration-200`}>
      <div className="text-[10px] text-scout-drift uppercase tracking-[0.12em] font-body font-medium mb-1.5">{label}</div>
      <div className={`text-xl font-semibold font-mono ${VALUE_COLORS[color]} tracking-tight`}>{value}</div>
      {subtext && <div className="text-[11px] text-scout-fossil mt-1">{subtext}</div>}
    </div>
  );
}
