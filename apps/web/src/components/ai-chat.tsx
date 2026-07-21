import { useEffect, useRef, useState } from "react";
import { Sparkles, ArrowUp, Bot, User, GitBranch, Network, Database, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/api";

type Msg = { role: "user" | "assistant"; text: string; refs?: string[] };

const refIcon = (reference: string) => {
  if (/db|store|postgres/i.test(reference)) return Database;
  if (/api|gateway/i.test(reference)) return Zap;
  if (/bus|queue/i.test(reference)) return Network;
  return GitBranch;
};

export function AiChat({ compact = false, repositoryId }: { compact?: boolean; repositoryId?: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const question = input.trim();
    if (!question || busy || !repositoryId) return;
    setInput("");
    setMessages((current) => [...current, { role: "user", text: question }]);
    setBusy(true);
    try {
      const response = await apiRequest<{ answer: string; citations: string[] }>(
        `/repositories/${repositoryId}/chat`,
        { method: "POST", body: JSON.stringify({ question }) },
      );
      setMessages((current) => [
        ...current,
        { role: "assistant", text: response.answer, refs: response.citations },
      ]);
    } catch (reason) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: reason instanceof Error ? reason.message : "Architecture chat is unavailable.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={cn("flex h-full flex-col", compact && "text-sm")}>
      <div className="flex items-center gap-2 border-b border-border/70 px-4 py-2.5">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-primary to-accent">
          <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
        </div>
        <div className="text-sm font-medium">Copilot</div>
        <span className="ml-auto rounded-full border border-border bg-panel/60 px-2 py-0.5 text-[10px] text-muted-foreground">
          graph-only context
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {!messages.length && (
          <div className="rounded-xl border border-border/60 bg-panel/40 px-3 py-2 text-sm text-muted-foreground">
            {repositoryId
              ? "Ask about this repository’s canonical architecture graph."
              : "Select a repository graph to start a conversation."}
          </div>
        )}
        {messages.map((message, index) => (
          <motion.div
            key={`${message.role}-${index}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={cn("flex gap-3", message.role === "user" ? "justify-end" : "")}
          >
            {message.role === "assistant" && (
              <div className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-md border border-border bg-panel">
                <Bot className="h-3.5 w-3.5 text-primary" />
              </div>
            )}
            <div className={cn("max-w-[85%]", message.role === "user" && "order-1")}>
              <div className={cn(
                "rounded-xl px-3 py-2 text-sm leading-relaxed",
                message.role === "user" ? "bg-primary text-primary-foreground" : "border border-border/60 bg-panel/60",
              )}>
                {message.text}
              </div>
              {message.refs && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {message.refs.map((reference) => {
                    const Icon = refIcon(reference);
                    return (
                      <span key={reference} className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-0.5 text-[11px] font-mono text-muted-foreground">
                        <Icon className="h-3 w-3 text-primary" /> {reference}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
            {message.role === "user" && (
              <div className="order-2 mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-md border border-border bg-panel">
                <User className="h-3.5 w-3.5" />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <form onSubmit={(event) => { event.preventDefault(); void send(); }} className="border-t border-border/70 p-3">
        <div className="relative rounded-xl border border-border bg-panel/60 focus-within:border-primary/60">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void send();
              }
            }}
            rows={2}
            placeholder="Ask about any repo, service, or module…"
            className="block w-full resize-none rounded-xl bg-transparent px-3 py-2.5 pr-11 text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={busy || !input.trim() || !repositoryId}
            className="absolute bottom-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="mt-1.5 flex items-center justify-between px-1 text-[11px] text-muted-foreground">
          <span>Enter to send · Shift+Enter for newline</span>
          <span className="font-mono">context: {repositoryId ? "architecture graph" : "none"}</span>
        </div>
      </form>
    </div>
  );
}
