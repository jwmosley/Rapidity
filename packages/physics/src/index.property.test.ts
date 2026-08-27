import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

// Harness proof only. The real invariants — the hyperbolic identity, rapidity
// additivity, small-delta-eta stability and the rest of PHYSICS.md §9 — arrive with
// the propagation code in Phase 1. Asserting them here would be testing Math, not us.
describe('@rapidity/physics property harness', () => {
  it('passes a property that holds', () => {
    const details = fc.check(fc.property(fc.double({ noNaN: true }), (x) => typeof x === 'number'));
    expect(details.failed).toBe(false);
    expect(details.numRuns).toBeGreaterThan(0);
  });

  it('finds and shrinks a counterexample to a property that does not', () => {
    const details = fc.check(fc.property(fc.integer({ min: 0, max: 1000 }), (n) => n < 500));
    expect(details.failed).toBe(true);
    expect(details.counterexample?.[0]).toBe(500);
  });
});
