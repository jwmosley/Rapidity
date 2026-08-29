import { describe, expect, it } from 'vitest';

import { coordTime, properTime } from '@rapidity/units';

import type { Command, Telemetry, TelemetryFrame } from './index.ts';

// The protocol rule these types exist to uphold: everything survives a JSON
// round trip, byte for byte in structure.
describe('@rapidity/protocol', () => {
  const telemetry: Telemetry = {
    id: 'core:drive.thrust',
    label: 'Drive Thrust',
    shortLabel: 'THR',
    value: 9_800_000,
    unit: 'N',
    formatted: '9.8 MN',
    spoken: 'drive thrust 9.8 meganewtons',
    quality: 'nominal',
    band: { min: 0, max: 12_000_000, setpoint: 9_800_000 },
    group: 'propulsion',
  };

  const command: Command = {
    verb: 'SET_ACCEL',
    params: { accel: 9.806_65 },
    actor: 'local',
    canonical: 'SET ACCEL 1.0 G',
    issuedAt: properTime(3600),
    sequence: 42,
  };

  const frame: TelemetryFrame = {
    tau: properTime(3600),
    t: coordTime(3612),
    sequence: 7,
    telemetry: [telemetry],
  };

  it('telemetry survives a JSON round trip', () => {
    expect(JSON.parse(JSON.stringify(telemetry))).toEqual(telemetry);
  });

  it('commands survive a JSON round trip', () => {
    expect(JSON.parse(JSON.stringify(command))).toEqual(command);
  });

  it('frames survive a JSON round trip', () => {
    expect(JSON.parse(JSON.stringify(frame))).toEqual(frame);
  });
});
