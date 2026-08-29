/**
 * A stand-in SimHost for the proofing shell: closed-form evaluation of a fixed
 * plan against a compressed wall clock, emitting frames at 1 Hz. The real
 * hosts — with the command log, checkpoints and workers — are @rapidity/sim's
 * Phase 3 work; this exists so the panel can be flown against real physics
 * today, through the same interface it will keep.
 */
import { INITIAL_STATE, evaluatePlan, planDuration, type Segment } from '@rapidity/physics';
import type { Command, SimHost, TelemetryFrame } from '@rapidity/protocol';
import { properTime, type ProperTime } from '@rapidity/units';

import { buildFrame } from './telemetry.ts';

export interface ProofingHostOptions {
  readonly plan: readonly Segment[];
  /** Proper seconds advanced per wall-clock second. */
  readonly compression: number;
}

export const createProofingHost = (options: ProofingHostOptions): SimHost => {
  const total = planDuration(options.plan);
  const started = Date.now();
  let sequence = 0;
  const listeners = new Set<(frame: TelemetryFrame) => void>();
  let timer: ReturnType<typeof setInterval> | null = null;

  const frameAt = (tau: ProperTime): TelemetryFrame => {
    // The shell holds at arrival; what a ship does after its plan ends is
    // Phase 3 sim policy, not physics.
    const clamped = properTime(Math.min(Math.max(0, tau), total));
    return buildFrame(evaluatePlan(INITIAL_STATE, options.plan, clamped), sequence++);
  };

  const now = (): ProperTime =>
    properTime(((Date.now() - started) / 1000) * options.compression);

  return {
    send: (_command: Command) => {
      // Commands arrive with the Phase 3 sim; the proofing plan is fixed.
    },
    subscribe: (onFrame) => {
      listeners.add(onFrame);
      timer ??= setInterval(() => {
        const frame = frameAt(now());
        for (const listener of listeners) listener(frame);
      }, 1000);
      return () => {
        listeners.delete(onFrame);
        if (listeners.size === 0 && timer !== null) {
          clearInterval(timer);
          timer = null;
        }
      };
    },
    evaluateAt: (tau) => frameAt(tau),
  };
};
