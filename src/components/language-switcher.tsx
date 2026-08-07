import { LANGUAGES, useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, Globe } from "lucide-react";

export function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();
  const current = LANGUAGES.find((l) => l.code === lang);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="min-h-11 gap-1.5 rounded-xl px-2.5 transition-transform duration-200 hover:scale-105"
          aria-label={t("top.language")}
          title={t("top.language")}
        >
          <Globe className="h-4 w-4 opacity-70" aria-hidden="true" />
          <span className="text-base leading-none" aria-hidden="true">
            {current?.flag}
          </span>
          <span className="hidden text-xs font-semibold uppercase sm:inline">{lang}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>{t("top.language")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {LANGUAGES.map((l) => (
          <DropdownMenuItem key={l.code} onClick={() => setLang(l.code)} className="gap-2">
            <span className="text-base leading-none" aria-hidden="true">
              {l.flag}
            </span>
            <span className="flex-1">{l.native}</span>
            {l.code === lang ? <Check className="h-4 w-4 text-primary" aria-hidden="true" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
