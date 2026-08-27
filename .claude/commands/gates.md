---
description: Run every blocking gate and report pass/fail
---

Run all five blocking gates for this repo, in this order. Run every gate even if an
earlier one fails — the point is a complete picture, not fail-fast.

1. `pnpm typecheck`
2. `pnpm test`
3. `pnpm lint:schema`
4. `pnpm lint:a11y`
5. `pnpm lint:deps`

Then report one line per gate: pass or fail. For any gate that failed, show its
failing output. Do not attempt fixes unless asked, and never skip or weaken an
accessibility gate to unblock a change — see CLAUDE.md.
