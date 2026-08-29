/**
 * PHYSICS.md §9 — every invariant as a fast-check property, tested against
 * identities rather than hand-computed values. Small-delta-eta stability lives
 * in smalldeta.property.test.ts against the mpmath golden table.
 */
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import {
  C,
  kilograms,
  metres,
  metresPerSecond,
  metresPerSecondSquared,
  properTime,
  rapidity,
} from '@rapidity/units';

import { betaOf, composeRapidities, gammaOf } from './conversions.ts';
import { flipAndBurnSegments } from './flip.ts';
import { finalMass, rapidityBudget } from './rocket.ts';
import {
  INITIAL_STATE,
  evaluateWithin,
  propagatePlan,
  propagateSegment,
  type Segment,
  type State,
} from './segments.ts';

const eta = (min: number, max: number) => fc.double({ min, max, noNaN: true });

const relError = (actual: number, expected: number): number =>
  expected === 0 ? Math.abs(actual) : Math.abs(actual - expected) / Math.abs(expected);

const segmentArb: fc.Arbitrary<Segment> = fc.oneof(
  fc.record({
    kind: fc.constant('coast' as const),
    properDuration: fc.double({ min: 1, max: 1e8, noNaN: true }).map(properTime),
  }),
  fc.record({
    kind: fc.constant('burn' as const),
    properAcceleration: fc
      .double({ min: -100, max: 100, noNaN: true })
      .map(metresPerSecondSquared),
    properDuration: fc.double({ min: 1, max: 1e8, noNaN: true }).map(properTime),
  }),
);

const startStateArb: fc.Arbitrary<State> = eta(-5, 5).map((value) => ({
  ...INITIAL_STATE,
  rapidity: rapidity(value),
}));

describe('hyperbolic identity: cosh² − sinh² = 1', () => {
  it('holds across the working rapidity range', () => {
    fc.assert(
      fc.property(eta(-15, 15), (value) => {
        const cosh = Math.cosh(value);
        const sinh = Math.sinh(value);
        // The identity subtracts numbers of size cosh², so the float tolerance
        // must scale with cosh² — that is the identity's own condition number.
        expect(Math.abs(cosh * cosh - sinh * sinh - 1)).toBeLessThanOrEqual(
          1e-13 * Math.max(1, cosh * cosh),
        );
      }),
    );
  });
});

describe('rapidity additivity matches relativistic velocity addition', () => {
  it('atanh of the composed beta equals the summed rapidity', () => {
    fc.assert(
      fc.property(eta(-3, 3), eta(-3, 3), (a, b) => {
        const betaA = betaOf(rapidity(a));
        const betaB = betaOf(rapidity(b));
        const composedBeta = (betaA + betaB) / (1 + betaA * betaB);
        // Range capped at |eta| ≤ 3: atanh amplifies beta's representation
        // error by gamma², the exact effect that makes eta the state variable.
        expect(Math.abs(Math.atanh(composedBeta) - (a + b))).toBeLessThanOrEqual(1e-10);
        expect(composeRapidities(rapidity(a), rapidity(b))).toBe(a + b);
      }),
    );
  });
});

describe('time ordering: tau ≤ t for any segment sequence', () => {
  it('elapsed coordinate time never trails elapsed proper time', () => {
    fc.assert(
      fc.property(
        startStateArb,
        fc.array(segmentArb, { minLength: 1, maxLength: 5 }),
        (start, plan) => {
          const end = propagatePlan(start, plan);
          const elapsedProper = end.properTime - start.properTime;
          const elapsedCoordinate = end.coordinateTime - start.coordinateTime;
          expect(elapsedCoordinate).toBeGreaterThanOrEqual(elapsedProper * (1 - 1e-12));
        },
      ),
    );
  });
});

describe('Lorentz floor: gamma ≥ 1 and 0 ≤ |beta| < 1', () => {
  it('holds for every rapidity', () => {
    fc.assert(
      fc.property(eta(-15, 15), (value) => {
        expect(gammaOf(rapidity(value))).toBeGreaterThanOrEqual(1);
        expect(Math.abs(betaOf(rapidity(value)))).toBeLessThan(1);
      }),
    );
  });
});

