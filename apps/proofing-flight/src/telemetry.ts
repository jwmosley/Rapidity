/**
 * The display boundary. SI values become player-facing strings here and only
 * here, following the SPEC.md conventions table: speed as `0.9517 c`, time
 * dilation as `EARTH CLOCK 3.26×` — never gamma, never rapidity — and the
 * crew clock as `T+ 412d 06:15:22`.
 */
import { betaOf, gammaOf, type State } from '@rapidity/physics';
import type { Telemetry, TelemetryFrame } from '@rapidity/protocol';
import { C, LIGHT_YEAR, type ProperTime } from '@rapidity/units';

export const SPEED_ID = 'core:flight.speed';
export const EARTH_CLOCK_ID = 'core:flight.earth_clock';
export const DISTANCE_ID = 'core:flight.distance';

const pad = (n: number): string => String(n).padStart(2, '0');

export const formatCrewClock = (tau: ProperTime): string => {
  const total = Math.max(0, Math.floor(tau));
  const days = Math.floor(total / 86_400);
  const hours = Math.floor((total % 86_400) / 3_600);
  const minutes = Math.floor((total % 3_600) / 60);
  const seconds = total % 60;
  return `T+ ${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

export const buildFrame = (state: State, sequence: number): TelemetryFrame => {
  const beta = betaOf(state.rapidity);
  const gamma = gammaOf(state.rapidity);
  const lightYears = state.position / LIGHT_YEAR;

  const telemetry: readonly Telemetry[] = [
    {
      id: SPEED_ID,
      label: 'Speed',
      shortLabel: 'SPD',
      value: beta * C,
      unit: 'm/s',
      formatted: `${beta.toFixed(4)} c`,
      spoken: `speed ${beta.toFixed(4)} c`,
      quality: 'nominal',
      group: 'flight',
    },
    {
      id: EARTH_CLOCK_ID,
      label: 'Earth Clock',
      shortLabel: 'E CLK',
      value: gamma,
      unit: '1',
      formatted: `${gamma.toFixed(2)}×`,
      spoken: `earth clock ${gamma.toFixed(2)} times`,
      quality: 'nominal',
      group: 'flight',
    },
    {
      id: DISTANCE_ID,
      label: 'Distance',
      shortLabel: 'DIST',
      value: state.position,
      unit: 'm',
      formatted: `${lightYears.toFixed(2)} ly`,
      spoken: `distance ${lightYears.toFixed(2)} light years`,
      quality: 'nominal',
      group: 'flight',
    },
  ];

  return {
    tau: state.properTime,
    t: state.coordinateTime,
    sequence,
    telemetry,
  };
};
