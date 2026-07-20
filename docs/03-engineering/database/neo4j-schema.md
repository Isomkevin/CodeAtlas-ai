# Neo4j Schema

Version

1.0

---

# Labels

Repository

Workspace

Package

Service

Module

Component

API

Endpoint

Database

Table

Column

Queue

Event

Dependency

Infrastructure

Decision

Document

Diagram

User

Team

AIAgent

ImplementationPlan

Workflow

---

# Relationships

(:Repository)-[:CONTAINS]->(:Service)

(:Service)-[:CONTAINS]->(:Module)

(:Module)-[:CONTAINS]->(:Component)

(:Component)-[:IMPLEMENTS]->(:API)

(:Service)-[:USES]->(:Database)

(:Service)-[:PUBLISHES]->(:Event)

(:Service)-[:SUBSCRIBES_TO]->(:Event)

(:Service)-[:DEPENDS_ON]->(:Service)

(:Service)-[:DEPLOYS_TO]->(:Infrastructure)

(:Document)-[:DOCUMENTS]->(:Service)

(:Diagram)-[:VISUALIZES]->(:Architecture)

(:Decision)-[:AFFECTS]->(:Service)

(:User)-[:OWNS]->(:Repository)

(:Team)-[:MAINTAINS]->(:Service)

---

# Constraints

Repository.slug UNIQUE

Service.id UNIQUE

API.id UNIQUE

Database.id UNIQUE

Event.id UNIQUE

---

# Indexes

Repository.slug

Service.name

API.path

Table.name

Dependency.name

Event.name
