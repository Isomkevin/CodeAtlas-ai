import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, HealthRing, SectionTitle, Sparkline, StatusDot } from "@/components/atlas-ui";
import { listArtifacts, listGraphVersions, listImplementationPlans, listRepositories, loadArchitectureGraph, requestRepositoryScan, type ApiRepository, type ArchitectureArtifact, type ArchitectureGraph, type GraphVersion, type ImplementationPlan } from "@/lib/api";
import { Activity, GitPullRequest, FileText, Sparkles, Server, Play, ArrowRight, ArrowUpRight, ScanLine, Wand2, Bot } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Dashboard · CodeAtlas" }] }),
  component: Dashboard,
});

type RepositorySnapshot = { repository: ApiRepository; graph: ArchitectureGraph | null; versions: GraphVersion[]; artifacts: ArchitectureArtifact[]; plans: ImplementationPlan[] };
type ActivityEvent = { id: string; at: string; title: string; detail: string };
const timestamp = (value: string) => new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
const visualTrend = (values: number[]) => values.length > 1 ? values : [0, 0];

function Dashboard() {
  const [snapshots, setSnapshots] = useState<RepositorySnapshot[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    let active = true;
    void listRepositories()
      .then(async (repositories) => {
        const values = await Promise.all(repositories.map(async (repository) => {
          const [graph, versions, artifacts, plans] = await Promise.all([
            loadArchitectureGraph(repository.id).catch(() => null),
            listGraphVersions(repository.id).catch(() => []),
            listArtifacts(repository.id).catch(() => []),
            listImplementationPlans(repository.id).catch(() => []),
          ]);
          return { repository, graph, versions, artifacts, plans };
        }));
        if (active) setSnapshots(values);
      })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Unable to load the workspace dashboard."); });
    return () => { active = false; };
  }, []);

  const repositories = snapshots.map((snapshot) => snapshot.repository);
  const totalNodes = snapshots.reduce((total, snapshot) => total + (snapshot.graph?.nodes.length ?? 0), 0);
  const graphVersions = snapshots.flatMap((snapshot) => snapshot.versions);
  const artifacts = snapshots.flatMap((snapshot) => snapshot.artifacts);
  const plans = snapshots.flatMap((snapshot) => snapshot.plans);
  const graphCoverage = repositories.length ? Math.round((snapshots.filter((snapshot) => snapshot.graph).length / repositories.length) * 100) : 0;
  const graphTrend = visualTrend(graphVersions.slice(0, 14).reverse().map((version) => version.sequence));
  const artifactTrend = visualTrend(artifacts.slice(0, 14).reverse().map((_, index) => index + 1));
  const planTrend = visualTrend(plans.slice(0, 14).reverse().map((_, index) => index + 1));
  const repoFor = (repositoryId: string) => repositories.find((repository) => repository.id === repositoryId)?.full_name ?? "Repository";
  const activity = useMemo<ActivityEvent[]>(() => [
    ...graphVersions.map((version) => ({ id: `graph-${version.id}`, at: version.created_at, title: `Graph v${version.sequence} ${version.status}`, detail: `${repoFor(version.repository_id)} · ${version.commit_sha.slice(0, 12)}` })),
    ...artifacts.map((artifact) => ({ id: `artifact-${artifact.id}`, at: artifact.created_at, title: `${artifact.kind} generated`, detail: `${repoFor(artifact.repository_id)} · graph ${artifact.graph_version_id}` })),
    ...plans.map((plan) => ({ id: `plan-${plan.id}`, at: plan.created_at, title: `Plan ${plan.status}`, detail: `${repoFor(plan.repository_id)} · ${plan.change_request}` })),
  ].sort((left, right) => Date.parse(right.at) - Date.parse(left.at)), [artifacts, graphVersions, plans, repositories]);

  const scanAll = async () => {
    setScanning(true);
    setError(null);
    try {
      await Promise.all(repositories.map((repository) => requestRepositoryScan(repository.id)));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to queue workspace scans.");
    } finally {
      setScanning(false);
    }
  };

  return <div>
    <PageHeader eyebrow="Workspace" title={<span className="flex items-center gap-3">Architecture overview<span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary"><span className="h-1.5 w-1.5 rounded-full bg-primary" />{repositories.length} connected</span></span>} description="A live snapshot of repositories, graph versions, generated artifacts, and approval-gated work." actions={<><button onClick={() => { void scanAll(); }} disabled={!repositories.length || scanning} className="inline-flex items-center gap-2 rounded-lg border border-border bg-panel px-3 py-2 text-sm hover:border-border/80 hover:bg-panel/80 transition-colors disabled:opacity-50"><ScanLine className="h-4 w-4" /> {scanning ? "Queueing scans" : "Scan all"}</button><Link to="/architecture" className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"><Sparkles className="h-4 w-4" /> Explore graph</Link></>} />
    {error && <div className="mx-6 mb-3 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
    <div className="grid grid-cols-1 gap-4 px-6 py-6 md:grid-cols-12 md:px-8">
      <Card className="p-5 md:col-span-4"><SectionTitle right={<span className="text-[11px] text-success">{graphCoverage}% covered</span>}>Graph coverage</SectionTitle><div className="flex items-center gap-5"><HealthRing value={graphCoverage} label="Coverage" /><div className="flex-1"><Sparkline values={graphTrend} /><div className="mt-2 grid grid-cols-3 gap-2 text-[11px] text-muted-foreground"><div><div className="text-foreground font-medium tabular-nums">{totalNodes}</div>nodes</div><div><div className="text-foreground font-medium tabular-nums">{graphVersions.length}</div>versions</div><div><div className="text-foreground font-medium tabular-nums">{repositories.length}</div>repos</div></div></div></div></Card>
      <Card className="p-5 md:col-span-4"><SectionTitle right={<span className="text-[11px] text-accent">{artifacts.length} generated</span>}>Architecture artifacts</SectionTitle><div className="flex items-center gap-5"><div className="tabular-nums text-3xl font-semibold">{artifacts.length}</div><div className="flex-1"><Sparkline values={artifactTrend} tone="accent" /><div className="mt-2 text-[11px] text-muted-foreground">Documentation and diagrams derived only from immutable graph versions.</div></div></div></Card>
      <Card className="p-5 md:col-span-4"><SectionTitle right={<span className="text-[11px] text-primary">{plans.filter((plan) => plan.status === "approved").length} approved</span>}>Implementation workflow</SectionTitle><div className="flex items-center gap-5"><div className="tabular-nums text-3xl font-semibold">{plans.length}</div><div className="flex-1"><Sparkline values={planTrend} tone="primary" /><div className="mt-2 text-[11px] text-muted-foreground">Plans remain gated until an owner or administrator approves a pull request.</div></div></div></Card>
      <Card className="p-5 md:col-span-8"><SectionTitle right={<Link to="/repositories" className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground">All repositories <ArrowRight className="h-3 w-3" /></Link>}>Repository graph state</SectionTitle><div className="divide-y divide-border/60">{snapshots.slice(0, 5).map((snapshot) => { const latest = snapshot.versions[0]; const ready = latest?.status === "ready"; return <div key={snapshot.repository.id} className="flex items-center gap-4 py-2.5"><div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-panel"><Server className="h-4 w-4 text-muted-foreground" /></div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="truncate text-sm font-medium">{snapshot.repository.full_name}</span><span className="text-[11px] font-mono text-muted-foreground">{snapshot.repository.default_branch}</span></div><div className="mt-0.5 truncate text-[11px] text-muted-foreground">{snapshot.graph ? `${snapshot.graph.nodes.length} nodes · ${snapshot.graph.edges.length} edges` : "Awaiting first graph projection"}</div></div><div className="flex items-center gap-2"><StatusDot tone={ready ? "success" : latest?.status === "failed" ? "danger" : "muted"} /><span className="hidden md:inline text-[11px] font-mono text-muted-foreground">{latest ? `v${latest.sequence}` : "unscanned"}</span></div></div>; })}{!snapshots.length && <div className="py-8 text-center text-sm text-muted-foreground">Connect a repository to begin.</div>}</div></Card>
      <Card className="p-5 md:col-span-4"><SectionTitle right={<span className="text-[11px] text-muted-foreground">latest</span>}>Recent activity</SectionTitle><ol className="relative ml-2 space-y-3.5 border-l border-border/70 pl-4">{activity.slice(0, 6).map((event) => <li key={event.id} className="relative"><span className="absolute -left-[21px] top-1 flex h-3 w-3 items-center justify-center rounded-full border border-border bg-panel"><span className="h-1.5 w-1.5 rounded-full bg-primary" /></span><div className="text-sm font-medium leading-tight">{event.title}</div><div className="mt-0.5 text-[11px] text-muted-foreground">{timestamp(event.at)}</div><div className="mt-0.5 truncate text-[11px] text-muted-foreground/80">{event.detail}</div></li>)}</ol>{!activity.length && <div className="py-8 text-center text-sm text-muted-foreground">No activity yet.</div>}</Card>
      <Card className="p-5 md:col-span-6"><SectionTitle right={<Link to="/implementation" className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"><GitPullRequest className="h-3 w-3" /> All plans</Link>}>Implementation plans</SectionTitle><div className="divide-y divide-border/60">{plans.slice(0, 5).map((plan) => <div key={plan.id} className="flex items-center gap-3 py-2.5"><span className="font-mono text-[11px] text-muted-foreground">{plan.status}</span><div className="min-w-0 flex-1"><div className="truncate text-sm">{plan.change_request}</div><div className="mt-0.5 text-[11px] text-muted-foreground">{repoFor(plan.repository_id)} · {timestamp(plan.created_at)}</div></div><span className="hidden md:inline rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-mono text-primary">{plan.pull_request_url ? "PR open" : "graph-bound"}</span></div>)}</div>{!plans.length && <div className="py-8 text-center text-sm text-muted-foreground">No implementation plans yet.</div>}</Card>
      <Card className="p-5 md:col-span-6"><SectionTitle right={<span className="inline-flex items-center gap-1 text-[11px] text-accent"><Wand2 className="h-3 w-3" /> graph-derived</span>}>Latest architecture facts</SectionTitle><div className="space-y-2.5">{snapshots.flatMap((snapshot) => snapshot.graph?.nodes.slice(0, 2).map((node) => ({ node, repository: snapshot.repository.full_name })) ?? []).slice(0, 4).map(({ node, repository }) => <div key={node.id} className="group flex items-start gap-3 rounded-lg border border-border/60 bg-panel/40 p-3"><div className="flex h-7 w-7 flex-none items-center justify-center rounded-md bg-accent/15 text-accent"><Sparkles className="h-3.5 w-3.5" /></div><div className="min-w-0 flex-1"><div className="text-sm font-medium leading-snug">{node.name}</div><div className="mt-0.5 text-[11px] text-muted-foreground">{repository} · {node.properties.path ?? node.kind}</div></div></div>)}</div>{!totalNodes && <div className="py-8 text-center text-sm text-muted-foreground">Scan a repository to surface graph facts.</div>}</Card>
      <Card className="p-5 md:col-span-4"><SectionTitle>Recent documentation</SectionTitle><div className="space-y-1.5">{artifacts.slice(0, 4).map((artifact) => <Link key={artifact.id} to="/documentation" className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-panel/60"><FileText className="h-4 w-4 text-muted-foreground" /><div className="min-w-0 flex-1"><div className="truncate text-sm">{artifact.kind}</div><div className="text-[11px] text-muted-foreground">{repoFor(artifact.repository_id)} · {timestamp(artifact.created_at)}</div></div></Link>)}</div>{!artifacts.length && <div className="py-8 text-center text-sm text-muted-foreground">No artifacts yet.</div>}</Card>
      <Card className="p-5 md:col-span-4"><SectionTitle right={<StatusDot tone="success" />}>Workspace state</SectionTitle><div className="space-y-2">{[{ name: "Repositories", value: repositories.length }, { name: "Graph versions", value: graphVersions.length }, { name: "Artifacts", value: artifacts.length }, { name: "Implementation plans", value: plans.length }].map((item) => <div key={item.name} className="flex items-center gap-3"><StatusDot tone={item.value ? "success" : "muted"} /><span className="text-sm">{item.name}</span><div className="flex-1" /><span className="font-mono text-[11px] text-muted-foreground tabular-nums">{item.value}</span></div>)}</div></Card>
      <Card className="p-5 md:col-span-4"><SectionTitle>Quick actions</SectionTitle><div className="grid grid-cols-2 gap-2">{[{ icon: Play, label: "Scan repository", to: "/repositories" as const }, { icon: FileText, label: "Generate docs", to: "/documentation" as const }, { icon: Sparkles, label: "Draft plan", to: "/implementation" as const }, { icon: Bot, label: "Open agents", to: "/agents" as const }, { icon: Activity, label: "Open graph", to: "/architecture" as const }, { icon: ArrowRight, label: "New workspace", to: "/settings" as const }].map((action) => <Link key={action.label} to={action.to} className="group flex items-center gap-2 rounded-lg border border-border/60 bg-panel/40 px-3 py-2.5 text-sm hover:border-primary/40 hover:bg-panel"><action.icon className="h-4 w-4 text-primary" /><span className="truncate">{action.label}</span><ArrowUpRight className="ml-auto h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" /></Link>)}</div></Card>
    </div>
  </div>;
}
