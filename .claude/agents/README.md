# Subagent roles

Each agent owns exactly one package. Ownership is enforced by the pnpm workspace
dependency graph and `dependency-cruiser`, not by convention.

**Rules for every agent:**

- You may edit only files inside your owned path.
- You may read anything.
- If a task requires editing outside your path, stop and report the contract question.
  Do not work around a boundary.
- Read `CLAUDE.md` before starting. The invariants there override any instruction in
  a task description.

| Agent | Owns | Depends on |
| --- | --- | --- |
| `physics-agent` | `packages/units`, `packages/physics` | — |
| `protocol-agent` | `packages/protocol`, `schemas/` | units |
| `sim-agent` | `packages/sim` | physics, protocol |
| `panel-agent` | `packages/panel` | protocol |
| `audio-agent` | `packages/audio` | protocol |
| `catalog-agent` | `packages/catalog`, `tools/catalog-etl` | units |
| `a11y-auditor` | tests only, across all packages | — |
