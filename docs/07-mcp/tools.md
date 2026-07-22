# CodeAtlas MCP tool registry

Only the following tools are currently exposed by `app.mcp_server`.

## `get_architecture_graph`

Returns the canonical graph for a connected repository.

```json
{
  "repository_id": "<repository-uuid>"
}
```

The result includes the selected graph version, graph nodes, and graph edges. It does not include raw source files.

## `create_implementation_plan`

Creates a graph-bound draft implementation plan.

```json
{
  "repository_id": "<repository-uuid>",
  "change_request": "Add an audit trail to workspace settings.",
  "graph_version_id": "<optional-graph-version-uuid>"
}
```

The API uses the latest ready graph when `graph_version_id` is omitted. Creating a plan does not grant a coding agent authority to open a pull request; owner or admin approval remains required.
