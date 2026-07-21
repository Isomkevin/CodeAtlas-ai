import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard, GitBranch, Network, Waypoints, BookOpen, Bot, History, Settings,
  Sparkles, Play, FileText, Plus, Zap,
} from "lucide-react";
import { listRepositories, loadArchitectureGraph, type ApiRepository, type ArchitectureGraphNode } from "@/lib/api";

type Ctx = { open: () => void; close: () => void };
const CommandCtx = createContext<Ctx>({ open: () => {}, close: () => {} });

export function useCommandPalette() { return useContext(CommandCtx); }

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [repositories, setRepositories] = useState<ApiRepository[]>([]);
  const [nodes, setNodes] = useState<ArchitectureGraphNode[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    let active = true;
    void listRepositories()
      .then(async (items) => {
        if (!active) return;
        setRepositories(items);
        if (items[0]) setNodes((await loadArchitectureGraph(items[0].id)).nodes);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  const go = useCallback((to: string) => {
    setIsOpen(false);
    void navigate({ to });
  }, [navigate]);

  return (
    <CommandCtx.Provider value={{ open: () => setIsOpen(true), close: () => setIsOpen(false) }}>
      {children}
      <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
        <CommandInput placeholder="Search repos, agents, nodes, or run a command…" />
        <CommandList>
          <CommandEmpty>No results.</CommandEmpty>
          <CommandGroup heading="Navigate">
            <CommandItem onSelect={() => go("/")}><LayoutDashboard /> Dashboard</CommandItem>
            <CommandItem onSelect={() => go("/repositories")}><GitBranch /> Repositories</CommandItem>
            <CommandItem onSelect={() => go("/architecture")}><Network /> Architecture</CommandItem>
            <CommandItem onSelect={() => go("/knowledge")}><Waypoints /> Knowledge Graph</CommandItem>
            <CommandItem onSelect={() => go("/documentation")}><BookOpen /> Documentation</CommandItem>
            <CommandItem onSelect={() => go("/implementation")}><Sparkles /> Implementation</CommandItem>
            <CommandItem onSelect={() => go("/agents")}><Bot /> AI Agents</CommandItem>
            <CommandItem onSelect={() => go("/history")}><History /> History</CommandItem>
            <CommandItem onSelect={() => go("/settings")}><Settings /> Settings</CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Commands">
            <CommandItem onSelect={() => go("/architecture")}><Play /> Scan repository</CommandItem>
            <CommandItem onSelect={() => go("/documentation")}><FileText /> Generate documentation</CommandItem>
            <CommandItem onSelect={() => go("/implementation")}><Zap /> Draft implementation plan</CommandItem>
            <CommandItem onSelect={() => go("/repositories")}><Plus /> Connect repository</CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Repositories">
            {repositories.slice(0, 6).map((r) => (
              <CommandItem key={r.id} onSelect={() => go("/repositories")}>
                <GitBranch /> {r.full_name} <span className="ml-auto text-xs text-muted-foreground">{r.default_branch}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Architecture nodes">
            {nodes.slice(0, 6).map((n) => (
              <CommandItem key={n.id} onSelect={() => go("/architecture")}>
                <Network /> {n.name} <span className="ml-auto text-xs text-muted-foreground">{n.properties.path ?? n.kind}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </CommandCtx.Provider>
  );
}
