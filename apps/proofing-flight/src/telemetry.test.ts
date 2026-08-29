import { describe, expect, it } from 'vitest';

import { INITIAL_STATE, evaluatePlan, flipAndBurnSegments } from '@rapidity/physics';
import { G0, LIGHT_YEAR, metres, properTime } from '@rapidity/units';

import { buildFrame, formatCrewClock, EARTH_CLOCK_ID, SPEED_ID } from './telemetry.ts';

describe('crew clock format', () => {
  it('matches the SPEC.md convention exactly', () => {
    expect(formatCrewClock(properTime(0))).toBe('T+ 0d 00:00:00');
    expect(formatCrewClock(properTime(412 * 86_400 + 6 * 3_600 + 15 * 60 + 22))).toBe(
      'T+ 412d 06:15:22',
    );
  });
});

describe('display boundary', () => {
  const plan = flipAndBurnSegments(metres(4.37 * LIGHT_YEAR), G0);
  const [accelerate] = plan;

  it("produces SPEC.md's own example strings at the flip point", () => {
    // The conventions table's 0.9517 c and 3.26× are the Alpha Centauri peak.
    const flip = evaluatePlan(INITIAL_STATE, plan, accelerate.properDuration);
    const frame = buildFrame(flip, 0);
    expect(frame.telemetry.find((t) => t.id === SPEED_ID)?.formatted).toBe('0.9517 c');
    expect(frame.telemetry.find((t) => t.id === EARTH_CLOCK_ID)?.formatted).toBe('3.26×');
  });

  it('keeps SI in value and conversion in formatted, with spoken expanding symbols', () => {
    const flip = evaluatePlan(INITIAL_STATE, plan, accelerate.properDuration);
    const frame = buildFrame(flip, 7);
    for (const entry of frame.telemetry) {
      expect(entry.spoken.length).toBeGreaterThan(0);
      expect(entry.spoken).not.toContain('×');
    }
    expect(frame.sequence).toBe(7);
    expect(frame.tau).toBe(flip.properTime);
    expect(frame.t).toBe(flip.coordinateTime);
  });
});
