import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Activity, Bone, Download, FileSearch, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, PageHeader, StatusBadge } from "@/components/shared";
import { listAnalyses } from "@/lib/analysis-store";
import { useI18n } from "@/lib/i18n";
import type { AnalysisRecord } from "@/lib/api";

export const Route = createFileRoute("/dashboard/history")({
  head: () => ({
    meta: [
      { title: "Analysis History — MedVision AI" },
      {
        name: "description",
        content: "Search and filter every chest and bone X-ray analysis run in your workspace.",
      },
      { property: "og:title", content: "Analysis History — MedVision AI" },
      {
        property: "og:description",
        content: "Full audit trail of AI-assisted radiograph analyses with confidence and status.",
      },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { t, tt } = useI18n();
  const [all, setAll] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    let active = true;
    listAnalyses().then((data) => {
      if (active) {
        setAll(data);
        setLoading(false);
      }
    }).catch(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const rows = useMemo(() => {
    return all.filter((a) => {
      const matchQ =
        !q ||
        [a.patientName, a.patientId, a.primary, a.id].join(" ").toLowerCase().includes(q.toLowerCase());
      return matchQ && (type === "all" || a.type === type) && (status === "all" || a.status === status);
    });
  }, [all, q, type, status]);

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title={t("history.title")} description={t("history.desc", { n: all.length })} />

      <Card className="shadow-soft">
        <CardContent className="p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap gap-3">
            <div className="relative min-w-56 flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                className="pl-9"
                placeholder={t("history.searchPh")}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label="Search analyses"
              />
            </div>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-40" aria-label="Filter by type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                 <SelectItem value="all">{t("type.all")}</SelectItem>
                 <SelectItem value="chest">{t("common.chest")}</SelectItem>
                 <SelectItem value="bone">{t("common.bone")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-44" aria-label="Filter by status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                 <SelectItem value="all">{t("status.all")}</SelectItem>
                 <SelectItem value="pending">{t("status.pending")}</SelectItem>
                 <SelectItem value="reviewed">{t("status.reviewed")}</SelectItem>
                 <SelectItem value="flagged">{t("status.flagged")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {rows.length === 0 ? (
            <EmptyState
              icon={FileSearch}
               title={t("history.empty")}
               description={t("history.emptyDesc")}
              action={
                <Button asChild>
                   <Link to="/dashboard/upload">{t("land.ctaUpload")}</Link>
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                     <TableHead>{t("common.date")}</TableHead>
                     <TableHead>{t("common.patient")}</TableHead>
                     <TableHead>{t("common.type")}</TableHead>
                     <TableHead>{t("common.prediction")}</TableHead>
                     <TableHead className="text-right">{t("common.confidence")}</TableHead>
                     <TableHead>{t("common.status")}</TableHead>
                     <TableHead className="text-right">{t("common.pdf")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((a) => (
                    <TableRow key={a.id} className="cursor-pointer">
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        <Link to="/dashboard/analysis/$id" params={{ id: a.id }} className="block">
                          {new Date(a.date).toLocaleDateString()}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link to="/dashboard/analysis/$id" params={{ id: a.id }} className="block">
                          <span className="font-medium">{a.patientName}</span>
                          <span className="block text-xs text-muted-foreground">{a.patientId}</span>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 text-sm">
                          {a.type === "chest" ? (
                            <Activity className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                          ) : (
                            <Bone className="h-3.5 w-3.5 text-teal" aria-hidden="true" />
                          )}
                           {a.type === "chest" ? t("common.chest") : `${t("common.bone")} · ${tt(a.bodyPart)}`}
                        </span>
                      </TableCell>
                       <TableCell>{tt(a.primary)}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {a.confidence}%
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={a.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Download PDF report for ${a.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            window.open(`http://localhost:8000/reports/${a.id}/pdf`, "_blank");
                            toast.success(t("common.download.done", { id: a.id }));
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
