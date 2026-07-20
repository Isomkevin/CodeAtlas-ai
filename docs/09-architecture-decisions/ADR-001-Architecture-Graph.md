# ADR-001

Status

Accepted

Date

2026-07-20

Owner

CodeAtlas Architecture Team

---

# Title

The Architecture Graph is the Canonical Source of Truth

---

# Context

Traditional documentation systems store information as markdown documents.

Diagramming systems store XML.

Repository tools store Git metadata.

AI assistants read source code directly.

Each representation eventually diverges.

Developers lose confidence in documentation because it no longer reflects reality.

We require a single canonical representation from which every artifact can be generated.

---

# Decision

CodeAtlas will store architecture as a property graph.

The graph—not markdown, diagrams, or AI memory—is the authoritative representation of software architecture.

All downstream artifacts must be derived from the graph.

Examples include:

Documentation

Architecture Diagrams

AI Context

Architecture Reviews

Implementation Plans

Dependency Reports

Impact Analysis

Architecture Drift Reports

---

# Consequences

Benefits

Single source of truth.

Automatic synchronization.

Rich relationship traversal.

AI reasoning.

Historical versioning.

Graph analytics.

Tradeoffs

Requires graph database expertise.

Additional synchronization layer.

Initial repository indexing complexity.

---

# Alternatives Considered

Markdown-first documentation.

Rejected.

Documentation becomes stale.

Diagram-first architecture.

Rejected.

Diagrams cannot express semantic relationships.

LLM memory only.

Rejected.

LLMs are not persistent knowledge stores.

---

# Outcome

The Architecture Graph becomes the foundation of every subsystem.