export type ApiRepository = {
  id: string;
  full_name: string;
  default_branch: string;
  status: string;
};

export type ArchitectureGraphNode = {
  id: string;
  kind: string;
  name: string;
  properties: Record<string, string>;
};

export type ArchitectureGraphEdge = {
  id: string;
  source_id: string;
  target_id: string;
  kind: string;
};

export type ArchitectureGraph = {
  version_id: string;
  repository_id: string;
  nodes: ArchitectureGraphNode[];
  edges: ArchitectureGraphEdge[];
};

export type GraphVersion = {
  id: string;
  repository_id: string;
  scan_id: string;
  sequence: number;
  parent_version_id: string | null;
  commit_sha: string;
  status: "projecting" | "ready" | "failed";
  summary: Record<string, unknown>;
  error: string | null;
  created_at: string;
  completed_at: string | null;
};

export type ArchitectureArtifact = {
  id: string;
  repository_id: string;
  graph_version_id: string;
  kind: "documentation" | "mermaid" | "drawio" | "c4";
  content: string;
  created_at: string;
};

export type ImplementationPlanTask = {
  id: string;
  title: string;
  node_id?: string;
  path?: string;
  acceptance_criteria?: string[];
};

export type ImplementationPlanJson = {
  graph_version_id?: string;
  summary?: string;
  affected_node_ids?: string[];
  affected_edge_ids?: string[];
  tasks?: ImplementationPlanTask[];
  guardrails?: string[];
};

export type ImplementationPlan = {
  id: string;
  repository_id: string;
  graph_version_id: string;
  requested_by: string;
  approved_by: string | null;
  status: "draft" | "approved" | "pull_request_opened" | "failed";
  change_request: string;
  plan_json: ImplementationPlanJson;
  pull_request_url: string | null;
  error: string | null;
  created_at: string;
  approved_at: string | null;
  completed_at: string | null;
};

export type RepositoryEvent = {
  type: "scan.running" | "scan.completed" | "scan.failed";
  scan_id: string;
  graph_version_id?: string;
  message?: string;
};

export type WorkspaceAIProvider = {
  configured: boolean;
  source: "workspace_byok" | "deployment_key" | "deterministic_graph";
  provider: string | null;
  base_url: string | null;
  model: string | null;
  key_hint: string | null;
  updated_at: string | null;
};

export type Workspace = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  role: "owner" | "admin" | "member" | "viewer";
  created_at: string | null;
  updated_at: string | null;
};

export const apiBaseUrl = import.meta.env.VITE_CODEATLAS_API_URL ?? "http://localhost:8000";

export class ApiAuthError extends Error {
  readonly isApiAuthError = true as const;
  constructor(message = "Not authenticated") {
    super(message);
    this.name = "ApiAuthError";
  }
}

export function isApiAuthError(value: unknown): value is ApiAuthError {
  return value instanceof Error && (value as ApiAuthError).isApiAuthError === true;
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = window.sessionStorage.getItem("codeatlas.access_token");
  const response = await fetch(`${apiBaseUrl}/api/v1${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { detail?: string; message?: string } | null;
    const message = payload?.message ?? payload?.detail ?? `Request failed (${response.status})`;
    if (response.status === 401) throw new ApiAuthError(typeof message === "string" ? message : "Not authenticated");
    throw new Error(typeof message === "string" ? message : `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export function listRepositories() {
  return apiRequest<ApiRepository[]>("/repositories");
}

export function loadArchitectureGraph(repositoryId: string) {
  return apiRequest<ArchitectureGraph>(`/repositories/${repositoryId}/graph`);
}

export function listGraphVersions(repositoryId: string) {
  return apiRequest<GraphVersion[]>(`/repositories/${repositoryId}/graph/versions`);
}

export function requestRepositoryScan(repositoryId: string) {
  return apiRequest(`/repositories/${repositoryId}/scan`, { method: "POST" });
}

export function subscribeRepositoryEvents(
  repositoryId: string,
  onEvent: (event: RepositoryEvent) => void,
  onError?: () => void,
) {
  const token = window.sessionStorage.getItem("codeatlas.access_token");
  if (!token) return () => undefined;
  const endpoint = new URL(apiBaseUrl);
  endpoint.protocol = endpoint.protocol === "https:" ? "wss:" : "ws:";
  endpoint.pathname = `${endpoint.pathname.replace(/\/$/, "")}/api/v1/repositories/${repositoryId}/events`;
  endpoint.searchParams.set("access_token", token);
  const socket = new WebSocket(endpoint);
  socket.onmessage = (message) => {
    try {
      onEvent(JSON.parse(message.data) as RepositoryEvent);
    } catch {
      onError?.();
    }
  };
  socket.onerror = () => onError?.();
  return () => socket.close();
}

export function connectRepository(url: string) {
  return apiRequest<ApiRepository>("/repositories", {
    method: "POST",
    body: JSON.stringify({ url }),
  });
}

export function listArtifacts(repositoryId: string) {
  return apiRequest<ArchitectureArtifact[]>(`/repositories/${repositoryId}/artifacts`);
}

export function generateArtifact(repositoryId: string, kind: ArchitectureArtifact["kind"]) {
  return apiRequest<ArchitectureArtifact>(`/repositories/${repositoryId}/artifacts`, {
    method: "POST",
    body: JSON.stringify({ kind }),
  });
}

export function listImplementationPlans(repositoryId: string) {
  return apiRequest<ImplementationPlan[]>(`/repositories/${repositoryId}/implementation-plans`);
}

export function createImplementationPlan(repositoryId: string, changeRequest: string) {
  return apiRequest<ImplementationPlan>(`/repositories/${repositoryId}/implementation-plans`, {
    method: "POST",
    body: JSON.stringify({ change_request: changeRequest }),
  });
}

export function approveImplementationPlan(repositoryId: string, planId: string) {
  return apiRequest<ImplementationPlan>(`/repositories/${repositoryId}/implementation-plans/${planId}/approve`, {
    method: "POST",
  });
}

export type OpenPullRequestInput = {
  title: string;
  body: string;
  head_branch: string;
  base_branch: string;
};

export function openPullRequest(repositoryId: string, planId: string, input: OpenPullRequestInput) {
  return apiRequest<ImplementationPlan>(`/repositories/${repositoryId}/implementation-plans/${planId}/pull-request`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getWorkspaceAIProvider() {
  return apiRequest<WorkspaceAIProvider>("/ai/provider");
}

export function saveWorkspaceAIProvider(input: {
  api_key: string;
  base_url: string;
  model: string;
}) {
  return apiRequest<WorkspaceAIProvider>("/ai/provider", {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function removeWorkspaceAIProvider() {
  return apiRequest<WorkspaceAIProvider>("/ai/provider", { method: "DELETE" });
}

export function getWorkspace() {
  return apiRequest<Workspace>("/auth/workspace");
}

export function updateWorkspace(input: { name: string; slug: string }) {
  return apiRequest<Workspace>("/auth/workspace", {
    method: "PUT",
    body: JSON.stringify(input),
  });
}
