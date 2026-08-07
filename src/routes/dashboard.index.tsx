import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Activity, ArrowUpRight, Bone, ClipboardCheck, Target, Upload } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Disclaimer, PageHeader, StatusBadge } from "@/components/shared";
import { ConfidenceBar } from "@/components/confidence";
import { useI18n } from "@/lib/i18n";
import { api, type DashboardStats } from "@/lib/api";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({
    meta: [
      { title: "Dashboard — MedVision AI" },
      {
        name: "description",
        content: "Overview of analyses, pending reviews and model accuracy in your MedVision AI workspace.",
      },
      { property: "og:title", content: "Dashboard — MedVision AI" },
      { property: "og:description", content: "Your clinical AI imaging workspace at a glance." },
    ],
  }),
  component: DashboardHome,
});

function DashboardHome() {
  const { t, tt } = useI18n();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api.dashboard.stats().then((data) => {
      if (active) {
        setStats(data);
        setLoading(false);
      }
    }).catch(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const statsList = useMemo(() => {
    if (!stats) return [];
    return [
      { labelKey: "dash.stat.total", value: stats.totalAnalyses, deltaKey: "dash.stat.totalDelta", icon: Activity },
      { labelKey: "dash.stat.recent", value: stats.recentAnalyses, deltaKey: "dash.stat.recentDelta", icon: Bone },
      { labelKey: "dash.stat.pending", value: stats.pendingReviews, deltaKey: "dash.stat.pendingDelta", icon: ClipboardCheck },
      { labelKey: "dash.stat.accuracy", value: stats.modelAccuracy, deltaKey: "dash.stat.accuracyDelta", icon: Target },
    ];
  }, [stats]);

  if (loading || !stats) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const recent = stats.recentRecords;

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
         title={t("dash.greeting")}
         description={t("dash.sub")}
      >
        <Button asChild>
          <Link to="/dashboard/upload">
            <Upload className="h-4 w-4" aria-hidden="true" />
             {t("dash.new")}
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statsList.map((s) => (
          <Card key={s.labelKey} className="shadow-soft">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <p className="text-sm text-muted-foreground">{t(s.labelKey)}</p>
                <s.icon className="h-4 w-4 text-primary" aria-hidden="true" />
              </div>
              <p className="mt-3 font-display text-3xl font-bold tabular-nums">{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t(s.deltaKey)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="shadow-soft lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display text-base">{t("dash.chart.title")}</CardTitle>
            <CardDescription>{t("dash.chart.desc")}</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.weeklyVolume} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" />
                <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" />
                <ReTooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: "0.6rem",
                    fontSize: 12,
                    color: "var(--popover-foreground)",
                  }}
                />
                 <Bar dataKey="chest" name={t("common.chest")} fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                 <Bar dataKey="bone" name={t("common.bone")} fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="font-display text-base">{t("dash.top.title")}</CardTitle>
            <CardDescription>{t("dash.top.desc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Pneumonia", confidence: 82 },
              { label: t("dash.top.fractures"), confidence: 64 },
              { label: "Cardiomegaly", confidence: 47 },
              { label: "Pleural Effusion", confidence: 33 },
              { label: "Tuberculosis", confidence: 21 },
            ].map((f) => (
              <ConfidenceBar key={f.label} label={tt(f.label)} value={f.confidence} />
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-display text-base">{t("dash.recent.title")}</CardTitle>
            <CardDescription>{t("dash.recent.desc")}</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard/history">
              {t("common.viewAll")}
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {recent.map((a) => (
            <Link
              key={a.id}
              to="/dashboard/analysis/$id"
              params={{ id: a.id }}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-accent/50"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                {a.type === "chest" ? (
                  <Activity className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Bone className="h-4 w-4" aria-hidden="true" />
                )}
              </span>
              <div className="min-w-40">
                <p className="text-sm font-semibold">{a.patientName}</p>
                <p className="text-xs text-muted-foreground">
                  {a.patientId} · {new Date(a.date).toLocaleDateString()}
                </p>
              </div>
              <div className="min-w-40">
                <p className="text-sm">{tt(a.primary)}</p>
                <p className="text-xs text-muted-foreground">
                  {a.type === "chest" ? t("res.chestStudy") : `${t("common.bone")} · ${tt(a.bodyPart)}`}
                </p>
              </div>
              <span className="font-mono text-sm tabular-nums text-muted-foreground">
                {a.confidence}%
              </span>
              <span className="ml-auto">
                <StatusBadge status={a.status} />
              </span>
            </Link>
          ))}
        </CardContent>
      </Card>

      <Disclaimer className="mt-6" />
    </div>
  );
}
