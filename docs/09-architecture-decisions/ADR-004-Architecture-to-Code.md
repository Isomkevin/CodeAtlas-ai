# ADR-004

Status

Accepted

---

# Title

Architecture Changes Drive Code Generation

---

# Context

Current AI coding tools generate implementation directly from prompts.

Architectural intent is often lost.

---

# Decision

Implementation begins with architecture.

Users modify architecture.

The implementation engine generates the required code.

Architecture always precedes implementation.

---

# Example

Instead of

"Create a Payment Service."

Users express

"Split Payments into Billing and Settlement."

CodeAtlas generates

Implementation Plan

Database Changes

Events

Tests

Infrastructure

Documentation

Pull Request

---

# Consequences

Higher consistency.

Predictable architecture.

Reduced drift.

Improved governance.

---

# Outcome

Architecture becomes executable.