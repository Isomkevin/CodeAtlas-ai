// Centralized mock data for CodeAtlas
export type NodeKind = "repo" | "service" | "module" | "api" | "database" | "infra" | "ai";

export const nodeColors: Record<NodeKind, { bg: string; ring: string; label: string }> = {
  repo:     { bg: "bg-[oklch(0.65_0.18_250/0.15)]", ring: "ring-[oklch(0.65_0.18_250/0.6)]", label: "Repository" },
  service:  { bg: "bg-[oklch(0.62_0.22_300/0.15)]", ring: "ring-[oklch(0.62_0.22_300/0.6)]", label: "Service" },
  module:   { bg: "bg-[oklch(0.62_0.18_275/0.15)]", ring: "ring-[oklch(0.62_0.18_275/0.6)]", label: "Module" },
  api:      { bg: "bg-[oklch(0.72_0.19_155/0.15)]", ring: "ring-[oklch(0.72_0.19_155/0.6)]", label: "API" },
  database: { bg: "bg-[oklch(0.72_0.18_55/0.15)]",  ring: "ring-[oklch(0.72_0.18_55/0.6)]",  label: "Database" },
  infra:    { bg: "bg-[oklch(0.62_0.03_250/0.20)]", ring: "ring-[oklch(0.62_0.03_250/0.6)]", label: "Infrastructure" },
  ai:       { bg: "bg-[oklch(0.72_0.24_340/0.15)]", ring: "ring-[oklch(0.72_0.24_340/0.6)]", label: "AI" },
};

export const repositories = [
  { id: "atlas-core",     name: "atlas-core",     provider: "GitHub", language: "TypeScript", framework: "TanStack", branch: "main",    health: 96, drift: 3,  status: "healthy" as const,  stars: 1240, prs: 4, updated: "2h ago",  desc: "Core intelligence runtime and graph engine." },
  { id: "atlas-web",      name: "atlas-web",      provider: "GitHub", language: "TypeScript", framework: "React 19",  branch: "main",    health: 91, drift: 7,  status: "healthy" as const,  stars: 812,  prs: 6, updated: "12m ago", desc: "Public marketing site and docs portal." },
  { id: "atlas-api",      name: "atlas-api",      provider: "GitHub", language: "Go",         framework: "Fiber",     branch: "main",    health: 88, drift: 12, status: "warning" as const,  stars: 402,  prs: 2, updated: "1h ago",  desc: "REST + gRPC gateway for architecture data." },
  { id: "atlas-agents",   name: "atlas-agents",   provider: "GitLab", language: "Python",     framework: "FastAPI",   branch: "develop", health: 74, drift: 22, status: "warning" as const,  stars: 289,  prs: 9, updated: "36m ago", desc: "Multi-agent orchestration & planning graph." },
  { id: "atlas-infra",    name: "atlas-infra",    provider: "GitHub", language: "HCL",        framework: "Terraform", branch: "main",    health: 82, drift: 14, status: "healthy" as const,  stars: 121,  prs: 1, updated: "3h ago",  desc: "Cloud infrastructure modules and pipelines." },
  { id: "atlas-cli",      name: "atlas-cli",      provider: "GitHub", language: "Rust",       framework: "Clap",      branch: "main",    health: 93, drift: 4,  status: "healthy" as const,  stars: 534,  prs: 0, updated: "6h ago",  desc: "Local CLI for scans, plans, and diffs." },
  { id: "payments-svc",   name: "payments-svc",   provider: "GitHub", language: "TypeScript", framework: "Nest",      branch: "main",    health: 68, drift: 31, status: "critical" as const, stars: 44,   prs: 12,updated: "24m ago", desc: "Billing, invoicing, and reconciliation." },
  { id: "search-svc",     name: "search-svc",     provider: "GitHub", language: "Python",     framework: "FastAPI",   branch: "main",    health: 85, drift: 9,  status: "healthy" as const,  stars: 76,   prs: 3, updated: "5h ago",  desc: "Vector + BM25 hybrid semantic search." },
];

export type Repository = typeof repositories[number];

export const activity = [
  { id: 1, kind: "scan",  title: "atlas-core scanned",           actor: "Architecture Agent", time: "2m ago",  detail: "1,284 files · 42 modules · 3 new drifts" },
  { id: 2, kind: "doc",   title: "Regenerated payments-svc docs", actor: "Documentation Agent", time: "12m ago", detail: "6 files updated · 42 new symbols indexed" },
  { id: 3, kind: "plan",  title: "Impact analysis complete",     actor: "Planner Agent",       time: "38m ago", detail: "12 files impacted across 3 services" },
  { id: 4, kind: "pr",    title: "PR #482 opened",               actor: "Implementation Agent",time: "1h ago",  detail: "Extract billing gateway → payments-svc" },
  { id: 5, kind: "alert", title: "Architecture drift detected",  actor: "Architecture Agent",  time: "3h ago",  detail: "payments-svc → users-db direct query" },
  { id: 6, kind: "review",title: "Security review passed",       actor: "Security Agent",      time: "5h ago",  detail: "atlas-api · 0 high · 2 medium" },
];

