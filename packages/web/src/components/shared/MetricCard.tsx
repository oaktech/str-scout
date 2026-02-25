interface MetricCardProps {
  label: string;
  value: string;
  subtext?: string;
  color?: 'green' | 'yellow' | 'red' | 'default';
}

export default function MetricCard({ label, value, subtext, color = 'default' }: MetricCardProps) {
  const borderClass =
    color === 'green'  ? 'metric-positive' :
    color === 'yellow' ? 'metric-caution' :
    color === 'red'    ? 'metric-negative' :
    'metric-neutral';

  const valueColor =
    color === 'green'  ? 'text-emerald-dark' :
    color === 'yellow' ? 'text-gold-dark' :
    color === 'red'    ? 'text-coral' :
    'text-ink';

  return (
    <div className={`bg-white rounded-md p-4 shadow-card ${borderClass} animate-slide-up`}>
      <div className="field-label !mb-2">{label}</div>
      <div className={`text-[22px] font-mono font-medium tracking-tight ${valueColor}`}>
        {value}
      </div>
      {subtext && <div className="text-xs text-stone mt-1.5">{subtext}</div>}
    </div>
  );
}
