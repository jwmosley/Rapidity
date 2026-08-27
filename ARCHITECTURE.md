# Rapidity — Architecture

## 1. Stack

Client-side TypeScript. No server. Installable PWA, runs offline from local files.

Chosen because screen-reader support for web content is more mature and more
consistent than any native toolkit, and ARIA gives control over instrument
announcement that nothing else matches. Accessibility is the top constraint, so the
platform best at it wins. Web Audio HRTF and WebHID come along free.

Python is used for **build-time catalog ETL only** (`tools/catalog-etl`). It emits a
committed artifact and never ships to the player.

A backend appears only at Phase 10 for the mod registry, and the game must remain
fully playable without it.

## 2. Package layout

pnpm workspaces monorepo. **Package boundaries are subagent ownership boundaries.**
The dependency graph is the enforcement mechanism: an agent cannot reach outside its
package because the import is not declared.

```
packages/
  units/        @rapidity/units      zero deps
  physics/      @rapidity/physics    → units
  protocol/     @rapidity/protocol   → units
  sim/          @rapidity/sim        → physics, protocol
  panel/        @rapidity/panel      → protocol
  audio/        @rapidity/audio      → protocol
  catalog/      @rapidity/catalog    → units
apps/
  proofing-flight/                   → all
tools/
  catalog-etl/                       Python, uv, outside the workspace
```

### 2.1 The load-bearing rule

**`@rapidity/panel` MUST NOT depend on `@rapidity/sim`.**

Panel binds to `@rapidity/protocol` only. It consumes telemetry frames and emits
commands. It has no access to simulation state.

This is the accessibility boundary made structural. If the panel could read sim state
directly, some instrument would eventually render a value that never passed through
the telemetry schema — and the schema is what guarantees `label`, `short_label`, and
`spoken` exist. Making it a dependency rule means it cannot erode.

`@rapidity/audio` is bound by the same rule for the same reason.

Enforce with `dependency-cruiser` as a blocking CI check.

## 3. Core boundary

Everything crosses one interface:

```ts
interface Telemetry {
  id: string;            // "core:drive.thrust"
  label: string;         // "Drive Thrust"
  shortLabel: string;    // "THR"      ≤ 8 chars, braille/MFD
  value: number;         // SI, always
  unit: string;
  formatted: string;     // display string, converted
  spoken: string;        // "drive thrust 9.8 meganewtons"
  quality: 'nominal' | 'advisory' | 'caution' | 'warning' | 'stale' | 'invalid';
}

interface Command {
  verb: string;          // "SET_ACCEL"
  params: Record<string, number | string>;
  actor: string;         // "local" in single-player
  canonical: string;     // "SET ACCEL 1.0 G"
  issuedAt: number;      // sim time, seconds
}
```

`canonical` gives voice control, a command-line interface, and a scriptable test
harness with no extra work. Many blind operators prefer a command line to a spatial
panel because it is faster and unambiguous, so the CLI is a first-class input mode,
not a fallback.

Consumers of this stream are peers: visual panel, screen-reader output, sonification
engine, physical HID panel, and (from Phase 9) a remote crew station.

## 4. SimHost

```ts
interface SimHost {
  send(cmd: Command): void;
  subscribe(fn: (frame: TelemetryFrame) => void): () => void;
  evaluateAt(tau: number): TelemetryFrame;
}
```

Three implementations: `SharedWorkerSimHost`, `WorkerSimHost`, `InlineSimHost`.

SharedWorker is unavailable on Android Chrome and inconsistent on mobile generally.
Mobile is single-window, so degrading to a dedicated worker costs nothing. **Never
reference a worker type directly outside `@rapidity/sim`.**

## 5. Save format and determinism

**State = initial conditions + ordered command log + segment-boundary checkpoints.**

Append each command to IndexedDB as issued, as JSONL. The log *is* the save. Nothing
is ever unsaved, so there is no save-before-leaving warning. Pause is a `PAUSE`
command carrying its sim time.

`sinh`/`cosh`/`exp` are implementation-defined and vary across engines, so replay is
not bit-identical. It does not matter here, because **nothing is stepped**. State is
computed from segment initial conditions, so variance costs roughly one ULP per
evaluation and only compounds where one segment's end state seeds the next. A voyage
has dozens of segments, not millions of ticks. Total divergence lands near parts per
trillion — invisible in any displayed value.

