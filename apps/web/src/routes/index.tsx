import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, HealthRing, KindBadge, SectionTitle, Sparkline, StatusDot } from "@/components/atlas-ui";
import {
  activity, pullRequests, recommendations, docs, systemStatus, repositories,
} from "@/lib/mock-data";
import {
  Activity, GitPullRequest, FileText, Sparkles, Server, Play, ArrowRight, ArrowUpRight,
  ScanLine, Wand2, Bot,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Dashboard · CodeAtlas" }] }),
  component: Dashboard,
});

const spark1 = [72, 74, 71, 78, 82, 79, 84, 88, 86, 90, 92, 91, 93, 94];
const spark2 = [24, 22, 26, 22, 20, 19, 21, 18, 17, 19, 14, 12, 15, 11];
const spark3 = [110, 132, 128, 145, 160, 152, 174, 168, 182, 190, 205, 214, 228, 236];

function Dashboard() {
  return (
    <div>
      <PageHeader
        eyebrow="Workspace / acme"
        title={
          <span className="flex items-center gap-3">
            Good morning, Lena
            <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-2.5 py-1 text-[11px] font-medium text-warning">
              <span className="h-1.5 w-1.5 rounded-full bg-warning" />
              4 need review
            </span>
          </span>
        }
        description="A snapshot of your architecture, agents, and open work across 8 repositories."
        actions={
          <>
            <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-panel px-3 py-2 text-sm hover:border-border/80 hover:bg-panel/80 transition-colors">
              <ScanLine className="h-4 w-4" /> Scan all
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
              <Sparkles className="h-4 w-4" /> Ask Copilot
            </button>
          </>
        }
      />


      <div className="grid grid-cols-1 gap-4 px-6 py-6 md:grid-cols-12 md:px-8">
        {/* Row 1: KPIs */}
        <Card className="p-5 md:col-span-4">
          <SectionTitle right={<span className="text-[11px] text-success">+2.1%</span>}>Architecture health</SectionTitle>
          <div className="flex items-center gap-5">
            <HealthRing value={87} label="Score" />
            <div className="flex-1">
              <Sparkline values={spark1} />
              <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] text-muted-foreground">
                <div><div className="text-foreground font-medium tabular-nums">42</div>modules</div>
                <div><div className="text-foreground font-medium tabular-nums">8</div>services</div>
                <div><div className="text-foreground font-medium tabular-nums">3</div>drifts</div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5 md:col-span-4">
          <SectionTitle right={<span className="text-[11px] text-warning">↓ 3 drifts</span>}>Architecture drift</SectionTitle>
          <div className="flex items-center gap-5">
            <div className="tabular-nums text-3xl font-semibold">11<span className="text-lg text-muted-foreground">%</span></div>
            <div className="flex-1">
              <Sparkline values={spark2} tone="warning" />
              <div className="mt-2 text-[11px] text-muted-foreground">Trend over 14 days · driven by <span className="text-foreground">payments-svc</span></div>
            </div>
          </div>
        </Card>

        <Card className="p-5 md:col-span-4">
          <SectionTitle right={<span className="text-[11px] text-primary">+12 this week</span>}>Agent throughput</SectionTitle>
          <div className="flex items-center gap-5">
            <div className="tabular-nums text-3xl font-semibold">236</div>
            <div className="flex-1">
              <Sparkline values={spark3} tone="primary" />
              <div className="mt-2 text-[11px] text-muted-foreground">Tasks completed by agents · 98% success</div>
            </div>
          </div>
        </Card>

        {/* Row 2 */}
        <Card className="p-5 md:col-span-8">
          <SectionTitle right={<Link to="/repositories" className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">All repositories <ArrowRight className="h-3 w-3" /></Link>}>
            Repository health
          </SectionTitle>
          <div className="divide-y divide-border/60">
            {repositories.slice(0, 5).map((r) => (
              <div key={r.id} className="flex items-center gap-4 py-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-panel border border-border">
                  <Server className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{r.name}</span>
                    <span className="text-[11px] text-muted-foreground">·</span>
                    <span className="text-[11px] font-mono text-muted-foreground">{r.language}</span>
                  </div>
                  <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{r.desc}</div>
                </div>
                <div className="hidden md:block w-40">
                  <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Health</span><span className="tabular-nums text-foreground">{r.health}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-border/60 overflow-hidden">
                    <div className={`h-full ${r.status === "critical" ? "bg-danger" : r.status === "warning" ? "bg-warning" : "bg-success"}`} style={{ width: `${r.health}%` }} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusDot tone={r.status === "critical" ? "danger" : r.status === "warning" ? "warning" : "success"} />
                  <span className="hidden md:inline text-[11px] font-mono text-muted-foreground w-16 text-right">{r.updated}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 md:col-span-4">
          <SectionTitle right={<span className="text-[11px] text-muted-foreground">last 6h</span>}>Recent activity</SectionTitle>
          <ol className="relative ml-2 space-y-3.5 border-l border-border/70 pl-4">
            {activity.slice(0, 6).map((a) => (
              <li key={a.id} className="relative">
                <span className="absolute -left-[21px] top-1 flex h-3 w-3 items-center justify-center rounded-full bg-panel border border-border">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                </span>
                <div className="text-sm font-medium leading-tight">{a.title}</div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">{a.actor} · {a.time}</div>
                <div className="mt-0.5 text-[11px] text-muted-foreground/80 truncate">{a.detail}</div>
              </li>
            ))}
          </ol>
        </Card>

        {/* Row 3 */}
        <Card className="p-5 md:col-span-6">
          <SectionTitle right={<Link to="/implementation" className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"><GitPullRequest className="h-3 w-3" /> All PRs</Link>}>
            Open pull requests
          </SectionTitle>
          <div className="divide-y divide-border/60">
            {pullRequests.map((p) => (
              <div key={p.id} className="flex items-center gap-3 py-2.5">
                <span className="font-mono text-[11px] text-muted-foreground w-10">#{p.id}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm">{p.title}</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">{p.repo} · {p.author} · {p.updated}</div>
                </div>
                <span className={`hidden md:inline rounded-md px-1.5 py-0.5 text-[10px] font-mono ${
                  p.status === "merged" ? "bg-accent/15 text-accent" : p.status === "review" ? "bg-info/15 text-info" : "bg-primary/15 text-primary"
                }`}>{p.status}</span>
                <span className="font-mono text-[11px] text-muted-foreground tabular-nums w-12 text-right">{p.checks}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 md:col-span-6">
          <SectionTitle right={<span className="inline-flex items-center gap-1 text-[11px] text-accent"><Wand2 className="h-3 w-3" /> generated</span>}>
            AI recommendations
          </SectionTitle>
          <div className="space-y-2.5">
            {recommendations.map((r) => (
              <div key={r.id} className="group flex items-start gap-3 rounded-lg border border-border/60 bg-panel/40 p-3 hover:border-primary/40 transition-colors">
                <div className="flex h-7 w-7 flex-none items-center justify-center rounded-md bg-accent/15 text-accent">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium leading-snug">{r.title}</div>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span>{r.area}</span><span>·</span>
                    <span className={r.impact === "high" ? "text-danger" : r.impact === "medium" ? "text-warning" : "text-muted-foreground"}>impact {r.impact}</span>
                    <span>·</span><span className="font-mono">conf {(r.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <button className="rounded-md border border-border bg-background/60 px-2 py-1 text-[11px] inline-flex items-center gap-1 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors">
                  Plan <ArrowUpRight className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </Card>

        {/* Row 4 */}
        <Card className="p-5 md:col-span-4">
          <SectionTitle>Recent documentation</SectionTitle>
          <div className="space-y-1.5">
            {docs.map((d) => (
              <Link key={d.id} to="/documentation" className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-panel/60">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm">{d.title}</div>
                  <div className="text-[11px] text-muted-foreground">{d.repo} · {d.updated}</div>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="p-5 md:col-span-4">
          <SectionTitle right={<StatusDot tone="warning" />}>System status</SectionTitle>
          <div className="space-y-2">
            {systemStatus.map((s) => (
              <div key={s.name} className="flex items-center gap-3">
                <StatusDot tone={s.status === "operational" ? "success" : "warning"} />
                <span className="text-sm">{s.name}</span>
                <div className="flex-1" />
                <span className="font-mono text-[11px] text-muted-foreground tabular-nums">{s.latency}ms</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 md:col-span-4">
          <SectionTitle>Quick actions</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: Play,     label: "Scan repository", to: "/repositories" as const },
              { icon: FileText, label: "Generate docs",   to: "/documentation" as const },
              { icon: Sparkles, label: "Draft plan",      to: "/implementation" as const },
              { icon: Bot,      label: "Open agents",     to: "/agents" as const },
              { icon: Activity, label: "Open graph",      to: "/architecture" as const },
              { icon: ArrowRight, label: "New workspace", to: "/settings" as const },
            ].map((a) => (
              <Link key={a.label} to={a.to} className="group flex items-center gap-2 rounded-lg border border-border/60 bg-panel/40 px-3 py-2.5 text-sm hover:border-primary/40 hover:bg-panel">
                <a.icon className="h-4 w-4 text-primary" />
                <span className="truncate">{a.label}</span>
                <ArrowUpRight className="ml-auto h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// Silence unused import if KindBadge not used
void KindBadge;
