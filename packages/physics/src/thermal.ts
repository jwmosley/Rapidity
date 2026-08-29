/**
 * Thermal relations (PHYSICS.md §5). Radiator area is a hull property and sets
 * the ceiling on sustainable thrust — what makes the Thermal page load-bearing.
 */
import {
  SIGMA_SB,
  type Kelvin,
  type MetresPerSecond,
  type Newtons,
  type SquareMetres,
  type Watts,
  type WattsPerSquareMetre,
  squareMetres,
  watts,
  wattsPerSquareMetre,
} from '@rapidity/units';

export const jetPower = (thrust: Newtons, exhaustVelocity: MetresPerSecond): Watts =>
  watts(0.5 * thrust * exhaustVelocity);

export const radiatorFlux = (temperature: Kelvin): WattsPerSquareMetre =>
  wattsPerSquareMetre(SIGMA_SB * temperature ** 4);

export const radiatorArea = (heatLoad: Watts, temperature: Kelvin): SquareMetres =>
  squareMetres(heatLoad / radiatorFlux(temperature));
