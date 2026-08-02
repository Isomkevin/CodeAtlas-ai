import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, SectionTitle, StatusDot } from "@/components/atlas-ui";
import { connectRepository, listRepositories, requestRepositoryScan, type ApiRepository } from "@/lib/api";
import { ApiErrorBanner } from "@/components/api-error-banner";
import { GitBranch, Plus, Search, ChevronRight, ScanLine } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/repositories")({
  head: () => ({ meta: [{ title: "Repositories · CodeAtlas" }] }),
  component: RepositoriesPage,
});

function RepositoriesPage() {
  const [repositories, setRepositories] = useState<ApiRepository[]>([]);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      setRepositories(await listRepositories());
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load repositories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void refresh(); }, []);

  const connect = async () => {
    const url = window.prompt("GitHub repository URL");
    if (!url) return;
    try {
      await connectRepository(url);
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to connect repository.");
    }
  };

  const rescanAll = async () => {
    try {
      await Promise.all(repositories.map((repository) => requestRepositoryScan(repository.id)));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to queue scans.");
    }
  };

  const filtered = useMemo(() => repositories.filter((repository) => {
    const matches = repository.full_name.toLowerCase().includes(query.toLowerCase());
    return matches && (tab === "all" || repository.status === tab);
  }), [query, repositories, tab]);
  const selected = filtered[0] ?? repositories[0] ?? null;

  return (
    <div>
      <PageHeader
        eyebrow="Sources"
        title="Repositories"
        description="Every repository connected to this workspace, with live scan and graph state."
        actions={<>
          <button onClick={() => { void rescanAll(); }} disabled={!repositories.length} className="inline-flex items-center gap-2 rounded-lg border border-border bg-panel px-3 py-2 text-sm disabled:opacity-50">
            <ScanLine className="h-4 w-4" /> Rescan all
          </button>
          <button onClick={() => { void connect(); }} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
            <Plus className="h-4 w-4" /> Connect repository
          </button>
        </>}
      />
      <ApiErrorBanner error={error} />

      <div className="px-6 py-6 md:px-8">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search repositories…" className="w-full rounded-lg border border-border bg-panel/60 py-2 pl-9 pr-3 text-sm outline-none focus:border-primary/60" />
          </div>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList><TabsTrigger value="all">All</TabsTrigger><TabsTrigger value="active">Connected</TabsTrigger></TabsList>
          </Tabs>
        </div>

        <Card>
          <div className="grid grid-cols-12 gap-4 border-b border-border/70 px-5 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            <div className="col-span-7">Repository</div><div className="col-span-3">Default branch</div><div className="col-span-2 text-right">State</div>
          </div>
          <div className="divide-y divide-border/60">
            {loading && <div className="px-5 py-8 text-sm text-muted-foreground">Loading repositories…</div>}
            {!loading && !filtered.length && <div className="px-5 py-8 text-sm text-muted-foreground">No repositories are connected yet.</div>}
            {filtered.map((repository) => (
              <Link to="/architecture" key={repository.id} className="group grid grid-cols-12 items-center gap-4 px-5 py-3 transition-colors hover:bg-panel/40">
                <div className="col-span-7 flex min-w-0 items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-panel"><GitBranch className="h-4 w-4 text-primary" /></div><div className="min-w-0"><div className="flex items-center gap-2"><span className="truncate text-sm font-medium">{repository.full_name}</span><StatusDot tone="success" /></div><div className="mt-0.5 text-[11px] text-muted-foreground">GitHub · canonical graph enabled</div></div></div>
                <div className="col-span-3 text-sm">{repository.default_branch}</div>
                <div className="col-span-2 flex items-center justify-end gap-2 text-[11px] font-mono text-muted-foreground"><span>{repository.status}</span><ChevronRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" /></div>
              </Link>
            ))}
          </div>
        </Card>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="p-5 md:col-span-2"><SectionTitle right={<Link to="/architecture" className="text-[11px] text-muted-foreground hover:text-foreground">Open workspace →</Link>}>{selected ? `${selected.full_name} · overview` : "Repository overview"}</SectionTitle><p className="text-sm text-muted-foreground">Scan a repository to create a versioned source and architecture graph. Artifacts, chat, drift, and plans derive from that graph.</p></Card>
          <Card className="p-5"><SectionTitle>Actions</SectionTitle><div className="space-y-2 text-sm"><button onClick={() => selected && void requestRepositoryScan(selected.id)} disabled={!selected} className="w-full rounded-lg border border-border/60 bg-panel/40 px-3 py-2 text-left disabled:opacity-50">Scan repository</button><Link to="/documentation" className="block w-full rounded-lg border border-border/60 bg-panel/40 px-3 py-2">Generate documentation</Link><Link to="/implementation" className="block w-full rounded-lg border border-border/60 bg-panel/40 px-3 py-2">Create implementation plan</Link></div></Card>
        </div>
      </div>
    </div>
  );
}
