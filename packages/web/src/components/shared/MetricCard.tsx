interface MetricCardProps {
  label: string;
  value: string;
  subtext?: string;
  color?: 'green' | 'yellow' | 'red' | 'default';
}

export default function MetricCard({ label, value, subtext, color = 'default' }: MetricCardProps) {
  const colorClass =
    color === 'green' ? 'text-green-400' :
    color === 'yellow' ? 'text-yellow-400' :
    color === 'red' ? 'text-red-400' :
    'text-white';

  return (
    <div className="bg-scout-surface border border-scout-border rounded-lg p-4">
      <div className="text-xs text-scout-muted uppercase tracking-wide mb-1">{label}</div>
      <div className={`text-xl font-semibold font-mono ${colorClass}`}>{value}</div>
      {subtext && <div className="text-xs text-scout-muted mt-1">{subtext}</div>}
    </div>
  );
}
