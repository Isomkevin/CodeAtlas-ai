# ADR-002

Status

Accepted

---

# Title

Expose Platform Capabilities Through Model Context Protocol

---

# Context

Modern AI development environments increasingly communicate using MCP.

Supporting proprietary integrations for every IDE would create unnecessary maintenance burden.

---

# Decision

CodeAtlas exposes a deliberately narrow architecture-intelligence interface through MCP over local stdio. The implemented bridge provides `get_architecture_graph` and `create_implementation_plan`, with a tenant-scoped API token and the same repository authorization as the HTTP API.

The first supported configuration targets are Cursor, Claude Desktop, Claude Code, and OpenClaw. The bridge does not expose a checkout, raw source, shell, or unrestricted GitHub access.

REST remains the primary application interface. Additional MCP tools are added only when their API authorization, data boundary, approval path, and tests are in place.

---

# Benefits

Vendor neutral.

Future proof.

Supports Cursor.

Supports Claude Desktop and Claude Code.

Supports OpenClaw.

Provides a vendor-neutral integration path for future MCP clients.

---

# Tradeoffs

Additional protocol layer.

Need to version MCP tools.

Need strict permission controls.

---

# Result

MCP-capable clients can consume an authorized workspace's architecture graph and create approval-gated plans without platform-specific integrations or repository source exposure.
