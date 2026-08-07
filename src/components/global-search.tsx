import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Activity, Bone, Search, User } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { listAnalyses } from "@/lib/analysis-store";
import { listPatients } from "@/lib/patient-store";
import { useI18n } from "@/lib/i18n";

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useI18n();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const [analyses, setAnalyses] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      listAnalyses().then((data) => setAnalyses(data));
      listPatients().then((data) => setPatients(data));
    } else {
      setAnalyses([]);
      setPatients([]);
    }
  }, [open]);

  const go = (fn: () => void) => {
    setOpen(false);
    fn();
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-9 gap-2 text-muted-foreground sm:min-w-56 sm:justify-start"
        aria-label={t("top.search")}
      >
        <Search className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">{t("top.search")}</span>
        <kbd className="ml-auto hidden rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] sm:inline">
          ⌘K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder={`${t("top.search")}…`} />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Patients">
            {patients.slice(0, 8).map((p) => (
              <CommandItem
                key={p.id}
                value={`${p.name} ${p.id} ${p.condition}`}
                onSelect={() =>
                  go(() => navigate({ to: "/dashboard/patients/$id", params: { id: p.id } }))
                }
              >
                <User className="h-4 w-4 text-primary" aria-hidden="true" />
                <span className="flex-1">{p.name}</span>
                <span className="text-xs text-muted-foreground">{p.id}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Studies & reports">
            {analyses.slice(0, 10).map((a) => (
              <CommandItem
                key={a.id}
                value={`${a.id} ${a.patientName} ${a.primary}`}
                onSelect={() =>
                  go(() => navigate({ to: "/dashboard/analysis/$id", params: { id: a.id } }))
                }
              >
                {a.type === "chest" ? (
                  <Activity className="h-4 w-4 text-primary" aria-hidden="true" />
                ) : (
                  <Bone className="h-4 w-4 text-teal" aria-hidden="true" />
                )}
                <span className="flex-1 truncate">
                  {a.primary} — {a.patientName}
                </span>
                <span className="text-xs text-muted-foreground">{a.id}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
