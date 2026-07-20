# Dependency Rules

Architecture Principle

Dependencies always point inward.

---

Allowed

API

↓

Application

↓

Domain

↓

Infrastructure

---

Forbidden

Infrastructure

↓

API

Database

↓

Controllers

Workers

↓

Controllers

Repositories

↓

HTTP

---

Module Communication

Module A

↓

Public Service Interface

↓

Module B

Never

Import internal classes.

Import repositories.

Share database models.

---

Cross Module Rules

Every cross-module call must

Use DTOs.

Emit events when state changes.

Respect ownership boundaries.

Be observable.

Be testable.

---

Architecture Validation

During CI

Detect forbidden imports.

Detect circular dependencies.

Detect orphan modules.

Detect undocumented modules.

Fail build on violations.
