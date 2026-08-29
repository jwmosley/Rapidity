/**
 * Rapidity is the state variable (PHYSICS.md §1). Everything else — beta, gamma,
 * velocity — is derived on demand and never stored: beta in f64 loses six digits
 * to leading nines by gamma = 1000, while eta stays an ordinary number
 * (docs/spikes/05-rapidity-precision.md).
 */
import { C, type MetresPerSecond, type Rapidity, metresPerSecond, rapidity } from '@rapidity/units';

export const gammaOf = (eta: Rapidity): number => Math.cosh(eta);

export const betaOf = (eta: Rapidity): number => Math.tanh(eta);

export const betaGammaOf = (eta: Rapidity): number => Math.sinh(eta);

export const velocityOf = (eta: Rapidity): MetresPerSecond =>
  metresPerSecond(C * Math.tanh(eta));

export const rapidityOfVelocity = (velocity: MetresPerSecond): Rapidity =>
  rapidity(Math.atanh(velocity / C));

export const rapidityOfGamma = (gamma: number): Rapidity => rapidity(Math.acosh(gamma));

// Boost composition is addition in eta. This is the whole point of the choice.
export const composeRapidities = (a: Rapidity, b: Rapidity): Rapidity => rapidity(a + b);
