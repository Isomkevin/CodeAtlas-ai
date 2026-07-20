# docs/04-database/knowledge-graph-schema.md

# Knowledge Graph Schema

Version: 1.0

Status: Canonical

Owner: CodeAtlas

---

# Purpose

The Knowledge Graph is the canonical representation of every software system managed by CodeAtlas.

Unlike traditional documentation tools that store markdown files or diagrams as the primary artifact, CodeAtlas stores relationships.

Everything else is generated from the graph.

The graph powers:

• AI reasoning
• Architecture documentation
• Draw.io generation
• Mermaid generation
• C4 generation
• Dependency analysis
• Drift detection
• Architecture implementation
• Impact analysis
• Search
• Ownership discovery

---

# Storage Strategy

Operational Data

PostgreSQL

Relationship Data

Neo4j

Embeddings

pgvector

Search

OpenSearch (future)

---

# Graph Model

Every entity is represented as a Node.

Relationships describe interactions.

Nodes are immutable.

Relationships are versioned.

Historical snapshots remain queryable.

---

# Node Base Schema

Every node contains:

id (UUID)

type

name

slug

description

repository_id

version

created_at

updated_at

created_by

last_scan

confidence_score

metadata (JSON)

embedding_id

status

---

# Primary Node Types

Repository

Workspace

Package

Service

Domain

Bounded Context

Module

Component

API

Endpoint

Route

Database

Schema

Table

Column

Queue

Topic

Event

Function

Class

Interface

Enum

Configuration

Dependency

Infrastructure

Cloud Resource

Deployment

Pipeline

User

Team

Organization

Architecture Decision

Document

Diagram

Pull Request

Issue

Test Suite

Test Case

AI Agent

Prompt

Workflow

Implementation Plan

---

# Standard Relationships

CONTAINS

BELONGS_TO

USES

DEPENDS_ON

CALLS

IMPLEMENTS

EXPOSES

OWNS

GENERATES

DEPLOYS_TO

PUBLISHES

SUBSCRIBES_TO

CONNECTS_TO

READS

WRITES

AUTHENTICATES

AUTHORIZES

VALIDATES

TRIGGERS

REFERENCES

EXTENDS

IMPLEMENTS_INTERFACE

MIGRATES_TO

SUPERSEDES

VERSION_OF

---

# Graph Constraints

Repositories cannot depend on repositories.

Every Service belongs to exactly one Repository.

Every API belongs to exactly one Service.

Every Table belongs to exactly one Database.

Every Event has at least one Publisher.

Circular service dependencies generate warnings.

Duplicate nodes merge automatically.

---

# Versioning

Every graph update creates:

Graph Version

Repository Commit SHA

Timestamp

Author

Reason

Graph Diff

Rollback Point

---

# Query Examples

Show all services using Redis.

Show authentication flow.

Find all services affected by Billing.

List every public API.

Show deployment topology.

Generate sequence diagram.

Explain checkout process.

Find architecture drift.
