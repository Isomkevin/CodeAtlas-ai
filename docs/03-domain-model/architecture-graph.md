# Architecture Graph Specification

Version: 1.0

Status: Canonical Domain Model

Owner: LESOM Dynamics

Project: CodeAtlas

---

# Purpose

The Architecture Graph is the canonical representation of every software system managed by CodeAtlas.

Every feature within CodeAtlas—including documentation generation, architecture visualization, AI reasoning, implementation planning, architecture validation, and code generation—is derived from this graph.

The Architecture Graph is the single source of truth.

Documentation is generated from the graph.

Diagrams are generated from the graph.

AI reasons over the graph.

Implementation plans are generated from the graph.

The graph is never manually edited.

It is continuously synchronized from repository analysis and approved architectural decisions.

---

# Guiding Principles

Architecture is Data.

Architecture is Versioned.

Architecture is Explainable.

Architecture is Queryable.

Architecture is Executable.

Architecture is Observable.

---

# Graph Database

Primary Database

Neo4j

Future Support

Amazon Neptune

Memgraph

Azure Cosmos Graph

---

# Graph Structure

The Architecture Graph consists of Nodes and Relationships.

Nodes represent entities.

Relationships represent interactions.

Every node has:

- Unique UUID
- Type
- Name
- Metadata
- Source
- Confidence Score
- Version
- Repository
- Last Updated Timestamp

---

# Node Types

## Repository

Represents a software repository.

Properties

Repository ID

Name

Description

Provider

Branch

Visibility

Owner

Created

Updated

---

## Service

Represents an independently deployable service.

Examples

Authentication Service

Payments Service

Notification Service

Gateway

Properties

Language

Framework

Runtime

Deployment Target

Owner

Health Score

Documentation

---

## Module

Represents an internal module.

Examples

Billing

Users

Orders

Inventory

AI

Analytics

---

## Component

Logical software component.

Examples

Controllers

Repositories

Workers

Schedulers

Validators

---

## API

Represents an exposed interface.

Types

REST

GraphQL

gRPC

MCP

WebSocket

Properties

Path

Method

Authentication

Version

Deprecation Status

---

## Database

Represents persistent storage.

Examples

PostgreSQL

MongoDB

Redis

Neo4j

SQLite

Properties

Engine

Version

Cluster

Owner

---

## Table

Represents database schema.

Properties

Columns

Indexes

Relationships

Primary Keys

Foreign Keys

---

## Queue

Examples

Kafka

RabbitMQ

Redis Streams

SQS

---

## Event

Examples

UserCreated

InvoicePaid

RepositoryScanned

DocumentationGenerated

ArchitectureUpdated

---

## File

Represents source files.

Properties

Path

Language

Hash

Size

---

## Directory

Represents folders.

---

## Class

Represents language classes.

---

## Interface

Represents contracts.

---

## Function

Represents callable units.

---

## Dependency

External library.

Examples

FastAPI

React

OpenAI

Tailwind

---

## Infrastructure

Examples

Docker

Kubernetes

Terraform

AWS Lambda

Cloud Run

---

## User

Represents repository members.

---

## Team

Represents engineering teams.

---

## Decision

Architecture Decision Record.

Examples

ADR-001

Use Neo4j

ADR-002

Event Driven Architecture

---

## Documentation

Represents generated documents.

Examples

README

Architecture Guide

API Docs

Runbook

---

## Diagram

Represents generated diagrams.

Examples

C4

Draw.io

Mermaid

Deployment

ERD

---

## AI Agent

Represents autonomous agents.

Examples

Architecture Agent

Planner Agent

Implementation Agent

Review Agent

Documentation Agent

Diagram Agent

---

# Relationship Types

Every relationship is directional.

## DEPENDS_ON

Service → Database

Module → Module

Component → Component

---

## IMPLEMENTS

Service → Interface

Component → API

---

## CALLS

Service → Service

API → API

Function → Function

---

## OWNS

Team → Service

User → Repository

---

## USES

Service → Dependency

Service → Database

Service → Queue

---

## PUBLISHES

Service → Event

---

## SUBSCRIBES_TO

Service → Event

---

## GENERATES

Agent → Documentation

Agent → Diagram

Agent → Code

---

## DEPLOYS_TO

Service → Infrastructure

---

## STORES

Database → Table

---

## CONTAINS

Repository → Service

Service → Module

Module → Component

Directory → File

---

## MODIFIES

Pull Request → Node

---

## CREATED_BY

Node → User

---

## APPROVED_BY

Decision → User

---

# Metadata

Every node stores

UUID

Type

Name

Description

Source

Confidence Score

Embedding ID

Repository ID

Version

Created At

Updated At

Last Scan

Tags

Labels

Owner

---

# Confidence Scoring

Every inferred node receives a confidence score.

100%

Explicitly defined.

90%

Strong inference.

75%

Probable.

50%

Weak inference.

Below 50%

Requires human validation.

---

# Versioning

Architecture Graphs are immutable snapshots.

Every repository scan creates:

Graph Version

Timestamp

Commit SHA

Branch

Author

Reason

Previous versions remain queryable.

---

# Query Examples

Examples of supported AI queries.

"What services depend on PostgreSQL?"

"What breaks if Payments is unavailable?"

"Which APIs are public?"

"Which services publish events?"

"Which components violate layering?"

"Show authentication flow."

"Explain onboarding."

"Generate deployment diagram."

"Generate sequence diagram."

---

# AI Reasoning

AI never reasons directly over raw source code.

Instead

Repository

↓

Source Graph

↓

Architecture Graph

↓

Reasoning Context

↓

Response

This dramatically reduces hallucinations.

---

# Graph Lifecycle

Repository Connected

↓

Repository Indexed

↓

AST Parsed

↓

Source Graph Built

↓

Architecture Graph Generated

↓

Knowledge Graph Updated

↓

Embeddings Updated

↓

Documentation Generated

↓

Diagrams Generated

↓

Repository Ready

---

# Graph Integrity Rules

No orphan nodes.

Every Service belongs to a Repository.

Every API belongs to a Service.

Every Table belongs to a Database.

Every Component belongs to a Module.

Every Module belongs to a Service.

Every Event has at least one Publisher.

Relationships are directional.

Circular dependencies generate warnings.

Duplicate nodes are merged.

Conflicting nodes require approval.

---

# Future Extensions

Business Capability Mapping

Organization Charts

Incident Correlation

Observability

Tracing

Production Metrics

Security Graph

Compliance Graph

Cloud Cost Graph

Threat Modeling

Infrastructure Drift

Multi-Repository Graph

Enterprise Knowledge Graph

Cross-Organization Reasoning

Digital Twin of Enterprise Software