interface MetricBadgeProps {
  value: number;
  thresholds: { green: number; yellow: number; invert?: boolean };
  format: (v: number) => string;
}

export default function MetricBadge({ value, thresholds, format }: MetricBadgeProps) {
  let color: string;

  if (thresholds.invert) {
    color = value < thresholds.green ? 'bg-scout-mint/10 text-scout-mint border border-scout-mint/20'
      : value < thresholds.yellow ? 'bg-scout-amber/10 text-scout-amber border border-scout-amber/20'
      : 'bg-scout-rose/10 text-scout-rose border border-scout-rose/20';
  } else {
    color = value > thresholds.green ? 'bg-scout-mint/10 text-scout-mint border border-scout-mint/20'
      : value > thresholds.yellow ? 'bg-scout-amber/10 text-scout-amber border border-scout-amber/20'
      : 'bg-scout-rose/10 text-scout-rose border border-scout-rose/20';
  }

  return (
    <span className={`${color} px-2 py-0.5 rounded text-xs font-mono font-medium inline-block`}>
      {format(value)}
    </span>
  );
}
