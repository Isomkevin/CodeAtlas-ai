import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, SectionTitle } from "@/components/atlas-ui";
import { listArtifacts, listGraphVersions, listImplementationPlans, listRepositories, type ArchitectureArtifact, type GraphVersion, type ImplementationPlan } from "@/lib/api";
import { Network, BookOpen, Waypoints, Terminal, GitCommit } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/history")({
  head: () => ({ meta: [{ title: "History · CodeAtlas" }] }),
  component: HistoryPage,
});

type HistoryEvent = { id: string; at: string; type: "architecture" | "docs" | "diagram" | "implementation"; title: string; detail: string };
const iconFor = (type: HistoryEvent["type"]) => type === "architecture" ? Network : type === "docs" ? BookOpen : type === "diagram" ? Waypoints : Terminal;
const timestamp = (value: string) => new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

function HistoryPage() {
  const [versions, setVersions] = useState<GraphVersion[]>([]);
  const [artifacts, setArtifacts] = useState<ArchitectureArtifact[]>([]);
  const [plans, setPlans] = useState<ImplementationPlan[]>([]);
  const [repositoryName, setRepositoryName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void listRepositories()
      .then(async (repositories) => {
        const repository = repositories[0];
        if (!repository) return;
        const [graphVersions, generatedArtifacts, implementationPlans] = await Promise.all([
          listGraphVersions(repository.id), listArtifacts(repository.id), listImplementationPlans(repository.id),
        ]);
        if (!active) return;
        setRepositoryName(repository.full_name);
        setVersions(graphVersions);
        setArtifacts(generatedArtifacts);
        setPlans(implementationPlans);
      })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Unable to load history."); });
    return () => { active = false; };
  }, []);

  const events = useMemo<HistoryEvent[]>(() => [
    ...versions.map((version) => ({ id: version.id, at: version.created_at, type: "architecture" as const, title: `Graph v${version.sequence} · ${version.status}`, detail: version.commit_sha.slice(0, 12) })),
    ...artifacts.map((artifact) => ({ id: artifact.id, at: artifact.created_at, type: artifact.kind === "documentation" ? "docs" as const : "diagram" as const, title: `${artifact.kind} artifact generated`, detail: `Graph ${artifact.graph_version_id}` })),
    ...plans.map((plan) => ({ id: plan.id, at: plan.created_at, type: "implementation" as const, title: `Implementation plan · ${plan.status}`, detail: plan.change_request })),
  ].sort((left, right) => Date.parse(right.at) - Date.parse(left.at)), [artifacts, plans, versions]);
  const latestVersion = versions[0] ?? null;

  return <div>
    <PageHeader eyebrow={repositoryName ?? "Timeline"} title="History" description="A versioned timeline of the canonical graph, generated artifacts, and implementation plans." />
    {error && <div className="mx-6 mb-3 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
    <div className="grid grid-cols-1 gap-4 px-6 py-6 md:grid-cols-3 md:px-8">
      <Card className="p-5 md:col-span-2"><SectionTitle right={<span className="text-[11px] font-mono text-muted-foreground">{versions.length} graph versions</span>}>Timeline</SectionTitle><ol className="relative ml-2 space-y-5 border-l border-border/70 pl-5">{events.map((event) => { const Icon = iconFor(event.type); return <li key={event.id} className="relative"><span className="absolute -left-[27px] top-0 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-panel"><Icon className="h-2.5 w-2.5 text-primary" /></span><div className="text-[11px] font-mono text-muted-foreground">{timestamp(event.at)}</div><div className="mt-0.5 text-sm font-medium">{event.title}</div><div className="mt-0.5 text-[11px] text-muted-foreground">{event.detail}</div></li>; })}</ol>{!events.length && <div className="py-8 text-center text-sm text-muted-foreground">Scan a repository to create a history.</div>}</Card>
      <Card className="p-5"><SectionTitle>Latest graph</SectionTitle>{latestVersion ? <div className="rounded-xl border border-border/60 bg-panel/40 p-3 font-mono text-[12px] leading-relaxed"><div className="text-muted-foreground">version: {latestVersion.sequence}</div><div className="text-muted-foreground">commit: {latestVersion.commit_sha}</div><div className="text-muted-foreground">status: {latestVersion.status}</div><div className="mt-2 text-foreground">{Object.entries(latestVersion.summary).map(([key, value]) => <div key={key}>{key}: {String(value)}</div>)}</div></div> : <div className="text-sm text-muted-foreground">No graph version is available.</div>}</Card>
      <Card className="p-5 md:col-span-3"><SectionTitle right={<GitCommit className="h-3.5 w-3.5 text-muted-foreground" />}>Version activity</SectionTitle><div className="grid grid-cols-3 gap-3 md:grid-cols-6"><div className="rounded-lg border border-border/60 bg-panel/40 p-3"><div className="text-lg font-semibold">{versions.length}</div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">Graph versions</div></div><div className="rounded-lg border border-border/60 bg-panel/40 p-3"><div className="text-lg font-semibold">{artifacts.length}</div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">Artifacts</div></div><div className="rounded-lg border border-border/60 bg-panel/40 p-3"><div className="text-lg font-semibold">{plans.length}</div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">Plans</div></div></div></Card>
    </div>
  </div>;
}
