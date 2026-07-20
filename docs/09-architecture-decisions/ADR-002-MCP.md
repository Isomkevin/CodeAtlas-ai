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

All AI interactions will be exposed through MCP.

The MCP server becomes the primary external interface.

REST APIs remain available for frontend and integrations.

---

# Benefits

Vendor neutral.

Future proof.

Supports Codex.

Supports Cursor.

Supports Claude Code.

Supports Gemini CLI.

Supports OpenAI Agents.

Supports enterprise AI systems.

---

# Tradeoffs

Additional protocol layer.

Need to version MCP tools.

Need strict permission controls.

---

# Result

Every AI coding assistant can consume architectural intelligence without platform-specific integrations.