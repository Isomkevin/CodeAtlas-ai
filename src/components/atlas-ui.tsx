import { cn } from "@/lib/utils";
import { nodeColors, type NodeKind } from "@/lib/mock-data";
import type { ReactNode } from "react";
import { motion } from "framer-motion";

export function StatusDot({ tone = "success", className }: { tone?: "success" | "warning" | "danger" | "info" | "muted"; className?: string }) {
  const map = {
    success: "bg-success shadow-[0_0_0_3px_color-mix(in_oklab,var(--success)_25%,transparent)]",
    warning: "bg-warning shadow-[0_0_0_3px_color-mix(in_oklab,var(--warning)_25%,transparent)]",
    danger:  "bg-danger shadow-[0_0_0_3px_color-mix(in_oklab,var(--danger)_25%,transparent)]",
    info:    "bg-info shadow-[0_0_0_3px_color-mix(in_oklab,var(--info)_25%,transparent)]",
    muted:   "bg-muted-foreground/50",
  } as const;
  return <span className={cn("inline-block h-2 w-2 rounded-full", map[tone], className)} />;
}

export function KindBadge({ kind, className }: { kind: NodeKind; className?: string }) {
  const c = nodeColors[kind];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ring-1 ring-inset", c.bg, c.ring, className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {c.label}
    </span>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-border/70 bg-card/60 backdrop-blur-sm soft-shadow", className)}>
      {children}
    </div>
  );
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h3 className="text-sm font-semibold tracking-tight">{children}</h3>
      {right}
    </div>
  );
}

export function Sparkline({ values, className, tone = "primary" }: { values: number[]; className?: string; tone?: "primary" | "accent" | "success" | "warning" | "danger" }) {
  const w = 120, h = 32, pad = 2;
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - pad * 2) - pad;
    return { x, y };
  });
  // Smooth Catmull-Rom → Bezier for a premium curve, not a jagged polyline
  const d = pts.reduce((acc, p, i, arr) => {
    if (i === 0) return `M ${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
    const p0 = arr[i - 1];
    const p2 = arr[i + 1] ?? p;
    const c1x = p0.x + (p.x - (arr[i - 2]?.x ?? p0.x)) / 6;
    const c1y = p0.y + (p.y - (arr[i - 2]?.y ?? p0.y)) / 6;
    const c2x = p.x - (p2.x - p0.x) / 6;
    const c2y = p.y - (p2.y - p0.y) / 6;
    return `${acc} C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
  }, "");
  const strokeVar: Record<string, string> = {
    primary: "var(--primary)", accent: "var(--accent)", success: "var(--success)", warning: "var(--warning)", danger: "var(--danger)",
  };
  const id = `sg-${tone}-${values.length}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={cn("h-8 w-full", className)} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={strokeVar[tone]} stopOpacity="0.28" />
          <stop offset="100%" stopColor={strokeVar[tone]} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L ${w} ${h} L 0 ${h} Z`} fill={`url(#${id})`} />
      <path d={d} fill="none" stroke={strokeVar[tone]} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function HealthRing({ value, size = 88, label }: { value: number; size?: number; label?: string }) {
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  const color = value >= 90 ? "var(--success)" : value >= 75 ? "var(--info)" : value >= 60 ? "var(--warning)" : "var(--danger)";
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} strokeWidth={stroke} className="stroke-border/70" fill="none" />
        <motion.circle
          cx={size/2} cy={size/2} r={r} strokeWidth={stroke} strokeLinecap="round" fill="none"
          stroke={color}
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: off }}
          transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-semibold tabular-nums">{value}</span>
        {label && <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>}
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, description, action }: { icon: ReactNode; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/70 bg-panel/30 px-6 py-14 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-card text-muted-foreground">{icon}</div>
      <div>
        <div className="text-sm font-medium">{title}</div>
        <div className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</div>
      </div>
      {action}
    </div>
  );
}
