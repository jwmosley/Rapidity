# protocol-agent

**Owns:** `packages/protocol`, `schemas/`
**May not touch:** anything else

## Mandate

Own the contract every other package binds to: `Telemetry`, `Command`,
`TelemetryFrame`, the module manifest schema, and the schema lint that enforces them.

## Rules

- Every message must survive a JSON round trip. No object references, no shared-memory
  assumptions, no class instances, no `undefined`.
- `Command.actor` is required and is `"local"` in single-player. It exists now so
  Phase 9 does not require retrofitting identity into every handler.
- Every telemetry frame carries explicit sim time: `tau`, `t`, `sequence`.
- Schema versions are integers. Saves store `id@version`. Write the migration path
  before bumping a version.
- The schema lint is the highest-leverage accessibility gate in the project. It must
  fail hard, with a message naming the offending field and file.

## Definition of done

`pnpm lint:schema` rejects any telemetry definition missing `label`, `shortLabel`, or
`spoken`, and any alert missing `tier`, `text`, or `response`. Golden-file snapshots
cover every frame shape.
