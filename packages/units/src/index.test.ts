import { describe, expect, it } from 'vitest';

import {
  AU,
  C,
  G0,
  LIGHT_YEAR,
  type CoordTime,
  type ProperTime,
  coordTime,
  metres,
  properTime,
  rapidity,
} from './index';

describe('@rapidity/units', () => {
  it('constructors are identity at runtime', () => {
    expect(rapidity(1.8490)).toBe(1.8490);
    expect(metres(4.37 * LIGHT_YEAR)).toBe(4.37 * LIGHT_YEAR);
    expect(properTime(0)).toBe(0);
    expect(coordTime(0)).toBe(0);
  });

  it('constants carry their exact defined values', () => {
    expect(C).toBe(299_792_458);
    expect(G0).toBe(9.806_65);
    expect(LIGHT_YEAR).toBe(9_460_730_472_580_800);
    expect(AU).toBe(149_597_870_700);
    // LIGHT_YEAR is c times the Julian year, exactly.
    expect(LIGHT_YEAR).toBe(C * 31_557_600);
  });

  it('proper and coordinate time do not interchange', () => {
    const takesCoord = (_t: CoordTime): true => true;
    const takesProper = (_t: ProperTime): true => true;
    // @ts-expect-error proper time must not pass as coordinate time
    expect(takesCoord(properTime(1))).toBe(true);
    // @ts-expect-error coordinate time must not pass as proper time
    expect(takesProper(coordTime(1))).toBe(true);
  });
});
