import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Bone,
  Download,
  Activity,
  FileSearch,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfidenceBar, ConfidenceGauge } from "@/components/confidence";
import { XrayViewer } from "@/components/xray-viewer";
import { Disclaimer, EmptyState, StatusBadge } from "@/components/shared";
import { getAnalysis, updateStatus } from "@/lib/analysis-store";
import type { AnalysisStatus } from "@/lib/mock-data";
import { useI18n } from "@/lib/i18n";
import type { AnalysisRecord } from "@/lib/api";

export const Route = createFileRoute("/dashboard/analysis/$id")({
  head: () => ({
    meta: [
      { title: "Analysis Detail — MedVision AI" },
      {
        name: "description",
        content:
          "Side-by-side X-ray viewer with AI confidence scores, localization and preliminary report.",
      },
      { property: "og:title", content: "Analysis Detail — MedVision AI" },
      {
        property: "og:description",
        content: "Review AI findings, confidence bars and the preliminary radiology report.",
      },
    ],
  }),
  component: AnalysisDetail,
});

function AnalysisDetail() {
  const { t, tt } = useI18n();
  const { id } = useParams({ from: "/dashboard/analysis/$id" });
  const [record, setRecord] = useState<AnalysisRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<AnalysisStatus>("pending");
  const [pdfOpen, setPdfOpen] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getAnalysis(id).then((data) => {
      if (active && data) {
        setRecord(data);
        setStatus(data.status);
        setLoading(false);
      } else if (active) {
        setLoading(false);
      }
    }).catch(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="mx-auto max-w-3xl">
        <EmptyState
          icon={FileSearch}
          title={t("res.notFound")}
          description={t("res.notFoundDesc")}
          action={
            <Button asChild>
              <Link to="/dashboard/history">{t("res.back")}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const boxes =
    record.type === "chest"
      ? [{ x: 52, y: 30, w: 26, h: 24, label: `${record.primary} ${record.confidence}%` }]
      : [{ x: 38, y: 46, w: 24, h: 18, label: `${record.primary} ${record.confidence}%` }];

  return (
    <div className="mx-auto max-w-7xl">
      <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
        <Link to="/dashboard/history">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t("res.back")}
        </Link>
      </Button>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1.5">
              {record.type === "chest" ? (
                <Activity className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Bone className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {record.type === "chest" ? t("res.chestStudy") : `${t("common.bone")} · ${tt(record.bodyPart)}`}
            </Badge>
            <StatusBadge status={status} />
          </div>
          <h1 className="mt-2 font-display text-2xl font-bold">{record.patientName}</h1>
          <p className="text-sm text-muted-foreground">
            {record.patientId} · {record.age ? `${record.age}y · ` : ""}
            {record.gender ? `${record.gender} · ` : ""}
             {t("res.study")} {record.id} · {new Date(record.date).toLocaleString()}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => toast.success(t("res.toast.saved"))}>
            <Save className="h-4 w-4" aria-hidden="true" />
            {t("res.save")}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              updateStatus(record.id, "reviewed").then(() => {
                setStatus("reviewed");
                toast.success(t("res.toast.reviewed"));
              }).catch((err) => {
                toast.error("Failed to update status: " + err.message);
              });
            }}
          >
            <BadgeCheck className="h-4 w-4" aria-hidden="true" />
            {t("res.reviewed")}
          </Button>
          <Button onClick={() => setPdfOpen(true)}>
            <Download className="h-4 w-4" aria-hidden="true" />
            {t("common.download")}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="font-display text-base">{t("res.viewer")}</CardTitle>
            <CardDescription>{t("res.viewerDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <XrayViewer src={record.imageUrl} alt={`${record.type} X-ray for ${record.patientName}`} boxes={boxes} />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="font-display text-base">{t("res.primary")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-6">
              <ConfidenceGauge value={record.confidence} />
              <div className="min-w-40 flex-1">
                <p className="font-display text-xl font-bold">{tt(record.primary)}</p>
                {record.fractureType ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{t("res.fractureType")}:</span>{" "}
                    {tt(record.fractureType)}
                  </p>
                ) : null}
                {record.localization ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{t("res.localization")}:</span>{" "}
                    {record.localization}
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="font-display text-base">{t("res.all")}</CardTitle>
              <CardDescription>{t("res.allDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {record.findings.map((f, i) => (
                <ConfidenceBar key={f.label} label={tt(f.label)} value={f.confidence} emphasis={i === 0} />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="mt-6 shadow-soft">
        <CardHeader>
          <CardTitle className="font-display text-base">{t("res.report")}</CardTitle>
          <CardDescription>{t("res.reportDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 text-sm leading-relaxed">
          {(
            [
              [t("res.findings"), record.report.findings],
              [t("res.impression"), record.report.impression],
              [t("res.recommendations"), record.report.recommendations],
            ] as const
          ).map(([heading, body]) => (
            <div key={heading}>
              <h3 className="font-display text-xs font-bold uppercase tracking-wider text-primary">
                {heading}
              </h3>
              <p className="mt-1.5 text-muted-foreground">{body}</p>
            </div>
          ))}
          {record.notes ? (
            <div>
              <h3 className="font-display text-xs font-bold uppercase tracking-wider text-primary">
                {t("common.notes")}
              </h3>
              <p className="mt-1.5 text-muted-foreground">{record.notes}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Disclaimer className="mt-6" />

      <Dialog open={pdfOpen} onOpenChange={setPdfOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">{t("res.export")} {record.id}</DialogTitle>
            <DialogDescription>
              {t("res.exportDesc")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPdfOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => {
                setPdfOpen(false);
                window.open(`http://localhost:8000/reports/${record.id}/pdf`, "_blank");
                toast.success(t("common.download.done", { id: record.id }));
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
