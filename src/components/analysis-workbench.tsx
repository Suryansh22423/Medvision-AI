import { useNavigate } from "@tanstack/react-router";
import { useRef, useState, useEffect } from "react";
import { Activity, Bone, FileImage, Loader2, Sparkles, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Disclaimer, PageHeader, PrivacyBadge } from "@/components/shared";
import { BONE_PARTS, type AnalysisType } from "@/lib/mock-data";
import { saveAnalysis } from "@/lib/analysis-store";
import { listPatients } from "@/lib/patient-store";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { api, type Patient } from "@/lib/api";

const STAGES = [
  "Validating study integrity…",
  "Preprocessing image (normalisation, resize)…",
  "Running AI model ensemble…",
  "Localising regions of interest…",
  "Generating preliminary report…",
];

export function AnalysisWorkbench({ type }: { type: AnalysisType }) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const isChest = type === "chest";
  const [patients, setPatients] = useState<Patient[]>([]);

  useEffect(() => {
    listPatients().then((data) => setPatients(data));
  }, []);

  const [bodyPart, setBodyPart] = useState("");
  const [detectingBodyPart, setDetectingBodyPart] = useState(false);
  const [bodyPartConfidence, setBodyPartConfidence] = useState<number | null>(null);
  const [linkedPatient, setLinkedPatient] = useState("");
  const [file, setFile] = useState<{ name: string; size: number; url: string } | null>(null);
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [patient, setPatient] = useState({ id: "", name: "", age: "", gender: "", notes: "" });
  const [stage, setStage] = useState(-1);

  const accept = (list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    if (!/\.(png|jpe?g|dcm|dicom)$/i.test(f.name)) {
      toast.error("Unsupported file — use PNG, JPG or DICOM.");
      return;
    }
    setRawFile(f);
    setFile({ name: f.name, size: f.size, url: URL.createObjectURL(f) });
    toast.success(`${f.name} ready for analysis`);

    if (!isChest) {
      setBodyPart("");
      setBodyPartConfidence(null);
      setDetectingBodyPart(true);
      api.analyses
        .detectBodyPart(f)
        .then((result) => {
          setBodyPart(result.bodyPart);
          setBodyPartConfidence(result.confidence);
          toast.success(`Detected ${result.bodyPart} (${result.confidence}% confidence)`);
        })
        .catch((err) => {
          toast.error("Could not auto-detect body part — please select manually.");
          console.error(err);
        })
        .finally(() => setDetectingBodyPart(false));
    }
  };

  const analyzing = stage >= 0;

  const analyze = () => {
    if (!rawFile) {
      toast.error("Upload an X-ray image first.");
      return;
    }
    if (!isChest && !bodyPart && !detectingBodyPart) {
      toast.error("Select the body part for fracture analysis.");
      return;
    }
    if (detectingBodyPart) {
      toast.error("Still detecting body part — please wait a moment.");
      return;
    }
    setStage(0);
    let i = 0;
    const tick = window.setInterval(() => {
      i += 1;
      if (i >= STAGES.length) {
        window.clearInterval(tick);
        const linked = patients.find((p) => p.id === linkedPatient);
        api.analyses.upload(type, rawFile, {
          bodyPart: isChest ? undefined : bodyPart,
          patientId: linked?.id || patient.id || undefined,
          patientName: linked?.name || patient.name || undefined,
          age: linked ? linked.age : (patient.age ? Number(patient.age) : undefined),
          gender: linked?.gender || patient.gender || undefined,
          notes: patient.notes || undefined,
        }).then((record) => {
          toast.success("Analysis complete");
          navigate({ to: "/dashboard/analysis/$id", params: { id: record.id } });
        }).catch((err) => {
          toast.error("Failed to run analysis: " + err.message);
          setStage(-1);
        });
        return;
      }
      setStage(i);
    }, 800);
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={isChest ? t("chest.title") : t("bone.title")}
        description={isChest ? t("chest.desc") : t("bone.desc")}
      >
        <PrivacyBadge />
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div className="space-y-6">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-base">
                {isChest ? (
                  <Activity className="h-4 w-4 text-primary" aria-hidden="true" />
                ) : (
                  <Bone className="h-4 w-4 text-teal" aria-hidden="true" />
                )}
                Study file
              </CardTitle>
              <CardDescription>Drop the radiograph or browse from your workstation.</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                role="button"
                tabIndex={0}
                aria-label="Upload X-ray image"
                onClick={() => inputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    inputRef.current?.click();
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  accept(e.dataTransfer.files);
                }}
                className={cn(
                  "flex min-h-56 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200",
                  dragging
                    ? "scale-[1.01] border-primary bg-primary/5"
                    : "border-border bg-muted/40 hover:bg-accent/40",
                )}
              >
                {file ? (
                  <>
                    <img
                      src={file.url}
                      alt="Uploaded X-ray preview"
                      className="max-h-44 animate-in fade-in rounded-lg border border-border object-contain"
                    />
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                  </>
                ) : (
                  <>
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                      <Upload className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <p className="font-display text-base font-semibold">{t("upload.drop")}</p>
                    <p className="max-w-xs text-sm text-muted-foreground">{t("upload.browse")}</p>
                  </>
                )}
                <input
                  ref={inputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.dcm,.dicom,image/*"
                  className="hidden"
                  onChange={(e) => accept(e.target.files)}
                />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
                  <FileImage className="h-4 w-4" aria-hidden="true" />
                  Browse files
                </Button>
                {file ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      setFile(null);
                      setRawFile(null);
                      setBodyPart("");
                      setBodyPartConfidence(null);
                    }}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Remove file
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {!isChest ? (
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="font-display text-base">Body part</CardTitle>
                <CardDescription>
                  {detectingBodyPart
                    ? "Analyzing image to detect the anatomical region…"
                    : bodyPartConfidence
                      ? `Auto-detected with ${bodyPartConfidence}% confidence — adjust if needed.`
                      : "Auto-detected on upload — selects the regional fracture model."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={bodyPart} onValueChange={setBodyPart} disabled={detectingBodyPart}>
                  <SelectTrigger id="body-part" aria-label="Body part">
                    {detectingBodyPart ? (
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        Detecting…
                      </span>
                    ) : (
                      <SelectValue placeholder="Select body part" />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {BONE_PARTS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="font-display text-base">Model coverage</CardTitle>
                <CardDescription>
                  Multi-label screening across pneumonia, tuberculosis, pneumothorax, cardiomegaly,
                  pleural effusion, atelectasis, oedema, nodules and consolidation.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="font-display text-base">Patient linking</CardTitle>
              <CardDescription>Attach the study to an existing record, or enter details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="link-patient">Existing patient</Label>
                <Select value={linkedPatient} onValueChange={setLinkedPatient}>
                  <SelectTrigger id="link-patient">
                    <SelectValue placeholder="Not linked" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} · {p.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!linkedPatient ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pid">Patient ID</Label>
                      <Input
                        id="pid"
                        placeholder="PT-1043"
                        value={patient.id}
                        onChange={(e) => setPatient((p) => ({ ...p, id: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="page">Age</Label>
                      <Input
                        id="page"
                        type="number"
                        min={0}
                        placeholder="54"
                        value={patient.age}
                        onChange={(e) => setPatient((p) => ({ ...p, age: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pname">Full name</Label>
                    <Input
                      id="pname"
                      placeholder="Amara Okafor"
                      value={patient.name}
                      onChange={(e) => setPatient((p) => ({ ...p, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pgender">Gender</Label>
                    <Select
                      value={patient.gender}
                      onValueChange={(v) => setPatient((p) => ({ ...p, gender: v }))}
                    >
                      <SelectTrigger id="pgender">
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
                </>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="pnotes">Clinical notes</Label>
                <Textarea
                  id="pnotes"
                  rows={3}
                  placeholder="Presenting complaint, duration, relevant history…"
                  value={patient.notes}
                  onChange={(e) => setPatient((p) => ({ ...p, notes: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          {analyzing ? (
            <Card className="shadow-card">
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
                  <div>
                    <p className="font-display text-sm font-semibold">Analysis in progress</p>
                    <p className="text-xs text-muted-foreground" aria-live="polite">
                      {STAGES[stage]}
                    </p>
                  </div>
                </div>
                <Progress value={((stage + 1) / STAGES.length) * 100} />
                <ul className="space-y-1.5 text-xs">
                  {STAGES.map((s, i) => (
                    <li
                      key={s}
                      className={cn(
                        "flex items-center gap-2 transition-colors",
                        i <= stage ? "text-foreground" : "text-muted-foreground/60",
                      )}
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          i < stage
                            ? "bg-success"
                            : i === stage
                              ? "animate-pulse bg-primary"
                              : "bg-muted-foreground/40",
                        )}
                      />
                      {s}
                    </li>
                  ))}
                </ul>
                <div className="space-y-2 pt-2">
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-24 w-full" />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Button size="lg" className="w-full" onClick={analyze}>
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              {isChest ? t("chest.cta") : t("bone.cta")}
            </Button>
          )}
        </div>
      </div>

      <Disclaimer className="mt-6" />
    </div>
  );
}
