import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { AiChat } from "@/components/ai-chat";
import { generateArtifact, listArtifacts, listRepositories, type ArchitectureArtifact, type ApiRepository } from "@/lib/api";
import { FileText, FolderTree, RefreshCw, Download, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/documentation")({
  head: () => ({ meta: [{ title: "Documentation · CodeAtlas" }] }),
  component: DocumentationPage,
});

function DocumentationPage() {
  const [repository, setRepository] = useState<ApiRepository | null>(null);
  const [artifacts, setArtifacts] = useState<ArchitectureArtifact[]>([]);
  const [active, setActive] = useState<ArchitectureArtifact | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const load = async () => {
    try {
      const repositories = await listRepositories();
      const selected = repositories[0] ?? null;
      setRepository(selected);
      if (!selected) return;
      const values = await listArtifacts(selected.id);
      setArtifacts(values);
      setActive(values.find((artifact) => artifact.kind === "documentation") ?? values[0] ?? null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load generated artifacts.");
    }
  };

  useEffect(() => { void load(); }, []);

  const generate = async () => {
    if (!repository) return;
    setGenerating(true);
    try {
      const artifact = await generateArtifact(repository.id, "documentation");
      setArtifacts((current) => [artifact, ...current.filter((item) => item.id !== artifact.id)]);
      setActive(artifact);
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to generate documentation.");
    } finally {
      setGenerating(false);
    }
  };

  const download = () => {
    if (!active) return;
    const blob = new Blob([active.content], { type: "text/markdown" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${repository?.full_name.replace("/", "-") ?? "architecture"}-${active.kind}.md`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return <div>
    <PageHeader eyebrow="Knowledge" title="Documentation" description="Graph-derived, versioned architecture artifacts." actions={<>
      <button onClick={download} disabled={!active} className="inline-flex items-center gap-2 rounded-lg border border-border bg-panel px-3 py-2 text-sm disabled:opacity-50"><Download className="h-4 w-4" /> Export</button>
      <button onClick={() => { void generate(); }} disabled={!repository || generating} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"><RefreshCw className="h-4 w-4" /> {generating ? "Generating" : "Regenerate"}</button>
    </>} />
    {error && <div className="mx-6 mb-3 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
    <div className="grid min-h-[calc(100vh-140px)] grid-cols-1 lg:grid-cols-[260px_1fr_360px]">
      <aside className="hidden border-r border-border/70 bg-sidebar/40 p-3 lg:block"><div className="mb-2 flex items-center gap-1.5 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground"><FolderTree className="h-3.5 w-3.5" /> Artifacts</div>{artifacts.map((artifact) => <button key={artifact.id} onClick={() => setActive(artifact)} className={`mb-1 flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm ${active?.id === artifact.id ? "bg-primary/15" : "hover:bg-panel/60"}`}><FileText className="h-3.5 w-3.5" /><span className="truncate">{artifact.kind}</span><ChevronRight className="ml-auto h-3.5 w-3.5" /></button>)}</aside>
      <main className="min-w-0 overflow-y-auto px-6 py-6 md:px-10"><div className="mx-auto max-w-3xl"><div className="mb-6"><div className="text-[11px] font-mono text-muted-foreground">{repository?.full_name ?? "No repository"} / graph-derived artifact</div><h2 className="mt-1 text-3xl font-semibold tracking-tight">{active?.kind ?? "Documentation"}</h2><div className="mt-2 text-[11px] text-muted-foreground">{active ? `Graph version ${active.graph_version_id}` : "Scan a repository, then generate an artifact."}</div></div>{active ? <pre className="whitespace-pre-wrap rounded-xl border border-border bg-panel/60 p-4 text-sm leading-relaxed">{active.content}</pre> : <div className="rounded-xl border border-border bg-panel/40 p-6 text-sm text-muted-foreground">No generated artifacts are available.</div>}</div></main>
      <aside className="hidden border-l border-border/70 bg-sidebar/40 lg:block"><AiChat compact repositoryId={repository?.id} /></aside>
    </div>
  </div>;
}
