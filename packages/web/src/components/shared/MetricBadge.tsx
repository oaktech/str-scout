interface MetricBadgeProps {
  value: number;
  thresholds: { green: number; yellow: number; invert?: boolean };
  format: (v: number) => string;
}

export default function MetricBadge({ value, thresholds, format }: MetricBadgeProps) {
  let dotColor: string;
  let textColor: string;

  if (thresholds.invert) {
    dotColor = value < thresholds.green ? 'bg-emerald'
      : value < thresholds.yellow ? 'bg-gold'
      : 'bg-coral';
    textColor = value < thresholds.green ? 'text-emerald-dark'
      : value < thresholds.yellow ? 'text-gold-dark'
      : 'text-coral';
  } else {
    dotColor = value > thresholds.green ? 'bg-emerald'
      : value > thresholds.yellow ? 'bg-gold'
      : 'bg-coral';
    textColor = value > thresholds.green ? 'text-emerald-dark'
      : value > thresholds.yellow ? 'text-gold-dark'
      : 'text-coral';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-sm font-medium ${textColor}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {format(value)}
    </span>
  );
}
