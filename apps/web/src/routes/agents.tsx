import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, StatusDot } from "@/components/atlas-ui";
import { apiBaseUrl, listArtifacts, listGraphVersions, listImplementationPlans, listRepositories, type ArchitectureArtifact, type GraphVersion, type ImplementationPlan } from "@/lib/api";
import { Compass, Network, BookOpen, Terminal, Check, Copy } from "lucide-react";
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
  const [mcpCopied, setMcpCopied] = useState(false);
  const [mcpError, setMcpError] = useState<string | null>(null);

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

  const copyMcpConfiguration = async () => {
    const token = sessionStorage.getItem("codeatlas.access_token");
    if (!token) {
      setMcpError("Sign in to CodeAtlas before creating a private MCP configuration.");
      return;
    }
    const configuration = {
      mcpServers: {
        codeatlas: {
          command: "uv",
          args: ["run", "python", "-m", "app.mcp_server"],
          env: {
            CODEATLAS_MCP_API_BASE_URL: `${apiBaseUrl}/api/v1`,
            CODEATLAS_MCP_TOKEN: token,
          },
        },
      },
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(configuration, null, 2));
      setMcpCopied(true);
      setMcpError(null);
      window.setTimeout(() => setMcpCopied(false), 2500);
    } catch {
      setMcpError("Your browser blocked clipboard access. Copy the configuration from docs/07-mcp/client-setup.md instead.");
    }
  };

  return <div>
    <PageHeader eyebrow="Autonomous" title="AI agents" description="Live architecture workflows executing against canonical graph versions." />
    {error && <div className="mx-6 mb-3 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
    <div className="grid grid-cols-1 gap-4 px-6 py-6 md:grid-cols-2 md:px-8 lg:grid-cols-3">
      <Card className="p-5 md:col-span-2 lg:col-span-3"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><div className="flex items-center gap-2 text-base font-semibold"><Terminal className="h-4 w-4 text-primary" />Connect an MCP coding agent</div><p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">Cursor, Claude Desktop, Claude Code, and OpenClaw can use the local CodeAtlas stdio bridge to read architecture graphs and create approval-gated plans. The bridge never exposes source files.</p></div><button onClick={() => { void copyMcpConfiguration(); }} className="inline-flex flex-none items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">{mcpCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{mcpCopied ? "Private config copied" : "Copy private MCP config"}</button></div><div className="mt-4 rounded-lg border border-border/60 bg-background/40 p-3 font-mono text-[11px] leading-5 text-muted-foreground">get_architecture_graph · create_implementation_plan<br />Run from the CodeAtlas checkout: <span className="text-foreground">uv run python -m app.mcp_server</span></div>{mcpError && <p className="mt-3 text-xs text-danger">{mcpError}</p>}<p className="mt-3 text-[11px] text-muted-foreground">The copied configuration contains your short-lived workspace token. Keep it in local agent settings only; client-specific instructions are in <code>docs/07-mcp/client-setup.md</code>.</p></Card>
      {agents.map((agent) => {
      const Icon = agent.icon;
      const active = agent.completed > 0;
      return <Card key={agent.id} className="group p-5 transition-all hover:border-primary/40"><div className="flex items-start justify-between"><div className="flex items-center gap-3"><div className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-panel"><Icon className="h-5 w-5 text-primary" />{active && <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-success ring-2 ring-card" />}</div><div><div className="text-base font-semibold tracking-tight">{agent.name}</div><div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground"><StatusDot tone={active ? "success" : "muted"} /><span>{active ? "active" : "idle"}</span></div></div></div></div><p className="mt-4 text-sm leading-relaxed text-muted-foreground">{agent.description}</p><div className="mt-4 grid grid-cols-2 gap-2 text-center"><div className="rounded-lg border border-border/60 bg-panel/40 py-2"><div className="text-sm font-semibold tabular-nums">{agent.completed}</div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">Completed</div></div><div className="rounded-lg border border-border/60 bg-panel/40 py-2"><div className="text-sm font-semibold tabular-nums">{active ? "ready" : "—"}</div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">State</div></div></div><div className="mt-4 rounded-md bg-panel/40 px-2 py-1.5 text-[12px] text-muted-foreground">Last work: {timestamp(agent.latest)}</div></Card>;
      })}</div>
  </div>;
}
