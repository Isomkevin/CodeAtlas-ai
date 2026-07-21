import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, SectionTitle } from "@/components/atlas-ui";
import { createImplementationPlan, listImplementationPlans, listRepositories, type ApiRepository, type ImplementationPlan } from "@/lib/api";
import { Sparkles, GitPullRequest, CheckCircle2, Circle, FileCode2, ClipboardList, Eye, Rocket, Layers } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/implementation")({
  head: () => ({ meta: [{ title: "Implementation · CodeAtlas" }] }),
  component: ImplementationPage,
});

function ImplementationPage() {
  const [repository, setRepository] = useState<ApiRepository | null>(null);
  const [plans, setPlans] = useState<ImplementationPlan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const active = plans[0] ?? null;

  const load = async () => {
    try {
      const repositories = await listRepositories();
      const selected = repositories[0] ?? null;
      setRepository(selected);
      setPlans(selected ? await listImplementationPlans(selected.id) : []);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load implementation plans.");
    }
  };
  useEffect(() => { void load(); }, []);

  const create = async () => {
    if (!repository) return;
    const changeRequest = window.prompt("Describe the architecture change to plan");
    if (!changeRequest) return;
    setCreating(true);
    try {
      const plan = await createImplementationPlan(repository.id, changeRequest);
      setPlans((current) => [plan, ...current]);
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to create plan.");
    } finally {
      setCreating(false);
    }
  };

  const tasks = active?.plan_json.tasks ?? [];
  return <div>
    <PageHeader eyebrow="Workflow" title="Implementation workspace" description="Turn architecture graph intent into an approval-gated pull request." actions={<>
      <button onClick={() => { void create(); }} disabled={!repository || creating} className="inline-flex items-center gap-2 rounded-lg border border-border bg-panel px-3 py-2 text-sm disabled:opacity-50"><Sparkles className="h-4 w-4" /> {creating ? "Planning" : "New plan"}</button>
      <button disabled={!active || active.status !== "approved"} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"><Rocket className="h-4 w-4" /> Ship draft PR</button>
    </>} />
    {error && <div className="mx-6 mb-3 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
    <div className="px-6 py-6 md:px-8">
      <Card className="p-5"><div className="flex flex-wrap items-center justify-between gap-5 text-sm"><span className="inline-flex items-center gap-2"><Layers className="h-4 w-4 text-primary" /> Architecture graph</span><span className="inline-flex items-center gap-2"><Eye className="h-4 w-4 text-primary" /> Impact analysis</span><span className="inline-flex items-center gap-2"><ClipboardList className="h-4 w-4 text-primary" /> Approval-gated plan</span><span className="inline-flex items-center gap-2"><GitPullRequest className="h-4 w-4 text-muted-foreground" /> Pull request</span></div></Card>
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3"><Card className="p-5 lg:col-span-2"><SectionTitle right={active ? <span className="rounded-md bg-panel px-2 py-0.5 text-[10px] font-mono">{active.status}</span> : null}>{active?.change_request ?? "No implementation plan selected"}</SectionTitle><p className="text-sm text-muted-foreground">{active ? `Bound to graph version ${active.graph_version_id}. Owners or administrators must approve before a coding-agent branch can open a PR.` : "Connect and scan a repository, then create a plan from the Architecture screen or this workspace."}</p><div className="mt-5 space-y-2">{tasks.map((task, index) => <div key={task.id} className="flex items-center gap-3 rounded-lg border border-border/60 bg-panel/40 px-3 py-2.5">{index === 0 ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Circle className="h-4 w-4 text-muted-foreground" />}<FileCode2 className="h-4 w-4 text-muted-foreground" /><div className="min-w-0 flex-1"><div className="text-sm">{task.title}</div><div className="truncate text-[11px] font-mono text-muted-foreground">{task.path ?? "architecture component"}</div></div></div>)}{active && !tasks.length && <div className="text-sm text-muted-foreground">This graph version has no matching implementation tasks.</div>}</div></Card><Card className="p-5"><SectionTitle>Plan history</SectionTitle><div className="space-y-2">{plans.map((plan) => <button key={plan.id} className="w-full rounded-lg border border-border/60 bg-panel/40 p-3 text-left"><div className="truncate text-sm font-medium">{plan.change_request}</div><div className="mt-1 text-[11px] font-mono text-muted-foreground">{plan.status}</div></button>)}{!plans.length && <div className="text-sm text-muted-foreground">No plans yet.</div>}</div></Card></div>
    </div>
  </div>;
}
