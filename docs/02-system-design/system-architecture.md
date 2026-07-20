# System Architecture

Version: 1.0

Status: Canonical Architecture

Owner: LESOM Dynamics

Project: CodeAtlas

---

# Purpose

This document defines the complete technical architecture of CodeAtlas.

It is the single source of truth for the platform's architecture.

Any implementation that contradicts this document is considered incorrect unless this document is updated first.

---

# Architecture Philosophy

CodeAtlas is built around one central idea:

> Architecture is data.

Everything else—including diagrams, documentation, AI reasoning, and generated code—is derived from that data.

Unlike traditional tools where documentation is the source of truth, CodeAtlas stores architecture as a continuously evolving knowledge graph.

Every service interacts with this graph.

---

# High-Level Architecture

```
                           +----------------------+
                           |      Web Client      |
                           | Next.js + React      |
                           +----------+-----------+
                                      |
                                      |
                           HTTPS / WebSocket
                                      |
                                      |
                    +-----------------v-----------------+
                    |          API Gateway              |
                    +-----------------+-----------------+
                                      |
                +---------------------+----------------------+
                |                     |                      |
                |                     |                      |
     +----------v-------+   +---------v--------+   +---------v--------+
     | Repository Engine|   | AI Orchestrator  |   | User Management  |
     +----------+-------+   +---------+--------+   +---------+--------+
                |                     |                      |
                |                     |                      |
     +----------v---------------------v----------------------v------+
     |                 Architecture Graph Engine                   |
     +----------+--------------------+-----------------------------+
                |
     +----------v-----------+
     | Graph Database       |
     | Neo4j                |
     +----------+-----------+
                |
     +----------v----------------+
     | Documentation Engine      |
     +----------+----------------+
                |
     +----------v----------------+
     | Diagram Engine            |
     +----------+----------------+
                |
     +----------v----------------+
     | MCP Server                |
     +---------------------------+
```

---

# Core Platform Components

CodeAtlas consists of twelve primary subsystems.

## 1. Web Platform

Responsibilities

- User authentication
- Repository management
- Interactive architecture graph
- Documentation viewer
- Diagram viewer
- AI Chat
- Implementation console
- Settings

Technology

- Next.js
- React
- TypeScript
- TailwindCSS

---

## 2. API Gateway

Responsibilities

Authentication

Authorization

Rate limiting

Routing

Audit logging

Streaming responses

Technology

FastAPI

---

## 3. Repository Intelligence Engine

Purpose

Understand repositories.

Responsibilities

Clone repositories.

Incrementally synchronize repositories.

Read Git history.

Read branches.

Read commits.

Parse files.

Parse dependencies.

Detect programming languages.

Detect frameworks.

Detect build systems.

Detect infrastructure.

Outputs

Repository Model

---

## 4. Source Intelligence Engine

Purpose

Convert source code into structured knowledge.

Responsibilities

AST Parsing

Dependency Analysis

Import Analysis

Function Discovery

API Discovery

Class Discovery

Database Discovery

Infrastructure Discovery

Configuration Discovery

Outputs

Source Graph

---

## 5. Architecture Graph Engine

Purpose

Convert source graph into architecture.

Responsibilities

Infer Services

Infer Components

Infer Domains

Infer Layers

Infer Events

Infer APIs

Infer Databases

Infer Dependencies

Infer Infrastructure

Outputs

Architecture Graph

This graph becomes the source of truth.

---

## 6. AI Orchestrator

Purpose

Coordinate AI agents.

Responsibilities

Task planning.

Context construction.

Tool selection.

Memory retrieval.

Prompt optimization.

Streaming.

Fallback routing.

Agent collaboration.

---

## 7. Knowledge Graph

Purpose

Persist architectural knowledge.

Stores

Repositories

Services

Components

Functions

Endpoints

Infrastructure

Queues

Events

Databases

Users

Ownership

Documentation

Architecture Decisions

Dependencies

Supports

Version history

Reasoning

Search

Similarity

Temporal analysis

---

## 8. Documentation Engine

Purpose

Generate documentation continuously.

Outputs

README

Architecture docs

API docs

Developer docs

Runbooks

Onboarding

ADRs

Sequence explanations

Migration plans

Documentation is regenerated automatically.

---

## 9. Diagram Engine

Purpose

Generate visual architecture.

Supported Formats

Draw.io

Mermaid

PlantUML

C4

Sequence

Deployment

Infrastructure

ERD

Component

Container

Diagrams are generated from the Architecture Graph.

Never manually edited.

---

## 10. Drift Detection Engine

Purpose

Detect divergence.

Compares

Architecture Graph

vs

Current Repository

Outputs

Violations

Risk score

Recommendations

Pull Requests

---

## 11. Implementation Engine

Purpose

Turn architecture into code.

Capabilities

Generate services

Generate APIs

Generate tests

Generate Terraform

Generate Kubernetes

Generate CI

Generate documentation

Generate migrations

Generate pull requests

---

## 12. MCP Server

Purpose

Expose CodeAtlas capabilities to AI coding agents.

Supported Clients

OpenAI Codex

Claude Code

Cursor

Gemini CLI

Windsurf

OpenAI Agents

VS Code

JetBrains

---

# Event Flow

Repository Connected

↓

Repository cloned

↓

Repository indexed

↓

AST parsed

↓

Dependency graph generated

↓

Architecture inferred

↓

Knowledge graph updated

↓

Documentation regenerated

↓

Diagrams regenerated

↓

Embeddings refreshed

↓

AI ready

---

# Architectural Principles

Single Source of Truth

Architecture Graph is canonical.

Stateless Services

Every service can scale horizontally.

Event Driven

Services communicate through events.

AI Native

Every subsystem is designed to collaborate with AI.

Deterministic Parsing

Inference is deterministic whenever possible.

Human Approval

AI never performs destructive actions automatically.

---

# Technology Stack

Frontend

Next.js

React

TailwindCSS

TypeScript

Backend

FastAPI

Python

Graph

Neo4j

Database

PostgreSQL

Queue

Redis Streams

Storage

S3 Compatible Storage

Authentication

GitHub OAuth

Google OAuth

OpenAI Auth (future)

Infrastructure

Docker

Kubernetes

GitHub Actions

Cloud

AWS

Azure

GCP

AI

OpenAI Responses API

OpenAI Agents SDK

Embeddings API

---

# Scalability Targets

Repositories

Unlimited

Files

10 Million+

Users

Enterprise Ready

Concurrent AI Tasks

10,000+

Graph Nodes

100 Million+

---

# Design Principles

Architecture over Documentation.

Knowledge Graph over Files.

Reasoning over Retrieval.

Events over Polling.

Contracts over Convention.

AI Collaboration over Automation.

Transparency over Black Boxes.

---

# Definition of Success

If a developer asks,

"How does this system work?"

CodeAtlas should answer accurately without reading the repository again.

If an AI coding agent asks,

"What should I implement?"

CodeAtlas should provide architectural context, constraints, affected systems, implementation guidance, and validation criteria before code generation begins.