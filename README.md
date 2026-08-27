# Rapidity

A relativistic interstellar spacecraft operations simulator. You do not fly a ship
through 3D space — you operate one, by reading instruments, setting parameters,
planning burn profiles and responding to faults.

**Accessibility is a primary design constraint, not a feature.** Where accessibility
and any other goal conflict, accessibility wins.

Status: **scaffold**. No implementation yet. See [ROADMAP.md](ROADMAP.md).

## Documents

Read these before changing anything. They are authoritative; code that disagrees with
them is wrong.

| Document | What it settles |
| --- | --- |
| [SPEC.md](SPEC.md) | What the game is, v1 scope, player-facing conventions |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Stack, package graph, save format, rendering rules |
| [PHYSICS.md](PHYSICS.md) | Rapidity propagation, reference cases, constants, invariants |
| [ACCESSIBILITY.md](ACCESSIBILITY.md) | Binding accessibility contract and its four enforcement tiers |
| [CLAUDE.md](CLAUDE.md) | Non-negotiable invariants and working conventions |

## Layout

```
packages/units       @rapidity/units      zero deps
packages/physics     @rapidity/physics    → units
packages/protocol    @rapidity/protocol   → units
packages/sim         @rapidity/sim        → physics, protocol
packages/panel       @rapidity/panel      → protocol
packages/audio       @rapidity/audio      → protocol
packages/catalog     @rapidity/catalog    → units
apps/proofing-flight                      → all
tools/catalog-etl                         Python, uv, outside the workspace
```

`@rapidity/panel` and `@rapidity/audio` must never depend on `@rapidity/sim`. They
bind to `@rapidity/protocol` only. This is the accessibility boundary made structural,
and `dependency-cruiser` enforces it as a blocking check. See ARCHITECTURE.md §2.1.

## Getting started

```
pnpm install
pnpm test
```

`pnpm install` fetches a Chromium build for the Tier 2 accessibility gate. Set
`RAPIDITY_SKIP_BROWSER_INSTALL=1` to skip it.

## Commands

| Command | What it does | Gate |
| --- | --- | --- |
| `pnpm test` | vitest, all packages | Blocking |
| `pnpm test:property` | fast-check physics invariants | Blocking |
| `pnpm typecheck` | `tsc -b` across the project references, plus test files | Blocking |
| `pnpm lint:schema` | Tier 1 — every telemetry has `label`, `shortLabel`, `spoken`; every alert has `tier`, `text`, `response` | Blocking |
| `pnpm lint:a11y` | Tier 2 — axe-core plus 320 px reflow | Blocking |
| `pnpm lint:deps` | dependency-cruiser package boundary check | Blocking |
| `pnpm test:sr` | Tier 3 — guidepup screen-reader automation | Nightly, non-blocking |
| `pnpm build` | `tsc -b` | — |

`pnpm dev` is not wired yet — there is nothing to serve until the app shell lands in
Phase 2.

## Licensing

Code is Apache-2.0. The derived star catalog is CC BY-SA 4.0 and ships as its own
artifact. See [LICENSES/](LICENSES/) and [CITATIONS](CITATIONS).
