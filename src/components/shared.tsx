import { Badge } from "@/components/ui/badge";
import { Info, Lock } from "lucide-react";
import type { AnalysisStatus, Severity } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

export function StatusBadge({ status }: { status: AnalysisStatus }) {
  const { t } = useI18n();
  const map: Record<AnalysisStatus, string> = {
    reviewed: "bg-success/12 text-success border-success/30",
    pending: "bg-warning/15 text-warning-foreground border-warning/40",
    flagged: "bg-destructive/10 text-destructive border-destructive/30",
    archived: "bg-muted text-muted-foreground border-border",
  };
  return (
    <Badge variant="outline" className={cn("font-medium", map[status])}>
      {t(`status.${status}`)}
    </Badge>
  );
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  const { t } = useI18n();
  const map: Record<Severity, string> = {
    mild: "bg-success/12 text-success border-success/30",
    moderate: "bg-warning/15 text-warning-foreground border-warning/40",
    severe: "bg-destructive/12 text-destructive border-destructive/30",
  };
  return (
    <Badge variant="outline" className={cn("gap-1.5 font-medium", map[severity])}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {t(`sev.${severity}`)} {t("sev.suffix")}
    </Badge>
  );
}

export function PrivacyBadge({ className }: { className?: string }) {
  const { t } = useI18n();
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 border-teal/40 bg-teal/10 font-medium text-teal-foreground", className)}
    >
      <Lock className="h-3 w-3" aria-hidden="true" />
      {t("common.privacy")}
    </Badge>
  );
}

export function Disclaimer({ className }: { className?: string }) {
  const { t } = useI18n();
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border border-border bg-accent/50 p-4 text-sm text-accent-foreground",
        className,
      )}
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p>
        <span className="font-semibold">{t("disc.strong")}</span> — {t("disc.text")}
      </p>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-bold text-foreground">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
      <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-accent text-accent-foreground">
        <Icon className="h-7 w-7" aria-hidden="true" />
      </span>
      <h3 className="font-display text-base font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
