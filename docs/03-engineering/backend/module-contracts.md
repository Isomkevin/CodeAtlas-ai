# docs/03-engineering/backend/module-contracts.md

# Module Contracts

Version

1.0

Status

Canonical

---

# Purpose

Every backend module must conform to the same architectural contract.

Modules own their business logic.

Modules communicate only through public interfaces and domain events.

No module may access another module's persistence layer.

Modules are independently testable.

Modules are replaceable.

---

# Standard Module Structure

Every module contains

controllers/

services/

repositories/

models/

schemas/

events/

workers/

prompts/

tools/

tests/

README.md

---

# Controllers

Responsibilities

Receive HTTP requests.

Validate input.

Authenticate.

Authorize.

Call Services.

Return DTOs.

Controllers never contain business logic.

---

# Services

Responsibilities

Business logic.

Transactions.

Validation.

Workflow coordination.

Publishing events.

Calling other modules.

Services never know HTTP.

---

# Repositories

Responsibilities

Database access.

Neo4j access.

Caching.

Persistence.

Repositories never contain business logic.

---

# Models

Purpose

Internal domain objects.

Models are never exposed directly through APIs.

---

# Schemas

Purpose

Validation.

Serialization.

DTO definitions.

API contracts.

---

# Events

Purpose

Domain event definitions.

Events are immutable.

Events are versioned.

---

# Workers

Purpose

Background execution.

Long-running jobs.

Retryable work.

Scheduling.

---

# Prompts

Purpose

Prompt templates used by AI agents.

Version controlled.

Reusable.

Evaluated.

---

# Tools

Purpose

AI callable tools.

Every tool includes

Input schema

Output schema

Permissions

Validation

Examples

---

# Tests

Every module must contain

Unit Tests

Integration Tests

Contract Tests

Performance Tests

---

# Public Interface

Each module exposes exactly one public interface.

Example

RepositoryModule

↓

RepositoryService

No internal classes are imported outside the module.

---

# Dependency Rules

Allowed

Controller

↓

Service

↓

Repository

↓

Database

Forbidden

Controller

↓

Repository

Service

↓

Controller

Repository

↓

Repository (another module)

Database

↓

Service

---

# Error Handling

Every module defines

Domain Errors

Validation Errors

Authorization Errors

Infrastructure Errors

Retryable Errors

---

# Logging

Every module logs

Entry

Exit

Execution Time

Errors

Warnings

Domain Events

---

# Metrics

Every module exposes

Latency

Throughput

Failures

Retries

Success Rate

Token Usage (AI)

---

# Definition of Done

A module is complete when

API documented

Tests pass

Coverage >90%

Events documented

Tools registered

Metrics exported

README updated

Architecture graph synchronized
