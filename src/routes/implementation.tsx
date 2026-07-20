import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, SectionTitle } from "@/components/atlas-ui";
import { impactFiles, generatedTasks } from "@/lib/mock-data";
import { motion } from "framer-motion";
import {
  Sparkles, GitPullRequest, CheckCircle2, Circle, FileCode2, ArrowRight,
  Wand2, ClipboardList, Eye, Rocket, Layers,
} from "lucide-react";

export const Route = createFileRoute("/implementation")({
  head: () => ({ meta: [{ title: "Implementation · CodeAtlas" }] }),
  component: ImplementationPage,
});

const steps = [
  { id: 1, label: "Architecture change",  icon: Layers,        state: "done" },
  { id: 2, label: "Impact analysis",      icon: Eye,           state: "done" },
  { id: 3, label: "Implementation plan",  icon: ClipboardList, state: "active" },
  { id: 4, label: "Review",               icon: Wand2,         state: "next" },
  { id: 5, label: "Generated tasks",      icon: CheckCircle2,  state: "next" },
  { id: 6, label: "Pull request",         icon: GitPullRequest,state: "next" },
] as const;

function ImplementationPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Workflow"
        title="Implementation workspace"
        description="Turn architectural intent into a reviewable pull request. Agents do the plumbing."
        actions={
          <>
            <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-panel px-3 py-2 text-sm"><Sparkles className="h-4 w-4" /> New plan</button>
            <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"><Rocket className="h-4 w-4" /> Ship draft PR</button>
          </>
        }
      />

      <div className="px-6 py-6 md:px-8">
        {/* Timeline */}
        <Card className="p-5">
          <div className="flex items-start justify-between gap-6 overflow-x-auto">
            {steps.map((s, i) => (
              <div key={s.id} className="relative flex flex-1 min-w-[140px] flex-col items-center gap-2">
                {i < steps.length - 1 && (
                  <div className="absolute left-1/2 top-4 h-[2px] w-full">
                    <div className="h-full w-full bg-border/70">
                      {(s.state === "done") && <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 0.6, delay: i * 0.1 }} className="h-full bg-primary" />}
                    </div>
                  </div>
                )}
                <div className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full border ${
                  s.state === "done" ? "bg-primary text-primary-foreground border-primary" :
                  s.state === "active" ? "bg-panel border-primary text-primary" : "bg-panel border-border text-muted-foreground"
                }`}>
                  <s.icon className="h-4 w-4" />
                </div>
                <div className="text-center">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Step {s.id}</div>
                  <div className="text-sm font-medium">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="p-5 lg:col-span-2">
            <SectionTitle right={<span className="rounded-md bg-warning/15 text-warning px-2 py-0.5 text-[10px] font-mono">HIGH IMPACT</span>}>
              Change · Extract billing gateway into payments-svc
            </SectionTitle>
            <p className="text-sm text-muted-foreground">
              Split checkout coupling by introducing a <code className="font-mono text-foreground">BillingGateway</code> port and moving the Stripe adapter behind it. Preserves public API. Enables invoice-service extraction next quarter.
            </p>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                <span>Impacted files</span>
                <span>5 files · +257 −92</span>
              </div>
              <div className="divide-y divide-border/60 rounded-xl border border-border/60 bg-panel/40">
                {impactFiles.map((f) => (
                  <div key={f.path} className="flex items-center gap-3 px-3 py-2.5">
                    <FileCode2 className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate font-mono text-[12px]">{f.path}</span>
                    <span className="ml-auto font-mono text-[11px] text-muted-foreground">{f.change}</span>
                    <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-mono ${
                      f.risk === "high" ? "bg-danger/15 text-danger" : f.risk === "medium" ? "bg-warning/15 text-warning" : "bg-success/15 text-success"
                    }`}>{f.risk}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <SectionTitle>Generated tasks</SectionTitle>
              <div className="space-y-2">
                {generatedTasks.map((t, i) => (
                  <div key={t.id} className="flex items-center gap-3 rounded-lg border border-border/60 bg-panel/40 px-3 py-2.5">
                    {i === 0 ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm">{t.title}</div>
                      <div className="text-[11px] text-muted-foreground">{t.agent} · est {t.est}</div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <div className="space-y-4">
            <Card className="p-5">
              <SectionTitle>Draft pull request</SectionTitle>
              <div className="rounded-xl border border-border/60 bg-panel/40 p-4">
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                  <GitPullRequest className="h-3.5 w-3.5 text-primary" /> payments-svc <span>·</span> #482
                </div>
                <div className="mt-1 text-sm font-medium">Extract billing gateway into dedicated module</div>
                <div className="mt-2 flex items-center gap-2 text-[11px]">
                  <span className="rounded-md bg-primary/15 text-primary px-1.5 py-0.5 font-mono">open</span>
                  <span className="rounded-md bg-panel border border-border px-1.5 py-0.5 font-mono">12/13 checks</span>
                </div>
                <div className="mt-4 flex gap-2">
                  <button className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">Open PR</button>
                  <button className="rounded-lg border border-border bg-panel px-3 py-2 text-sm">Diff</button>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <SectionTitle>Agents assigned</SectionTitle>
              <div className="space-y-2 text-sm">
                {["Planner","Implementation","Testing","Review","Documentation"].map((a) => (
                  <div key={a} className="flex items-center gap-2 rounded-lg border border-border/60 bg-panel/40 px-3 py-2">
                    <div className="h-2 w-2 rounded-full bg-success" />
                    <span>{a}</span>
                    <span className="ml-auto text-[11px] font-mono text-muted-foreground">ready</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
