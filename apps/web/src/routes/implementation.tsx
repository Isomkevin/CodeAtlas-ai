import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, SectionTitle } from "@/components/atlas-ui";
import {
  approveImplementationPlan,
  apiBaseUrl,
  createImplementationPlan,
  listImplementationPlans,
  listRepositories,
  openPullRequest,
  type ApiRepository,
  type ImplementationPlan,
} from "@/lib/api";
import { ApiErrorBanner } from "@/components/api-error-banner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Sparkles, GitPullRequest, CheckCircle2, Circle, FileCode2, ClipboardList, Eye, Rocket,
  Layers, ChevronDown, Clipboard, ExternalLink, ShieldCheck,
} from "lucide-react";
import { useMemo, useEffect, useState } from "react";

export const Route = createFileRoute("/implementation")({
  head: () => ({ meta: [{ title: "Implementation · CodeAtlas" }] }),
  component: ImplementationPage,
});

function ImplementationPage() {
  const [repository, setRepository] = useState<ApiRepository | null>(null);
  const [plans, setPlans] = useState<ImplementationPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [shipping, setShipping] = useState(false);
  const [prDialogOpen, setPrDialogOpen] = useState(false);
  const [prTitle, setPrTitle] = useState("");
  const [prBody, setPrBody] = useState("");
  const [prHead, setPrHead] = useState("");
  const [prBase, setPrBase] = useState("main");

  const active = useMemo(
    () => plans.find((plan) => plan.id === selectedPlanId) ?? plans[0] ?? null,
    [plans, selectedPlanId],
  );

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
      setSelectedPlanId(plan.id);
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to create plan.");
    } finally {
      setCreating(false);
    }
  };

  const approve = async () => {
    if (!repository || !active) return;
    setApproving(true);
    try {
      const updated = await approveImplementationPlan(repository.id, active.id);
      setPlans((current) => current.map((plan) => (plan.id === updated.id ? updated : plan)));
      setError(null);
      toast.success("Plan approved");
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Unable to approve plan.";
      setError(message);
      toast.error(message);
    } finally {
      setApproving(false);
    }
  };

  const openPrDialog = () => {
    if (!active) return;
    setPrTitle(active.change_request.length > 72 ? `${active.change_request.slice(0, 69)}...` : active.change_request);
    setPrBody(buildPrBody(active));
    setPrHead(`codeatlas/plan-${active.id.slice(0, 8)}`);
    setPrBase("main");
    setPrDialogOpen(true);
  };

  const submitPr = async () => {
    if (!repository || !active) return;
    setShipping(true);
    try {
      const updated = await openPullRequest(repository.id, active.id, {
        title: prTitle.trim(),
        body: prBody.trim(),
        head_branch: prHead.trim(),
        base_branch: prBase.trim() || "main",
      });
      setPlans((current) => current.map((plan) => (plan.id === updated.id ? updated : plan)));
      setPrDialogOpen(false);
      setError(null);
      toast.success("Pull request opened", {
        description: updated.pull_request_url ?? undefined,
        action: updated.pull_request_url ? {
          label: "Open",
          onClick: () => window.open(updated.pull_request_url!, "_blank", "noopener"),
        } : undefined,
      });
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Unable to open pull request.";
      setError(message);
      toast.error(message);
    } finally {
      setShipping(false);
    }
  };

  const copyMcpPrompt = async () => {
    if (!repository || !active) return;
    const prompt = buildMcpPrompt(repository, active, apiBaseUrl);
    try {
      await navigator.clipboard.writeText(prompt);
      toast.success("MCP bridge prompt copied", {
        description: "Paste it into Claude Code, Cursor, or another MCP-capable agent.",
      });
    } catch {
      toast.error("Clipboard write blocked", {
        description: "Copy the prompt manually from the dialog.",
      });
    }
  };

  const tasks = active?.plan_json.tasks ?? [];
  const canApprove = active?.status === "draft";
  const canShip = active?.status === "approved";
  const shipped = active?.status === "pull_request_opened";

  return (
    <div>
      <PageHeader
        eyebrow="Workflow"
        title="Implementation workspace"
        description="Turn architecture graph intent into an approval-gated pull request."
        actions={
          <>
            <button
              onClick={() => { void create(); }}
              disabled={!repository || creating}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-panel px-3 py-2 text-sm disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" /> {creating ? "Planning" : "New plan"}
            </button>
            {canApprove && (
              <button
                onClick={() => { void approve(); }}
                disabled={approving}
                className="inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-sm font-medium text-primary disabled:opacity-50"
              >
                <ShieldCheck className="h-4 w-4" /> {approving ? "Approving" : "Approve plan"}
              </button>
            )}
            {shipped && active?.pull_request_url && (
              <a
                href={active.pull_request_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-success/40 bg-success/10 px-3 py-2 text-sm font-medium text-success"
              >
                <GitPullRequest className="h-4 w-4" /> View PR <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger
                disabled={!canShip || shipping}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Rocket className="h-4 w-4" /> {shipping ? "Shipping" : "Ship draft PR"} <ChevronDown className="h-3.5 w-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[240px]">
                <DropdownMenuItem onClick={openPrDialog} className="gap-2">
                  <GitPullRequest className="h-4 w-4" />
                  <div className="flex flex-col">
                    <span>Open pull request…</span>
                    <span className="text-[11px] text-muted-foreground">Requires a pushed branch with your changes</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { void copyMcpPrompt(); }} className="gap-2">
                  <Clipboard className="h-4 w-4" />
                  <div className="flex flex-col">
                    <span>Copy MCP bridge prompt</span>
                    <span className="text-[11px] text-muted-foreground">Paste into Claude Code / Cursor to draft the changes</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />
      <ApiErrorBanner error={error} />
      <div className="px-6 py-6 md:px-8">
        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-5 text-sm">
            <StatusPill icon={<Layers className="h-4 w-4 text-primary" />} label="Architecture graph" active />
            <StatusPill icon={<Eye className="h-4 w-4 text-primary" />} label="Impact analysis" active={Boolean(active)} />
            <StatusPill icon={<ClipboardList className="h-4 w-4 text-primary" />} label="Approval-gated plan" active={active?.status === "approved" || active?.status === "pull_request_opened"} />
            <StatusPill icon={<GitPullRequest className={active?.status === "pull_request_opened" ? "h-4 w-4 text-success" : "h-4 w-4 text-muted-foreground"} />} label="Pull request" active={active?.status === "pull_request_opened"} />
          </div>
        </Card>
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="p-5 lg:col-span-2">
            <SectionTitle right={active ? <span className="rounded-md bg-panel px-2 py-0.5 text-[10px] font-mono">{active.status}</span> : null}>
              {active?.change_request ?? "No implementation plan selected"}
            </SectionTitle>
            <p className="text-sm text-muted-foreground">
              {active
                ? `Bound to graph version ${active.graph_version_id}. Owners or administrators must approve before a coding-agent branch can open a PR.`
                : "Connect and scan a repository, then create a plan from the Architecture screen or this workspace."}
            </p>
            <div className="mt-5 space-y-2">
              {tasks.map((task, index) => (
                <div key={task.id} className="flex items-center gap-3 rounded-lg border border-border/60 bg-panel/40 px-3 py-2.5">
                  {index === 0 ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                  <FileCode2 className="h-4 w-4 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm">{task.title}</div>
                    <div className="truncate text-[11px] font-mono text-muted-foreground">{task.path ?? "architecture component"}</div>
                  </div>
                </div>
              ))}
              {active && !tasks.length && <div className="text-sm text-muted-foreground">This graph version has no matching implementation tasks.</div>}
            </div>
          </Card>
          <Card className="p-5">
            <SectionTitle>Plan history</SectionTitle>
            <div className="space-y-2">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${plan.id === active?.id ? "border-primary/50 bg-primary/5" : "border-border/60 bg-panel/40 hover:border-border"}`}
                >
                  <div className="truncate text-sm font-medium">{plan.change_request}</div>
                  <div className="mt-1 text-[11px] font-mono text-muted-foreground">{plan.status}</div>
                </button>
              ))}
              {!plans.length && <div className="text-sm text-muted-foreground">No plans yet.</div>}
            </div>
          </Card>
        </div>
      </div>

      <Dialog open={prDialogOpen} onOpenChange={setPrDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Open pull request</DialogTitle>
            <DialogDescription>
              CodeAtlas opens the PR using your GitHub credentials on <span className="font-mono">{repository?.full_name}</span>. The head branch must already exist and contain your changes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Field label="Title" value={prTitle} onChange={setPrTitle} />
            <Field label="Head branch" value={prHead} onChange={setPrHead} placeholder="feature/my-branch" mono />
            <Field label="Base branch" value={prBase} onChange={setPrBase} placeholder="main" mono />
            <label className="block">
              <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Body</div>
              <textarea
                value={prBody}
                onChange={(event) => setPrBody(event.target.value)}
                rows={7}
                className="w-full rounded-lg border border-border bg-panel/60 px-3 py-2 text-sm outline-none focus:border-primary/60"
              />
            </label>
          </div>
          <DialogFooter>
            <button
              onClick={() => setPrDialogOpen(false)}
              className="rounded-lg border border-border bg-panel/60 px-3 py-2 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => { void submitPr(); }}
              disabled={shipping || !prTitle.trim() || !prHead.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              <Rocket className="h-4 w-4" /> {shipping ? "Opening..." : "Open PR"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusPill({ icon, label, active }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 ${active ? "text-foreground" : "text-muted-foreground"}`}>
      {icon}<span>{label}</span>
    </span>
  );
}

function Field({ label, value, onChange, placeholder, mono }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-lg border border-border bg-panel/60 px-3 py-2 text-sm outline-none focus:border-primary/60 ${mono ? "font-mono" : ""}`}
      />
    </label>
  );
}

function buildPrBody(plan: ImplementationPlan): string {
  const tasks = plan.plan_json.tasks ?? [];
  const affected = plan.plan_json.affected_node_ids ?? [];
  const guardrails = plan.plan_json.guardrails ?? [];
  const lines: string[] = [];
  lines.push(`## Change request\n\n${plan.change_request}\n`);
  if (tasks.length) {
    lines.push("## Tasks\n");
    for (const task of tasks) {
      lines.push(`- **${task.title}**${task.path ? ` (\`${task.path}\`)` : ""}`);
    }
    lines.push("");
  }
  if (affected.length) {
    lines.push(`## Affected graph nodes\n\n${affected.length} node${affected.length === 1 ? "" : "s"} touched by this plan.\n`);
  }
  if (guardrails.length) {
    lines.push("## Guardrails\n");
    for (const guardrail of guardrails) lines.push(`- ${guardrail}`);
    lines.push("");
  }
  lines.push(`_CodeAtlas plan ${plan.id}_`);
  return lines.join("\n");
}

function buildMcpPrompt(repository: ApiRepository, plan: ImplementationPlan, apiBase: string): string {
  const tasks = plan.plan_json.tasks ?? [];
  const taskLines = tasks.map((task, index) => `  ${index + 1}. ${task.title}${task.path ? ` — \`${task.path}\`` : ""}`).join("\n");
  return [
    "You have access to the CodeAtlas MCP tools. Use them to implement this approved plan.",
    "",
    `Repository: ${repository.full_name}`,
    `Repository id: ${repository.id}`,
    `Plan id: ${plan.id}`,
    `Change request: ${plan.change_request}`,
    "",
    "Tasks:",
    taskLines || "  (no tasks — treat the change request as the sole spec)",
    "",
    "Steps:",
    "  1. Call `get_architecture_graph` for the repository above to load canonical context.",
    "  2. Implement each task by editing files on a new branch. Preserve or intentionally update graph relationships.",
    "  3. Add focused automated tests for the changed behavior.",
    "  4. Push the branch to the connected GitHub repository.",
    "  5. Report the branch name back here so a maintainer can open the PR via CodeAtlas.",
    "",
    `API context (already provided to the MCP bridge): ${apiBase}`,
  ].join("\n");
}
