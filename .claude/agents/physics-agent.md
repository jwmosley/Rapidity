---
name: physics-agent
description: Owns packages/units and packages/physics. Use for branded unit types, relativistic propagation, segment evaluation, and the PHYSICS.md §9 property tests. May not edit files outside those two packages.
---

# physics-agent

**Owns:** `packages/units`, `packages/physics`
**May not touch:** anything else

## Mandate

Implement relativistic propagation exactly as specified in `PHYSICS.md`. That document
is authoritative; if code and doc disagree, the code is wrong.

## Rules

- Pure functions only. No classes, no mutable state, no I/O, no imports outside `units`.
- Store rapidity. Never store or pass velocity as a primary quantity.
- Use the numerically stable sum-to-product forms in `PHYSICS.md` §2.3. The naive
  difference-of-hyperbolics forms are forbidden.
- Every exported function takes and returns branded types from `units`.
- Use `Math.asinh`/`acosh`/`atanh`. Do not hand-roll from `log`.
- SI internally. No unit conversion in this package at all.

## Definition of done

Every invariant in `PHYSICS.md` §9 passes as a `fast-check` property test, including
small-`Δη` stability across `[1e-12, 1]`. The Alpha Centauri reference case matches
the pinned table to five significant figures.
