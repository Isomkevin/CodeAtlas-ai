import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, SectionTitle } from "@/components/atlas-ui";
import {
  apiBaseUrl,
  getWorkspace,
  getWorkspaceAIProvider,
  removeWorkspaceAIProvider,
  saveWorkspaceAIProvider,
  updateWorkspace,
  type Workspace,
  type WorkspaceAIProvider,
} from "@/lib/api";
import {
  Bell,
  Bot,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  GitBranch,
  KeyRound,
  LoaderCircle,
  Mail,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

type Section = "general" | "integrations" | "agents" | "notifications" | "billing";

const sectionIds: Section[] = ["general", "integrations", "agents", "notifications", "billing"];

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings · CodeAtlas" }] }),
  validateSearch: (search: Record<string, unknown>): { tab?: Section } => {
    const tab = search.tab;
    return typeof tab === "string" && (sectionIds as string[]).includes(tab) ? { tab: tab as Section } : {};
  },
  component: SettingsPage,
});

const sections: Array<{ id: Section; label: string; icon: typeof Users }> = [
  { id: "general", label: "General", icon: Users },
  { id: "integrations", label: "Integrations", icon: GitBranch },
  { id: "agents", label: "Agents", icon: KeyRound },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "billing", label: "Billing", icon: CreditCard },
];

const inputClass = "w-full rounded-lg border border-border bg-panel/60 px-3 py-2 text-sm outline-none focus:border-primary/60 disabled:cursor-not-allowed disabled:opacity-60";

