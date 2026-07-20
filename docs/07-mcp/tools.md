# MCP Tool Registry

Every tool is versioned.

Every tool is discoverable.

Every tool is deterministic.

---

# Repository Tools

scan_repository

Synchronize repository.

Arguments

Repository

Branch

Incremental

Returns

Repository Summary

Architecture Summary

Health

---

get_repository

Returns repository metadata.

---

list_repositories

Returns repositories accessible by current user.

---

# Architecture Tools

generate_architecture

Infer architecture graph.

Returns

Graph Version

Services

Domains

Dependencies

---

get_architecture

Returns canonical architecture.

---

update_architecture

Modify architecture after approval.

---

compare_architectures

Compare graph versions.

---

generate_sequence

Generate sequence diagram.

---

generate_c4

Generate C4 diagrams.

---

generate_component_diagram

Generate component diagram.

---

generate_deployment

Generate deployment diagram.

---

# Documentation Tools

generate_readme

generate_docs

generate_runbook

generate_adr

generate_api_docs

update_docs

---

# Knowledge Graph

graph_query

Accepts Cypher-like queries.

---

graph_search

Semantic search.

---

graph_neighbors

Relationship traversal.

---

graph_dependencies

Dependency analysis.

---

graph_impact

Impact analysis.

---

graph_timeline

Historical evolution.

---

# AI Planning

create_plan

Break work into milestones.

---

estimate_effort

Engineering estimation.

---

suggest_refactor

Architecture improvements.

---

generate_tasks

Implementation backlog.

---

# Implementation

implement_feature

Generate production code.

---

implement_service

Generate service.

---

implement_api

Generate endpoints.

---

implement_database

Generate migrations.

---

implement_tests

Generate testing suite.

---

implement_infrastructure

Generate Terraform

Docker

Helm

Kubernetes

---

generate_pull_request

Creates PR.

---

# Validation

validate_architecture

Detect violations.

---

validate_dependencies

---

validate_security

---

validate_performance

---

validate_documentation

---

# Search

find_service

find_api

find_dependency

find_owner

find_decision

find_component

---

# GitHub

create_branch

commit

push

create_pr

review_pr

merge_pr

---

# Enterprise

architecture_score

technical_debt

risk_analysis

engineering_health

compliance_report