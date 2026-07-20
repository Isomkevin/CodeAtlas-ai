import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, SectionTitle, StatusDot } from "@/components/atlas-ui";
import { repositories } from "@/lib/mock-data";
import { GitBranch, Plus, Search, Star, GitPullRequest, ChevronRight, ScanLine } from "lucide-react";
import { useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/repositories")({
  head: () => ({ meta: [{ title: "Repositories · CodeAtlas" }] }),
  component: RepositoriesPage,
});

function RepositoriesPage() {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("all");
  const filtered = useMemo(() => {
    const term = q.toLowerCase();
    return repositories.filter((r) =>
      (tab === "all" || r.status === tab) &&
      (r.name.includes(term) || r.language.toLowerCase().includes(term) || r.desc.toLowerCase().includes(term)),
    );
  }, [q, tab]);

  return (
    <div>
      <PageHeader
        eyebrow="Sources"
        title="Repositories"
        description="Every repository connected to this workspace, with live health and drift telemetry."
        actions={
          <>
            <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-panel px-3 py-2 text-sm">
              <ScanLine className="h-4 w-4" /> Rescan all
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
              <Plus className="h-4 w-4" /> Connect repository
            </button>
          </>
        }
      />

      <div className="px-6 py-6 md:px-8">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Search repositories…"
              className="w-full rounded-lg border border-border bg-panel/60 pl-9 pr-3 py-2 text-sm outline-none focus:border-primary/60"
            />
          </div>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="healthy">Healthy</TabsTrigger>
              <TabsTrigger value="warning">Warnings</TabsTrigger>
              <TabsTrigger value="critical">Critical</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Card>
          <div className="grid grid-cols-12 gap-4 border-b border-border/70 px-5 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            <div className="col-span-5">Repository</div>
            <div className="col-span-2">Language</div>
            <div className="col-span-1 text-right">Health</div>
            <div className="col-span-1 text-right">Drift</div>
            <div className="col-span-1 text-right">PRs</div>
            <div className="col-span-2 text-right">Updated</div>
          </div>
          <div className="divide-y divide-border/60">
            {filtered.map((r) => (
              <Link to="/architecture" key={r.id} className="group grid grid-cols-12 items-center gap-4 px-5 py-3 hover:bg-panel/40 transition-colors">
                <div className="col-span-5 min-w-0 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-panel border border-border">
                    <GitBranch className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">{r.name}</span>
                      <StatusDot tone={r.status === "critical" ? "danger" : r.status === "warning" ? "warning" : "success"} />
                    </div>
                    <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{r.desc}</div>
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-sm">{r.language}</div>
                  <div className="text-[11px] text-muted-foreground">{r.framework} · {r.provider}</div>
                </div>
                <div className="col-span-1 text-right">
                  <div className="tabular-nums text-sm font-medium">{r.health}</div>
                  <div className="mt-1 h-1 rounded-full bg-border/60 overflow-hidden">
                    <div className={`h-full ${r.status === "critical" ? "bg-danger" : r.status === "warning" ? "bg-warning" : "bg-success"}`} style={{ width: `${r.health}%` }} />
                  </div>
                </div>
                <div className="col-span-1 text-right font-mono text-sm tabular-nums text-muted-foreground">{r.drift}%</div>
                <div className="col-span-1 text-right">
                  <span className="inline-flex items-center gap-1 rounded-md border border-border bg-background/40 px-1.5 py-0.5 text-[11px] font-mono">
                    <GitPullRequest className="h-3 w-3" /> {r.prs}
                  </span>
                </div>
                <div className="col-span-2 flex items-center justify-end gap-3 text-[11px] font-mono text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Star className="h-3 w-3" /> {r.stars}</span>
                  <span>{r.updated}</span>
                  <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </div>
        </Card>

        {/* Selected repository preview */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="p-5 md:col-span-2">
            <SectionTitle right={<Link to="/architecture" className="text-[11px] text-muted-foreground hover:text-foreground">Open workspace →</Link>}>
              atlas-core · overview
            </SectionTitle>
            <div className="grid grid-cols-4 gap-3 text-center">
              {[
                { l: "Modules", v: "42" }, { l: "Services", v: "8" }, { l: "APIs", v: "23" }, { l: "Databases", v: "4" },
              ].map((s) => (
                <div key={s.l} className="rounded-lg border border-border/60 bg-panel/40 py-3">
                  <div className="text-xl font-semibold tabular-nums">{s.v}</div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.l}</div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <SectionTitle>Actions</SectionTitle>
            <div className="space-y-2 text-sm">
              {["Scan repository","Generate documentation","Generate diagram","Open AI chat","Create implementation plan"].map((a) => (
                <button key={a} className="w-full rounded-lg border border-border/60 bg-panel/40 px-3 py-2 text-left hover:border-primary/40">{a}</button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
