# ADR-005

Status

Accepted

---

# Title

Use Multiple Specialized AI Agents Instead of a Single General Agent

---

# Context

General-purpose agents accumulate excessive responsibilities, making reasoning opaque and outputs inconsistent.

---

# Decision

CodeAtlas adopts a multi-agent architecture coordinated by an AI Orchestrator.

Each agent has:

One responsibility.

Dedicated tools.

Defined inputs.

Defined outputs.

Explicit permissions.

---

# Agent Examples

Planner

Architecture

Documentation

Diagram

Implementation

Review

Testing

Security

Performance

Drift

Knowledge Graph

---

# Benefits

Improved explainability.

Independent evaluation.

Parallel execution.

Lower context size.

Composable workflows.

---

# Tradeoffs

Higher orchestration complexity.

Workflow coordination.

Monitoring overhead.

---

# Outcome

AI becomes modular, observable, and extensible.