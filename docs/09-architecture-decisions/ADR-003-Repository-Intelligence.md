# ADR-003

Status

Accepted

---

# Title

Repository Intelligence Precedes AI

---

# Context

Many AI coding assistants analyze repositories by sending source files directly to an LLM.

This is expensive, slow, and susceptible to hallucinations.

---

# Decision

Repository parsing must always occur before AI reasoning.

The processing pipeline is:

Repository

↓

AST

↓

Source Graph

↓

Architecture Graph

↓

AI

---

# Benefits

Deterministic parsing.

Lower token usage.

Higher accuracy.

Language independence.

Reduced hallucinations.

---

# Consequences

More engineering effort.

Requires parsers for each language.

---

# Outcome

AI becomes a reasoning layer rather than a parsing layer.