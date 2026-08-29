/**
 * The one interface everything crosses (ARCHITECTURE.md §3–§4). These types
 * mirror schemas/telemetry.schema.json and schemas/command.schema.json — the
 * schemas are authoritative; a disagreement here is a bug in this file.
 *
 * Everything must survive a JSON round trip: no object references, no class
 * instances, no undefined. Branded number types are erased at runtime and are
 * JSON-safe.
 */
import type { CoordTime, ProperTime } from '@rapidity/units';

export type Quality = 'nominal' | 'advisory' | 'caution' | 'warning' | 'stale' | 'invalid';

export interface TelemetryBand {
  readonly min: number;
  readonly max: number;
  readonly setpoint?: number;
}

export interface TelemetrySonify {
  readonly channel: 'pitch' | 'amplitude' | 'roughness' | 'pan';
  readonly scale?: 'linear' | 'log';
}

export interface Telemetry {
  /** Namespaced, e.g. "core:drive.thrust". Never the project name. */
  readonly id: string;
  readonly label: string;
  /** ≤ 8 chars, for MFD real estate and braille displays. */
  readonly shortLabel: string;
  /** SI, always. Conversion happens at the display boundary, not here. */
  readonly value: number;
  readonly unit: string;
  /** Player-facing units. Never contains gamma or rapidity. */
  readonly formatted: string;
  readonly spoken: string;
  readonly quality: Quality;
  readonly band?: TelemetryBand;
  readonly group?: string;
  readonly sonify?: TelemetrySonify;
}

export interface Command {
  readonly verb: string;
  /** Flat map; numbers are SI. */
  readonly params: Readonly<Record<string, number | string | boolean>>;
  /** "local" in single-player; present from day one so Phase 9 needs no retrofit. */
  readonly actor: string;
  /** Canonical human-readable form — the command line, voice control, test harness. */
  readonly canonical: string;
  /** Proper (crew) time since scenario epoch. */
  readonly issuedAt: ProperTime;
  /** Monotonic; defines log ordering and reconciliation. */
  readonly sequence: number;
}

/** Every frame carries explicit sim time so no consumer ever infers it. */
export interface TelemetryFrame {
  readonly tau: ProperTime;
  readonly t: CoordTime;
  readonly sequence: number;
  readonly telemetry: readonly Telemetry[];
}

/**
 * The sim boundary (ARCHITECTURE.md §4). Worker types exist only behind this
 * interface, inside @rapidity/sim — panel and audio never learn which
 * implementation is running (invariant 11).
 */
export interface SimHost {
  send(command: Command): void;
  subscribe(onFrame: (frame: TelemetryFrame) => void): () => void;
  evaluateAt(tau: ProperTime): TelemetryFrame;
}
