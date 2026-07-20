import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, SectionTitle } from "@/components/atlas-ui";
import { historyEvents } from "@/lib/mock-data";
import { Network, BookOpen, Waypoints, Terminal, GitCommit } from "lucide-react";

export const Route = createFileRoute("/history")({
  head: () => ({ meta: [{ title: "History · CodeAtlas" }] }),
  component: HistoryPage,
});

const iconFor = (t: string) => t === "architecture" ? Network : t === "docs" ? BookOpen : t === "diagram" ? Waypoints : Terminal;

function HistoryPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Timeline"
        title="History"
        description="A git-like timeline across architecture, diagrams, docs, and implementations."
      />
      <div className="grid grid-cols-1 gap-4 px-6 py-6 md:grid-cols-3 md:px-8">
        <Card className="p-5 md:col-span-2">
          <SectionTitle right={<span className="text-[11px] font-mono text-muted-foreground">42 versions</span>}>Timeline</SectionTitle>
          <ol className="relative ml-2 space-y-5 border-l border-border/70 pl-5">
            {historyEvents.map((e) => {
              const Icon = iconFor(e.type);
              return (
                <li key={e.id} className="relative">
                  <span className="absolute -left-[27px] top-0 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-panel">
                    <Icon className="h-2.5 w-2.5 text-primary" />
                  </span>
                  <div className="text-[11px] font-mono text-muted-foreground">{e.when}</div>
                  <div className="mt-0.5 text-sm font-medium">{e.title}</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">{e.author}</div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <button className="rounded-md border border-border bg-panel px-2 py-0.5 text-[11px]">View diff</button>
                    <button className="rounded-md border border-border bg-panel px-2 py-0.5 text-[11px]">Restore</button>
                  </div>
                </li>
              );
            })}
          </ol>
        </Card>

        <Card className="p-5">
          <SectionTitle>Diff · v41 → v42</SectionTitle>
          <div className="rounded-xl border border-border/60 bg-panel/40 p-3 font-mono text-[12px] leading-relaxed">
            <div className="text-muted-foreground">--- a/architecture.yaml</div>
            <div className="text-muted-foreground">+++ b/architecture.yaml</div>
            <div className="mt-1 text-muted-foreground">@@ payments-svc @@</div>
            <div className="rounded bg-danger/10 px-1 text-danger">- talks_to: [postgres]</div>
            <div className="rounded bg-success/10 px-1 text-success">+ talks_to: [postgres, event-bus]</div>
            <div className="rounded bg-success/10 px-1 text-success">+ emits: [invoice.settled]</div>
            <div className="mt-2 text-muted-foreground">@@ modules @@</div>
            <div className="rounded bg-success/10 px-1 text-success">+ billing.gateway</div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div className="flex -space-x-1.5">
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary to-accent ring-2 ring-card" />
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-accent to-info ring-2 ring-card" />
            </div>
            <div className="text-[11px] text-muted-foreground">Reviewed by Architecture Agent · Approved by Lena</div>
          </div>
        </Card>

        <Card className="p-5 md:col-span-3">
          <SectionTitle right={<GitCommit className="h-3.5 w-3.5 text-muted-foreground" />}>Commit graph</SectionTitle>
          <div className="grid grid-cols-14 gap-1 sm:grid-cols-28">
            {Array.from({ length: 84 }).map((_, i) => {
              const intensity = (Math.sin(i * 0.7) + 1) / 2;
              const level = intensity > 0.75 ? "bg-primary" : intensity > 0.5 ? "bg-primary/60" : intensity > 0.25 ? "bg-primary/30" : "bg-border/60";
              return <div key={i} className={`h-3 w-3 rounded-sm ${level}`} />;
            })}
          </div>
          <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
            <span>Less</span>
            <div className="h-2.5 w-2.5 rounded-sm bg-border/60" />
            <div className="h-2.5 w-2.5 rounded-sm bg-primary/30" />
            <div className="h-2.5 w-2.5 rounded-sm bg-primary/60" />
            <div className="h-2.5 w-2.5 rounded-sm bg-primary" />
            <span>More</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
