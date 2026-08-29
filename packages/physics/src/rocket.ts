/**
 * The relativistic rocket equation (PHYSICS.md §4). Rapidity budget is the
 * currency: deltaEta = (ve/c) ln(m0/m1). This exponential is the core gameplay
 * tension — the flight planner exists to expose it.
 */
import {
  C,
  type Kilograms,
  type MetresPerSecond,
  type Rapidity,
  kilograms,
  rapidity,
} from '@rapidity/units';

export const massRatio = (deltaEta: Rapidity, exhaustVelocity: MetresPerSecond): number =>
  Math.exp((deltaEta * C) / exhaustVelocity);

export const finalMass = (
  initialMass: Kilograms,
  deltaEta: Rapidity,
  exhaustVelocity: MetresPerSecond,
): Kilograms => kilograms(initialMass * Math.exp(-(deltaEta * C) / exhaustVelocity));

export const rapidityBudget = (
  initialMass: Kilograms,
  finalMass: Kilograms,
  exhaustVelocity: MetresPerSecond,
): Rapidity => rapidity((exhaustVelocity / C) * Math.log(initialMass / finalMass));
