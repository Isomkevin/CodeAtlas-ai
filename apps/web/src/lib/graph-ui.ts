export type NodeKind = "repo" | "service" | "module" | "api" | "database" | "infra" | "ai";

export const nodeColors: Record<NodeKind, { bg: string; ring: string; label: string }> = {
  repo: { bg: "bg-[oklch(0.65_0.18_250/0.15)]", ring: "ring-[oklch(0.65_0.18_250/0.6)]", label: "Repository" },
  service: { bg: "bg-[oklch(0.62_0.22_300/0.15)]", ring: "ring-[oklch(0.62_0.22_300/0.6)]", label: "Service" },
  module: { bg: "bg-[oklch(0.62_0.18_275/0.15)]", ring: "ring-[oklch(0.62_0.18_275/0.6)]", label: "Module" },
  api: { bg: "bg-[oklch(0.72_0.19_155/0.15)]", ring: "ring-[oklch(0.72_0.19_155/0.6)]", label: "API" },
  database: { bg: "bg-[oklch(0.72_0.18_55/0.15)]", ring: "ring-[oklch(0.72_0.18_55/0.6)]", label: "Database" },
  infra: { bg: "bg-[oklch(0.62_0.03_250/0.20)]", ring: "ring-[oklch(0.62_0.03_250/0.6)]", label: "Infrastructure" },
  ai: { bg: "bg-[oklch(0.72_0.24_340/0.15)]", ring: "ring-[oklch(0.72_0.24_340/0.6)]", label: "AI" },
};

export function graphNodeKind(kind: string): NodeKind {
  return kind === "external_module" ? "infra" : kind === "repository" ? "repo" : "module";
}
