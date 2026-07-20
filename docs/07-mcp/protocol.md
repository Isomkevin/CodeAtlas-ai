# Model Context Protocol (MCP) Specification

Version: 1.0

Status

Canonical

Owner

CodeAtlas

---

# Overview

The Model Context Protocol (MCP) is the primary interface through which AI coding agents interact with CodeAtlas.

Rather than exposing repositories directly to AI assistants, CodeAtlas exposes architectural knowledge.

Every supported AI coding agent connects to the CodeAtlas MCP Server.

The MCP Server provides:

- Architecture Context
- Documentation
- Repository Intelligence
- Architecture Validation
- Code Generation Planning
- Diagram Generation
- Knowledge Graph Queries
- Drift Detection
- Implementation Workflows

This allows AI agents to reason from architecture instead of raw source code.

---

# Design Principles

Architecture First

The Architecture Graph is always consulted before repository analysis.

Structured Context

AI receives structured knowledge rather than entire repositories.

Deterministic Tools

Every tool returns structured JSON.

Stateless Requests

Each request is independent.

Security

Repositories never leave the customer's infrastructure.

Streaming

Long-running tasks stream progress.

Observability

Every MCP request is logged.

---

# Supported Clients

OpenAI Codex

Claude Code

Cursor

Gemini CLI

Windsurf

Continue.dev

VS Code

JetBrains

OpenAI Agents SDK

Future Support

Custom Enterprise Agents

---

# Resources

Architecture Graph

Repository Metadata

Repository Tree

Documentation

Architecture Decisions

Architecture Health

Diagrams

Knowledge Graph

Implementation Plans

Pull Requests

Repository History

Architecture Timeline

---

# Tool Categories

Repository Tools

Architecture Tools

Knowledge Graph Tools

Documentation Tools

Diagram Tools

Implementation Tools

Validation Tools

Search Tools

Planning Tools

Infrastructure Tools

GitHub Tools

Administration Tools

---

# Request Lifecycle

AI Agent

↓

MCP Server

↓

Authentication

↓

Authorization

↓

Context Builder

↓

Tool Execution

↓

Graph Update

↓

Streaming Response

↓

Audit Log

---

# Context Construction

Every request automatically includes

Repository

Architecture Graph

Architecture Decisions

Current Branch

Current Commit

User Permissions

Relevant Documentation

Relevant Services

Relevant APIs

Relevant Dependencies

This eliminates unnecessary prompt engineering.

---

# Response Format

Every response includes

Status

Confidence

Execution Time

Affected Nodes

Affected Services

Suggested Next Actions

Warnings

References

---

# Security

OAuth2

JWT

Role-Based Access Control

Repository Isolation

Audit Logging

Approval Workflows

Encrypted Storage

Secrets Management

---

# Extensibility

Organizations may register custom MCP tools.

Example

Security Scanner

Cloud Cost Analyzer

Internal Architecture Validator

Compliance Checker

Performance Analyzer

---

# Future

Distributed MCP Clusters

Federated Architecture Graphs

Cross Organization Architecture

Multi Repository Queries

Real Time Collaboration

Persistent Agent Sessions