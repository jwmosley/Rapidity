/**
 * Sum-to-product forms for differences of hyperbolics (PHYSICS.md §2.3).
 *
 * The naive sinh(eta1) - sinh(eta0) cancels catastrophically for small deltas —
 * at deltaEta = 1e-12 it keeps about four correct digits. These forms take the
 * half-delta directly (in propagation it is a*dtau/2c, known without any
 * subtraction) and hold full precision across deltaEta down to 1e-12, verified
 * against a 50-digit mpmath reference in hyperbolic.golden.ts.
 */

export const sinhDifference = (eta0: number, deltaEta: number): number =>
  2 * Math.cosh(eta0 + deltaEta / 2) * Math.sinh(deltaEta / 2);

export const coshDifference = (eta0: number, deltaEta: number): number =>
  2 * Math.sinh(eta0 + deltaEta / 2) * Math.sinh(deltaEta / 2);
