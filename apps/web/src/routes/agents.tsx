import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, StatusDot } from "@/components/atlas-ui";
import { listArtifacts, listGraphVersions, listImplementationPlans, listRepositories, type ArchitectureArtifact, type GraphVersion, type ImplementationPlan } from "@/lib/api";
import { Compass, Network, BookOpen, Terminal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/agents")({
  head: () => ({ meta: [{ title: "AI agents · CodeAtlas" }] }),
  component: AgentsPage,
});

type Agent = { id: string; name: string; icon: typeof Compass; completed: number; latest: string | null; description: string };
const timestamp = (value: string | null) => value ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "awaiting work";

function AgentsPage() {
  const [versions, setVersions] = useState<GraphVersion[]>([]);
  const [artifacts, setArtifacts] = useState<ArchitectureArtifact[]>([]);
  const [plans, setPlans] = useState<ImplementationPlan[]>([]);
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
        setVersions(graphVersions);
        setArtifacts(generatedArtifacts);
        setPlans(implementationPlans);
      })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Unable to load agent activity."); });
    return () => { active = false; };
  }, []);

  const agents = useMemo<Agent[]>(() => [
    { id: "architecture", name: "Architecture projector", icon: Network, completed: versions.length, latest: versions[0]?.completed_at ?? versions[0]?.created_at ?? null, description: "Turns parsed source facts into immutable graph versions." },
    { id: "documentation", name: "Documentation generator", icon: BookOpen, completed: artifacts.length, latest: artifacts[0]?.created_at ?? null, description: "Renders Markdown, Mermaid, Draw.io, and C4 directly from graph versions." },
    { id: "planner", name: "Implementation planner", icon: Compass, completed: plans.length, latest: plans[0]?.completed_at ?? plans[0]?.created_at ?? null, description: "Builds graph-bound plans that require approval before PR creation." },
    { id: "coding", name: "MCP coding bridge", icon: Terminal, completed: plans.filter((plan) => plan.status === "pull_request_opened").length, latest: plans.find((plan) => plan.pull_request_url)?.completed_at ?? null, description: "Supplies graph and approved plan context to a coding agent without source-file access." },
  ], [artifacts, plans, versions]);

  return <div>
    <PageHeader eyebrow="Autonomous" title="AI agents" description="Live architecture workflows executing against canonical graph versions." />
    {error && <div className="mx-6 mb-3 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
    <div className="grid grid-cols-1 gap-4 px-6 py-6 md:grid-cols-2 md:px-8 lg:grid-cols-3">{agents.map((agent) => {
      const Icon = agent.icon;
      const active = agent.completed > 0;
      return <Card key={agent.id} className="group p-5 transition-all hover:border-primary/40"><div className="flex items-start justify-between"><div className="flex items-center gap-3"><div className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-panel"><Icon className="h-5 w-5 text-primary" />{active && <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-success ring-2 ring-card" />}</div><div><div className="text-base font-semibold tracking-tight">{agent.name}</div><div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground"><StatusDot tone={active ? "success" : "muted"} /><span>{active ? "active" : "idle"}</span></div></div></div></div><p className="mt-4 text-sm leading-relaxed text-muted-foreground">{agent.description}</p><div className="mt-4 grid grid-cols-2 gap-2 text-center"><div className="rounded-lg border border-border/60 bg-panel/40 py-2"><div className="text-sm font-semibold tabular-nums">{agent.completed}</div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">Completed</div></div><div className="rounded-lg border border-border/60 bg-panel/40 py-2"><div className="text-sm font-semibold tabular-nums">{active ? "ready" : "—"}</div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">State</div></div></div><div className="mt-4 rounded-md bg-panel/40 px-2 py-1.5 text-[12px] text-muted-foreground">Last work: {timestamp(agent.latest)}</div></Card>;
    })}</div>
  </div>;
}
