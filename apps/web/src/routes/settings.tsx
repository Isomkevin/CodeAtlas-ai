import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, SectionTitle } from "@/components/atlas-ui";
import { Switch } from "@/components/ui/switch";
import { GitBranch, Slack, KeyRound, Users, Bell, CreditCard } from "lucide-react";
import { useState } from "react";

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
                  <Switch defaultChecked={i.on} />
                </div>
              ))}
            </div>
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
