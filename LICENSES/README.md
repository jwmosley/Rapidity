# Licensing

Two licenses, deliberately separated. ARCHITECTURE.md §13.

| What | License | Why |
| --- | --- | --- |
| All code in `packages/`, `apps/`, `tools/`, `scripts/` | [Apache-2.0](Apache-2.0.txt) | Explicit patent grant and trademark clause, both of which matter once a mod registry and a possible store build exist. |
| The derived star catalog artifact | [CC BY-SA 4.0](CC-BY-SA-4.0.txt) | Share-alike attaches to derivative works of the data. |

Share-alike attaches to derivative works of the *data*. A program that reads a data
file is not a derivative of that data. The catalog therefore ships as its own artifact
with its own `LICENSE` and HYG attribution, which keeps that boundary explicit and
unarguable.

Attribution and data-source acknowledgements are in [`CITATIONS`](../CITATIONS).

Pack manifests carry a required `spdx` field (see `schemas/module.schema.json`) so the
Phase 10 registry can surface pack licensing.
