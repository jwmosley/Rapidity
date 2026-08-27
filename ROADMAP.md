# Rapidity — Roadmap

Estimates assume solo development at 6–10 hrs/week. **Every phase must leave
something that works if you stop there.**

Phase 3 is the first shippable release and lands around five to six months in.
Everything after is a two-year arc.

---

## Phase 0 — Spikes · 2–3 wks

Prove the risky things in throwaway code. Delete all of it afterward.

**Spikes:**

1. Screen reader reads a live SVG gauge — all four readers
2. `role="application"` scoped to a region, browse-mode escape verified
3. WebHID talking to an Arduino
4. **iOS: does the hardware silent switch mute Web Audio?**
5. Rapidity math holds precision at γ = 1000 where β would lose six digits
6. Guidepup driving NVDA in CI — does it hold up?

**Acceptance:** written findings on each, with a go/no-go on Guidepup and a
resolution for the iOS audio question. No production code committed.

---

## Phase 1 — Physics core · 4–6 wks

`@rapidity/units`, `@rapidity/physics`.

Rapidity propagation, segment plans, closed-form evaluation, branded types.
Pure functions. Zero UI, zero I/O.

Includes `SimHost` interface definition (not implementations) so nothing binds to a
worker type later.

**Acceptance:** every invariant in `PHYSICS.md` §9 passes as a property test. The
Alpha Centauri reference case matches the pinned table to five significant figures.
Small-`Δη` stability verified against a high-precision reference.

---

## Phase 2 — One accessible instrument · 6–8 wks

**Highest-value milestone in the plan.** A single gauge that works visually, through a
screen reader, sonified, keyboard-only, and on the HID panel.

If the accessibility stack holds for one instrument, the other forty are mechanical.
If it does not, you learn that now instead of in month eighteen.

Design it at phone width first, then widen.

**Acceptance:** the gauge passes all four readers. Schema lint, axe-core, and 320 px
reflow all gating in CI. Touch is a first-class input source. No hover-only
affordances anywhere. English is the binding acceptance language; a Japanese catalog
and Japanese reader tests ship alongside — available and tracked, non-blocking
(issue #1).

---

## Phase 3 — The Shakedown Flight · 8–10 wks · **SHIP THIS**

One hull, no cargo modules, Sol → Alpha Centauri. Flight planner, three panel pages
(Flight, Propulsion, Thermal), dual clocks, comms lag, 8–12 faults with ECAM-style
procedures, save/pause/resume/replay.

**Acceptance:** complete the flight with **no mouse and no screen**. Full four-reader
matrix passes. Runs offline from local files on a 2015-era laptop with integrated
graphics. Installs as a PWA on desktop and phone.

---

## Phase 4 — Resource graph and cargo · 10–12 wks

Bus model, hardpoints, module manifests, auto-generated mimic diagrams.

**Build three modules by hand first, then extract the schema from what they share.**

**Acceptance:** three modules load from manifests. A cargo module's synoptic page
generates from its declared draws with no hand-authored screen. Cargo mass visibly
changes the flight planner's feasible envelope.

---

## Phase 5 — Alarms and procedures · 6–8 wks

Full ISA-18.2 rationalization, suppression by design, first-out annunciation, L4
historian trends.

**Acceptance:** no alarm exists without a defined response. A cascade correctly
identifies the first-out alarm.

---

## Phase 6 — Surface scaling · 4–6 wks

Full surface registry: phone through wall of displays. Multi-window via SharedWorker
with graceful degradation. **Mobile stops being a port and becomes a surface class.**

**Acceptance:** the same session runs correctly on one phone screen, one laptop, and
four monitors, without conditional layout code outside the registry.

---

## Phase 7 — Warp · 4–6 wks

Rules 1–5 from `PHYSICS.md` §6. Pre-warp alignment, gravity-gradient thresholds,
causal-disconnect instrument staleness, exit particle load.

**Acceptance:** crew and Earth clocks stay synchronised through a warp leg. Instruments
correctly flag `stale` while enclosed.

---

## Phase 8 — Mod SDK and validator · ongoing

Pack format, content-addressed and signed, static JSON index on a CDN or GitHub
Releases. Local packs keep working offline.

**Acceptance:** a third-party pack that omits `spoken` on any telemetry field is
rejected by the validator with a clear message.

---

## Phase 9 — Same-ship co-op · sizing TBD

Peer-hosted, host-authoritative. Crew stations are surfaces over a WebSocket rather
than BroadcastChannel.

Lockstep is not viable: the propagation is built entirely on `sinh`, `cosh`, and `exp`,
which are implementation-defined across engines. One player's browser runs the sim;
everyone else is a terminal. Server cost stays near zero.

**Multi-ship shared universe is out of scope.** Two ships at different rapidities have
no shared present moment, and at 4 ly the comms lag is years — live voice between
separate ships is incoherent in this game's own model. If ever attempted, it must be
asynchronous with light-lag messaging as the mechanic.

**Acceptance:** session handshake compares pack hashes and refuses mismatched joins
rather than desyncing quietly. Late-join reconstructs from the command log.

---

## Phase 10 — Registry · sizing TBD

Static index first. FastAPI or ASP.NET Core only if an API proves necessary — this is
where the backend learning goal fits, cleanly separated from a game that still runs
offline without it.

**Acceptance:** the game launches and plays fully with the registry unreachable.

---

## Phase 11 — Comms · sizing TBD

Text-first. Speech-to-text on voice and text-to-speech on typed messages, putting deaf
and blind crew on the same intercom channel. Voice routed separately from sonification
with ducking.

---

## Phase 12 — Mobile shell · sizing TBD

Touch and VoiceOver interaction pass. Store packaging if wanted: a PWA cannot be
listed in the App Store, so Capacitor wraps the identical web build for iOS and a TWA
does the same for Play. No second codebase either way.
