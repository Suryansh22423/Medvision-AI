import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Search, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { EmptyState, PageHeader, PrivacyBadge } from "@/components/shared";
import { addPatient, listPatients } from "@/lib/patient-store";
import { useI18n } from "@/lib/i18n";
import type { Patient } from "@/lib/api";

export const Route = createFileRoute("/dashboard/patients/")({
  head: () => ({
    meta: [
      { title: "Patient Directory — MedVision AI" },
      {
        name: "description",
        content: "Private, searchable patient directory with linked imaging studies and reports.",
      },
      { property: "og:title", content: "Patient Directory — MedVision AI" },
      {
        property: "og:description",
        content: "Secure patient records with full scan history timelines.",
      },
    ],
  }),
  component: PatientsPage,
});

function PatientsPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [version, setVersion] = useState(0);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", age: "", gender: "", condition: "" });
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    listPatients().then((data) => {
      if (active) {
        setPatients(data);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [version]);

  const filtered = useMemo(() => {
    return patients.filter((p) =>
      `${p.name} ${p.id} ${p.condition}`.toLowerCase().includes(query.toLowerCase()),
    );
  }, [patients, query]);

  const submit = () => {
    if (!form.name.trim() || !form.age) {
      toast.error("Name and age are required.");
      return;
    }
    addPatient({
      name: form.name.trim(),
      age: Number(form.age),
      gender: form.gender || "Prefer not to say",
      condition: form.condition.trim(),
    }).then((created) => {
      setForm({ name: "", age: "", gender: "", condition: "" });
      setOpen(false);
      setVersion((v) => v + 1);
      toast.success(`${created.name} added as ${created.id}`);
    }).catch((err) => {
      toast.error("Failed to add patient: " + err.message);
    });
  };

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title={t("patients.title")} description={t("patients.desc")}>
        <div className="flex items-center gap-2">
          <PrivacyBadge />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                {t("patients.add")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="font-display">Add patient</DialogTitle>
                <DialogDescription>
                  Records are stored privately in this browser session only.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="np-name">Full name</Label>
                  <Input
                    id="np-name"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="np-age">Age</Label>
                    <Input
                      id="np-age"
                      type="number"
                      min={0}
                      value={form.age}
                      onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="np-gender">Gender</Label>
                    <Select
                      value={form.gender}
                      onValueChange={(v) => setForm((f) => ({ ...f, gender: v }))}
                    >
                      <SelectTrigger id="np-gender">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {["Female", "Male", "Other", "Prefer not to say"].map((g) => (
                          <SelectItem key={g} value={g}>
                            {g}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="np-cond">Presenting condition</Label>
                  <Input
                    id="np-cond"
                    placeholder="Suspected pneumonia"
                    value={form.condition}
                    onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  {t("common.cancel")}
                </Button>
                <Button onClick={submit}>Add patient</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </PageHeader>

      <Card className="shadow-soft">
        <CardContent className="p-4 sm:p-5">
          <div className="relative mb-4 max-w-sm">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              className="pl-9"
              placeholder="Search by name, ID or condition"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search patients"
            />
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No patients match your search"
              description="Try a different name or patient ID, or add a new patient record."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Age / Gender</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead>Last visit</TableHead>
                    <TableHead className="text-right">Studies</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => (
                    <TableRow
                      key={p.id}
                      className="cursor-pointer"
                      onClick={() => navigate({ to: "/dashboard/patients/$id", params: { id: p.id } })}
                    >
                      <TableCell className="font-medium">
                        <Link
                          to="/dashboard/patients/$id"
                          params={{ id: p.id }}
                          className="hover:underline"
                        >
                          {p.name}
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{p.id}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {p.age} · {p.gender}
                      </TableCell>
                      <TableCell className="text-sm">{p.condition}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(p.lastVisit).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right text-sm">{p.analyses}</TableCell>
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
