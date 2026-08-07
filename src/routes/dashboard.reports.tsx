import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Download, Eye, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader, StatusBadge } from "@/components/shared";
import { listAnalyses } from "@/lib/analysis-store";
import { useI18n } from "@/lib/i18n";
import type { AnalysisRecord } from "@/lib/api";

export const Route = createFileRoute("/dashboard/reports")({
  head: () => ({
    meta: [
      { title: "Reports — MedVision AI" },
      {
        name: "description",
        content: "Preview, download and re-issue AI-generated preliminary radiology reports.",
      },
      { property: "og:title", content: "Reports — MedVision AI" },
      { property: "og:description", content: "Library of preliminary AI radiology reports ready for sign-off." },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const { t, tt } = useI18n();
  const [reports, setReports] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<AnalysisRecord | null>(null);

  useEffect(() => {
    let active = true;
    listAnalyses().then((data) => {
      if (active) {
        setReports(data);
        setLoading(false);
      }
    }).catch(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title={t("reports.title")} description={t("reports.desc")} />

      <div className="grid gap-4 lg:grid-cols-2">
        {reports.map((r) => (
          <Card key={r.id} className="shadow-soft">
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <CardTitle className="font-display text-base">{tt(r.primary)}</CardTitle>
                <CardDescription>
                  {r.id} · {r.patientName} ({r.patientId}) ·{" "}
                  {new Date(r.date).toLocaleDateString()}
                </CardDescription>
              </div>
              <StatusBadge status={r.status} />
            </CardHeader>
            <CardContent>
              <p className="line-clamp-3 text-sm text-muted-foreground">{r.report.impression}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => setPreview(r)}>
                  <Eye className="h-4 w-4" aria-hidden="true" />
                   {t("reports.preview")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    window.open(`http://localhost:8000/reports/${r.id}/pdf`, "_blank");
                    toast.success(t("common.download.done", { id: r.id }));
                  }}
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  PDF
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/dashboard/analysis/$id" params={{ id: r.id }}>
                    <FileText className="h-4 w-4" aria-hidden="true" />
                     {t("reports.openStudy")}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!preview} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{t("reports.dialog")} · {preview?.id}</DialogTitle>
            <DialogDescription>
              {preview?.patientName} · {preview?.patientId} ·{" "}
              {preview ? new Date(preview.date).toLocaleString() : ""}
            </DialogDescription>
          </DialogHeader>
          {preview ? (
            <div className="space-y-5 rounded-lg border border-border bg-card p-5 text-sm leading-relaxed">
              {(
                [
                  [t("res.findings"), preview.report.findings],
                  [t("res.impression"), preview.report.impression],
                  [t("res.recommendations"), preview.report.recommendations],
                ] as const
              ).map(([heading, body]) => (
                <div key={heading}>
                  <h3 className="font-display text-xs font-bold uppercase tracking-wider text-primary">
                    {heading}
                  </h3>
                  <p className="mt-1.5 text-muted-foreground">{body}</p>
                </div>
              ))}
              <p className="border-t border-border pt-4 text-xs text-muted-foreground">
                {t("reports.discShort")}
              </p>
            </div>
          ) : null}
          <DialogFooter>
            <Button
              onClick={() => {
                if (preview) {
                  window.open(`http://localhost:8000/reports/${preview.id}/pdf`, "_blank");
                  toast.success(t("common.download.done", { id: preview.id }));
                }
                setPreview(null);
              }}
            >
              <Download className="h-4 w-4" aria-hidden="true" />
               {t("common.download")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
