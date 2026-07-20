import { useEffect, useRef, useState } from "react";
import { Sparkles, ArrowUp, Bot, User, GitBranch, Network, Database, Zap } from "lucide-react";
import { chatSeed } from "@/lib/mock-data";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; text: string; refs?: string[]; streaming?: boolean };

const refIcon = (r: string) => {
  if (/db|store|postgres/i.test(r)) return Database;
  if (/api|gateway/i.test(r)) return Zap;
  if (/bus|queue/i.test(r)) return Network;
  return GitBranch;
};

export function AiChat({ compact = false }: { compact?: boolean }) {
  const [messages, setMessages] = useState<Msg[]>(chatSeed);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    setBusy(true);
    const reply = "Tracing dependencies… I found 3 direct callers and 2 indirect paths. The proposed change impacts payments-svc → postgres and event-bus fanout.";
    let i = 0;
    setMessages((m) => [...m, { role: "assistant", text: "", streaming: true }]);
    const iv = setInterval(() => {
      i += 4;
      setMessages((m) => {
        const copy = [...m];
        const last = copy[copy.length - 1];
        copy[copy.length - 1] = { ...last, text: reply.slice(0, i) };
        return copy;
      });
      if (i >= reply.length) {
        clearInterval(iv);
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { ...copy[copy.length - 1], streaming: false, refs: ["payments-svc", "postgres", "event-bus"] };
          return copy;
        });
        setBusy(false);
      }
    }, 24);
  };

  return (
    <div className={cn("flex h-full flex-col", compact && "text-sm")}>
      <div className="flex items-center gap-2 border-b border-border/70 px-4 py-2.5">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-primary to-accent">
          <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
        </div>
        <div className="text-sm font-medium">Copilot</div>
        <span className="ml-auto rounded-full border border-border bg-panel/60 px-2 py-0.5 text-[10px] text-muted-foreground">
          gpt-atlas · streaming
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={cn("flex gap-3", m.role === "user" ? "justify-end" : "")}
          >
            {m.role === "assistant" && (
              <div className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-md bg-panel border border-border">
                <Bot className="h-3.5 w-3.5 text-primary" />
              </div>
            )}
            <div className={cn("max-w-[85%]", m.role === "user" && "order-1")}>
              <div className={cn(
                "rounded-xl px-3 py-2 text-sm leading-relaxed",
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-panel/60 border border-border/60",
              )}>
                {m.text}
                {m.streaming && <span className="ml-0.5 inline-block h-3 w-1.5 translate-y-0.5 animate-pulse bg-primary/80" />}
              </div>
              {m.refs && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {m.refs.map((r) => {
                    const Icon = refIcon(r);
                    return (
                      <span key={r} className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-0.5 text-[11px] font-mono text-muted-foreground">
                        <Icon className="h-3 w-3 text-primary" /> {r}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
            {m.role === "user" && (
              <div className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-md bg-panel border border-border order-2">
                <User className="h-3.5 w-3.5" />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="border-t border-border/70 p-3">
        <div className="relative rounded-xl border border-border bg-panel/60 focus-within:border-primary/60">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            rows={2}
            placeholder="Ask about any repo, service, or module…"
            className="block w-full resize-none rounded-xl bg-transparent px-3 py-2.5 pr-11 text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="absolute bottom-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="mt-1.5 flex items-center justify-between px-1 text-[11px] text-muted-foreground">
          <span>Enter to send · Shift+Enter for newline</span>
          <span className="font-mono">context: 3 repos · 42 nodes</span>
        </div>
      </form>
    </div>
  );
}
