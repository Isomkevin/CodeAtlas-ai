import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, KindBadge, SectionTitle } from "@/components/atlas-ui";
import { archNodes, historyEvents } from "@/lib/mock-data";
import { Search, ArrowRight, Clock, Sparkles } from "lucide-react";
import { useState, useMemo } from "react";

export const Route = createFileRoute("/knowledge")({
  head: () => ({ meta: [{ title: "Knowledge graph · CodeAtlas" }] }),
  component: KnowledgePage,
});

function KnowledgePage() {
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    const term = q.toLowerCase();
    if (!term) return archNodes;
    return archNodes.filter((n) => n.label.toLowerCase().includes(term) || n.sub.toLowerCase().includes(term) || n.kind.includes(term));
  }, [q]);

  return (
    <div>
      <PageHeader
        eyebrow="Semantic"
        title="Knowledge graph"
        description="Search across every entity in your architecture. Trace relationships, follow chains, replay history."
      />

      <div className="px-6 py-6 md:px-8">
        <div className="relative mb-6">
          <div className="absolute inset-x-0 -top-8 -z-10 mx-auto h-32 max-w-2xl rounded-full bg-primary/20 blur-3xl" />
          <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-panel/60 backdrop-blur px-4 py-3 focus-within:border-primary/60">
            <div className="flex items-center gap-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={q} onChange={(e) => setQ(e.target.value)}
                placeholder="Search entities, symbols, or ask a question…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <span className="rounded-md border border-border bg-background/60 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">semantic</span>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-1.5 text-[11px]">
            {["payments", "graph engine", "authentication", "vector search", "event bus"].map((t) => (
              <button key={t} onClick={() => setQ(t)} className="rounded-md border border-border bg-panel/40 px-2 py-0.5 text-muted-foreground hover:text-foreground">
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="p-4 lg:col-span-2">
            <SectionTitle right={<span className="text-[11px] text-muted-foreground font-mono">{results.length} results</span>}>Results</SectionTitle>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {results.map((n) => (
                <div key={n.id} className="group rounded-xl border border-border/60 bg-panel/40 p-3 hover:border-primary/40 transition-colors">
                  <div className="flex items-center justify-between">
                    <KindBadge kind={n.kind} />
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
                  </div>
                  <div className="mt-2 text-sm font-medium">{n.label}</div>
                  <div className="text-[11px] text-muted-foreground">{n.sub}</div>
                  <div className="mt-3 flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
                    <span className="rounded-md bg-background/60 px-1.5 py-0.5">deps: {(n.id.length + 2)}</span>
                    <span className="rounded-md bg-background/60 px-1.5 py-0.5">cov: {40 + n.id.length * 4}%</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="space-y-4">
            <Card className="p-4">
              <SectionTitle right={<Sparkles className="h-3.5 w-3.5 text-accent" />}>Related concepts</SectionTitle>
              <div className="flex flex-wrap gap-1.5">
                {["billing", "invoicing", "webhooks", "OIDC", "vector store", "OLTP", "retrieval", "planner"].map((t) => (
                  <span key={t} className="rounded-full border border-border bg-panel/60 px-2.5 py-1 text-[11px]">{t}</span>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <SectionTitle right={<Clock className="h-3.5 w-3.5 text-muted-foreground" />}>Timeline</SectionTitle>
              <ol className="relative ml-1 space-y-3 border-l border-border/70 pl-4">
                {historyEvents.slice(0, 5).map((e) => (
                  <li key={e.id} className="relative">
                    <span className="absolute -left-[19px] top-1 h-2.5 w-2.5 rounded-full bg-primary/70 ring-2 ring-background" />
                    <div className="text-[11px] font-mono text-muted-foreground">{e.when}</div>
                    <div className="text-sm">{e.title}</div>
                  </li>
                ))}
              </ol>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
