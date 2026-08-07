import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

export function ConfidenceBar({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: number;
  emphasis?: boolean;
}) {
  const { t } = useI18n();
  const tone =
    value >= 70 ? "bg-primary" : value >= 40 ? "bg-teal" : "bg-muted-foreground/40";

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span
          className={cn(
            "text-sm",
            emphasis ? "font-semibold text-foreground" : "text-muted-foreground",
          )}
        >
          {label}
        </span>
        <span className="font-mono text-xs tabular-nums text-muted-foreground">{value}%</span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label={`${label} ${t("common.confidence")}`}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn("h-full rounded-full transition-[width] duration-700 ease-out", tone)}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export function ConfidenceGauge({ value, size = 148 }: { value: number; size?: number }) {
  const { t } = useI18n();
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          className="stroke-muted"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          strokeLinecap="round"
          className="stroke-primary transition-[stroke-dashoffset] duration-1000 ease-out"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute text-center">
        <div className="font-display text-3xl font-bold tabular-nums text-foreground">{value}%</div>
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{t("common.confidence")}</div>
      </div>
    </div>
  );
}