describe('reversibility: +dtau then −dtau returns to the origin', () => {
  it('round-trips state through any single segment', () => {
    fc.assert(
      fc.property(startStateArb, segmentArb, (start, segment) => {
        const forward = evaluateWithin(start, segment, segment.properDuration);
        const back = evaluateWithin(forward, segment, properTime(-segment.properDuration));
        expect(Math.abs(back.rapidity - start.rapidity)).toBeLessThanOrEqual(1e-12);
        expect(Math.abs(back.properTime - start.properTime)).toBeLessThanOrEqual(
          1e-9 * segment.properDuration,
        );
        const travelled = Math.max(1, Math.abs(forward.position - start.position));
        expect(Math.abs(back.position - start.position)).toBeLessThanOrEqual(1e-9 * travelled);
        const aged = Math.max(1, forward.coordinateTime - start.coordinateTime);
        expect(Math.abs(back.coordinateTime - start.coordinateTime)).toBeLessThanOrEqual(
          1e-9 * aged,
        );
      }),
    );
  });
});

describe('Newtonian limit: a·tau/c → 0 gives dx → a·tau²/2 and dt → dtau', () => {
  it('burns from rest reduce to Galilean kinematics', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.1, max: 100, noNaN: true }),
        fc.double({ min: 1e-9, max: 1e-4, noNaN: true }),
        (a, smallness) => {
          const tau = (smallness * C) / a;
          const end = propagateSegment(INITIAL_STATE, {
            kind: 'burn',
            properAcceleration: metresPerSecondSquared(a),
            properDuration: properTime(tau),
          });
          expect(relError(end.position, (a * tau * tau) / 2)).toBeLessThanOrEqual(1e-8);
          expect(relError(end.coordinateTime, tau)).toBeLessThanOrEqual(1e-8);
        },
      ),
    );
  });
});

describe('flip symmetry: the two legs mirror in deltaEta, dtau and dx', () => {
  it('a flip-and-burn plan is symmetric about the flip', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.5, max: 50, noNaN: true }),
        fc.double({ min: 1e11, max: 1e17, noNaN: true }),
        (a, d) => {
          const [accelerate, decelerate] = flipAndBurnSegments(
            metres(d),
            metresPerSecondSquared(a),
          );
          const flip = propagateSegment(INITIAL_STATE, accelerate);
          const end = propagateSegment(flip, decelerate);

          expect(accelerate.properDuration).toBe(decelerate.properDuration);
          const deltaEtaOut = flip.rapidity - INITIAL_STATE.rapidity;
          const deltaEtaBack = end.rapidity - flip.rapidity;
          expect(relError(-deltaEtaBack, deltaEtaOut)).toBeLessThanOrEqual(1e-12);
          expect(
            relError(end.position - flip.position, flip.position - INITIAL_STATE.position),
          ).toBeLessThanOrEqual(1e-12);
          expect(
            relError(
              end.coordinateTime - flip.coordinateTime,
              flip.coordinateTime - INITIAL_STATE.coordinateTime,
            ),
          ).toBeLessThanOrEqual(1e-12);
          expect(Math.abs(end.rapidity)).toBeLessThanOrEqual(1e-12);
        },
      ),
    );
  });
});

describe('rocket monotonicity: final mass strictly decreases in deltaEta', () => {
  it('more rapidity always costs more propellant', () => {
    fc.assert(
      fc.property(
        // ve ≥ 0.05c keeps the exponent within f64's normal range; below that
        // the mass ratio underflows to zero and "strictly less" is meaningless.
        fc.double({ min: 0.05, max: 0.99, noNaN: true }),
        fc.double({ min: 0, max: 10, noNaN: true }),
        fc.double({ min: 1e-6, max: 5, noNaN: true }),
        (veFraction, deltaEta, gap) => {
          const ve = metresPerSecond(veFraction * C);
          const before = finalMass(kilograms(1e6), rapidity(deltaEta), ve);
          const after = finalMass(kilograms(1e6), rapidity(deltaEta + gap), ve);
          expect(after).toBeLessThan(before);
        },
      ),
    );
  });

  it('rapidity budget inverts final mass exactly', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.05, max: 0.99, noNaN: true }),
        fc.double({ min: 0.01, max: 8, noNaN: true }),
        (veFraction, deltaEta) => {
          const ve = metresPerSecond(veFraction * C);
          const m1 = finalMass(kilograms(1e6), rapidity(deltaEta), ve);
          expect(
            relError(rapidityBudget(kilograms(1e6), m1, ve), deltaEta),
          ).toBeLessThanOrEqual(1e-12);
        },
      ),
    );
  });
});
