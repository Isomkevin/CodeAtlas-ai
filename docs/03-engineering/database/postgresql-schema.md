# PostgreSQL Database Specification

Version

1.0

Status

Canonical

Owner

CodeAtlas

---

# Purpose

PostgreSQL stores all operational data.

Neo4j stores relationships.

PostgreSQL stores business entities.

Every table must be normalized to at least Third Normal Form (3NF).

UUIDs are used as primary keys.

Soft deletion is preferred over hard deletion.

Every table includes audit fields.

---

# Common Columns

Every table contains

id UUID PRIMARY KEY

created_at TIMESTAMP

updated_at TIMESTAMP

created_by UUID

updated_by UUID

deleted_at TIMESTAMP NULL

version INTEGER

---

# organizations

Purpose

Tenant isolation.

Columns

id

name

slug

plan

status

owner_id

settings JSONB

Indexes

slug UNIQUE

owner_id

---

# users

Columns

id

organization_id

email

username

avatar_url

display_name

role

status

last_login

Indexes

email UNIQUE

organization_id

---

# repositories

Columns

id

organization_id

github_repository_id

name

slug

description

default_branch

language

visibility

status

last_scan

architecture_version

Indexes

organization_id

slug

github_repository_id

---

# branches

Columns

repository_id

name

is_default

latest_commit_sha

last_synced

---

# commits

Columns

repository_id

branch_id

sha

author

message

committed_at

---

# architecture_versions

Columns

repository_id

commit_sha

graph_version

summary

generated_at

status

---

# documentation

Columns

repository_id

type

title

path

content

checksum

generated_by

version

---

# diagrams

Columns

repository_id

type

format

storage_path

graph_version

checksum

---

# implementation_plans

Columns

repository_id

title

status

requested_by

approved_by

plan JSONB

---

# ai_sessions

Columns

repository_id

user_id

session_type

started_at

ended_at

model

token_usage

---

# tasks

Columns

implementation_plan_id

title

status

priority

assigned_agent

estimated_minutes

completed_at

---

# pull_requests

Columns

repository_id

provider

provider_id

branch

status

merged_at

---

# Audit Requirements

Every mutation creates

Audit Log

User

Timestamp

Previous Value

New Value

Reason
