import { cn } from "@/lib/utils";

interface CircularGaugeProps {
  value: number;
  max?: number;
  color?: string;
  className?: string;
  strokeWidth?: number;
}

export function CircularGauge({
  value,
  max = 100,
  className,
  color = "text-primary",
  strokeWidth = 4,
}: CircularGaugeProps) {
  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const safeValue = Math.min(Math.max(value, 0), max);
  const offset = circumference - (safeValue / max) * circumference;

  return (
    <div
      className={cn("relative shrink-0", className)}
      role="progressbar"
      aria-valuenow={safeValue}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <svg className="size-full -rotate-90" viewBox="0 0 24 24">
        <circle
          cx="12"
          cy="12"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/20"
        />
        <circle
          cx="12"
          cy="12"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn("transition-all duration-500 ease-out", color)}
        />
      </svg>
    </div>
  );
}
