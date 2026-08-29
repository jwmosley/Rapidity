/**
 * Branded physical-quantity types and exact SI constants. ARCHITECTURE.md §12.
 *
 * Proper time and coordinate time get distinct brands on purpose: the compiler
 * rejecting one where the other belongs removes an entire bug class in a codebase
 * whose central mechanic is that the two clocks disagree.
 */

type Brand<Name extends string> = { readonly __brand: Name };

export type Rapidity = number & Brand<'Rapidity'>;
export type ProperTime = number & Brand<'ProperTime'>;
export type CoordTime = number & Brand<'CoordTime'>;
export type Metres = number & Brand<'Metres'>;
export type MetresPerSecond = number & Brand<'MetresPerSecond'>;
export type MetresPerSecondSquared = number & Brand<'MetresPerSecondSquared'>;
export type Kilograms = number & Brand<'Kilograms'>;
export type Newtons = number & Brand<'Newtons'>;
export type Kelvin = number & Brand<'Kelvin'>;
export type Watts = number & Brand<'Watts'>;
export type WattsPerSquareMetre = number & Brand<'WattsPerSquareMetre'>;
export type WattsPerSquareMetrePerKelvin4 = number & Brand<'WattsPerSquareMetrePerKelvin4'>;
export type SquareMetres = number & Brand<'SquareMetres'>;

export const rapidity = (value: number): Rapidity => value as Rapidity;
export const properTime = (value: number): ProperTime => value as ProperTime;
export const coordTime = (value: number): CoordTime => value as CoordTime;
export const metres = (value: number): Metres => value as Metres;
export const metresPerSecond = (value: number): MetresPerSecond => value as MetresPerSecond;
export const metresPerSecondSquared = (value: number): MetresPerSecondSquared =>
  value as MetresPerSecondSquared;
export const kilograms = (value: number): Kilograms => value as Kilograms;
export const newtons = (value: number): Newtons => value as Newtons;
export const kelvin = (value: number): Kelvin => value as Kelvin;
export const watts = (value: number): Watts => value as Watts;
export const wattsPerSquareMetre = (value: number): WattsPerSquareMetre =>
  value as WattsPerSquareMetre;
export const squareMetres = (value: number): SquareMetres => value as SquareMetres;

// PHYSICS.md §7 — exact values. C, G0, LIGHT_YEAR and AU are exact by definition.
export const C = 299_792_458 as MetresPerSecond;
export const G0 = 9.806_65 as MetresPerSecondSquared;
export const LIGHT_YEAR = 9_460_730_472_580_800 as Metres;
export const AU = 149_597_870_700 as Metres;
export const PARSEC = 3.085_677_581_491_367_3e16 as Metres;
export const SIGMA_SB = 5.670_374_419e-8 as WattsPerSquareMetrePerKelvin4;