function SettingsPage() {
  const { tab } = Route.useSearch();
  const [active, setActive] = useState<Section>(tab ?? "general");
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceSlug, setWorkspaceSlug] = useState("");
  const [workspaceSaving, setWorkspaceSaving] = useState(false);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [githubError, setGithubError] = useState<string | null>(null);
  const [demoAvailable, setDemoAvailable] = useState(false);
  const [demoSigningIn, setDemoSigningIn] = useState(false);
  const [aiProvider, setAiProvider] = useState<WorkspaceAIProvider | null>(null);
  const [aiKey, setAiKey] = useState("");
  const [aiBaseUrl, setAiBaseUrl] = useState("https://api.openai.com/v1");
  const [aiModel, setAiModel] = useState("gpt-4.1-mini");
  const [aiSaving, setAiSaving] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const loadWorkspace = async () => {
    const hasSession = Boolean(sessionStorage.getItem("codeatlas.access_token"));
    setSignedIn(hasSession);
    if (!hasSession) {
      setWorkspace(null);
      setAiProvider(null);
      return;
    }
    try {
      const currentWorkspace = await getWorkspace();
      setWorkspace(currentWorkspace);
      setWorkspaceName(currentWorkspace.name);
      setWorkspaceSlug(currentWorkspace.slug);
      if (currentWorkspace.role === "owner" || currentWorkspace.role === "admin") {
        const provider = await getWorkspaceAIProvider();
        setAiProvider(provider);
        if (provider.base_url) setAiBaseUrl(provider.base_url);
        if (provider.model) setAiModel(provider.model);
      }
    } catch (error) {
      setWorkspaceError(error instanceof Error ? error.message : "Unable to load workspace settings.");
    }
  };

  useEffect(() => {
    void loadWorkspace();
    const receiveSession = (event: MessageEvent<unknown>) => {
      if (event.origin !== new URL(apiBaseUrl).origin || typeof event.data !== "object" || event.data === null) return;
      const message = event.data as { type?: string; accessToken?: string };
      if (message.type === "codeatlas:session" && message.accessToken) {
        sessionStorage.setItem("codeatlas.access_token", message.accessToken);
        setGithubError(null);
        setWorkspaceError(null);
        void loadWorkspace();
      }
    };
    window.addEventListener("message", receiveSession);
    void fetch(`${apiBaseUrl}/api/v1/health`)
      .then((response) => response.json() as Promise<{ environment?: string }>)
      .then((health) => setDemoAvailable(health.environment === "development"))
      .catch(() => undefined);
    return () => window.removeEventListener("message", receiveSession);
  }, []);

  const connectGitHub = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/auth/github/authorize`);
      if (!response.ok) throw new Error("GitHub OAuth is not configured yet.");
      const { authorization_url } = await response.json() as { authorization_url: string };
      const popup = window.open(authorization_url, "codeatlas-github-oauth", "popup,width=560,height=720");
      if (!popup) throw new Error("Allow pop-ups to connect GitHub.");
    } catch (error) {
      setGithubError(error instanceof Error ? error.message : "Unable to connect GitHub.");
    }
  };

  const createDevelopmentSession = async () => {
    setDemoSigningIn(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/auth/development/session`, { method: "POST" });
      if (!response.ok) throw new Error("Local demo sign-in is not enabled.");
      const { access_token } = await response.json() as { access_token: string };
      sessionStorage.setItem("codeatlas.access_token", access_token);
      setGithubError(null);
      setWorkspaceError(null);
      await loadWorkspace();
    } catch (error) {
      setGithubError(error instanceof Error ? error.message : "Unable to create local demo session.");
    } finally {
      setDemoSigningIn(false);
    }
  };

  const saveWorkspaceDetails = async () => {
    setWorkspaceSaving(true);
    setWorkspaceError(null);
    try {
      const updated = await updateWorkspace({ name: workspaceName.trim(), slug: workspaceSlug.trim() });
      setWorkspace(updated);
      setWorkspaceName(updated.name);
      setWorkspaceSlug(updated.slug);
    } catch (error) {
      setWorkspaceError(error instanceof Error ? error.message : "Unable to save workspace details.");
    } finally {
      setWorkspaceSaving(false);
    }
  };

  const saveAIProvider = async () => {
    if (!aiKey.trim()) {
      setAiError("Enter an API key to save a workspace provider.");
      return;
    }
    setAiSaving(true);
    setAiError(null);
    try {
      const provider = await saveWorkspaceAIProvider({ api_key: aiKey, base_url: aiBaseUrl, model: aiModel });
      setAiProvider(provider);
      setAiKey("");
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "Unable to save the workspace provider.");
    } finally {
      setAiSaving(false);
    }
  };

  const clearAIProvider = async () => {
    setAiSaving(true);
    setAiError(null);
    try {
      setAiProvider(await removeWorkspaceAIProvider());
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "Unable to remove the workspace provider.");
    } finally {
      setAiSaving(false);
    }
  };

  const canManage = workspace?.role === "owner" || workspace?.role === "admin";

  return (
    <div>
      <PageHeader eyebrow="Workspace" title="Settings" description="Manage workspace identity, connected services, coding agents, and deployment status." />
      <div className="grid grid-cols-1 gap-6 px-6 py-6 md:grid-cols-[220px_1fr] md:px-8">
        <aside>
          <nav className="space-y-1" aria-label="Settings sections">
            {sections.map((section) => {
              const Icon = section.icon;
              return <button key={section.id} onClick={() => setActive(section.id)} className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${active === section.id ? "border-primary bg-panel text-foreground" : "border-transparent text-muted-foreground hover:bg-panel/60 hover:text-foreground"}`}>
                <Icon className="h-4 w-4" />{section.label}
              </button>;
            })}
          </nav>
        </aside>

        <div className="space-y-4">
          {active === "general" && <GeneralPanel workspace={workspace} name={workspaceName} slug={workspaceSlug} signedIn={signedIn} canManage={canManage} saving={workspaceSaving} error={workspaceError} onNameChange={setWorkspaceName} onSlugChange={setWorkspaceSlug} onSave={() => { void saveWorkspaceDetails(); }} onConnect={() => { void connectGitHub(); }} />}
          {active === "integrations" && <IntegrationsPanel signedIn={signedIn} error={githubError} demoAvailable={demoAvailable} demoSigningIn={demoSigningIn} onConnect={() => { void connectGitHub(); }} onDevelopmentSession={() => { void createDevelopmentSession(); }} />}
          {active === "agents" && <AgentsPanel provider={aiProvider} aiKey={aiKey} baseUrl={aiBaseUrl} model={aiModel} saving={aiSaving} error={aiError} canManage={canManage} onKeyChange={setAiKey} onBaseUrlChange={setAiBaseUrl} onModelChange={setAiModel} onSave={() => { void saveAIProvider(); }} onClear={() => { void clearAIProvider(); }} />}
          {active === "notifications" && <NotificationsPanel />}
          {active === "billing" && <BillingPanel workspace={workspace} />}
        </div>
      </div>
    </div>
  );
}

function GeneralPanel({ workspace, name, slug, signedIn, canManage, saving, error, onNameChange, onSlugChange, onSave, onConnect }: { workspace: Workspace | null; name: string; slug: string; signedIn: boolean; canManage: boolean; saving: boolean; error: string | null; onNameChange: (value: string) => void; onSlugChange: (value: string) => void; onSave: () => void; onConnect: () => void }) {
  if (!signedIn) return <ConnectCard title="Sign in to manage your workspace" description="Connect GitHub to load your workspace identity and manage owner/admin settings." onConnect={onConnect} />;
  return <Card className="p-5"><SectionTitle right={<RoleBadge role={workspace?.role} />}>Workspace identity</SectionTitle><p className="mb-5 text-sm text-muted-foreground">These values identify your tenant across the CodeAtlas API and generated links.</p><div className="grid grid-cols-1 gap-3 md:grid-cols-2"><Field label="Workspace name" value={name} onChange={onNameChange} disabled={!canManage} /><Field label="Workspace slug" value={slug} onChange={onSlugChange} disabled={!canManage} mono /></div><div className="mt-4 flex flex-wrap items-center gap-3"><button onClick={onSave} disabled={!canManage || saving} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">{saving && <LoaderCircle className="h-4 w-4 animate-spin" />}{saving ? "Saving" : "Save workspace"}</button>{!canManage && <span className="text-xs text-muted-foreground">Only workspace owners and administrators can change identity settings.</span>}</div>{error && <p className="mt-3 text-xs text-danger">{error}</p>}</Card>;
}

function IntegrationsPanel({ signedIn, error, demoAvailable, demoSigningIn, onConnect, onDevelopmentSession }: { signedIn: boolean; error: string | null; demoAvailable: boolean; demoSigningIn: boolean; onConnect: () => void; onDevelopmentSession: () => void }) {
  return <><Card className="p-5"><SectionTitle right={<StatusBadge active={signedIn} activeLabel="Connected" inactiveLabel="Not connected" />}>GitHub</SectionTitle><p className="text-sm leading-6 text-muted-foreground">GitHub OAuth provides repository discovery, private clone credentials, signed webhook refreshes, and pull-request workflows.</p><div className="mt-4 flex flex-wrap items-center gap-3"><button onClick={onConnect} className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">{signedIn ? "Reconnect GitHub" : "Connect GitHub"}</button>{demoAvailable && !signedIn && <button onClick={onDevelopmentSession} disabled={demoSigningIn} className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-sm font-medium text-primary disabled:opacity-50">{demoSigningIn ? "Creating demo session" : "Use local demo session"}</button>}</div>{error && <p className="mt-3 text-xs text-danger">{error}</p>}</Card><Card className="p-5"><SectionTitle>Other integrations</SectionTitle><div className="divide-y divide-border/60"><CapabilityRow icon={GitBranch} title="GitLab" description="GitLab OAuth and repository ingestion are not configured in this deployment." state="Not installed" /><CapabilityRow icon={Bell} title="Slack" description="No Slack app or outbound notification provider is configured." state="Not configured" /><CapabilityRow icon={KeyRound} title="Linear" description="Generated-task synchronization is not configured." state="Not configured" /></div></Card></>;
}

function AgentsPanel({ provider, aiKey, baseUrl, model, saving, error, canManage, onKeyChange, onBaseUrlChange, onModelChange, onSave, onClear }: { provider: WorkspaceAIProvider | null; aiKey: string; baseUrl: string; model: string; saving: boolean; error: string | null; canManage: boolean; onKeyChange: (value: string) => void; onBaseUrlChange: (value: string) => void; onModelChange: (value: string) => void; onSave: () => void; onClear: () => void }) {
  const source = provider?.source === "workspace_byok" ? "Workspace BYOK" : provider?.source === "deployment_key" ? "Deployment key" : "Graph-only";
  return <><Card className="p-5"><SectionTitle right={<span className="inline-flex items-center gap-1 text-[11px] text-success"><ShieldCheck className="h-3.5 w-3.5" />{source}</span>}>AI model provider</SectionTitle><p className="mb-4 text-sm leading-6 text-muted-foreground">Use an OpenAI-compatible workspace key instead of the deployment key. It is encrypted at rest, never returned to the browser, and only receives architecture-graph context.</p><div className="grid grid-cols-1 gap-3 md:grid-cols-2"><label className="block md:col-span-2"><Label>API key</Label><input value={aiKey} onChange={(event) => onKeyChange(event.target.value)} type="password" autoComplete="off" disabled={!canManage} placeholder={provider?.key_hint ? `Configured (${provider.key_hint}); enter a key to rotate` : "sk-..."} className={inputClass} /></label><label className="block"><Label>Base URL</Label><input value={baseUrl} onChange={(event) => onBaseUrlChange(event.target.value)} disabled={!canManage} inputMode="url" className={inputClass} /></label><label className="block"><Label>Model</Label><input value={model} onChange={(event) => onModelChange(event.target.value)} disabled={!canManage} className={inputClass} /></label></div><div className="mt-4 flex flex-wrap items-center gap-2"><button onClick={onSave} disabled={!canManage || saving} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"><Sparkles className="h-4 w-4" />{saving ? "Saving" : "Save workspace key"}</button>{provider?.source === "workspace_byok" && <button onClick={onClear} disabled={!canManage || saving} className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground disabled:opacity-50">Use deployment key instead</button>}{!canManage && <span className="text-xs text-muted-foreground">Only workspace owners and administrators can configure BYOK.</span>}</div>{error && <p className="mt-3 text-xs text-danger">{error}</p>}</Card><Card className="p-5"><SectionTitle>MCP coding agents</SectionTitle><p className="text-sm leading-6 text-muted-foreground">The local CodeAtlas stdio bridge lets Cursor, Claude Desktop, Claude Code, and OpenClaw retrieve architecture graphs and create approval-gated implementation plans without source-file exposure.</p><Link to="/agents" className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:border-primary/50">Configure MCP bridge <ExternalLink className="h-4 w-4" /></Link></Card></>;
}

function NotificationsPanel() {
  return <><Card className="p-5"><SectionTitle>Operational notifications</SectionTitle><p className="mb-4 text-sm leading-6 text-muted-foreground">CodeAtlas currently provides in-product operational visibility. It does not claim email, Slack, or webhook delivery until an outbound provider is configured.</p><CapabilityRow icon={CheckCircle2} title="Scan progress" description="The Architecture experience receives authenticated WebSocket scan events." state="Available in app" active /><CapabilityRow icon={Bot} title="Agent plan status" description="Implementation plan status is visible in the dashboard and implementation workflow." state="Available in app" active /><CapabilityRow icon={Mail} title="Email and Slack delivery" description="No outbound delivery provider is configured for this deployment." state="Not configured" /></Card><Card className="p-5"><SectionTitle>Next step</SectionTitle><p className="text-sm text-muted-foreground">Connect an outbound notification provider before relying on email or chat alerts. The current settings accurately show these channels as unavailable rather than saving inactive preferences.</p></Card></>;
}

function BillingPanel({ workspace }: { workspace: Workspace | null }) {
  return <><Card className="p-5"><SectionTitle right={<StatusBadge active={workspace?.status === "active"} activeLabel="Active" inactiveLabel="Unavailable" />}>Workspace plan</SectionTitle><div className="mt-2 text-2xl font-semibold capitalize">{workspace?.plan ?? "No workspace loaded"}</div><p className="mt-2 text-sm leading-6 text-muted-foreground">This deployment has no payment provider, checkout flow, invoice service, or metered billing integration configured.</p></Card><Card className="p-5"><SectionTitle>Billing administration</SectionTitle><p className="text-sm leading-6 text-muted-foreground">Billing is intentionally read-only until a payment provider is deployed. No card, invoice, or usage controls are shown because they would not perform a real billing operation.</p></Card></>;
}

function Field({ label, value, onChange, disabled, mono = false }: { label: string; value: string; onChange: (value: string) => void; disabled: boolean; mono?: boolean }) { return <label className="block"><Label>{label}</Label><input value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} className={`${inputClass} ${mono ? "font-mono" : ""}`} /></label>; }
function Label({ children }: { children: ReactNode }) { return <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{children}</span>; }
function RoleBadge({ role }: { role: Workspace["role"] | undefined }) { return <span className="rounded-full border border-border px-2 py-1 text-[11px] font-medium capitalize text-muted-foreground">{role ?? "No session"}</span>; }
function StatusBadge({ active, activeLabel, inactiveLabel }: { active: boolean; activeLabel: string; inactiveLabel: string }) { return <span className={`inline-flex items-center gap-1 text-[11px] ${active ? "text-success" : "text-muted-foreground"}`}><span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-success" : "bg-muted-foreground"}`} />{active ? activeLabel : inactiveLabel}</span>; }
function CapabilityRow({ icon: Icon, title, description, state, active = false }: { icon: typeof Bell; title: string; description: string; state: string; active?: boolean }) { return <div className="flex items-start gap-3 py-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-panel"><Icon className="h-4 w-4 text-primary" /></span><div className="min-w-0 flex-1"><div className="text-sm font-medium">{title}</div><p className="mt-0.5 text-xs leading-5 text-muted-foreground">{description}</p></div><span className={`pt-1 text-[11px] ${active ? "text-success" : "text-muted-foreground"}`}>{state}</span></div>; }
function ConnectCard({ title, description, onConnect }: { title: string; description: string; onConnect: () => void }) { return <Card className="p-5"><SectionTitle>{title}</SectionTitle><p className="text-sm text-muted-foreground">{description}</p><button onClick={onConnect} className="mt-4 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">Connect GitHub</button></Card>; }
