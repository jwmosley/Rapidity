# Rapidity — Accessibility Contract

This is a binding specification. Violations are build failures, not backlog items.

## 1. The acceptance test

**Complete the Shakedown Flight with no mouse and no screen.**

This is the Phase 3 release gate and it is worth more than any conformance audit.
Automated tooling catches the mechanical subset only. Whether the sonification is
comprehensible, and whether a blind player can actually fly the ship, are not
automatable.

## 2. Conformance target

WCAG 2.2 AA as design target. Game Accessibility Guidelines and the Xbox
Accessibility Guidelines alongside it, because WCAG alone does not model game
concepts. **No formal certification for v1.**

Three enforcement tiers:

| Tier | Check | Gate |
| --- | --- | --- |
| 1 | Custom schema lint | Blocking, every PR |
| 2 | axe-core + 320 px reflow | Blocking, every PR |
| 3 | Guidepup screen-reader automation | Nightly, non-blocking |
| 4 | Manual four-reader matrix | Release gate, checklist |

### Tier 1 — schema lint

Every telemetry definition must carry `label`, `shortLabel`, and `spoken`. Every alert
must carry `tier`, `text`, and `response`. Missing any of these fails the build and
the module does not load.

This is the highest-leverage gate in the project. Enforcing accessibility at the
content boundary means **no third-party pack can ship an inaccessible instrument.**
Auditing after the fact is orders of magnitude more expensive.

### Tier 2 — why 320 px reflow matters twice

WCAG 1.4.10 requires reflow at 320 CSS px. That is also the phone layout. Gating
reflow means the mobile layout arrives as a byproduct of accessibility work rather
than as a port.

### Tier 3 — why Guidepup does not block

Guidepup drives NVDA and VoiceOver from CI. It needs Windows runners for NVDA and
macOS runners for VoiceOver at roughly ten times the minute cost, and it is flaky
enough that PR-gating it means it gets switched off within a month. Run it nightly
against five critical announcements. Treat failures as signal, not as a stop.

## 3. Screen reader matrix

| Reader + browser | Role |
| --- | --- |
| NVDA + Firefox | Primary dev loop. Free, standards-strict. |
| JAWS + Chrome | Release gate. Most professional users. |
| VoiceOver + Safari | iOS. The only combination that exists there. |
| Narrator + Edge | Zero-install floor. |

**Narrator matters more than its market share suggests.** JAWS costs over a thousand
dollars. A blind player evaluating the game must not have to install anything first.

## 4. Browse mode — the central conflict

NVDA and JAWS intercept single-letter keys for quick navigation. A
hotkey-per-instrument-group scheme gets swallowed before the app sees it.

**Resolution:** scope `role="application"` to the panel region only, **never the
document**. Provide a documented escape so browse navigation still works everywhere
else. A visible and announced mode indicator states which mode is active at all times.

Rejected alternatives: modifier on every hotkey (slow, and collides with reader
shortcuts), global application role (destroys browse navigation site-wide).

Verify in the Phase 0 spike against all four readers before building on it.

## 5. Live region policy

Telemetry-heavy apps break screen readers. Rapid live-region updates are dropped by
some readers and flooded by others, and all four disagree about which.

**Rules:**

1. Exactly **one** `aria-live="polite"` status region, holding crew clock and current
   mode only.
2. All other telemetry is **query-driven**. Hotkey per instrument group, polled on
   demand. Never pushed.
3. Only `caution` and `warning` quality tiers announce automatically, via
   `aria-live="assertive"`.
4. No live region updates faster than 1 Hz, ever.

This matches ECAM and EICAS exception-based operation, so the accessible design and
the authentic design are the same design.

## 6. Sonification

Map rapidity, not velocity. Pitch perception is logarithmic and `η` is already the
log-like variable, so linear `η` → semitones gives a perceptually even ramp from rest
to 0.99 c.

| Parameter | Channel |
| --- | --- |
| Rapidity | Pitch, linear η → semitones |
| Thrust | Low-frequency amplitude |
| Thermal load | Timbre roughness |
| Target bearing | HRTF pan via Web Audio `PannerNode` |
| Alert tier | Distinct earcon per tier, never pitch alone |

**Sonification is never the only channel for anything actionable.**

### iOS audio risk

`AudioContext` requires a user gesture to unlock and suspends on background. **Spike
in Phase 0 whether the hardware silent switch mutes Web Audio output.** If it does,
that is a correctness problem for blind players, not a polish item. Resolve before
building the audio layer.

Voice chat (Phase 11) competes directly with sonification. Route separately with
ducking.

## 7. Deaf and hard of hearing

- Every audio cue has a visual twin in a persistent alert stack
- Nothing is conveyed by sound alone
- Alert tiers differ by **shape and text**, never colour alone
- Voice comms carry speech-to-text both directions (Phase 11)

## 8. Motor and physical

The event-driven clock means there is no real-time pressure and therefore no timed
input to fail. Most of this is free.

- Full keyboard operability, no simultaneous-key requirements
- Everything remappable
- Pause-on-caution, default on
- Scanning-friendly focus tree for single-switch input
- Every drag interaction has a numeric-entry equivalent
- Targets minimum 24 × 24 CSS px, target 44 × 44
- **Hover is never the sole affordance for anything**

## 9. Low vision and colour

- **Colour is never load-bearing.** Reserved exclusively for abnormal conditions.
- High-Performance HMI palette: grey backgrounds, muted normal state
- Values render as bars with normal band and setpoint marked, so deviation reads
  before the number does
- Respects `prefers-reduced-motion` and `prefers-contrast`
- Browser font size honoured; no fixed `px` type sizes

The Airbus dark-cockpit principle, High-Performance HMI, and the colourblind
requirement all specify the same thing: quiet by default, colour means abnormal.

## 10. Mobile interaction

VoiceOver on iOS uses swipe navigation and the rotor rather than keyboard focus, so
the hotkey scheme does not translate.

**The conversational query interface is the primary input mode on phone.** "Computer,
projected radiator margin at current burn." The `Command.canonical` form already
supports this. What was chosen for flavour turns out to be the mobile accessibility
answer.

## 11. Alarm rationalization

Per ISA-18.2 and EEMUA 191:

- **Every alarm has a defined operator response or it does not exist.** Enforced by
  the required `response` field in Tier 1 lint.
- Suppression by design — no low-pressure alarm on a deliberately shut pump
- First-out annunciation — flag which alarm fired first in a cascade; this is the
  diagnostic key in any failure
- Three tiers only: advisory, caution, warning. Master acknowledge.
