/**
 * Closed-form segment propagation (PHYSICS.md §2). Nothing is numerically
 * integrated; a loop over time here is a bug by definition (invariant 6).
 */
import {
  C,
  type CoordTime,
  type Metres,
  type MetresPerSecondSquared,
  type ProperTime,
  type Rapidity,
  coordTime,
  metres,
  properTime,
  rapidity,
} from '@rapidity/units';

export interface BurnSegment {
  readonly kind: 'burn';
  readonly properAcceleration: MetresPerSecondSquared;
  readonly properDuration: ProperTime;
}

export interface CoastSegment {
  readonly kind: 'coast';
  readonly properDuration: ProperTime;
}

export type Segment = BurnSegment | CoastSegment;

export interface State {
  readonly rapidity: Rapidity;
  readonly properTime: ProperTime;
  readonly coordinateTime: CoordTime;
  readonly position: Metres;
}

export const INITIAL_STATE: State = {
  rapidity: rapidity(0),
  properTime: properTime(0),
  coordinateTime: coordTime(0),
  position: metres(0),
};

const coastFrom = (state: State, elapsed: number): State => ({
  rapidity: state.rapidity,
  properTime: properTime(state.properTime + elapsed),
  coordinateTime: coordTime(state.coordinateTime + elapsed * Math.cosh(state.rapidity)),
  position: metres(state.position + C * elapsed * Math.sinh(state.rapidity)),
});

const sinhc = (x: number): number => (x === 0 ? 1 : Math.sinh(x) / x);

/**
 * State after `elapsed` of proper time within a segment. `elapsed` may be
 * negative — evaluating a segment's past is how replay rewinds and how the
 * reversibility invariant is stated — and may exceed the segment's duration;
 * callers that care about segment bounds enforce them (see evaluatePlan).
 */
export const evaluateWithin = (state: State, segment: Segment, elapsed: ProperTime): State => {
  switch (segment.kind) {
    case 'coast':
      return coastFrom(state, elapsed);
    case 'burn': {
      // PHYSICS.md §2.3's sum-to-product forms, regrouped so nothing divides
      // by the acceleration: (c/a)·(sinh eta1 − sinh eta0) is algebraically
      // dtau·cosh(etaMid)·sinhc(deltaEta/2). The naive grouping turns a
      // denormal acceleration into (c/a)=Infinity times an underflowed 0 — a
      // NaN the reversibility property caught. This form also degrades to the
      // exact coast expressions as a → 0, so zero thrust needs no special case.
      const deltaEta = (segment.properAcceleration * elapsed) / C;
      const halfDelta = deltaEta / 2;
      const etaMid = state.rapidity + halfDelta;
      const stretch = sinhc(halfDelta);
      return {
        rapidity: rapidity(state.rapidity + deltaEta),
        properTime: properTime(state.properTime + elapsed),
        coordinateTime: coordTime(
          state.coordinateTime + elapsed * Math.cosh(etaMid) * stretch,
        ),
        position: metres(state.position + C * elapsed * Math.sinh(etaMid) * stretch),
      };
    }
  }
};

export const propagateSegment = (state: State, segment: Segment): State =>
  evaluateWithin(state, segment, segment.properDuration);

export const propagatePlan = (initial: State, plan: readonly Segment[]): State =>
  plan.reduce(propagateSegment, initial);

export const planDuration = (plan: readonly Segment[]): ProperTime =>
  properTime(plan.reduce((total, segment) => total + segment.properDuration, 0));

/**
 * State at proper time `tau` measured from `initial`, for tau within the plan.
 * Out-of-range tau is a caller error, not a clamp — what a ship does after its
 * plan ends is sim policy, and clamping silently here would hide it.
 */
export const evaluatePlan = (initial: State, plan: readonly Segment[], tau: ProperTime): State => {
  if (tau < 0 || tau > planDuration(plan)) {
    throw new RangeError(`tau ${tau} outside plan [0, ${planDuration(plan)}]`);
  }
  let state = initial;
  let remaining = tau as number;
  for (const segment of plan) {
    if (remaining <= segment.properDuration) {
      return evaluateWithin(state, segment, properTime(remaining));
    }
    state = propagateSegment(state, segment);
    remaining -= segment.properDuration;
  }
  return state;
};
