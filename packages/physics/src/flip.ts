/**
 * Flip-and-burn (brachistochrone): accelerate half the distance, flip,
 * decelerate the rest (PHYSICS.md §3).
 */
import {
  C,
  type CoordTime,
  type Metres,
  type MetresPerSecondSquared,
  type ProperTime,
  type Rapidity,
  coordTime,
  metresPerSecondSquared,
  properTime,
  rapidity,
} from '@rapidity/units';

import type { BurnSegment } from './segments.ts';

export interface FlipAndBurn {
  readonly etaPeak: Rapidity;
  readonly properDuration: ProperTime;
  readonly coordinateDuration: CoordTime;
  readonly totalRapidityChange: Rapidity;
}

export const flipAndBurn = (
  distance: Metres,
  properAcceleration: MetresPerSecondSquared,
): FlipAndBurn => {
  const a = properAcceleration;
  const etaPeak = Math.acosh(1 + (a * distance) / (2 * C * C));
  return {
    etaPeak: rapidity(etaPeak),
    properDuration: properTime((2 * C * etaPeak) / a),
    coordinateDuration: coordTime(((2 * C) / a) * Math.sinh(etaPeak)),
    totalRapidityChange: rapidity(2 * etaPeak),
  };
};

/** The two burn legs as a segment plan; rapidity budget is their |deltaEta| sum. */
export const flipAndBurnSegments = (
  distance: Metres,
  properAcceleration: MetresPerSecondSquared,
): readonly [BurnSegment, BurnSegment] => {
  const { properDuration } = flipAndBurn(distance, properAcceleration);
  const half = properTime(properDuration / 2);
  return [
    { kind: 'burn', properAcceleration, properDuration: half },
    {
      kind: 'burn',
      properAcceleration: metresPerSecondSquared(-properAcceleration),
      properDuration: half,
    },
  ];
};
