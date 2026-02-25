interface MetricBadgeProps {
  value: number;
  thresholds: { green: number; yellow: number; invert?: boolean };
  format: (v: number) => string;
}

export default function MetricBadge({ value, thresholds, format }: MetricBadgeProps) {
  let color: string;

  if (thresholds.invert) {
    // Lower is better (e.g., break-even occupancy)
    color = value < thresholds.green ? 'bg-green-500/20 text-green-400'
      : value < thresholds.yellow ? 'bg-yellow-500/20 text-yellow-400'
      : 'bg-red-500/20 text-red-400';
  } else {
    // Higher is better (e.g., cash on cash)
    color = value > thresholds.green ? 'bg-green-500/20 text-green-400'
      : value > thresholds.yellow ? 'bg-yellow-500/20 text-yellow-400'
      : 'bg-red-500/20 text-red-400';
  }

  return (
    <span className={`${color} px-2 py-0.5 rounded text-xs font-mono font-medium`}>
      {format(value)}
    </span>
  );
}
