import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, StatusDot } from "@/components/atlas-ui";
import {
  apiBaseUrl, createMcpToken, listArtifacts, listGraphVersions, listImplementationPlans,
  listMcpTokens, listRepositories, revokeMcpToken,
  type ArchitectureArtifact, type CreatedPersonalAccessToken, type GraphVersion,
  type ImplementationPlan, type PersonalAccessTokenSummary,
} from "@/lib/api";
import { ApiErrorBanner } from "@/components/api-error-banner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Compass, Network, BookOpen, Terminal, Check, Copy, Plus, Trash2, KeyRound, AlertTriangle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/agents")({
  head: () => ({ meta: [{ title: "AI agents · CodeAtlas" }] }),
  component: AgentsPage,
});

type Agent = { id: string; name: string; icon: typeof Compass; completed: number; latest: string | null; description: string };

const timestamp = (value: string | null) =>
  value ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "awaiting work";

const relative = (value: string | null) => {
  if (!value) return "never";
  const then = new Date(value).getTime();
  const seconds = Math.floor((Date.now() - then) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

function AgentsPage() {
  const [versions, setVersions] = useState<GraphVersion[]>([]);
  const [artifacts, setArtifacts] = useState<ArchitectureArtifact[]>([]);
  const [plans, setPlans] = useState<ImplementationPlan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [tokens, setTokens] = useState<PersonalAccessTokenSummary[]>([]);
  const [tokenLoadError, setTokenLoadError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [tokenName, setTokenName] = useState("MCP bridge");
  const [creating, setCreating] = useState(false);
  const [revealed, setRevealed] = useState<CreatedPersonalAccessToken | null>(null);

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

  const loadTokens = async () => {
    try {
      setTokens(await listMcpTokens());
      setTokenLoadError(null);
    } catch (reason) {
      setTokenLoadError(reason instanceof Error ? reason.message : "Unable to load MCP tokens.");
    }
  };
  useEffect(() => { void loadTokens(); }, []);

  const agents = useMemo<Agent[]>(() => [
    { id: "architecture", name: "Architecture projector", icon: Network, completed: versions.length, latest: versions[0]?.completed_at ?? versions[0]?.created_at ?? null, description: "Turns parsed source facts into immutable graph versions." },
    { id: "documentation", name: "Documentation generator", icon: BookOpen, completed: artifacts.length, latest: artifacts[0]?.created_at ?? null, description: "Renders Markdown, Mermaid, Draw.io, and C4 directly from graph versions." },
    { id: "planner", name: "Implementation planner", icon: Compass, completed: plans.length, latest: plans[0]?.completed_at ?? plans[0]?.created_at ?? null, description: "Builds graph-bound plans that require approval before PR creation." },
    { id: "coding", name: "MCP coding bridge", icon: Terminal, completed: plans.filter((plan) => plan.status === "pull_request_opened").length, latest: plans.find((plan) => plan.pull_request_url)?.completed_at ?? null, description: "Supplies graph and approved plan context to a coding agent without source-file access." },
  ], [artifacts, plans, versions]);

  const submitCreate = async () => {
    setCreating(true);
    try {
      const created = await createMcpToken({ name: tokenName.trim() });
      setRevealed(created);
      setCreateOpen(false);
      setTokenName("MCP bridge");
      await loadTokens();
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Unable to create MCP token.";
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  const revoke = async (token: PersonalAccessTokenSummary) => {
    if (!window.confirm(`Revoke ${token.name} (${token.prefix}...)? Any MCP client using it will lose access immediately.`)) return;
    try {
      await revokeMcpToken(token.id);
      toast.success("Token revoked");
      await loadTokens();
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Unable to revoke token.");
    }
  };

  const copyConfig = async (rawToken: string) => {
    const configuration = {
      mcpServers: {
        codeatlas: {
          command: "uv",
          args: ["run", "python", "-m", "app.mcp_server"],
          env: {
            CODEATLAS_MCP_API_BASE_URL: `${apiBaseUrl}/api/v1`,
            CODEATLAS_MCP_TOKEN: rawToken,
          },
        },
      },
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(configuration, null, 2));
      toast.success("MCP config copied to clipboard");
    } catch {
      toast.error("Clipboard blocked — copy the JSON manually from the dialog");
    }
  };

  const copyRaw = async (rawToken: string) => {
    try {
      await navigator.clipboard.writeText(rawToken);
      toast.success("Token copied");
    } catch {
      toast.error("Clipboard blocked");
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Autonomous" title="AI agents" description="Live architecture workflows executing against canonical graph versions." />
      <ApiErrorBanner error={error} />
      <div className="grid grid-cols-1 gap-4 px-6 py-6 md:grid-cols-2 md:px-8 lg:grid-cols-3">
        <Card className="p-5 md:col-span-2 lg:col-span-3">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-base font-semibold">
                <Terminal className="h-4 w-4 text-primary" />Connect an MCP coding agent
              </div>
              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                Cursor, Claude Desktop, Claude Code, and OpenClaw can use the local CodeAtlas stdio bridge to read architecture graphs and create approval-gated plans. The bridge authenticates with a long-lived personal access token that you can revoke at any time — session sign-out will not affect it.
              </p>
            </div>
            <button
              onClick={() => setCreateOpen(true)}
              className="inline-flex flex-none items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> Generate MCP token
            </button>
          </div>

          <div className="mt-4 rounded-lg border border-border/60 bg-background/40 p-3 font-mono text-[11px] leading-5 text-muted-foreground">
            get_architecture_graph · create_implementation_plan<br />
            Run from the CodeAtlas checkout: <span className="text-foreground">uv run python -m app.mcp_server</span>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
              <KeyRound className="h-3 w-3" /> Personal access tokens
            </div>
            {tokenLoadError && <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">{tokenLoadError}</div>}
            {tokens.length === 0 && !tokenLoadError && (
              <div className="rounded-lg border border-dashed border-border/60 bg-panel/20 px-3 py-4 text-sm text-muted-foreground">
                No tokens yet. Generate one to configure your MCP-capable agent.
              </div>
            )}
            {tokens.length > 0 && (
              <div className="divide-y divide-border/60 rounded-lg border border-border/60 bg-panel/20">
                {tokens.map((token) => (
                  <div key={token.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5 text-sm">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{token.name}</div>
                      <div className="text-[11px] font-mono text-muted-foreground">
                        {token.prefix}…{token.expires_at ? ` · expires ${new Date(token.expires_at).toLocaleDateString()}` : " · no expiry"}
                      </div>
                    </div>
                    <div className="text-[11px] text-muted-foreground">Last used {relative(token.last_used_at)}</div>
                    <button
                      onClick={() => { void revoke(token); }}
                      className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-panel/40 px-2 py-1 text-[11px] text-muted-foreground hover:border-destructive/40 hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-3 w-3" /> Revoke
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="mt-3 text-[11px] text-muted-foreground">
            Client-specific setup instructions live in <code>docs/07-mcp/client-setup.md</code>. Tokens carry your workspace role — treat them like a password.
          </p>
        </Card>

        {agents.map((agent) => {
          const Icon = agent.icon;
          const active = agent.completed > 0;
          return (
            <Card key={agent.id} className="group p-5 transition-all hover:border-primary/40">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-panel">
                    <Icon className="h-5 w-5 text-primary" />
                    {active && <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-success ring-2 ring-card" />}
                  </div>
                  <div>
                    <div className="text-base font-semibold tracking-tight">{agent.name}</div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <StatusDot tone={active ? "success" : "muted"} />
                      <span>{active ? "active" : "idle"}</span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{agent.description}</p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                <div className="rounded-lg border border-border/60 bg-panel/40 py-2">
                  <div className="text-sm font-semibold tabular-nums">{agent.completed}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Completed</div>
                </div>
                <div className="rounded-lg border border-border/60 bg-panel/40 py-2">
                  <div className="text-sm font-semibold tabular-nums">{active ? "ready" : "—"}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">State</div>
                </div>
              </div>
              <div className="mt-4 rounded-md bg-panel/40 px-2 py-1.5 text-[12px] text-muted-foreground">Last work: {timestamp(agent.latest)}</div>
            </Card>
          );
        })}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate MCP personal access token</DialogTitle>
            <DialogDescription>
              This token authenticates the local MCP bridge with the CodeAtlas API. It carries your workspace role and does not expire when you sign out of the browser.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <label className="block">
              <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Name</div>
              <input
                autoFocus
                value={tokenName}
                onChange={(event) => setTokenName(event.target.value)}
                placeholder="e.g. Claude Code — MBP"
                className="w-full rounded-lg border border-border bg-panel/60 px-3 py-2 text-sm outline-none focus:border-primary/60"
              />
            </label>
          </div>
          <DialogFooter>
            <button onClick={() => setCreateOpen(false)} className="rounded-lg border border-border bg-panel/60 px-3 py-2 text-sm">Cancel</button>
            <button
              onClick={() => { void submitCreate(); }}
              disabled={creating || tokenName.trim().length < 2}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              <KeyRound className="h-4 w-4" /> {creating ? "Generating..." : "Generate"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={revealed !== null} onOpenChange={(open) => { if (!open) setRevealed(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-success" /> Token created — copy it now
            </DialogTitle>
            <DialogDescription className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-warning">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
              <span>This is the only time you'll see the raw token. Copy it now — you can revoke it any time later.</span>
            </DialogDescription>
          </DialogHeader>
          {revealed && (
            <div className="space-y-3">
              <div>
                <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Raw token</div>
                <div className="break-all rounded-lg border border-border bg-background/60 px-3 py-2 font-mono text-xs">
                  {revealed.token}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => { void copyConfig(revealed.token); }}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
                >
                  <Copy className="h-4 w-4" /> Copy MCP config JSON
                </button>
                <button
                  onClick={() => { void copyRaw(revealed.token); }}
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-panel/60 px-3 py-2 text-sm"
                >
                  <Copy className="h-4 w-4" /> Copy raw token
                </button>
              </div>
            </div>
          )}
          <DialogFooter>
            <button
              onClick={() => setRevealed(null)}
              className="rounded-lg bg-primary/10 border border-primary/40 px-3 py-2 text-sm font-medium text-primary"
            >
              I saved it
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
