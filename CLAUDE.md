# CLAUDE.md — Rapidity

Project instructions for Claude Code. Read `SPEC.md`, `ARCHITECTURE.md`,
`PHYSICS.md`, and `ACCESSIBILITY.md` before making changes.

## What this project is

A relativistic interstellar spacecraft operations simulator. The interface is the
game — instruments, not viewports. Accessibility is a primary constraint, not a
feature.

## Non-negotiable invariants

Violating any of these is a bug regardless of whether tests pass.

1. **`@rapidity/panel` and `@rapidity/audio` must never import `@rapidity/sim`.**
   They bind to `@rapidity/protocol` only. This is the accessibility boundary made
   structural. `dependency-cruiser` enforces it.
2. **No canvas for instruments.** SVG and DOM only. Canvas is permitted for the
   decorative starfield, which carries no information.
3. **Every telemetry definition carries `label`, `shortLabel`, `spoken`. Every alert
   carries `tier`, `text`, `response.`** Schema lint blocks the build otherwise.
4. **SI units internally, everywhere.** Conversion happens only at the display
   boundary.
5. **Store rapidity, never velocity.** See `PHYSICS.md` §1.
6. **Nothing is numerically integrated.** All propagation is closed form.
7. **First-party module namespace is `core:`, never `rapidity:`.** The project name
   appears in the npm scope, repo name, and PWA manifest, and nowhere else. Never in
   a durable identifier.
8. **All fiction lives in string catalogs.** No lore in logic, no narrative state
   machine.
9. **No browser storage APIs other than IndexedDB for the command log.**
10. **Hover is never the sole affordance.** Every drag has a numeric-entry equivalent.
11. **Never reference a worker type outside `@rapidity/sim`.** Go through `SimHost`.
12. **One `aria-live="polite"` region only.** Everything else is query-driven. No live
    region updates faster than 1 Hz.

## Commands

```
pnpm install
pnpm typecheck         # tsc -b, project references plus test files — blocking
pnpm test              # vitest, all packages
pnpm test:property     # fast-check physics invariants
pnpm lint:schema       # Tier 1 accessibility gate — blocking
pnpm lint:a11y         # axe-core + 320px reflow — blocking
pnpm lint:deps         # dependency-cruiser boundary check — blocking
pnpm test:sr           # guidepup — nightly, non-blocking
pnpm dev               # proofing shell at localhost:4173 — tsc --watch + static server
pnpm build
```

## Code style

- TypeScript strict. `noUncheckedIndexedAccess` on.
- Branded types from `@rapidity/units` for all physical quantities. Never a bare
  `number` for a dimensioned value.
- Pure functions in `@rapidity/physics`. No classes, no state, no I/O.
- Prefer exhaustive `switch` on discriminated unions over `if` chains.
- No barrel files that re-export across package boundaries.
- Comments explain *why*, never *what*. If a comment describes what the code does,
  rename things instead.

## Testing

- Physics is tested against **identities**, not hand-computed values. See
  `PHYSICS.md` §9 for the invariant list.
- The Alpha Centauri reference case in `PHYSICS.md` §3 is pinned. If it changes, the
  physics is wrong.
- Telemetry frames get golden-file snapshots to catch protocol drift.
- Accessibility gates are not optional and are not to be skipped to unblock a change.

## Working conventions

- Small commits, conventional commit messages.
- Never modify a package you do not own. Open the contract question instead.
- If a change requires crossing a package boundary, stop and say so — the boundary is
  probably right and the design is probably wrong.
- Do not add dependencies without justification. The runtime target is a 2015-era
  laptop with integrated graphics, offline.
- Do not implement future phases early. Stubs for Phase 7 warp do not belong in
  Phase 3.

## Things that look like bugs but are not

- Position ULP at 4.37 ly is ~9.2 m. This is documented and acceptable.
- Replay is not bit-identical across browsers. This is expected — see
  `ARCHITECTURE.md` §5.
- The panel cannot see simulation state. That is the point.
- `EARTH CLOCK 3.26×` is deliberate. `γ` never appears in player-facing copy, and
  neither does rapidity.
