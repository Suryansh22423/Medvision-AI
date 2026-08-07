import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState, useEffect } from "react";
import { Activity, Bone, FileImage, Loader2, ScanLine, Sparkles, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Disclaimer, PageHeader } from "@/components/shared";
import { BONE_PARTS, type AnalysisType } from "@/lib/mock-data";
import { saveAnalysis } from "@/lib/analysis-store";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

export const Route = createFileRoute("/dashboard/upload")({
  head: () => ({
    meta: [
      { title: "Upload X-ray — MedVision AI" },
      {
        name: "description",
        content:
          "Drag and drop a chest or bone X-ray, add patient context and run AI-assisted analysis in seconds.",
      },
      { property: "og:title", content: "Upload X-ray — MedVision AI" },
      {
        property: "og:description",
        content: "Submit a radiograph for AI-assisted chest pathology or fracture analysis.",
      },
    ],
  }),
  component: UploadPage,
});

const STAGES = [
  "Validating study integrity…",
  "Preprocessing image (normalisation, resize)…",
  "Running AI model ensemble…",
  "Localising regions of interest…",
  "Generating preliminary report…",
];

function UploadPage() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [type, setType] = useState<AnalysisType>("chest");
  const [bodyPart, setBodyPart] = useState("");
  const [detectingBodyPart, setDetectingBodyPart] = useState(false);
  const [bodyPartConfidence, setBodyPartConfidence] = useState<number | null>(null);
  const [file, setFile] = useState<{ name: string; size: number; url: string } | null>(null);
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [patient, setPatient] = useState({ id: "", name: "", age: "", gender: "", notes: "" });
  const [stage, setStage] = useState(-1);

  useEffect(() => {
    if (type !== "bone") {
      setBodyPart("");
      setBodyPartConfidence(null);
      return;
    }
    if (!rawFile) return;

    let cancelled = false;
    setDetectingBodyPart(true);
    api.analyses
      .detectBodyPart(rawFile)
      .then((result) => {
        if (cancelled) return;
        setBodyPart(result.bodyPart);
        setBodyPartConfidence(result.confidence);
        toast.success(`Detected ${result.bodyPart} (${result.confidence}% confidence)`);
      })
      .catch((err) => {
        if (cancelled) return;
        toast.error("Could not auto-detect body part — please select manually.");
        console.error(err);
      })
      .finally(() => {
        if (!cancelled) setDetectingBodyPart(false);
      });

    return () => {
      cancelled = true;
    };
  }, [type, rawFile]);

  const accept = (list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    const ok = /\.(png|jpe?g|dcm|dicom)$/i.test(f.name);
    if (!ok) {
      toast.error("Unsupported file — use PNG, JPG or DICOM.");
      return;
    }
    setRawFile(f);
    setFile({ name: f.name, size: f.size, url: URL.createObjectURL(f) });
    toast.success(`${f.name} ready for analysis`);
  };

  const analyzing = stage >= 0;

  const analyze = () => {
    if (!rawFile) {
      toast.error("Upload an X-ray image first.");
      return;
    }
    if (type === "bone" && !bodyPart && !detectingBodyPart) {
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
        api.analyses.upload(type, rawFile, {
          bodyPart: type === "bone" ? bodyPart : undefined,
          patientId: patient.id || undefined,
          patientName: patient.name || undefined,
          age: patient.age ? Number(patient.age) : undefined,
          gender: patient.gender || undefined,
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
    }, 900);
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Upload X-ray"
        description="Supported formats: PNG, JPG and DICOM-style files up to 40 MB."
      />

      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div className="space-y-6">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="font-display text-base">Study file</CardTitle>
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
                  "flex min-h-56 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors",
                  dragging ? "border-primary bg-primary/5" : "border-border bg-muted/40 hover:bg-accent/40",
                )}
              >
                {file ? (
                  <>
                    <img
                      src={file.url}
                      alt="Uploaded X-ray preview"
                      className="max-h-44 rounded-lg border border-border object-contain"
                    />
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(0)} KB
                    </p>
                  </>
                ) : (
                  <>
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                      <Upload className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <p className="font-display text-base font-semibold">Drop X-ray here</p>
                    <p className="max-w-xs text-sm text-muted-foreground">
                      or click to browse — PNG, JPG, DICOM. Images stay in your browser session.
                    </p>
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
                {file ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3 text-destructive hover:text-destructive"
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
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="font-display text-base">Analysis type</CardTitle>
              <CardDescription>Select the model family for this study.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Tabs value={type} onValueChange={(v) => setType(v as AnalysisType)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="chest" className="gap-2">
                    <Activity className="h-4 w-4" aria-hidden="true" />
                    Chest X-ray
                  </TabsTrigger>
                  <TabsTrigger value="bone" className="gap-2">
                    <Bone className="h-4 w-4" aria-hidden="true" />
                    Bone fracture
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {type === "bone" ? (
                <div className="space-y-2">
                  <Label htmlFor="body-part">Body part</Label>
                  <Select value={bodyPart} onValueChange={setBodyPart} disabled={detectingBodyPart}>
                    <SelectTrigger id="body-part">
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
                  {bodyPartConfidence ? (
                    <p className="text-xs text-muted-foreground">
                      Auto-detected with {bodyPartConfidence}% confidence — adjust if needed.
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">
                  Chest model screens 14 thoracic findings including pneumonia, tuberculosis,
                  pneumothorax, cardiomegaly and pleural effusion.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="font-display text-base">Patient context</CardTitle>
              <CardDescription>Optional — improves report wording only.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                        "flex items-center gap-2",
                        i <= stage ? "text-foreground" : "text-muted-foreground/60",
                      )}
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          i < stage ? "bg-success" : i === stage ? "bg-primary" : "bg-muted-foreground/40",
                        )}
                      />
                      {s}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : (
            <Button size="lg" className="w-full" onClick={analyze}>
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Analyze study
            </Button>
          )}

          <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground">
            <FileImage className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p>
              No study to hand? Click <ScanLine className="inline h-3 w-3" aria-hidden="true" />{" "}
              <span className="font-semibold">Analyze</span> after uploading any X-ray image — this
              demo simulates model inference with realistic output.
            </p>
          </div>
        </div>
      </div>

      <Disclaimer className="mt-6" />
    </div>
  );
}
