import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { KindBadge } from "@/components/atlas-ui";
import { ArchitectureGraph } from "@/components/architecture-graph";
import { AiChat } from "@/components/ai-chat";
import { graphNodeKind, nodeColors, type NodeKind } from "@/lib/graph-ui";
import {
  listRepositories,
  loadArchitectureGraph,
  requestRepositoryScan,
  subscribeRepositoryEvents,
  type ApiRepository,
  type ArchitectureGraph as ApiArchitectureGraph,
} from "@/lib/api";
import {
  ChevronRight, ChevronDown, Filter, GitCompare, LayoutGrid, Maximize2, Search, ScanLine,
  GitBranch, Database, Server, Boxes, Zap, Cpu, Sparkles, ArrowRight, ArrowLeft,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/architecture")({
  head: () => ({ meta: [{ title: "Architecture · CodeAtlas" }] }),
  component: ArchitecturePage,
});

const iconFor: Record<NodeKind, React.ComponentType<{ className?: string }>> = {
  repo: GitBranch, service: Server, module: Boxes, api: Zap, database: Database, infra: Cpu, ai: Sparkles,
};

function ArchitecturePage() {
  const [repositories, setRepositories] = useState<ApiRepository[]>([]);
  const [graph, setGraph] = useState<ApiArchitectureGraph | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [scanState, setScanState] = useState<"idle" | "queued" | "running">("idle");
  const repository = repositories[0] ?? null;
  const archNodes = useMemo(() => graph?.nodes.map((node) => ({
    id: node.id,
    kind: graphNodeKind(node.kind) as NodeKind,
    label: node.name,
    sub: node.properties.path ?? node.kind,
  })) ?? [], [graph]);
  const archEdges = useMemo(() => graph?.edges.map((edge) => ({
    id: edge.id,
    source: edge.source_id,
    target: edge.target_id,
    kind: edge.kind,
  })) ?? [], [graph]);
  const explorerGroups = useMemo(() => repository ? [{
    id: repository.id,
    label: repository.full_name,
    ids: archNodes.map((node) => node.id),
  }] : [], [archNodes, repository]);

  useEffect(() => {
    let active = true;
    listRepositories()
      .then((items) => {
        if (active) setRepositories(items);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Unable to load repositories");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!repository) return;
    let active = true;
    setIsLoading(true);
    loadArchitectureGraph(repository.id)
      .then((value) => {
        if (active) {
          setGraph(value);
          setExpanded([repository.id]);
          setSelectedId(value.nodes[0]?.id ?? null);
        }
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Unable to load architecture graph");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, [repository]);

  useEffect(() => {
    if (!repository) return;
    return subscribeRepositoryEvents(
      repository.id,
      (event) => {
        if (event.type === "scan.running") {
          setScanState("running");
          return;
        }
        if (event.type === "scan.failed") {
          setScanState("idle");
          setError(event.message ?? "Repository scan failed");
          return;
        }
        setScanState("idle");
        void loadArchitectureGraph(repository.id)
          .then((value) => {
            setGraph(value);
            setExpanded([repository.id]);
            setSelectedId(value.nodes[0]?.id ?? null);
            setError(null);
          })
          .catch((reason: unknown) => {
            setError(reason instanceof Error ? reason.message : "Unable to load updated architecture graph");
          });
      },
      () => setError("Live scan updates are unavailable. Refresh this page to read the latest graph."),
    );
  }, [repository]);

  const scan = async () => {
    if (!repository) return;
    setIsScanning(true);
    setError(null);
    try {
      await requestRepositoryScan(repository.id);
      setScanState("queued");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to queue scan");
    } finally {
      setIsScanning(false);
    }
  };
  const selected = archNodes.find((n) => n.id === selectedId) ?? null;

  const connections = useMemo(() => {
    if (!selected) return { inbound: [], outbound: [] };
    const inbound  = archEdges.filter((e) => e.target === selected.id).map((e) => archNodes.find((n) => n.id === e.source)!).filter(Boolean);
    const outbound = archEdges.filter((e) => e.source === selected.id).map((e) => archNodes.find((n) => n.id === e.target)!).filter(Boolean);
    return { inbound, outbound };
  }, [selected]);

  const filteredGroups = useMemo(() => {
    if (!query) return explorerGroups;
    const q = query.toLowerCase();
    return explorerGroups
      .map((g) => ({ ...g, ids: g.ids.filter((id) => {
        const n = archNodes.find((x) => x.id === id);
        return n && (n.label.toLowerCase().includes(q) || n.sub.toLowerCase().includes(q));
      }) }))
      .filter((g) => g.ids.length > 0);
  }, [query]);

  return (
    <div className="flex flex-col">
      <PageHeader
        eyebrow={repository?.full_name ?? "Architecture"}
        title={<span>Architecture <span className="text-muted-foreground font-normal">/ {repository?.default_branch ?? "no repository"}</span></span>}
        description="Live, interactive graph of services, modules, APIs, and data. Click a node to inspect."
        actions={
          <>
            <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-panel px-3 py-2 text-sm hover:bg-panel/80 transition-colors">
              <GitCompare className="h-4 w-4" /> Compare <span className="font-mono text-muted-foreground">v41 → v42</span>
            </button>
            <button onClick={scan} disabled={!repository || isScanning || scanState !== "idle"} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:cursor-not-allowed disabled:opacity-50">
              <ScanLine className="h-4 w-4" /> {isScanning ? "Queueing scan" : scanState === "queued" ? "Scan queued" : scanState === "running" ? "Scanning" : "Scan"}
            </button>
          </>
        }
      />

      {error && <div className="mx-5 mb-3 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
      <div className="grid min-h-[calc(100vh-140px)] grid-cols-1 lg:grid-cols-[260px_1fr_340px]">
        {/* Left: repository explorer */}
        <aside className="hidden lg:flex flex-col border-r border-border/70 bg-sidebar/40">
          <div className="border-b border-border/70 p-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Search nodes"
                className="w-full rounded-lg border border-border bg-panel/60 pl-8 pr-2 py-1.5 text-sm outline-none focus:border-primary/60"
                aria-label="Search architecture nodes"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <div className="px-2 py-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">Repositories</div>
            {filteredGroups.map((group) => {
              const open = expanded.includes(group.id);
              return (
                <div key={group.id} className="mb-1">
                  <button
                    onClick={() => setExpanded((e) => e.includes(group.id) ? e.filter((x) => x !== group.id) : [...e, group.id])}
                    className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm hover:bg-panel/60 transition-colors"
                    aria-expanded={open}
                  >
                    {open
                      ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                    <GitBranch className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="truncate">{group.label}</span>
                    <span className="ml-auto text-[10px] font-mono text-muted-foreground">{group.ids.length}</span>
                  </button>
                  {open && (
                    <div className="ml-4 mt-0.5 space-y-0.5 border-l border-border/60 pl-2">
                      {group.ids.map((id) => {
                        const n = archNodes.find((x) => x.id === id)!;
                        const Icon = iconFor[n.kind];
                        const active = n.id === selectedId;
                        return (
                          <button
                            key={n.id}
                            onClick={() => setSelectedId(n.id)}
                            className={`flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-[13px] transition-colors ${
                              active ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-panel/60 hover:text-foreground"
                            }`}
                          >
                            <Icon className={`h-3.5 w-3.5 shrink-0 ${active ? "text-primary" : ""}`} />
                            <span className="truncate">{n.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* Center: graph + bottom chat */}
        <div className="flex min-w-0 flex-col">
          <div className="flex items-center gap-1.5 border-b border-border/70 bg-panel/30 px-3 py-2">
            <button className="rounded-md border border-border bg-panel/60 px-2 py-1 text-[11px] inline-flex items-center gap-1.5 hover:bg-panel transition-colors">
              <Filter className="h-3 w-3" /> Filter
            </button>
            <button className="rounded-md border border-border bg-panel/60 px-2 py-1 text-[11px] inline-flex items-center gap-1.5 hover:bg-panel transition-colors">
              <LayoutGrid className="h-3 w-3" /> Auto-layout
            </button>
            <button className="rounded-md border border-border bg-panel/60 px-2 py-1 text-[11px] hover:bg-panel transition-colors">Highlight deps</button>
            <div className="ml-auto flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
              <span>v42</span>
              <span className="text-border">·</span>
              <span>{archNodes.length} nodes</span>
              <span className="text-border">·</span>
              <span>{archEdges.length} edges</span>
              <button className="ml-1 rounded-md border border-border bg-panel/60 p-1 hover:bg-panel transition-colors" aria-label="Fullscreen">
                <Maximize2 className="h-3 w-3" />
              </button>
            </div>
          </div>

          <div className="dot-bg relative min-h-[420px] flex-1">
            {isLoading ? (
              <div className="flex h-full min-h-[420px] items-center justify-center text-sm text-muted-foreground">Loading architecture graph…</div>
            ) : archNodes.length ? (
              <ArchitectureGraph graphNodes={archNodes} graphEdges={archEdges} onSelect={setSelectedId} />
            ) : (
              <div className="flex h-full min-h-[420px] items-center justify-center text-center text-sm text-muted-foreground">Connect and scan a repository to build its architecture graph.</div>
            )}
          </div>

          {/* Bottom AI console */}
          <div className="h-[280px] border-t border-border/70 bg-panel/20">
            <AiChat compact repositoryId={repository?.id} />
          </div>
        </div>

        {/* Right: inspector */}
        <aside className="border-t lg:border-t-0 lg:border-l border-border/70 bg-sidebar/40 overflow-y-auto">
          {selected ? (
            <div className="space-y-5 p-5">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <KindBadge kind={selected.kind} />
                  <span className="font-mono text-[10px] text-muted-foreground">id:{selected.id}</span>
                </div>
                <h3 className="mt-3 text-lg font-semibold tracking-tight">{selected.label}</h3>
                <p className="mt-0.5 text-[13px] text-muted-foreground">{selected.sub}</p>
              </div>

              <div>
                <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">Signals</div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { l: "Health", v: "82", tone: "text-info" },
                    { l: "Drift",  v: "14%", tone: "text-warning" },
                    { l: "In",     v: connections.inbound.length.toString(),  tone: "text-foreground" },
                    { l: "Out",    v: connections.outbound.length.toString(), tone: "text-foreground" },
                  ].map((s) => (
                    <div key={s.l} className="rounded-lg border border-border/60 bg-panel/40 px-3 py-2.5">
                      <div className={`text-lg font-semibold tabular-nums ${s.tone}`}>{s.v}</div>
                      <div className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>

              {connections.inbound.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
                    <ArrowLeft className="h-3 w-3" /> Inbound · {connections.inbound.length}
                  </div>
                  <div className="space-y-1">
                    {connections.inbound.map((n) => {
                      const Icon = iconFor[n.kind];
                      return (
                        <button key={n.id} onClick={() => setSelectedId(n.id)}
                          className="flex w-full items-center gap-2 rounded-lg border border-border/60 bg-panel/40 px-2.5 py-1.5 text-left text-sm hover:border-primary/40 transition-colors">
                          <div className={`flex h-6 w-6 items-center justify-center rounded-md ${nodeColors[n.kind].bg} ring-1 ring-inset ${nodeColors[n.kind].ring}`}>
                            <Icon className="h-3 w-3" />
                          </div>
                          <span className="truncate">{n.label}</span>
                          <span className="ml-auto text-[10px] font-mono text-muted-foreground truncate">{n.sub}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {connections.outbound.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
                    <ArrowRight className="h-3 w-3" /> Outbound · {connections.outbound.length}
                  </div>
                  <div className="space-y-1">
                    {connections.outbound.map((n) => {
                      const Icon = iconFor[n.kind];
                      return (
                        <button key={n.id} onClick={() => setSelectedId(n.id)}
                          className="flex w-full items-center gap-2 rounded-lg border border-border/60 bg-panel/40 px-2.5 py-1.5 text-left text-sm hover:border-primary/40 transition-colors">
                          <div className={`flex h-6 w-6 items-center justify-center rounded-md ${nodeColors[n.kind].bg} ring-1 ring-inset ${nodeColors[n.kind].ring}`}>
                            <Icon className="h-3 w-3" />
                          </div>
                          <span className="truncate">{n.label}</span>
                          <span className="ml-auto text-[10px] font-mono text-muted-foreground truncate">{n.sub}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-2 pt-2">
                <button className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
                  Generate documentation
                </button>
                <button className="w-full rounded-lg border border-border bg-panel/60 px-3 py-2 text-sm hover:bg-panel transition-colors">
                  Plan refactor
                </button>
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-panel border border-border text-muted-foreground">
                <Server className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-medium">Select a node</div>
                <div className="mt-1 text-[12px] text-muted-foreground">Click any node in the graph to inspect its dependencies, health, and signals.</div>
              </div>
            </div>
          )}
        </aside>
      </div>
      
    </div>
  );
}