export const pullRequests = [
  { id: 482, repo: "payments-svc", title: "Extract billing gateway into dedicated module",  author: "sam.k",  status: "open" as const,   checks: "12/13", updated: "1h ago"  },
  { id: 481, repo: "atlas-core",   title: "Introduce incremental graph diffing",             author: "lena.h", status: "review" as const, checks: "13/13", updated: "3h ago"  },
  { id: 479, repo: "atlas-agents", title: "Planner: retry with narrowed context on failure", author: "arjun",  status: "open" as const,   checks: "10/13", updated: "6h ago"  },
  { id: 478, repo: "atlas-web",    title: "Docs: new architecture examples gallery",         author: "maya.o", status: "merged" as const, checks: "13/13", updated: "1d ago"  },
];

export const recommendations = [
  { id: "r1", title: "Split payments-svc into billing and invoicing",   impact: "high" as const,   confidence: 0.92, area: "Architecture" },
  { id: "r2", title: "Introduce a shared observability module",          impact: "medium" as const, confidence: 0.81, area: "Cross-cutting" },
  { id: "r3", title: "Deprecate legacy /v1/users endpoint",              impact: "medium" as const, confidence: 0.78, area: "API" },
  { id: "r4", title: "Move search-svc embeddings to pgvector",           impact: "low" as const,    confidence: 0.66, area: "Data" },
];

export const docs = [
  { id: "d1", repo: "atlas-core",   title: "Graph engine overview",       updated: "2h ago"  },
  { id: "d2", repo: "atlas-agents", title: "Planner architecture",        updated: "12m ago" },
  { id: "d3", repo: "atlas-api",    title: "Request lifecycle",           updated: "1h ago"  },
  { id: "d4", repo: "payments-svc", title: "Billing state machine",       updated: "3h ago"  },
];

export const systemStatus = [
  { name: "Ingestion",     status: "operational" as const, latency: 42  },
  { name: "Graph engine",  status: "operational" as const, latency: 71  },
  { name: "AI gateway",    status: "degraded" as const,    latency: 284 },
  { name: "Vector search", status: "operational" as const, latency: 55  },
  { name: "Webhooks",      status: "operational" as const, latency: 33  },
];

// Architecture graph nodes/edges (React Flow)
export const archNodes = [
  { id: "web",       kind: "service"  as NodeKind, label: "atlas-web",      sub: "Next.js · edge",    x:   0, y:   0 },
  { id: "gateway",   kind: "api"      as NodeKind, label: "api-gateway",    sub: "Go · Fiber",         x: 300, y:   0 },
  { id: "auth",      kind: "service"  as NodeKind, label: "auth-svc",       sub: "OIDC · sessions",   x: 300, y: 140 },
  { id: "core",      kind: "service"  as NodeKind, label: "atlas-core",     sub: "graph engine",      x: 600, y: -60 },
  { id: "agents",    kind: "ai"       as NodeKind, label: "atlas-agents",   sub: "planner · review",  x: 600, y:  80 },
  { id: "search",    kind: "service"  as NodeKind, label: "search-svc",     sub: "hybrid retrieval",  x: 600, y: 220 },
  { id: "payments",  kind: "service"  as NodeKind, label: "payments-svc",   sub: "billing · invoices",x: 900, y: 160 },
  { id: "graphdb",   kind: "database" as NodeKind, label: "graph-db",       sub: "Neo4j",             x: 900, y: -60 },
  { id: "vector",    kind: "database" as NodeKind, label: "vector-store",   sub: "pgvector",          x: 900, y:  60 },
  { id: "postgres",  kind: "database" as NodeKind, label: "postgres",       sub: "primary OLTP",      x: 900, y: 280 },
  { id: "queue",     kind: "infra"    as NodeKind, label: "event-bus",      sub: "NATS jetstream",    x: 300, y: 260 },
  { id: "sdk",       kind: "module"   as NodeKind, label: "@atlas/sdk",     sub: "TypeScript",        x:   0, y: 160 },
  { id: "cli",       kind: "module"   as NodeKind, label: "atlas-cli",      sub: "Rust",              x:   0, y: 300 },
  { id: "repo",      kind: "repo"     as NodeKind, label: "monorepo",       sub: "18 packages",       x: -300, y: 80 },
];

export const archEdges = [
  { source: "web", target: "gateway" },
  { source: "sdk", target: "gateway" },
  { source: "cli", target: "gateway" },
  { source: "gateway", target: "auth" },
  { source: "gateway", target: "core" },
  { source: "gateway", target: "agents" },
  { source: "gateway", target: "search" },
  { source: "gateway", target: "payments", animated: true },
  { source: "core", target: "graphdb" },
  { source: "core", target: "queue" },
  { source: "agents", target: "vector" },
  { source: "search", target: "vector" },
  { source: "payments", target: "postgres" },
  { source: "auth", target: "postgres" },
  { source: "repo", target: "web" },
  { source: "repo", target: "sdk" },
  { source: "repo", target: "cli" },
];

