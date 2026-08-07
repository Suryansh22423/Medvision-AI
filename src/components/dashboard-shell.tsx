import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  Bone,

  Bell,
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
  Stethoscope,
  Upload,
  Users,
  WifiOff,
} from "lucide-react";

import { toast } from "sonner";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useOnlineStatus } from "@/hooks/use-online";
import { GlobalSearch } from "@/components/global-search";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { useI18n } from "@/lib/i18n";


const NAV = [
  { titleKey: "nav.dashboard", url: "/dashboard", icon: LayoutDashboard },
  { titleKey: "nav.chest", url: "/dashboard/chest", icon: Activity },
  { titleKey: "nav.bone", url: "/dashboard/bone", icon: Bone },
  { titleKey: "nav.patients", url: "/dashboard/patients", icon: Users },
  { titleKey: "nav.history", url: "/dashboard/history", icon: Upload },
  { titleKey: "nav.reports", url: "/dashboard/reports", icon: FileText },
  { titleKey: "nav.settings", url: "/dashboard/settings", icon: Settings },
];


function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { t } = useI18n();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2.5 px-1.5 py-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Stethoscope className="h-4.5 w-4.5" aria-hidden="true" />
          </span>
          <span className="font-display text-sm font-bold leading-tight group-data-[collapsible=icon]:hidden">
            MedVision AI
            <span className="block text-[11px] font-medium text-muted-foreground">
              {t("nav.tagline")}
            </span>
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("nav.workspace")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((item) => {
                const active =
                  item.url === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.titleKey}>
                    <SidebarMenuButton asChild isActive={active} tooltip={t(item.titleKey)}>
                      <Link to={item.url}>
                        <item.icon className="h-4 w-4" aria-hidden="true" />
                        <span>{t(item.titleKey)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <div className="rounded-lg bg-sidebar-accent p-3 text-[11px] leading-relaxed text-sidebar-accent-foreground group-data-[collapsible=icon]:hidden">
          {t("nav.footerNote")}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const online = useOnlineStatus();
  const { t } = useI18n();

  const navigate = useNavigate();

  return (
    <SidebarProvider>
      <div className="flex min-h-dvh w-full bg-background">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card/85 px-3 backdrop-blur sm:px-5">
            <SidebarTrigger aria-label="Toggle navigation" />
            <div className="hidden items-center gap-2 sm:flex">
              <Badge variant="secondary" className="gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                {t("top.models")}
              </Badge>
              {!online ? (
                <Badge variant="outline" className="gap-1.5 border-warning/40 text-warning-foreground">
                  <WifiOff className="h-3 w-3" aria-hidden="true" />
                  {t("top.offline")}
                </Badge>
              ) : null}
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <GlobalSearch />
              <LanguageSwitcher />

              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("top.notifications")}
                className="relative min-h-11 min-w-11"
                onClick={() => toast(t("top.notifyToast"))}
              >
                <Bell className="h-4 w-4" />
                <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-destructive" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 px-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                        EW
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden text-left text-xs leading-tight sm:block">
                      <span className="block font-semibold">Dr. Elena Whitfield</span>
                      <span className="block text-muted-foreground">{t("top.role")}</span>
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel>Dr. Elena Whitfield</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard/settings">{t("nav.settings")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      navigate({ to: "/" });
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Exit Workspace
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
