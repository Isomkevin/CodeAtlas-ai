import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, SectionTitle } from "@/components/atlas-ui";
import { Switch } from "@/components/ui/switch";
import { getWorkspaceAIProvider, removeWorkspaceAIProvider, saveWorkspaceAIProvider, type WorkspaceAIProvider } from "@/lib/api";
import { GitBranch, Slack, KeyRound, Users, Bell, CreditCard, LoaderCircle, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

const apiBaseUrl = import.meta.env.VITE_CODEATLAS_API_URL ?? "http://localhost:8000";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings · CodeAtlas" }] }),
  component: SettingsPage,
});

const sections = [
  { id: "general",     label: "General",       icon: Users },
  { id: "integrations",label: "Integrations",  icon: GitBranch },
  { id: "agents",      label: "Agents",        icon: KeyRound },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "billing",     label: "Billing",       icon: CreditCard },
];

function SettingsPage() {
  const [active, setActive] = useState("integrations");
  const [githubConnected, setGithubConnected] = useState(false);
  const [githubError, setGithubError] = useState<string | null>(null);
  const [demoAvailable, setDemoAvailable] = useState(false);
  const [demoSigningIn, setDemoSigningIn] = useState(false);
  const [aiProvider, setAiProvider] = useState<WorkspaceAIProvider | null>(null);
  const [aiKey, setAiKey] = useState("");
  const [aiBaseUrl, setAiBaseUrl] = useState("https://api.openai.com/v1");
  const [aiModel, setAiModel] = useState("gpt-4.1-mini");
  const [aiSaving, setAiSaving] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const loadAIProvider = async () => {
    try {
      const provider = await getWorkspaceAIProvider();
      setAiProvider(provider);
      if (provider.base_url) setAiBaseUrl(provider.base_url);
      if (provider.model) setAiModel(provider.model);
    } catch {
      setAiProvider(null);
    }
  };

  useEffect(() => {
    setGithubConnected(Boolean(sessionStorage.getItem("codeatlas.access_token")));
    void loadAIProvider();
    const receiveSession = (event: MessageEvent<unknown>) => {
      if (event.origin !== new URL(apiBaseUrl).origin || typeof event.data !== "object" || event.data === null) return;
      const message = event.data as { type?: string; accessToken?: string };
      if (message.type === "codeatlas:session" && message.accessToken) {
        sessionStorage.setItem("codeatlas.access_token", message.accessToken);
        setGithubConnected(true);
        setGithubError(null);
        void loadAIProvider();
      }
    };
    window.addEventListener("message", receiveSession);
    void fetch(`${apiBaseUrl}/api/v1/health`)
      .then((response) => response.json() as Promise<{ environment?: string }>)
      .then((health) => setDemoAvailable(health.environment === "development"))
      .catch(() => undefined);
    return () => window.removeEventListener("message", receiveSession);
  }, []);

  const connectGitHub = async (enabled: boolean) => {
    if (!enabled) {
      sessionStorage.removeItem("codeatlas.access_token");
      setGithubConnected(false);
      return;
    }
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/auth/github/authorize`);
      if (!response.ok) throw new Error("GitHub OAuth is not configured yet.");
      const { authorization_url } = await response.json() as { authorization_url: string };
      const popup = window.open(authorization_url, "codeatlas-github-oauth", "popup,width=560,height=720");
      if (!popup) throw new Error("Allow pop-ups to connect GitHub.");
    } catch (error) {
      setGithubError(error instanceof Error ? error.message : "Unable to connect GitHub.");
      setGithubConnected(false);
    }
  };

  const createDevelopmentSession = async () => {
    setDemoSigningIn(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/auth/development/session`, { method: "POST" });
      if (!response.ok) throw new Error("Local demo sign-in is not enabled.");
      const { access_token } = await response.json() as { access_token: string };
      sessionStorage.setItem("codeatlas.access_token", access_token);
      setGithubConnected(true);
      setGithubError(null);
    } catch (error) {
      setGithubError(error instanceof Error ? error.message : "Unable to create local demo session.");
    } finally {
      setDemoSigningIn(false);
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
      const provider = await saveWorkspaceAIProvider({
        api_key: aiKey,
        base_url: aiBaseUrl,
        model: aiModel,
      });
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

  return (
    <div>
      <PageHeader eyebrow="Workspace" title="Settings" description="Configure your workspace, integrations, and agent behavior." />
      <div className="grid grid-cols-1 gap-6 px-6 py-6 md:grid-cols-[220px_1fr] md:px-8">
        <aside>
          <nav className="space-y-1">
            {sections.map((s) => (
              <button key={s.id} onClick={() => setActive(s.id)}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                  active === s.id ? "bg-panel border border-border text-foreground" : "text-muted-foreground hover:bg-panel/60"
                }`}>
                <s.icon className="h-4 w-4" />{s.label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="space-y-4">
          <Card className="p-5">
            <SectionTitle>Workspace</SectionTitle>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="block">
                <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Name</div>
                <input defaultValue="Acme Engineering" className="w-full rounded-lg border border-border bg-panel/60 px-3 py-2 text-sm outline-none focus:border-primary/60" />
              </label>
              <label className="block">
                <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Slug</div>
                <input defaultValue="acme" className="w-full rounded-lg border border-border bg-panel/60 px-3 py-2 text-sm outline-none focus:border-primary/60 font-mono" />
              </label>
            </div>
          </Card>

          <Card className="p-5">
            <SectionTitle right={<span className="text-[11px] font-mono text-muted-foreground">3 connected</span>}>Integrations</SectionTitle>
            <div className="divide-y divide-border/60">
              {[
                { name: "GitHub",   desc: "Repositories, PRs, checks",     icon: GitBranch, on: true },
                { name: "GitLab",   desc: "Mirror repositories",           icon: GitBranch, on: true },
                { name: "Slack",    desc: "Agent notifications & alerts",  icon: Slack,     on: true },
                { name: "Linear",   desc: "Sync generated tasks",          icon: KeyRound,  on: false },
              ].map((i) => (
                <div key={i.name} className="flex items-center gap-4 py-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-panel border border-border">
                    <i.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{i.name}</div>
                    <div className="text-[11px] text-muted-foreground">{i.desc}</div>
                  </div>
                  <Switch
                    checked={i.name === "GitHub" ? githubConnected : i.on}
                    onCheckedChange={i.name === "GitHub" ? connectGitHub : undefined}
                  />
                </div>
              ))}
            </div>
            {githubError && <p className="mt-3 text-xs text-danger">{githubError}</p>}
            {demoAvailable && !githubConnected && <button onClick={() => { void createDevelopmentSession(); }} disabled={demoSigningIn} className="mt-3 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-medium text-primary disabled:opacity-50">{demoSigningIn ? "Creating demo session…" : "Use local demo session"}</button>}
          </Card>

          <Card className="p-5">
            <SectionTitle right={<span className={`inline-flex items-center gap-1 text-[11px] ${aiProvider?.source === "workspace_byok" ? "text-success" : "text-muted-foreground"}`}><ShieldCheck className="h-3.5 w-3.5" />{aiProvider?.source === "workspace_byok" ? "Workspace BYOK" : aiProvider?.source === "deployment_key" ? "Deployment key" : "Graph-only"}</span>}>AI model provider</SectionTitle>
            <p className="mb-4 text-xs leading-relaxed text-muted-foreground">Use your workspace’s OpenAI-compatible key instead of the deployment key. CodeAtlas encrypts it at rest, never returns it to the browser, and uses it only with architecture-graph context.</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="block md:col-span-2"><div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">API key</div><input value={aiKey} onChange={(event) => setAiKey(event.target.value)} type="password" autoComplete="off" placeholder={aiProvider?.key_hint ? `Configured (${aiProvider.key_hint}); enter a new key to rotate` : "sk-..."} className="w-full rounded-lg border border-border bg-panel/60 px-3 py-2 text-sm outline-none focus:border-primary/60" /></label>
              <label className="block"><div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Base URL</div><input value={aiBaseUrl} onChange={(event) => setAiBaseUrl(event.target.value)} inputMode="url" className="w-full rounded-lg border border-border bg-panel/60 px-3 py-2 text-sm outline-none focus:border-primary/60" /></label>
              <label className="block"><div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Model</div><input value={aiModel} onChange={(event) => setAiModel(event.target.value)} placeholder="gpt-4.1-mini" className="w-full rounded-lg border border-border bg-panel/60 px-3 py-2 text-sm outline-none focus:border-primary/60" /></label>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2"><button onClick={() => { void saveAIProvider(); }} disabled={aiSaving || !githubConnected} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground disabled:opacity-50"><Sparkles className="h-3.5 w-3.5" />{aiSaving ? "Saving…" : "Save workspace key"}</button>{aiProvider?.source === "workspace_byok" && <button onClick={() => { void clearAIProvider(); }} disabled={aiSaving} className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-50">Use deployment key instead</button>} {!githubConnected && <span className="text-xs text-muted-foreground">Sign in as an owner or admin to configure BYOK.</span>} {aiSaving && <LoaderCircle className="h-4 w-4 animate-spin text-primary" />}</div>
            {aiError && <p className="mt-3 text-xs text-danger">{aiError}</p>}
          </Card>

          <Card className="p-5">
            <SectionTitle>Agent policies</SectionTitle>
            <div className="space-y-3">
              {[
                { name: "Auto-regenerate documentation", desc: "When architecture changes, refresh affected docs." },
                { name: "Open PRs automatically",         desc: "Implementation agent opens draft PRs for approved plans." },
                { name: "Notify on drift",                desc: "Ping the workspace when drift exceeds 15%." },
              ].map((p, i) => (
                <div key={p.name} className="flex items-start justify-between gap-4 rounded-lg border border-border/60 bg-panel/40 p-3">
                  <div>
                    <div className="text-sm font-medium">{p.name}</div>
                    <div className="text-[11px] text-muted-foreground">{p.desc}</div>
                  </div>
                  <Switch defaultChecked={i !== 1} />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