export const agents = [
  { id: "planner",       name: "Planner",       icon: "Compass",  status: "active" as const,  last: "38s ago", latency: 412,  tasks: 128, health: 98,
    recent: ["Drafted plan · split payments-svc", "Estimated impact · 12 files"] },
  { id: "architecture",  name: "Architecture",  icon: "Network",  status: "active" as const,  last: "2m ago",  latency: 890,  tasks: 342, health: 95,
    recent: ["Detected drift · payments → users-db", "Rescanned atlas-core"] },
  { id: "documentation", name: "Documentation", icon: "BookOpen", status: "idle" as const,    last: "12m ago", latency: 1420, tasks: 89,  health: 92,
    recent: ["Regenerated planner docs", "Indexed 42 new symbols"] },
  { id: "diagram",       name: "Diagram",       icon: "Waypoints",status: "idle" as const,    last: "1h ago",  latency: 2100, tasks: 61,  health: 90,
    recent: ["Rendered v42 architecture diagram", "Refactored retrieval sub-graph"] },
  { id: "implementation",name: "Implementation",icon: "Terminal", status: "active" as const,  last: "22s ago", latency: 3200, tasks: 214, health: 88,
    recent: ["Opened PR #482 · billing gateway", "Rebased branch on main"] },
  { id: "review",        name: "Review",        icon: "Eye",      status: "active" as const,  last: "1m ago",  latency: 620,  tasks: 176, health: 94,
    recent: ["Reviewed PR #482 · 3 comments", "Approved atlas-core#481"] },
  { id: "testing",       name: "Testing",       icon: "FlaskConical", status: "idle" as const,last: "18m ago", latency: 1800, tasks: 142, health: 91,
    recent: ["Generated 14 contract tests", "Ran regression suite · 0 fails"] },
  { id: "security",      name: "Security",      icon: "ShieldCheck",  status: "active" as const, last: "4m ago", latency: 540, tasks: 74, health: 97,
    recent: ["Scanned atlas-api · 0 high", "Rotated 3 stale secrets"] },
  { id: "performance",   name: "Performance",   icon: "Gauge",    status: "idle" as const,    last: "42m ago", latency: 760,  tasks: 58,  health: 89,
    recent: ["Profiled graph engine · −34% P95", "Flagged N+1 in search-svc"] },
];

export const historyEvents = [
  { id: "h1", when: "Today · 14:22", type: "architecture", title: "v42 · Added event-bus between payments-svc and core", author: "Architecture Agent" },
  { id: "h2", when: "Today · 12:04", type: "docs",         title: "Regenerated 6 documents in atlas-agents",             author: "Documentation Agent" },
  { id: "h3", when: "Today · 09:41", type: "impl",         title: "PR #482 opened · Extract billing gateway",             author: "Implementation Agent" },
  { id: "h4", when: "Yesterday",     type: "diagram",      title: "v41 · Split retrieval sub-graph",                     author: "Diagram Agent" },
  { id: "h5", when: "Yesterday",     type: "architecture", title: "v40 · Introduced vector-store node",                  author: "Architecture Agent" },
  { id: "h6", when: "2 days ago",    type: "docs",         title: "Initial planner architecture doc committed",         author: "Documentation Agent" },
];

export const impactFiles = [
  { path: "packages/payments/src/gateway.ts",       change: "+128 −44",  risk: "high"   as const },
  { path: "packages/payments/src/invoices.ts",      change: "+62 −18",   risk: "medium" as const },
  { path: "apps/api/src/routes/billing.ts",         change: "+41 −22",   risk: "medium" as const },
  { path: "packages/sdk/src/payments.ts",           change: "+18 −6",    risk: "low"    as const },
  { path: "infra/terraform/services/payments.tf",   change: "+8 −2",     risk: "low"    as const },
];

export const generatedTasks = [
  { id: "t1", title: "Introduce BillingGateway interface",           agent: "Planner",       est: "1h" },
  { id: "t2", title: "Move Stripe adapter behind gateway",           agent: "Implementation",est: "3h" },
  { id: "t3", title: "Add contract tests for gateway",               agent: "Testing",       est: "1.5h" },
  { id: "t4", title: "Update sdk/payments to consume interface",     agent: "Implementation",est: "45m" },
  { id: "t5", title: "Regenerate billing docs & diagram",            agent: "Documentation", est: "20m" },
];

export const chatSeed = [
  { role: "assistant" as const, text: "Hi — I'm your architecture copilot. Ask about any repo, service, or module. I can trace dependencies, plan refactors, or draft ADRs." },
  { role: "user"      as const, text: "What talks to payments-svc?" },
  { role: "assistant" as const, text: "Inbound: api-gateway (billing routes), atlas-web (checkout). Outbound: postgres (primary OLTP), event-bus (invoice.settled). One drift detected: direct read from users-db." , refs: ["payments-svc","api-gateway","event-bus","users-db"] },
];
