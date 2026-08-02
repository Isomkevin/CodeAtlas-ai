import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, KindBadge, SectionTitle } from "@/components/atlas-ui";
import { graphNodeKind } from "@/lib/graph-ui";
import { listGraphVersions, listRepositories, loadArchitectureGraph, type ArchitectureGraphEdge, type ArchitectureGraphNode, type GraphVersion } from "@/lib/api";
import { ApiErrorBanner } from "@/components/api-error-banner";
import { Search, ArrowRight, Clock, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/knowledge")({
  head: () => ({ meta: [{ title: "Knowledge graph · CodeAtlas" }] }),
  component: KnowledgePage,
});

const timestamp = (value: string) => new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

function KnowledgePage() {
  const [q, setQ] = useState("");
  const [nodes, setNodes] = useState<ArchitectureGraphNode[]>([]);
  const [edges, setEdges] = useState<ArchitectureGraphEdge[]>([]);
  const [versions, setVersions] = useState<GraphVersion[]>([]);
  const [repositoryName, setRepositoryName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void listRepositories()
      .then(async (repositories) => {
        const repository = repositories[0];
        if (!repository) return;
        const [graph, graphVersions] = await Promise.all([
          loadArchitectureGraph(repository.id),
          listGraphVersions(repository.id),
        ]);
        if (!active) return;
        setRepositoryName(repository.full_name);
        setNodes(graph.nodes);
        setEdges(graph.edges);
        setVersions(graphVersions);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Unable to load architecture knowledge.");
      });
    return () => { active = false; };
  }, []);

  const results = useMemo(() => {
    const term = q.toLowerCase();
    return nodes.filter((node) => !term || [node.name, node.kind, node.properties.path ?? ""].some((value) => value.toLowerCase().includes(term)));
  }, [nodes, q]);
  const related = useMemo(() => nodes.map((node) => node.name).filter((value, index, all) => all.indexOf(value) === index).slice(0, 8), [nodes]);

  return (
    <div>
      <PageHeader eyebrow={repositoryName ?? "Semantic"} title="Knowledge graph" description="Search the canonical architecture graph and inspect versioned graph history." />
      <ApiErrorBanner error={error} />
      <div className="px-6 py-6 md:px-8">
        <div className="relative mb-6">
          <div className="absolute inset-x-0 -top-8 -z-10 mx-auto h-32 max-w-2xl rounded-full bg-primary/20 blur-3xl" />
          <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-panel/60 backdrop-blur px-4 py-3 focus-within:border-primary/60">
            <div className="flex items-center gap-3"><Search className="h-4 w-4 text-muted-foreground" /><input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search graph entities and symbols…" className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" /><span className="rounded-md border border-border bg-background/60 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">graph</span></div>
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-1.5 text-[11px]">{related.map((term) => <button key={term} onClick={() => setQ(term)} className="rounded-md border border-border bg-panel/40 px-2 py-0.5 text-muted-foreground hover:text-foreground">{term}</button>)}</div>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="p-4 lg:col-span-2">
            <SectionTitle right={<span className="text-[11px] font-mono text-muted-foreground">{results.length} results</span>}>Results</SectionTitle>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{results.map((node) => {
              const dependencyCount = edges.filter((edge) => edge.source_id === node.id || edge.target_id === node.id).length;
              return <div key={node.id} className="group rounded-xl border border-border/60 bg-panel/40 p-3 hover:border-primary/40 transition-colors"><div className="flex items-center justify-between"><KindBadge kind={graphNodeKind(node.kind)} /><ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition" /></div><div className="mt-2 text-sm font-medium">{node.name}</div><div className="text-[11px] text-muted-foreground">{node.properties.path ?? node.kind}</div><div className="mt-3 flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground"><span className="rounded-md bg-background/60 px-1.5 py-0.5">relationships: {dependencyCount}</span></div></div>;
            })}</div>
            {!results.length && <div className="py-8 text-center text-sm text-muted-foreground">Scan a repository to populate its architecture graph.</div>}
          </Card>
          <div className="space-y-4">
            <Card className="p-4"><SectionTitle right={<Sparkles className="h-3.5 w-3.5 text-accent" />}>Graph concepts</SectionTitle><div className="flex flex-wrap gap-1.5">{related.map((term) => <span key={term} className="rounded-full border border-border bg-panel/60 px-2.5 py-1 text-[11px]">{term}</span>)}</div></Card>
            <Card className="p-4"><SectionTitle right={<Clock className="h-3.5 w-3.5 text-muted-foreground" />}>Graph versions</SectionTitle><ol className="relative ml-1 space-y-3 border-l border-border/70 pl-4">{versions.slice(0, 5).map((version) => <li key={version.id} className="relative"><span className="absolute -left-[19px] top-1 h-2.5 w-2.5 rounded-full bg-primary/70 ring-2 ring-background" /><div className="text-[11px] font-mono text-muted-foreground">{timestamp(version.created_at)}</div><div className="text-sm">v{version.sequence} · {version.status}</div></li>)}</ol>{!versions.length && <div className="text-sm text-muted-foreground">No graph versions yet.</div>}</Card>
          </div>
        </div>
      </div>
    </div>
  );
}
