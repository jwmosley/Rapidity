# Spike 6 — Guidepup driving NVDA in CI

**Question under test** (`ROADMAP.md` Phase 0): Guidepup driving NVDA in CI —
does it hold up?

**Verdict: go** — for the NVDA half, which is what this spike scoped. On
`windows-latest`, `guidepup/setup-action` plus a project-local asset install
gives a working NVDA that reads a real page, announces a polite live region,
and stays stable across repeated runs: after two instructive failures that
each had a single, legible cause, three consecutive dispatches passed 9/9
iterations with phrase-for-phrase identical spoken output, in both Firefox
and Chromium. VoiceOver on macOS runners was not exercised and remains its
own risk.

## Method

Throwaway branch `spike/06-guidepup-nvda` (never merges; delete when the
phase closes). Its workflow repurposes `nightly-screen-readers.yml` for
manual dispatch: `guidepup/setup-action@0.21.0`, then
`npx @guidepup/setup install`, then a harness that launches a headed
Playwright browser (dispatch input: `firefox` or `chromium`) on a static
gauge page and drives NVDA via `@guidepup/guidepup` 0.33.2. Per iteration,
three separately reported checks:

- **text** — NVDA reads plain page text (baseline)
- **meter** — the SVG gauge's `role="meter"` name and value are announced
- **live** — after activating a button *through NVDA* (`act()`), the polite
  live region announces the new value

Full spoken-phrase logs print every run. Dispatch:

```
gh workflow run nightly-screen-readers.yml --ref spike/06-guidepup-nvda -f browser=firefox -f runs=3
```

## Run record (2026-08-27)

| Dispatch | Config | Result | Cause / notes |
| -------- | ------ | ------ | ------------- |
| 33051605813 | firefox × 3 | fail 0/3 | `NVDA is not installed` — setup-action alone is not enough for guidepup 0.33 |
| 33052196238 | firefox × 3 | fail 0/3 | iteration 1 navigation worked; NVDA silent after in-job restart (iterations 2–3); synthetic click never triggered the live region |
| 33053094311 | firefox × 3 | **pass 3/3** | after harness rework |
| 33053666099 | firefox × 3 | **pass 3/3** | identical logs |
| 33053673462 | chromium × 3 | **pass 3/3** | spoken output identical to Firefox |

## Operational rules the failures bought

These are requirements for the real Tier 3 suite, not suggestions:

1. **Install project-local screen reader assets.** Since guidepup ~0.33,
   `guidepup/setup-action` only does the once-per-machine OS half; the job
   must also run `npx @guidepup/setup install` after `pnpm install` so the
   assets match the project's guidepup version. Main's nightly workflow needs
   this step added when the Phase 2 suite lands.
2. **One NVDA session per job.** Start NVDA once, run every case inside that
   session, stop once. Restarting NVDA mid-job left it running but silent —
   ten empty phrases per iteration — which is guidepup's own usage pattern
   confirmed the hard way.
3. **Drive interaction through the reader.** A synthetic Playwright
   `page.click()` never produced a live-region announcement; NVDA's `act()`
   produced it 9 times out of 9. Test what the player does, not what the DOM
   can be made to do.

## Announcement observations (feed into Phase 2)

- NVDA speaks `role="meter"` as **"progress bar"**, appending
  `aria-valuetext`: "Radiator margin, progress bar, 72 percent". Acceptable,
  but the role word is wrong-ish; revisit against the other readers when the
  real gauge lands.
- The polite live region announced exactly once per activation, promptly and
  reliably: "Radiator margin 68 percent". First CI evidence for the
  one-polite-region design in `ACCESSIBILITY.md` §5.
- NVDA output was identical between Playwright Firefox and Chromium — the
  harness approach is not engine-specific.

## Cost and cadence

The harness itself is cheap — NVDA start plus three full iterations took
~45–50 s; the ~7–10 minute job is almost entirely runner setup. Public-repo
standard runners make dispatches free. The 9/9 sample is small; the nightly
cadence on main will accumulate honest flakiness data once the real suite
exists, and Tier 3 stays non-blocking regardless (`ACCESSIBILITY.md` §2).

## Open remainder

VoiceOver + Safari on `macos-latest` is untested by this spike. The setup
action supports it, but macOS needs its own proving run — treat it as part
of the Phase 2 Tier 3 build-out, not a blocker for this go.
