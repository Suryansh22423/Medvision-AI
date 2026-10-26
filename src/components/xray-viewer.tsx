import { useEffect, useRef, useState } from "react";
import { Contrast, Maximize2, Minus, Plus, RotateCcw, ScanSearch, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
}

export function XrayViewer({
  src,
  alt,
  boxes = [],
  className,
  compact = false,
}: {
  src?: string | undefined;
  alt: string;
  boxes?: Box[];
  className?: string;
  compact?: boolean;
}) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({ zoom: 1, x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [overlay, setOverlay] = useState(true);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const dragRef = useRef<{ x: number; y: number } | null>(null);

  stateRef.current = { zoom, x: offset.x, y: offset.y };

  const clamp = (v: number) => Math.min(6, Math.max(0.5, v));

  const zoomAt = (px: number, py: number, next: number) => {
    const { zoom: z, x, y } = stateRef.current;
    const k = next / z;
    setOffset({ x: px - (px - x) * k, y: py - (py - y) * k });
    setZoom(next);
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      const rect = el.getBoundingClientRect();
      const next = clamp(stateRef.current.zoom * Math.exp(-dy * 0.0018));
      zoomAt(e.clientX - rect.left, e.clientY - rect.top, next);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const step = (dir: 1 | -1) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    zoomAt(rect.width / 2, rect.height / 2, clamp(stateRef.current.zoom * (dir === 1 ? 1.3 : 1 / 1.3)));
  };

  const reset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setBrightness(100);
    setContrast(100);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div
        ref={containerRef}
        className={cn(
          "relative w-full cursor-grab overflow-hidden rounded-xl border border-border bg-slate-950 active:cursor-grabbing",
          compact ? "aspect-square" : "aspect-[4/5]",
        )}
        onPointerDown={(e) => {
          dragRef.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!dragRef.current) return;
          setOffset({ x: e.clientX - dragRef.current.x, y: e.clientY - dragRef.current.y });
        }}
        onPointerUp={() => {
          dragRef.current = null;
        }}
        style={{ touchAction: "none" }}
      >
        <div
          className="absolute left-0 top-0 h-full w-full origin-top-left"
          style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }}
        >
          {src ? (
            <img
              src={src}
              alt={alt}
              className="h-full w-full select-none object-contain"
              draggable={false}
              style={{ filter: `brightness(${brightness}%) contrast(${contrast}%)` }}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-500">
              <ScanSearch className="h-10 w-10" aria-hidden="true" />
              <p className="text-xs">{t("viewer.noImage")}</p>
            </div>
          )}
          {overlay &&
            boxes.map((b) => (
              <div
                key={b.label}
                className="absolute rounded-sm border-2 border-teal/90 bg-teal/10 shadow-[0_0_8px_rgba(20,184,166,0.3)]"
                style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%` }}
              >
                <span className="absolute -top-6 left-0 whitespace-nowrap rounded bg-teal px-1.5 py-0.5 text-[10px] font-semibold text-teal-foreground shadow-sm">
                  {b.label}
                </span>
              </div>
            ))}
        </div>
        
        {/* PACS Style Corner Overlays */}
        <div className="pointer-events-none absolute left-3 top-3 font-mono text-[10px] leading-tight text-slate-400/90 select-none">
          <p className="font-semibold text-slate-200 uppercase">{alt.replace("X-ray for ", "").toUpperCase()}</p>
          <p>MODALITY: DX RADIOGRAPHY</p>
          <p>SOURCE: AI ACCELERATED CADx</p>
        </div>
        
        <div className="pointer-events-none absolute right-3 top-3 text-right font-mono text-[10px] leading-tight text-slate-400/90 select-none">
          <p className="font-semibold text-slate-200">MEDVISION CLINICAL SYS</p>
          <p>{new Date().toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' })}</p>
          <p>120 kVp · 320 mA</p>
        </div>

        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-display text-lg font-bold text-slate-600/40 select-none">
          R
        </div>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-15">
          <div className="h-8 w-[1px] bg-slate-300" />
          <div className="h-[1px] w-8 bg-slate-300" />
        </div>

        <div className="pointer-events-none absolute bottom-3 left-3 font-mono text-[10px] leading-tight text-slate-400/90 select-none">
          <p>ZOOM: {zoom.toFixed(2)}×</p>
          <p>W: {Math.round(contrast * 4)} L: {Math.round(brightness * 2.5)}</p>
        </div>

        <div className="pointer-events-none absolute bottom-3 right-3 text-right font-mono text-[10px] leading-tight text-slate-400/90 select-none">
          <p>FPS: 60.0</p>
          <p>SCALE: 0.15 mm/px</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="icon" aria-label={t("viewer.zoomOut")} onClick={() => step(-1)}>
          <Minus className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" aria-label={t("viewer.zoomIn")} onClick={() => step(1)}>
          <Plus className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" aria-label={t("viewer.reset")} onClick={reset}>
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label="Fit to frame"
          onClick={() => {
            setZoom(1);
            setOffset({ x: 0, y: 0 });
          }}
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <Switch id={`overlay-${alt}`} checked={overlay} onCheckedChange={setOverlay} />
          <Label htmlFor={`overlay-${alt}`} className="text-sm text-muted-foreground">
            {t("viewer.overlay")}
          </Label>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sun className="h-3.5 w-3.5" aria-hidden="true" />
            {t("viewer.brightness")} {brightness}%
          </Label>
          <Slider
            value={[brightness]}
            min={40}
            max={180}
            step={1}
            onValueChange={([v]) => setBrightness(v ?? 100)}
            aria-label={t("viewer.brightness")}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Contrast className="h-3.5 w-3.5" aria-hidden="true" />
            {t("viewer.contrast")} {contrast}%
          </Label>
          <Slider
            value={[contrast]}
            min={40}
            max={220}
            step={1}
            onValueChange={([v]) => setContrast(v ?? 100)}
            aria-label={t("viewer.contrast")}
          />
        </div>
      </div>
    </div>
  );
}
