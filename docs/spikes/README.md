# Phase 0 spike findings

`ROADMAP.md` Phase 0: prove the risky things in throwaway code, delete the code,
keep written findings. This directory holds the findings — one file per spike,
numbered as in the roadmap.

Spike code lives in `spikes/` at the repo root, which is gitignored. Nothing in
`spikes/` may be imported by anything. Delete it when the phase closes.

Each findings file states its method precisely enough to re-run the experiment,
and ends with an explicit verdict:

- **go / no-go** where the roadmap asks for one (Guidepup),
- a **resolution** for open questions (iOS audio), or
- **confirmed / refuted** for technical claims.

| # | Spike | Findings | Verdict |
| - | ----- | -------- | ------- |
| 1 | Screen reader reads a live SVG gauge — all four readers | — | pending |
| 2 | `role="application"` scoped to a region, browse-mode escape | — | pending |
| 3 | WebHID talking to an Arduino | — | pending |
| 4 | iOS hardware silent switch vs Web Audio | — | pending |
| 5 | Rapidity precision at γ = 1000 | [05-rapidity-precision.md](05-rapidity-precision.md) | **confirmed** |
| 6 | Guidepup driving NVDA in CI | — | pending |
