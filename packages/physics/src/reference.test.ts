/**
 * The pinned reference cases from PHYSICS.md §3–§5. CLAUDE.md: if the Alpha
 * Centauri table changes, the physics is wrong. Each value is asserted at the
 * precision the document prints it.
 */
import { describe, expect, it } from 'vitest';

import {
  C,
  G0,
  LIGHT_YEAR,
  kelvin,
  kilograms,
  metres,
  metresPerSecond,
  newtons,
  watts,
} from '@rapidity/units';

import { betaOf, gammaOf } from './conversions';
import { flipAndBurn, flipAndBurnSegments } from './flip';
import { massRatio } from './rocket';
import { INITIAL_STATE, evaluatePlan, planDuration, propagatePlan } from './segments';
import { jetPower, radiatorArea } from './thermal';

const JULIAN_YEAR_S = 31_557_600;
const years = (seconds: number): number => seconds / JULIAN_YEAR_S;

const expectPinned = (actual: number, pinned: number, halfUlpOfPrint: number): void => {
  expect(Math.abs(actual - pinned)).toBeLessThanOrEqual(halfUlpOfPrint);
};

const relError = (actual: number, expected: number): number =>
  Math.abs(actual - expected) / Math.abs(expected);

describe('Sol → Alpha Centauri, d = 4.37 ly, a = 1 g (PHYSICS.md §3)', () => {
  const distance = metres(4.37 * LIGHT_YEAR);
  const plan = flipAndBurn(distance, G0);

  it('matches the pinned table at its printed precision', () => {
    expectPinned(plan.etaPeak, 1.849, 0.00005);
    expectPinned(years(plan.properDuration), 3.582, 0.0005);
    expectPinned(years(plan.coordinateDuration), 6.003, 0.0005);
    expectPinned(gammaOf(plan.etaPeak), 3.2556, 0.00005);
    expectPinned(betaOf(plan.etaPeak), 0.9517, 0.00005);
    expectPinned(plan.totalRapidityChange, 3.6981, 0.00005);
  });

  it('pins the scale constants c²/g and c/g at 0.9687', () => {
    expectPinned((C * C) / G0 / LIGHT_YEAR, 0.9687, 0.00005);
    expectPinned(years(C / G0), 0.9687, 0.00005);
  });

  it('propagating the two-leg segment plan lands the closed forms on the same numbers', () => {
    const segments = flipAndBurnSegments(distance, G0);
    const end = propagatePlan(INITIAL_STATE, segments);
    expect(relError(end.position, distance)).toBeLessThanOrEqual(1e-12);
    expect(Math.abs(end.rapidity)).toBeLessThanOrEqual(1e-12);
    expect(relError(end.coordinateTime, plan.coordinateDuration)).toBeLessThanOrEqual(1e-12);
    expect(end.properTime).toBe(planDuration(segments));

    const flip = evaluatePlan(INITIAL_STATE, segments, segments[0].properDuration);
    expect(relError(flip.rapidity, plan.etaPeak)).toBeLessThanOrEqual(1e-12);
    expect(relError(flip.position, distance / 2)).toBeLessThanOrEqual(1e-12);
  });
});

describe('mass ratios for the reference deltaEta (PHYSICS.md §4)', () => {
  const deltaEta = flipAndBurn(metres(4.37 * LIGHT_YEAR), G0).totalRapidityChange;

  it.each([
    [0.1, 1.15e16],
    [0.3, 2.26e5],
    [0.5, 1630],
    [0.9, 60.9],
  ])('exhaust velocity %f c gives mass ratio %f', (fraction, pinned) => {
    const ratio = massRatio(deltaEta, metresPerSecond(fraction * C));
    expect(relError(ratio, pinned)).toBeLessThanOrEqual(5e-3);
  });
});

describe('thermal worked case: 1000 t hull at 1 g, ve = 0.1 c (PHYSICS.md §5)', () => {
  const thrust = newtons(kilograms(1e6) * G0);
  const power = jetPower(thrust, metresPerSecond(0.1 * C));
  const waste = watts(power * 0.001);

  it('jet power is 1.47e14 W and the 0.1% waste stream 1.47e11 W', () => {
    expect(relError(power, 1.47e14)).toBeLessThanOrEqual(5e-3);
    expect(relError(waste, 1.47e11)).toBeLessThanOrEqual(5e-3);
  });

  it.each([
    [1200, 1.25e6],
    [1500, 5.12e5],
    [2000, 1.62e5],
  ])('radiator area at %d K is %f m²', (temperature, pinned) => {
    expect(relError(radiatorArea(waste, kelvin(temperature)), pinned)).toBeLessThanOrEqual(5e-3);
  });
});
