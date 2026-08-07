import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/register")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
  head: () => ({
    meta: [
      { title: "Doctor Registration — MedVision AI" },
      {
        name: "description",
        content:
          "Create a MedVision AI clinician account to run AI-assisted chest and bone X-ray analyses.",
      },
      { property: "og:title", content: "Doctor Registration — MedVision AI" },
      {
        property: "og:description",
        content: "Register your clinical account for AI-assisted radiology decision support.",
      },
    ],
  }),
  component: RegisterPage,
});

type Fields = {
  name: string;
  email: string;
  license: string;
  specialty: string;
  password: string;
  confirm: string;
};

function RegisterPage() {
  const navigate = useNavigate();
  const [f, setF] = useState<Fields>({
    name: "",
    email: "",
    license: "",
    specialty: "",
    password: "",
    confirm: "",
  });
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof Fields | "terms", string>>>({});
  const [loading, setLoading] = useState(false);

  const set = (key: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF((prev) => ({ ...prev, [key]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Partial<Record<keyof Fields | "terms", string>> = {};
    if (f.name.trim().length < 3) next.name = "Enter your full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) next.email = "Enter a valid work email.";
    if (f.license.trim().length < 4) next.license = "Medical licence number is required.";
    if (!f.specialty) next.specialty = "Select your specialty.";
    if (f.password.length < 8) next.password = "Use at least 8 characters.";
    if (f.confirm !== f.password) next.confirm = "Passwords do not match.";
    if (!terms) next.terms = "You must accept the clinical use terms.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Account created — welcome to MedVision AI");
      navigate({ to: "/dashboard" });
    }, 1000);
  };

  const err = (key: keyof Fields | "terms") =>
    errors[key] ? (
      <p className="text-xs font-medium text-destructive">{errors[key]}</p>
    ) : null;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-hero-wash px-4 py-12">
      <div className="w-full max-w-xl">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Stethoscope className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="font-display text-base font-bold">MedVision AI</span>
        </Link>
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display text-xl">Create your clinician account</CardTitle>
            <CardDescription>
              Verified doctors only. Credentials are checked against your medical council registry.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-5" noValidate>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" value={f.name} onChange={set("name")} placeholder="Dr. Elena Whitfield" aria-invalid={!!errors.name} />
                  {err("name")}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email">Work email</Label>
                  <Input
                    id="reg-email"
                    type="email"
                    value={f.email}
                    onChange={set("email")}
                    placeholder="e.whitfield@hospital.org"
                    aria-invalid={!!errors.email}
                  />
                  {err("email")}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="license">Medical licence no.</Label>
                  <Input id="license" value={f.license} onChange={set("license")} placeholder="GMC-7741920" aria-invalid={!!errors.license} />
                  {err("license")}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialty">Specialty</Label>
                  <Select value={f.specialty} onValueChange={(v) => setF((p) => ({ ...p, specialty: v }))}>
                    <SelectTrigger id="specialty" aria-invalid={!!errors.specialty}>
                      <SelectValue placeholder="Select specialty" />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        "Radiology",
                        "Emergency Medicine",
                        "Pulmonology",
                        "Orthopaedics",
                        "Internal Medicine",
                        "General Practice",
                      ].map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {err("specialty")}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Password</Label>
                  <Input
                    id="reg-password"
                    type="password"
                    value={f.password}
                    onChange={set("password")}
                    placeholder="••••••••"
                    aria-invalid={!!errors.password}
                  />
                  {err("password")}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirm password</Label>
                  <Input
                    id="confirm"
                    type="password"
                    value={f.confirm}
                    onChange={set("confirm")}
                    placeholder="••••••••"
                    aria-invalid={!!errors.confirm}
                  />
                  {err("confirm")}
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Checkbox
                  id="terms"
                  checked={terms}
                  onCheckedChange={(v) => setTerms(v === true)}
                  className="mt-0.5"
                />
                <Label htmlFor="terms" className="text-sm font-normal leading-relaxed text-muted-foreground">
                  I understand MedVision AI provides preliminary, AI-assisted output for decision
                  support and that final diagnosis remains my clinical responsibility.
                </Label>
              </div>
              {err("terms")}

              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                {loading ? "Creating account…" : "Create account"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already registered?{" "}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
