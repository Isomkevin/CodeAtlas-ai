# CodeAtlas MCP tool registry

The CodeAtlas MCP surface exposes exactly two tools. Both transports (Streamable HTTP + local stdio) enumerate the same registry.

## `get_architecture_graph`

Return the canonical architecture graph for a connected repository.

**Arguments:**

```json
{
  "repository_id": "<repository-uuid>"
}
```

**Response** (via `tools/call` → `content[0].text` as JSON):

```json
{
  "version_id": "<graph-version-uuid>",
  "repository_id": "<repository-uuid>",
  "nodes": [
    { "id": "…", "kind": "class|function|module|external_module", "name": "…", "properties": { "path": "…", "line": "…" } }
  ],
  "edges": [
    { "id": "…", "source_id": "…", "target_id": "…", "kind": "contains|imports|…" }
  ]
}
```

The response includes the selected graph version, all nodes, and all edges. It does **not** include raw source files or file contents. The API returns the latest ready graph when a specific version isn't requested.

**Guardrails:**

- Repository access is checked against the caller's workspace before any graph query.
- If Neo4j Aura is mid-resume, the graph store retries auth errors with 2s / 5s / 10s backoff.
- Sustained backend failures surface as MCP `isError` with a readable message, not a transport error.

## `create_implementation_plan`

Create a graph-bound **draft** implementation plan.

**Arguments:**

```json
{
  "repository_id": "<repository-uuid>",
  "change_request": "Add rate limiting to the /repositories endpoint using SlowAPI.",
  "graph_version_id": "<optional-graph-version-uuid>"
}
```

- `change_request` must be at least 10 characters.
- `graph_version_id` is optional — the API uses the latest ready graph when omitted.

**Response:**

```json
{
  "id": "<plan-uuid>",
  "repository_id": "<repository-uuid>",
  "graph_version_id": "<graph-version-uuid>",
  "status": "draft",
  "change_request": "…",
  "plan_json": {
    "graph_version_id": "…",
    "summary": "…",
    "affected_node_ids": ["…"],
    "affected_edge_ids": ["…"],
    "tasks": [
      { "id": "task-1", "title": "…", "node_id": "…", "path": "…", "acceptance_criteria": ["…"] }
    ],
    "guardrails": ["…"]
  },
  "pull_request_url": null,
  "error": null,
  "created_at": "…"
}
```

**Guardrails:**

- Creating a plan **does not** grant a coding agent authority to open a pull request.
- The plan remains `status: "draft"` until an owner or admin approves it via the CodeAtlas UI (or the REST endpoint).
- Only after approval can CodeAtlas open a real GitHub PR using the workspace's OAuth token.

## Not implemented

The MCP surface is deliberately small. The bridge does **not** expose:

- Raw source files, file contents, or checkouts.
- A generic filesystem or shell.
- Direct GitHub API access.
- Plan approval or PR creation — those are UI/REST-only owner/admin actions to keep the approval gate outside coding-agent reach.

If you need broader capabilities in your coding-agent session, use the agent's own tools (Cursor's editor, Claude Code's file tools, etc.) alongside CodeAtlas. See the [protocol](protocol.md#security-boundary) doc for the full security rationale.
