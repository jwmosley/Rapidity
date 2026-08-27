# Rapidity — Specification

## What this is

A relativistic interstellar spacecraft operations simulator. The player does not
fly a ship through 3D space. The player operates a ship by reading instruments,
setting parameters, planning burn profiles, and responding to faults — the way a
flight engineer or a plant operator works.

Travel is between real stars, using real catalog data. The physics of relativistic
flight is modelled honestly. Warp is fictional but internally consistent and rule-bound.

**Accessibility is a primary design constraint, not a feature.** The game must be
fully playable by blind, low-vision, deaf, and physically disabled players. Where
accessibility and any other goal conflict, accessibility wins.

## Design pillars

1. **Instruments, not viewports.** The interface is the game. There is no required
   3D view. A starfield may exist as decoration and must never carry information.
2. **Honest physics.** Relativistic mechanics are correct, not approximated for feel.
   Where fiction is required (warp), it gets explicit rules derived from the source
   metric's known properties.
3. **Time is the antagonist.** Voyages take years. Crew time and Earth time diverge.
   That divergence is a mechanic, not a footnote.
4. **Every output has three channels.** Visual, screen-reader, and audio. No
   information exists in only one.
5. **Data over code.** Ships, modules, instruments, and text are content. The engine
   is a small fixed vocabulary those compose against.

## v1 scope — the Shakedown Flight

The first shippable release is one complete voyage.

**In scope:**

- One hull, fixed configuration, no cargo modules
- Sol → Alpha Centauri, single destination
- Flight planner: burn/coast segment editor with live budget feedback
- Three panel pages: Flight, Propulsion, Thermal
- Full dual-clock display, comms lag readout
- Fault injection with ECAM-style procedure display for a small fault set
- Sonification of the primary flight parameters
- Save, pause, resume, replay
- Desktop and phone layouts

**Explicitly out of scope for v1:**

- Cargo modules and the resource-flow graph (Phase 4)
- Warp (Phase 7)
- Multiplayer, registry, comms (Phases 9–11)
- Multiple ships, factions, economy, plot
- Any 3D rendering
- Physical HID panel support beyond the Phase 0 spike

## Player-facing conventions

| Concept | Display | Notes |
| --- | --- | --- |
| Crew clock | Mission elapsed, `T+ 412d 06:15:22` | Primary. Persistent status region. |
| Earth clock | Absolute date, `2387-04-11` | Secondary. On query. |
| Time dilation | `EARTH CLOCK 3.26×` | Never shown as `γ`. |
| Speed | `0.9517 c` | Never shown as rapidity. |
| Distance | Light-years en route, AU in-system | SI internally, always. |
| Acceleration | `g` | SI internally, always. |
| Comms lag | Earliest possible reply, absolute date | Derived, not entered. |

**Rapidity is an internal state variable and never appears in player-facing copy.**
The project name is a term the player never encounters. This is intentional.

## Fiction layer

Light framing only. There is an era and an operating organisation. There is no plot,
no factions, no dialogue tree.

The fiction exists to pin engineering constants so they are defensible rather than
arbitrary: era fixes achievable exhaust velocity, radiator operating temperature, and
whether warp is fielded technology.

**Hard rule: all fiction lives in string catalogs. No lore in logic.** No narrative
state machine, no story flags. A total conversion replaces strings, never code.

The v1 scenario is `core:shakedown_flight` — a systems proving cruise. This makes the
ECAM-style procedure display the tutorial, so no separate tutorial is designed.

## Non-goals

- Realtime piloting or twitch input of any kind
- Combat
- Photorealism
- Server-dependent play. The game must run fully offline, forever, from local files.

## Open items

- npm scope `@rapidity` availability unverified — confirm before first publish
- Exact era and operating organisation names
- Fault set for v1 (target 8–12 faults with distinct procedures)
