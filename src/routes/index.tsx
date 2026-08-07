import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  Bone,
  Brain,
  ChevronRight,
  FileText,
  Gauge,
  Layers,
  Lock,
  ScanLine,
  ShieldCheck,
  Stethoscope,
  Timer,
} from "lucide-react";
import heroImage from "@/assets/hero-xray.jpg";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Disclaimer } from "@/components/shared";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { BONE_PARTS, CHEST_CONDITIONS, HOW_IT_WORKS } from "@/lib/mock-data";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MedVision AI — AI-Powered Chest & Bone X-ray Analysis" },
      {
        name: "description",
        content:
          "Upload a chest or bone X-ray and get AI-assisted findings, confidence scores, fracture localization and a preliminary radiology report in seconds.",
      },
      { property: "og:title", content: "MedVision AI — AI-Powered Chest & Bone X-ray Analysis" },
      {
        property: "og:description",
        content:
          "AI-assisted second opinion for chest pathology screening and fracture detection. Built for busy clinical teams.",
      },
    ],
  }),
  component: Landing,
});

const BENEFITS = [
  {
    icon: Timer,
    titleKey: "land.b1.title",
    textKey: "land.b1.text",
  },
  {
    icon: Layers,
    titleKey: "land.b2.title",
    textKey: "land.b2.text",
  },
  {
    icon: Bone,
    titleKey: "land.b3.title",
    textKey: "land.b3.text",
  },
  {
    icon: FileText,
    titleKey: "land.b4.title",
    textKey: "land.b4.text",
  },
];

function Landing() {
  const { t, tt } = useI18n();
  const benefitItems = BENEFITS.map((benefit) => ({
    ...benefit,
    title: t(benefit.titleKey),
    text: t(benefit.textKey),
  }));

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Stethoscope className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="font-display text-base font-bold">MedVision AI</span>
          </Link>
          <nav className="ml-auto hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#conditions" className="transition-colors hover:text-foreground">
              {t("land.navConditions")}
            </a>
            <a href="#how" className="transition-colors hover:text-foreground">
              {t("land.navHow")}
            </a>
            <a href="#trust" className="transition-colors hover:text-foreground">
              {t("land.navSafety")}
            </a>
          </nav>
          <div className="ml-auto flex items-center gap-1.5 md:ml-6">
            <LanguageSwitcher />
            <ThemeToggle />
            <Button asChild className="shadow-soft transition-transform duration-200 hover:scale-[1.03]">
              <Link to="/dashboard">Enter Dashboard</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-border bg-hero-wash">
        <div className="absolute inset-0 bg-grid-clinical opacity-60" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <Badge variant="secondary" className="mb-5 gap-1.5 py-1">
              <Brain className="h-3.5 w-3.5" aria-hidden="true" />
              {t("land.badge")}
            </Badge>
            <h1 className="font-display text-4xl font-extrabold leading-[1.08] text-foreground sm:text-5xl lg:text-[3.4rem]">
              {t("land.h1")}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t("land.sub")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link to="/dashboard">
                  <ScanLine className="h-4 w-4" aria-hidden="true" />
                  Enter Dashboard
                </Link>
              </Button>
            </div>
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6">
              {[
                ["94.2%", t("land.stat1")],
                ["11", t("land.stat2")],
                ["18s", t("land.stat3")],
              ].map(([value, label]) => (
                <div key={label}>
                  <dt className="font-display text-2xl font-bold text-foreground">{value}</dt>
                  <dd className="text-xs text-muted-foreground">{label}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="relative">
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
              <img
                src={heroImage}
                alt={t("land.heroAlt")}
                width={1536}
                height={1024}
                className="h-full w-full object-cover"
              />
            </div>
            <Card className="absolute -bottom-6 left-4 hidden w-56 shadow-card sm:block">
              <CardContent className="flex items-center gap-3 p-4">
                <Gauge className="h-8 w-8 text-primary" aria-hidden="true" />
                <div>
                  <p className="text-xs text-muted-foreground">{t("land.primaryPred")}</p>
                  <p className="font-display text-sm font-bold">{tt("Pneumonia")} · 92%</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 lg:py-20">
        <h2 className="font-display text-2xl font-bold sm:text-3xl">{t("land.benefits.title")}</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          {t("land.benefits.sub")}
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {benefitItems.map((b) => (
            <Card key={b.title} className="border-border shadow-soft transition-shadow hover:shadow-card">
              <CardContent className="p-6">
                <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <b.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="font-display text-base font-semibold">{b.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{b.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="conditions" className="border-y border-border bg-card/60">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-2 lg:py-20">
          <div>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">{t("land.cond.title")}</h2>
            <p className="mt-2 text-muted-foreground">
              {t("land.cond.sub")}
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Card className="shadow-soft">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-2 text-primary">
                  <Activity className="h-5 w-5" aria-hidden="true" />
                  <h3 className="font-display text-sm font-bold uppercase tracking-wide">
                    {t("land.cond.chest")}
                  </h3>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {CHEST_CONDITIONS.filter((c) => c !== "No Finding").map((c) => (
                    <li key={c} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                      {tt(c)}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card className="shadow-soft">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-2 text-teal-foreground">
                  <Bone className="h-5 w-5" aria-hidden="true" />
                  <h3 className="font-display text-sm font-bold uppercase tracking-wide">
                    {t("land.cond.bone")}
                  </h3>
                </div>
                <ul className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  {BONE_PARTS.map((p) => (
                    <li key={p} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-teal" />
                      {tt(p)}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl px-4 py-16 lg:py-20">
        <h2 className="font-display text-2xl font-bold sm:text-3xl">{t("land.how.title")}</h2>
        <ol className="mt-10 grid gap-6 md:grid-cols-3 lg:grid-cols-5">
          {HOW_IT_WORKS.map((step, i) => (
            <li key={step.title} className="relative rounded-xl border border-border bg-card p-5 shadow-soft">
              <span className="font-display text-xs font-bold text-primary">{t("land.how.step")} {i + 1}</span>
              <h3 className="mt-2 font-display text-base font-semibold">{t(`how.${i + 1}.title`)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(`how.${i + 1}.text`)}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="trust" className="border-t border-border bg-card/60">
        <div className="mx-auto max-w-6xl px-4 py-16 lg:py-20">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: ShieldCheck,
                title: t("land.trust1.title"),
                text: t("land.trust1.text"),
              },
              {
                icon: Lock,
                title: t("land.trust2.title"),
                text: t("land.trust2.text"),
              },
              {
                icon: Gauge,
                title: t("land.trust3.title"),
                text: t("land.trust3.text"),
              },
            ].map((t) => (
              <Card key={t.title} className="shadow-soft">
                <CardContent className="p-6">
                  <t.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                  <h3 className="mt-4 font-display text-base font-semibold">{t.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Disclaimer className="mt-8" />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex flex-wrap items-center justify-between gap-6 rounded-2xl border border-border bg-primary/5 p-8">
          <div>
            <h2 className="font-display text-xl font-bold sm:text-2xl">
               {t("land.final.title")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
               {t("land.final.sub")}
            </p>
          </div>
          <Button size="lg" asChild>
            <Link to="/dashboard/upload">
               {t("land.final.cta")}
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 text-xs text-muted-foreground">
          <p>{t("land.footer1")}</p>
          <p>{t("land.footer2")}</p>
        </div>
      </footer>
    </div>
  );
}