Checkpoint at **segment boundaries**, not on a timer. Natural anchors, a few hundred
bytes, and they bound drift inside a single segment. The same checkpoint hashes give
Phase 9 desync detection free.

This one mechanism yields save, replay, pause/resume, desync detection, late-join,
and the Phase 5 historian.

## 6. Time model

Wall-clock time drives nothing. The sim advances **event to event**, evaluating in
closed form. Real-time stepping happens only while the player is actively adjusting
something.

Mobile browsers suspend background timers, which would break a tick-based sim.
Resuming here is a recompute against the wall clock. Nothing to handle.

## 7. Rendering

**SVG and DOM. Canvas is forbidden for instruments.**

Canvas text is invisible to screen readers, ignores browser font settings, and breaks
400 % reflow. Canvas is permitted only for the decorative starfield, which must never
carry information.

Vector panels also scale cleanly for low vision and high-DPI phones, so the
accessibility choice and the mobile choice are the same choice.

## 8. Surface registry

A *surface* declares capabilities — pixel dimensions, audio channels, input methods —
and requests pages. One laptop screen gives page cycling. Four monitors pin pages.
Headless with headphones reads the same pages as query groups. A phone is a surface
declaring small dimensions and touch.

From Phase 9, a remote crew station is also just a surface. Transport differs;
the sim core does not know.

## 9. Screen hierarchy

- **L1** — ship overview, every bus at a glance
- **L2** — subsystem mimics, auto-generated from the resource graph (Phase 4)
- **L3** — detail and manual actuation
- **L4** — historian trends; a six-year cruise gets reviewed, not watched

## 10. Resource-flow graph (Phase 4, design fixed now)

The ship is a graph of nodes on shared buses — power (W), heat rejection (W_th),
propellant (kg), consumables, compute. Every module declares draws and provides.
Hardpoints declare mass limit, volume, bus taps, coolant loop capacity, structural
acceleration rating.

Behaviour comes from a fixed vocabulary: `Source`, `Sink`, `Store`, `Converter`,
`Radiator`, `Tank`, `Thruster`. Packs compose these. No scripting until that
vocabulary stops growing, and then a sandboxed expression language, never `eval`.

**Build three modules by hand before extracting the schema.** Designing it up front
will get it wrong.

## 11. Naming invariants

| Invariant | Rule |
| --- | --- |
| First-party module namespace | `core:` — **never** `rapidity:` |
| Third-party namespace | author-chosen, e.g. `jeremy:` |
| Save-embedded identifier | `core:cryo_hab_mk2@3` (id @ schema version) |
| Project name appears in | npm scope, repo name, PWA manifest — nowhere else |

The project name is deliberately absent from every durable identifier. Renaming the
project is a find-and-replace that breaks zero saves. Do not let `rapidity:` appear as
a namespace prefix anywhere.

## 12. Branded types

```ts
type Rapidity   = number & { readonly __brand: 'Rapidity' };
type ProperTime = number & { readonly __brand: 'ProperTime' };
type CoordTime  = number & { readonly __brand: 'CoordTime' };
type Metres     = number & { readonly __brand: 'Metres' };
```

The codebase juggles rapidity, proper time, coordinate time, metres, kilograms and
m/s². Making the compiler reject coordinate time where proper time belongs removes an
entire bug class. All branded types live in `@rapidity/units`.

## 13. Licensing

- Code: **Apache-2.0** — explicit patent grant and trademark clause, both of which
  matter once a mod registry and a possible store build exist.
- Derived star catalog: **CC BY-SA 4.0**, shipped as its own artifact with its own
  LICENSE and HYG attribution.

Share-alike attaches to derivative works of the *data*. A program that reads a data
file is not a derivative of that data. Keeping the catalog a separate artifact keeps
that boundary explicit and unarguable.

Top-level `LICENSES/` directory. `CITATIONS` file for NASA Exoplanet Archive
acknowledgement. Pack manifests carry a required SPDX field so the registry can
surface pack licensing.
