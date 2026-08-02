import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, GitBranch, Network, Waypoints, BookOpen,
  Sparkles, Bot, History, Settings, Command, Bell, Search, ChevronsUpDown, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useCommandPalette } from "@/components/command-palette";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useCollapsiblePanel } from "@/lib/use-collapsible-panel";
import { useKeyboardShortcut } from "@/lib/use-keyboard-shortcut";
import { useUIState } from "@/lib/ui-state";
import { type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

const nav = [
  { to: "/dashboard",      label: "Dashboard",       icon: LayoutDashboard },
  { to: "/repositories",   label: "Repositories",    icon: GitBranch },
  { to: "/architecture",   label: "Architecture",    icon: Network },
  { to: "/knowledge",      label: "Knowledge Graph", icon: Waypoints },
  { to: "/documentation",  label: "Documentation",   icon: BookOpen },
  { to: "/implementation", label: "Implementation",  icon: Sparkles },
  { to: "/agents",         label: "AI Agents",       icon: Bot },
  { to: "/history",        label: "History",         icon: History },
  { to: "/settings",       label: "Settings",        icon: Settings },
] as const;

const EXPANDED_WIDTH = 248;
const COLLAPSED_WIDTH = 60;
const SPRING = { type: "spring" as const, stiffness: 380, damping: 34 };

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { open } = useCommandPalette();
  const { collapsed, toggle } = useCollapsiblePanel("shell");
  const { focusMode } = useUIState();

  useKeyboardShortcut("\\", () => toggle(), { withMeta: true });

  if (pathname === "/") {
    return <div className="dark min-h-screen bg-background text-foreground">{children}</div>;
  }

  const shellHidden = focusMode;

  return (
    <div className="dark flex min-h-screen w-full bg-background text-foreground">
      <AnimatePresence initial={false}>
        {!shellHidden && (
          <motion.aside
            key="app-shell-aside"
            initial={{ x: -EXPANDED_WIDTH, opacity: 0 }}
            animate={{ x: 0, opacity: 1, width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH }}
            exit={{ x: -EXPANDED_WIDTH, opacity: 0 }}
            transition={SPRING}
            className="relative hidden md:flex sticky top-0 h-screen shrink-0 flex-col border-r border-border bg-sidebar/60 backdrop-blur"
          >
            {/* Workspace switcher */}
            <button
              className={cn(
                "mt-3 flex items-center gap-3 rounded-xl border border-border/70 bg-panel/60 text-left transition-colors hover:bg-panel",
                collapsed ? "mx-2 justify-center p-1.5" : "mx-3 px-3 py-2.5",
              )}
              aria-label="Switch workspace"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-primary-foreground" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M4 7l8-4 8 4-8 4-8-4z"/><path d="M4 12l8 4 8-4"/><path d="M4 17l8 4 8-4"/>
                </svg>
              </div>
              {!collapsed && (
                <>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">CodeAtlas</div>
                    <div className="truncate text-[11px] text-muted-foreground">acme · production</div>
                  </div>
                  <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                </>
              )}
            </button>

            {/* Search / command */}
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={open}
                    aria-label="Open command palette"
                    className="mx-2 mt-3 flex h-9 items-center justify-center rounded-lg border border-border/60 bg-background/40 text-muted-foreground transition-colors hover:border-border hover:text-foreground"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Search or run — ⌘K</TooltipContent>
              </Tooltip>
            ) : (
              <button
                onClick={open}
                className="mx-3 mt-3 flex items-center gap-2 rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-left text-sm text-muted-foreground hover:border-border hover:text-foreground transition-colors"
              >
                <Search className="h-3.5 w-3.5" />
                <span className="flex-1">Search or run…</span>
                <kbd className="rounded-md border border-border bg-panel px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">⌘K</kbd>
              </button>
            )}

            <nav className="mt-4 flex-1 px-2">
              {!collapsed && (
                <div className="px-2 pb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
                  Workspace
                </div>
              )}
              <ul className="space-y-0.5">
                {nav.map((item) => {
                  const active = pathname.startsWith(item.to);
                  const Icon = item.icon;
                  const linkNode = (
                    <Link
                      to={item.to}
                      className={cn(
                        "group relative flex items-center rounded-lg text-sm transition-colors",
                        collapsed
                          ? "h-9 w-full justify-center"
                          : "gap-2.5 px-2.5 py-1.5",
                        active
                          ? "bg-sidebar-accent text-foreground"
                          : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                      )}
                      aria-label={collapsed ? item.label : undefined}
                    >
                      {active && (
                        <motion.span
                          layoutId="nav-active"
                          className={cn(
                            "absolute rounded-full bg-primary",
                            collapsed
                              ? "left-0 top-1/2 h-4 w-[2px] -translate-y-1/2"
                              : "inset-y-1 left-0 w-[2px]",
                          )}
                          transition={{ type: "spring", stiffness: 400, damping: 32 }}
                        />
                      )}
                      <Icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  );
                  return (
                    <li key={item.to}>
                      {collapsed ? (
                        <Tooltip>
                          <TooltipTrigger asChild>{linkNode}</TooltipTrigger>
                          <TooltipContent side="right">{item.label}</TooltipContent>
                        </Tooltip>
                      ) : (
                        linkNode
                      )}
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* User profile */}
            <div
              className={cn(
                "mb-3 flex items-center rounded-xl border border-border/60 bg-panel/40 transition-colors",
                collapsed ? "mx-2 justify-center p-1.5" : "mx-3 gap-3 px-3 py-2",
              )}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-accent/80 text-xs font-semibold text-primary-foreground">
                LK
              </div>
              {!collapsed && (
                <>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">Lena Kirsch</div>
                    <div className="truncate text-[11px] text-muted-foreground">lead architect</div>
                  </div>
                  <button className="relative rounded-md p-1.5 text-muted-foreground hover:bg-background/60 hover:text-foreground">
                    <Bell className="h-4 w-4" />
                    <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-primary" />
                  </button>
                </>
              )}
            </div>

            {/* Collapse toggle — sits on the right border, half-overlapping */}
            <button
              onClick={toggle}
              aria-label={collapsed ? "Expand sidebar (⌘\\)" : "Collapse sidebar (⌘\\)"}
              className="absolute -right-3 top-16 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-panel text-muted-foreground shadow-md transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
            </button>
          </motion.aside>
        )}
      </AnimatePresence>

      <main className="min-w-0 flex-1">
        {/* Mobile top bar */}
        {!shellHidden && (
          <div className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/80 px-4 py-2.5 backdrop-blur md:hidden">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-primary-foreground" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M4 7l8-4 8 4-8 4-8-4z"/><path d="M4 12l8 4 8-4"/></svg>
              </div>
              <span className="text-sm font-semibold">CodeAtlas</span>
            </div>
            <button onClick={open} className="rounded-md border border-border p-1.5 text-muted-foreground">
              <Command className="h-4 w-4" />
            </button>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}

export function PageHeader({
  eyebrow, title, description, actions,
}: { eyebrow?: string; title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-b border-border/70 px-6 py-5 md:flex-row md:items-end md:justify-between md:px-8 md:py-6">
      <div className="min-w-0">
        {eyebrow && <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{eyebrow}</div>}
        <h1 className="truncate text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
