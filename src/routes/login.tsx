import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Lock, Mail, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
  head: () => ({
    meta: [
      { title: "Doctor Login — MedVision AI" },
      {
        name: "description",
        content: "Sign in to the MedVision AI clinical workspace to review chest and bone X-ray analyses.",
      },
      { property: "og:title", content: "Doctor Login — MedVision AI" },
      {
        property: "og:description",
        content: "Secure access to the MedVision AI radiology decision-support workspace.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: { email?: string; password?: string } = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = t("auth.err.email");
    if (password.length < 6) next.password = t("auth.err.password");
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success(t("auth.login.success"));
      navigate({ to: "/dashboard" });
    }, 900);
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-hero-wash px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-4 flex justify-end gap-1.5">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
        <Link to="/" className="mb-8 flex items-center justify-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Stethoscope className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="font-display text-base font-bold">MedVision AI</span>
        </Link>
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display text-xl">{t("auth.login.title")}</CardTitle>
            <CardDescription>{t("auth.login.desc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-5" noValidate>
              <div className="space-y-2">
                <Label htmlFor="email">{t("common.email")}</Label>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="e.whitfield@hospital.org"
                    className="pl-9"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "email-error" : undefined}
                  />
                </div>
                {errors.email ? (
                  <p id="email-error" className="text-xs font-medium text-destructive">
                    {errors.email}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t("common.password")}</Label>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="pl-9"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? "password-error" : undefined}
                  />
                </div>
                {errors.password ? (
                  <p id="password-error" className="text-xs font-medium text-destructive">
                    {errors.password}
                  </p>
                ) : null}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox id="remember" />
                  <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground">
                    {t("auth.login.remember")}
                  </Label>
                </div>
                <button
                  type="button"
                  className="text-sm font-medium text-primary hover:underline"
                  onClick={() => toast(t("auth.login.reset"))}
                >
                  {t("auth.login.forgot")}
                </button>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                {loading ? t("auth.login.loading") : t("auth.login.submit")}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {t("auth.login.new")} {" "}
              <Link to="/register" className="font-medium text-primary hover:underline">
                {t("auth.login.register")}
              </Link>
            </p>
          </CardContent>
        </Card>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          {t("auth.login.demo")}
        </p>
      </div>
    </div>
  );
}
