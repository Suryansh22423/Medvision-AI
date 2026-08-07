import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Activity, ArrowLeft, Bone, CalendarClock, Columns2, FileText, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { EmptyState, PageHeader, PrivacyBadge, SeverityBadge, StatusBadge } from "@/components/shared";
import { XrayViewer } from "@/components/xray-viewer";
import { ConfidenceBar } from "@/components/confidence";
import { listAnalyses } from "@/lib/analysis-store";
import { getPatient } from "@/lib/patient-store";
import { severityFor } from "@/lib/mock-data";
import type { Patient, AnalysisRecord } from "@/lib/api";

export const Route = createFileRoute("/dashboard/patients/$id")({
  head: () => ({
    meta: [
      { title: "Patient record — MedVision AI" },
      {
        name: "description",
        content: "Private patient record with full imaging timeline and side-by-side scan comparison.",
      },
      { property: "og:title", content: "Patient record — MedVision AI" },
      {
        property: "og:description",
        content: "Scan history timeline, linked reports and comparison view for a single patient.",
      },
    ],
  }),
  component: PatientDetail,
});

function PatientDetail() {
  const { id } = Route.useParams();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [studies, setStudies] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([getPatient(id), listAnalyses()]).then(([p, allAnalyses]) => {
      if (active) {
        setPatient(p || null);
        setStudies(allAnalyses.filter((a) => a.patientId === id));
        setLoading(false);
      }
    }).catch(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [id]);

  const [compare, setCompare] = useState(false);
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");

  // Sync left/right states when studies load
  useEffect(() => {
    if (studies.length > 0) {
      setLeft(studies[0]?.id ?? "");
      setRight(studies[1]?.id ?? studies[0]?.id ?? "");
    }
  }, [studies]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!patient) throw notFound();

  const leftStudy = studies.find((s) => s.id === left);
  const rightStudy = studies.find((s) => s.id === right);

  return (
    <div className="mx-auto max-w-7xl">
      <Button variant="ghost" size="sm" asChild className="mb-3 -ml-2">
        <Link to="/dashboard/patients">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Patient directory
        </Link>
      </Button>

      <PageHeader title={patient.name} description={`${patient.id} · ${patient.condition}`}>
        <div className="flex flex-wrap items-center gap-2">
          <PrivacyBadge />
          {studies.length > 1 ? (
            <Button variant={compare ? "default" : "outline"} onClick={() => setCompare((c) => !c)}>
              <Columns2 className="h-4 w-4" aria-hidden="true" />
              Comparison view
            </Button>
          ) : null}
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr]">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-base">
              <UserRound className="h-4 w-4 text-primary" aria-hidden="true" />
              Demographics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {(
              [
                ["Patient ID", patient.id],
                ["Age", `${patient.age}`],
                ["Gender", patient.gender],
                ["Last visit", new Date(patient.lastVisit).toLocaleDateString()],
                ["Linked studies", `${studies.length}`],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-medium">{v}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-base">
              <CalendarClock className="h-4 w-4 text-primary" aria-hidden="true" />
              Scan history timeline
            </CardTitle>
            <CardDescription>Chronological imaging record for this patient.</CardDescription>
          </CardHeader>
          <CardContent>
            {studies.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No studies linked yet"
                description="Upload a chest or bone X-ray and link it to this patient to build the timeline."
                action={
                  <Button asChild>
                    <Link to="/dashboard/chest">Start an analysis</Link>
                  </Button>
                }
              />
            ) : (
              <ol className="relative space-y-5 border-l border-border pl-6">
                {studies.map((s) => (
                  <li key={s.id} className="relative">
                    <span className="absolute -left-[1.9rem] top-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card">
                      {s.type === "chest" ? (
                        <Activity className="h-3 w-3 text-primary" aria-hidden="true" />
                      ) : (
                        <Bone className="h-3 w-3 text-teal" aria-hidden="true" />
                      )}
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to="/dashboard/analysis/$id"
                        params={{ id: s.id }}
                        className="font-display text-sm font-semibold hover:underline"
                      >
                        {s.primary}
                      </Link>
                      <StatusBadge status={s.status} />
                      <SeverityBadge severity={severityFor(s.confidence, s.primary)} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(s.date).toLocaleString()} · {s.id} ·{" "}
                      {s.type === "chest" ? "Chest" : `Bone — ${s.bodyPart}`} · {s.confidence}%
                      confidence
                    </p>
                    <div className="mt-2 max-w-sm">
                      <ConfidenceBar label={s.primary} value={s.confidence} />
                    </div>

                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>

      {compare && studies.length > 1 ? (
        <Card className="mt-6 shadow-card">
          <CardHeader>
            <CardTitle className="font-display text-base">Side-by-side comparison</CardTitle>
            <CardDescription>Compare two studies for this patient.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {(
                [
                  ["Study A", left, setLeft, leftStudy] as const,
                  ["Study B", right, setRight, rightStudy] as const,
                ]
              ).map(([label, value, setter, study]) => (
                <div key={label} className="space-y-3">
                  <Select value={value} onValueChange={setter}>
                    <SelectTrigger aria-label={label}>
                      <SelectValue placeholder={label} />
                    </SelectTrigger>
                    <SelectContent>
                      {studies.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {new Date(s.date).toLocaleDateString()} — {s.primary}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <XrayViewer
                    src={study?.imageUrl}
                    alt={`${label} — ${study?.primary ?? "study"}`}
                    compact
                  />
                  {study ? (
                    <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3 text-xs">
                      <p className="font-display text-sm font-semibold">{study.primary}</p>
                      <Separator />
                      <p className="text-muted-foreground">{study.report.impression}</p>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
