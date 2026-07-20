# Event Contracts

Version

1.0

---

# Event Format

Every event uses the same envelope.

{
  event_id

  event_name

  event_version

  occurred_at

  producer

  repository_id

  correlation_id

  payload
}

---

# RepositoryImported

Payload

repository_id

organization_id

branch

commit_sha

---

# ArchitectureGenerated

Payload

repository_id

graph_version

services

modules

components

---

# DocumentationGenerated

Payload

repository_id

documents

checksum

---

# DiagramGenerated

Payload

repository_id

diagram_type

diagram_version

---

# ImplementationCompleted

Payload

repository_id

implementation_id

pull_request

tests_passed

coverage
