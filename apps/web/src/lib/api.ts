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

export type ArchitectureArtifact = {
  id: string;
  repository_id: string;
  graph_version_id: string;
  kind: "documentation" | "mermaid" | "drawio" | "c4";
  content: string;
  created_at: string;
};

export type ImplementationPlan = {
  id: string;
  repository_id: string;
  graph_version_id: string;
  status: "draft" | "approved" | "pull_request_opened" | "failed";
  change_request: string;
  plan_json: { tasks?: Array<{ id: string; title: string; path?: string }> };
  pull_request_url: string | null;
  error: string | null;
};

export const apiBaseUrl = import.meta.env.VITE_CODEATLAS_API_URL ?? "http://localhost:8000";

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
    throw new Error(payload?.message ?? payload?.detail ?? `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export function listRepositories() {
  return apiRequest<ApiRepository[]>("/repositories");
}

export function loadArchitectureGraph(repositoryId: string) {
  return apiRequest<ArchitectureGraph>(`/repositories/${repositoryId}/graph`);
}

export function requestRepositoryScan(repositoryId: string) {
  return apiRequest(`/repositories/${repositoryId}/scan`, { method: "POST" });
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
