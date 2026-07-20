# Domain Events

Every important business action emits an event.

Events are immutable.

Events are replayable.

Events are observable.

---

Repository Events

RepositoryImported

RepositoryUpdated

RepositorySynced

RepositoryDeleted

RepositoryScanStarted

RepositoryScanCompleted

---

Architecture Events

ArchitectureGenerated

ArchitectureUpdated

ArchitectureValidated

ArchitectureDiffGenerated

ArchitectureDriftDetected

---

Graph Events

GraphCreated

GraphUpdated

GraphMerged

GraphVersionCreated

---

Documentation Events

DocumentationGenerated

ReadmeGenerated

ADRGenerated

RunbookGenerated

---

Diagram Events

DrawIOGenerated

MermaidGenerated

PlantUMLGenerated

DeploymentDiagramGenerated

ERDGenerated

---

AI Events

TaskStarted

TaskCompleted

TaskFailed

ContextBuilt

ReasoningCompleted

---

Implementation Events

PlanGenerated

ImplementationStarted

ImplementationFinished

ImplementationFailed

TestsGenerated

TestsPassed

TestsFailed

PullRequestGenerated

---

Git Events

BranchCreated

CommitCreated

PullRequestCreated

ReviewCompleted

MergeCompleted

---

Security Events

LoginSucceeded

LoginFailed

PermissionDenied

APIKeyCreated

OrganizationCreated