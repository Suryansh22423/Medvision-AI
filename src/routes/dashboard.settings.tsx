import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/shared";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { useI18n } from "@/lib/i18n";
import { useState, useEffect } from "react";
import { Brain, Play, Loader2, Target, Activity, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { api, type TrainingStatus } from "@/lib/api";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/settings")({
  head: () => ({
    meta: [
      { title: "Settings — MedVision AI" },
      {
        name: "description",
        content: "Manage your clinician profile, review thresholds and notification preferences.",
      },
      { property: "og:title", content: "Settings — MedVision AI" },
      { property: "og:description", content: "Profile, model threshold and notification settings." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { t } = useI18n();
  
  // Profile settings state
  const [name, setName] = useState("Dr. Elena Whitfield");
  const [email, setEmail] = useState("e.whitfield@hospital.org");
  const [dept, setDept] = useState("Radiology");
  const [licence, setLicence] = useState("GMC-7741920");

  // Training state
  const [modelType, setModelType] = useState<"chest" | "bone">("chest");
  const [epochs, setEpochs] = useState(5);
  const [learningRate, setLearningRate] = useState(0.001);
  const [trainingStatus, setTrainingStatus] = useState<TrainingStatus>({ status: "idle" });
  const [isStarting, setIsStarting] = useState(false);

  // Poll status when training is running
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    const checkStatus = async () => {
      try {
        const status = await api.training.status();
        setTrainingStatus(status);
      } catch (err) {
        console.error("Failed to fetch training status:", err);
      }
    };

    // Initial check
    checkStatus();

    // Setup polling if training is in progress
    if (trainingStatus.status === "running") {
      intervalId = setInterval(checkStatus, 1500);
    } else {
      intervalId = setInterval(checkStatus, 5000); // slower poll when idle/done
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [trainingStatus.status]);

  const handleStartTraining = async () => {
    setIsStarting(true);
    try {
      await api.training.start(modelType, epochs, learningRate);
      toast.success("AI model fine-tuning task started successfully in background.");
      // Instantly trigger status check
      const status = await api.training.status();
      setTrainingStatus(status);
    } catch (err: any) {
      toast.error(err.message || "Failed to trigger training");
    } finally {
      setIsStarting(false);
    }
  };

  const chartData = trainingStatus.metricsHistory?.map((item) => ({
    ...item,
    accuracy: Math.round(item.accuracy * 100),
  })) || [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title={t("settings.title")} description={t("settings.desc")} />

      {/* Profile Card */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="font-display text-base">{t("settings.profile")}</CardTitle>
          <CardDescription>{t("settings.profileDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="s-name">{t("common.fullName")}</Label>
              <Input id="s-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-email">{t("common.email")}</Label>
              <Input id="s-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-dept">{t("settings.dept")}</Label>
              <Input id="s-dept" value={dept} onChange={(e) => setDept(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-licence">{t("settings.licence")}</Label>
              <Input id="s-licence" value={licence} onChange={(e) => setLicence(e.target.value)} />
            </div>
          </div>
          <Separator />
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">{t("settings.prefs")}</p>
                <p className="text-xs text-muted-foreground">{t("settings.prefsDesc")}</p>
              </div>
              <div className="flex gap-1.5"><LanguageSwitcher /><ThemeToggle /></div>
            </div>
            {[
              [t("settings.notifyDone"), "notify-done", true],
              [t("settings.notifyFlag"), "notify-flag", true],
              [t("settings.pdfOverlay"), "pdf-overlay", false],
            ].map(([label, id, def]) => (
              <div key={id as string} className="flex items-center justify-between gap-4">
                <Label htmlFor={id as string} className="font-normal">
                  {label as string}
                </Label>
                <Switch id={id as string} defaultChecked={def as boolean} />
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <Button onClick={() => toast.success(t("settings.saved"))}>{t("common.save")}</Button>
          </div>
        </CardContent>
      </Card>

      {/* Model Retraining Card */}
      <Card className={cn(
        "shadow-soft overflow-hidden transition-all duration-300",
        trainingStatus.status === "running" && "pulse-glow border-primary/30"
      )}>
        <CardHeader className="bg-gradient-to-r from-primary/5 via-accent/5 to-transparent border-b">
          <div className="flex items-center gap-2.5">
            <Brain className="h-5 w-5 text-primary animate-pulse" />
            <div>
              <CardTitle className="font-display text-base">AI Model Retraining & Transfer Learning</CardTitle>
              <CardDescription>Fine-tune DenseNet121 weights on a real clinical radiology dataset.</CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2.5">
                <Label className="text-sm font-semibold">Select AI Model Target</Label>
                <RadioGroup 
                  value={modelType} 
                  onValueChange={(val) => setModelType(val as "chest" | "bone")}
                  disabled={trainingStatus.status === "running"}
                  className="grid grid-cols-2 gap-3"
                >
                  <div>
                    <RadioGroupItem value="chest" id="model-chest" className="peer sr-only" />
                    <Label
                      htmlFor="model-chest"
                      className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                    >
                      <Activity className="mb-2 h-5 w-5 text-muted-foreground peer-data-[state=checked]:text-primary" />
                      <span className="text-sm font-medium">Chest X-ray</span>
                      <span className="text-xs text-muted-foreground mt-0.5">10 Conditions</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="bone" id="model-bone" className="peer sr-only" />
                    <Label
                      htmlFor="model-bone"
                      className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                    >
                      <Brain className="mb-2 h-5 w-5 text-muted-foreground peer-data-[state=checked]:text-primary" />
                      <span className="text-sm font-medium">Bone Fracture</span>
                      <span className="text-xs text-muted-foreground mt-0.5">7 Fractures</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label htmlFor="s-epochs" className="text-sm font-medium">Epochs (Training Cycles)</Label>
                  <span className="font-mono text-sm font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                    {epochs}
                  </span>
                </div>
                <Slider
                  id="s-epochs"
                  min={1}
                  max={20}
                  step={1}
                  value={[epochs]}
                  onValueChange={(val) => setEpochs(val[0])}
                  disabled={trainingStatus.status === "running"}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="s-lr" className="text-sm font-medium">Learning Rate (Optimizer Step Size)</Label>
                <Input
                  id="s-lr"
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  max="0.1"
                  value={learningRate}
                  onChange={(e) => setLearningRate(parseFloat(e.target.value) || 0.001)}
                  disabled={trainingStatus.status === "running"}
                  className="font-mono"
                />
              </div>
              
              <Button
                onClick={handleStartTraining}
                disabled={trainingStatus.status === "running" || isStarting}
                className="w-full h-11"
              >
                {trainingStatus.status === "running" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Model Training in Progress...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Start Transfer Learning Fine-Tuning
                  </>
                )}
              </Button>
            </div>

            {/* Live Progress Card */}
            <div className="border border-border/80 rounded-xl p-5 bg-card flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-semibold">Training Status</h4>
                    <p className="text-xs text-muted-foreground">Real-time status updates</p>
                  </div>
                  <div className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                    trainingStatus.status === "running"
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 animate-pulse"
                      : trainingStatus.status === "completed"
                      ? "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300"
                      : trainingStatus.status === "failed"
                      ? "bg-destructive/10 text-destructive dark:bg-destructive/20"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {trainingStatus.status === "running" && <RefreshCw className="h-3 w-3 animate-spin" />}
                    {trainingStatus.status === "completed" && <CheckCircle2 className="h-3 w-3" />}
                    {trainingStatus.status === "failed" && <AlertCircle className="h-3 w-3" />}
                    {trainingStatus.status === "idle" && <Target className="h-3 w-3" />}
                    {trainingStatus.status.toUpperCase()}
                  </div>
                </div>

                <Separator />

                {trainingStatus.status === "idle" ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
                    <Target className="h-10 w-10 text-muted-foreground/60" />
                    <p className="text-sm text-muted-foreground">Ready to train. Please configure hyperparameters and start fine-tuning.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-accent/40 rounded-lg p-3">
                        <span className="text-xs text-muted-foreground block mb-0.5">Current Cycle</span>
                        <span className="font-semibold text-lg font-mono">
                          Epoch {trainingStatus.currentEpoch} / {trainingStatus.totalEpochs}
                        </span>
                      </div>
                      <div className="bg-accent/40 rounded-lg p-3">
                        <span className="text-xs text-muted-foreground block mb-0.5">Current Loss</span>
                        <span className="font-semibold text-lg font-mono">
                          {trainingStatus.loss || "0.000"}
                        </span>
                      </div>
                      <div className="bg-accent/40 rounded-lg p-3 col-span-2">
                        <span className="text-xs text-muted-foreground block mb-0.5">Validation Accuracy</span>
                        <span className="font-bold text-lg font-mono text-primary">
                          {trainingStatus.accuracy ? `${trainingStatus.accuracy}%` : "Calculating..."}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Total Progress</span>
                        <span>{trainingStatus.progress}%</span>
                      </div>
                      <Progress value={trainingStatus.progress} className="h-2" />
                    </div>

                    {trainingStatus.error && (
                      <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-xs flex gap-2 border border-destructive/20 font-mono max-h-24 overflow-y-auto">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>{trainingStatus.error}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="text-[10px] text-muted-foreground/80 mt-4 leading-relaxed bg-accent/20 p-2.5 rounded-lg border border-border/40">
                💡 **Clinician Insight**: Transfer learning operates by freezing the 121 convolutional layers of DenseNet and training only the classification layer on the target dataset. This enables swift model convergence on standard clinical workstations without specialized GPU arrays.
              </div>
            </div>
          </div>

          {/* Metric charts */}
          {chartData.length > 0 && (
            <div className="space-y-3 pt-4 border-t">
              <h4 className="text-sm font-semibold flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-primary" /> Training Convergence Metrics
              </h4>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="epoch" tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" />
                    <YAxis yAxisId="left" tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" />
                    <ReTooltip
                      contentStyle={{
                        background: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: "0.6rem",
                        fontSize: 11,
                        color: "var(--popover-foreground)",
                      }}
                    />
                    <Legend verticalAlign="top" height={36} iconType="circle" fontSize={11} />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="loss"
                      name="Loss (BCE)"
                      stroke="var(--chart-1)"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="accuracy"
                      name="Accuracy (%)"
                      stroke="var(--chart-2)"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
