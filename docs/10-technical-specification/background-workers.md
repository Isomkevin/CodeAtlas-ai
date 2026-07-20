# Background Workers

Worker 1

Repository Scanner

Runs

Immediately after repository sync.

Responsibilities

Clone.

Fetch.

Parse.

Update Graph.

---

Worker 2

Documentation Generator

Runs

After architecture changes.

Responsibilities

Generate docs.

Update README.

Generate ADRs.

---

Worker 3

Diagram Generator

Runs

After documentation generation.

Responsibilities

Generate Mermaid.

Generate Draw.io.

Generate C4.

---

Worker 4

Embedding Generator

Runs

After graph updates.

Responsibilities

Generate embeddings.

Store vectors.

Update semantic search.

---

Worker 5

Architecture Drift

Runs

Nightly.

Responsibilities

Compare architecture against repository.

Generate drift report.

---

Worker 6

Health Analyzer

Runs

Daily.

Responsibilities

Complexity.

Dependencies.

Ownership.

Risk.

Architecture score.

---

Worker 7

Repository Cleanup

Runs

Weekly.

Responsibilities

Archive old snapshots.

Optimize graph.

Cleanup temporary data.