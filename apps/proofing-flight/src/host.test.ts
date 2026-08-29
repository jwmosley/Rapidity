import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { flipAndBurnSegments, planDuration } from '@rapidity/physics';
import type { TelemetryFrame } from '@rapidity/protocol';
import { G0, LIGHT_YEAR, metres, properTime } from '@rapidity/units';

import { createProofingHost } from './host.ts';

const plan = flipAndBurnSegments(metres(4.37 * LIGHT_YEAR), G0);
const COMPRESSION = 2_000_000;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(0);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('proofing host', () => {
  it('evaluates on demand with a monotonic sequence', () => {
    const host = createProofingHost({ plan, compression: COMPRESSION });
    const a = host.evaluateAt(properTime(0));
    const b = host.evaluateAt(properTime(1000));
    expect(a.telemetry.length).toBe(3);
    expect(b.sequence).toBeGreaterThan(a.sequence);
  });

  it('emits a frame per second of wall time, with compressed proper time', () => {
    const host = createProofingHost({ plan, compression: COMPRESSION });
    const frames: TelemetryFrame[] = [];
    host.subscribe((frame) => frames.push(frame));

    vi.advanceTimersByTime(3000);
    expect(frames.length).toBe(3);
    expect(frames[2]?.tau).toBe(3 * COMPRESSION);
  });

  it('holds at arrival instead of running off the plan', () => {
    const host = createProofingHost({ plan, compression: COMPRESSION });
    const frames: TelemetryFrame[] = [];
    host.subscribe((frame) => frames.push(frame));

    // 3 minutes of wall time is well past the ~57 s compressed flight.
    vi.advanceTimersByTime(180_000);
    expect(frames.at(-1)?.tau).toBe(planDuration(plan));
  });

  it('stops the clock when the last subscriber leaves', () => {
    const host = createProofingHost({ plan, compression: COMPRESSION });
    const frames: TelemetryFrame[] = [];
    const unsubscribe = host.subscribe((frame) => frames.push(frame));

    vi.advanceTimersByTime(2000);
    unsubscribe();
    vi.advanceTimersByTime(5000);
    expect(frames.length).toBe(2);
  });

  it('accepts commands without effect, per the fixed proofing plan', () => {
    const host = createProofingHost({ plan, compression: COMPRESSION });
    expect(() =>
      host.send({
        verb: 'PAUSE',
        params: {},
        actor: 'local',
        canonical: 'PAUSE',
        issuedAt: properTime(0),
        sequence: 0,
      }),
    ).not.toThrow();
  });
});
