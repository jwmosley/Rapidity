# catalog-etl

Build-time ETL for the derived star catalog. Python, managed with `uv`.

**Outside the pnpm workspace on purpose.** It emits a committed artifact and never
ships to the player. ARCHITECTURE.md §2.

Output is a separate CC BY-SA 4.0 artifact with its own `LICENSE` and HYG attribution,
because share-alike attaches to derivative works of the data and keeping the catalog
separate keeps that boundary unarguable. ARCHITECTURE.md §13, and [CITATIONS](../../CITATIONS).

Not implemented. Lands with `@rapidity/catalog`.

```
uv sync
uv run catalog-etl --help
```
