import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, Sparkline, StatusDot } from "@/components/atlas-ui";
import { agents } from "@/lib/mock-data";
import {
  Compass, Network, BookOpen, Waypoints, Terminal, Eye, FlaskConical, ShieldCheck, Gauge,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Compass, Network, BookOpen, Waypoints, Terminal, Eye, FlaskConical, ShieldCheck, Gauge,
};

export const Route = createFileRoute("/agents")({
  head: () => ({ meta: [{ title: "AI agents · CodeAtlas" }] }),
  component: AgentsPage,
});

const rand = (n: number, seed: number) => Array.from({ length: n }, (_, i) => 40 + ((Math.sin(i * seed) + 1) * 30));

function AgentsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Autonomous"
        title="AI agents"
        description="Specialized agents cooperate to plan, document, implement, and review changes across your systems."
      />

      <div className="grid grid-cols-1 gap-4 px-6 py-6 md:grid-cols-2 md:px-8 lg:grid-cols-3">
        {agents.map((a, idx) => {
          const Icon = iconMap[a.icon] ?? Compass;
          const tone = a.status === "active" ? "success" : "muted";
          return (
            <Card key={a.id} className="group p-5 transition-all hover:border-primary/40">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-panel border border-border">
                    <Icon className="h-5 w-5 text-primary" />
                    {a.status === "active" && (
                      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-success ring-2 ring-card" />
                    )}
                  </div>
                  <div>
                    <div className="text-base font-semibold tracking-tight">{a.name}</div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <StatusDot tone={tone as "success" | "muted"} />
                      <span className="capitalize">{a.status}</span>
                      <span>·</span><span>last {a.last}</span>
                    </div>
                  </div>
                </div>
                <span className="rounded-md border border-border bg-panel px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                  v{2 + idx}.{idx}.0
                </span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg border border-border/60 bg-panel/40 py-2">
                  <div className="text-sm font-semibold tabular-nums">{a.tasks}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Tasks</div>
                </div>
                <div className="rounded-lg border border-border/60 bg-panel/40 py-2">
                  <div className="text-sm font-semibold tabular-nums">{a.latency}<span className="text-[10px] text-muted-foreground">ms</span></div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Latency</div>
                </div>
                <div className="rounded-lg border border-border/60 bg-panel/40 py-2">
                  <div className={`text-sm font-semibold tabular-nums ${a.health >= 95 ? "text-success" : a.health >= 90 ? "text-info" : "text-warning"}`}>{a.health}%</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Health</div>
                </div>
              </div>

              <div className="mt-4">
                <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
                  <span>Throughput</span><span>24h</span>
                </div>
                <Sparkline values={rand(20, idx + 1)} tone={idx % 3 === 0 ? "primary" : idx % 3 === 1 ? "accent" : "success"} />
              </div>

              <div className="mt-4 space-y-1.5">
                {["Regenerated architecture diagram", "Planned refactor: split payments", "Reviewed PR #482"].slice(0, 2).map((t) => (
                  <div key={t} className="flex items-center gap-2 rounded-md bg-panel/40 px-2 py-1.5 text-[12px] text-muted-foreground">
                    <span className="h-1 w-1 rounded-full bg-primary" />
                    <span className="truncate">{t}</span>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
