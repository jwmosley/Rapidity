// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import type { Telemetry } from '@rapidity/protocol';

import { createGauge } from './gauge.ts';

const reading = (overrides: Partial<Telemetry> = {}): Telemetry => ({
  id: 'core:thermal.radiator_margin',
  label: 'Radiator Margin',
  shortLabel: 'RAD MRG',
  value: 7.2e10,
  unit: 'W',
  formatted: '72 GW',
  spoken: 'radiator margin 72 gigawatts',
  quality: 'nominal',
  band: { min: 3e10, max: 1.4e11, setpoint: 9e10 },
  group: 'thermal',
  ...overrides,
});

const options = { min: 0, max: 2e11 };

describe('gauge semantics', () => {
  it('exposes meter role, name, range and current value', () => {
    const gauge = createGauge(document, options, reading());
    const el = gauge.element;
    expect(el.getAttribute('role')).toBe('meter');
    expect(el.getAttribute('aria-label')).toBe('Radiator Margin');
    expect(el.getAttribute('aria-valuemin')).toBe('0');
    expect(el.getAttribute('aria-valuemax')).toBe('200000000000');
    expect(el.getAttribute('aria-valuenow')).toBe('72000000000');
    expect(el.getAttribute('aria-valuetext')).toBe('72 GW');
  });

  it('is keyboard reachable and its SVG is decoration', () => {
    const gauge = createGauge(document, options, reading());
    expect(gauge.element.getAttribute('tabindex')).toBe('0');
    expect(gauge.element.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('updates value, needle and readout together', () => {
    const gauge = createGauge(document, options, reading());
    const needle = gauge.element.querySelector('.gauge-needle');
    const before = needle?.getAttribute('transform');
    gauge.update(reading({ value: 1.4e11, formatted: '140 GW' }));
    expect(gauge.element.getAttribute('aria-valuenow')).toBe('140000000000');
    expect(gauge.element.getAttribute('aria-valuetext')).toBe('140 GW');
    expect(gauge.element.querySelector('.gauge-readout')?.textContent).toBe('140 GW');
    expect(needle?.getAttribute('transform')).not.toBe(before);
  });

  it('pegs the needle but reports the true value when the reading leaves the dial', () => {
    const gauge = createGauge(document, options, reading({ value: 9e11, formatted: '900 GW' }));
    expect(gauge.element.getAttribute('aria-valuenow')).toBe('900000000000');
    expect(gauge.element.querySelector('.gauge-needle')?.getAttribute('transform')).toContain(
      'rotate(80',
    );
  });
});

describe('quality is never colour alone', () => {
  it('nominal shows no badge — quiet is the normal state', () => {
    const gauge = createGauge(document, options, reading());
    expect(gauge.element.querySelector('.gauge-quality')?.textContent).toBe('');
    expect(gauge.element.getAttribute('data-quality')).toBe('nominal');
  });

  it('abnormal states carry the quality as visible text', () => {
    const gauge = createGauge(document, options, reading({ quality: 'caution' }));
    expect(gauge.element.querySelector('.gauge-quality')?.textContent).toBe('caution');
    expect(gauge.element.getAttribute('data-quality')).toBe('caution');
  });
});

describe('band and setpoint', () => {
  it('renders the normal band and setpoint markers', () => {
    const gauge = createGauge(document, options, reading());
    expect(gauge.element.querySelector('.gauge-band')?.hasAttribute('hidden')).toBe(false);
    expect(gauge.element.querySelector('.gauge-setpoint')?.hasAttribute('hidden')).toBe(false);
  });

  it('hides both when the reading has no band', () => {
    const base = reading();
    const { band: _band, ...withoutBand } = base;
    const gauge = createGauge(document, options, withoutBand as Telemetry);
    expect(gauge.element.querySelector('.gauge-band')?.hasAttribute('hidden')).toBe(true);
    expect(gauge.element.querySelector('.gauge-setpoint')?.hasAttribute('hidden')).toBe(true);
  });
});

describe('announcement discipline', () => {
  it('contains no live region — the page owns the only one (invariant 12)', () => {
    const gauge = createGauge(document, options, reading());
    expect(gauge.element.querySelectorAll('[aria-live]').length).toBe(0);
  });

  it('offers its spoken form for the query system instead', () => {
    const gauge = createGauge(document, options, reading());
    gauge.update(reading({ spoken: 'radiator margin 140 gigawatts' }));
    expect(gauge.spoken()).toBe('radiator margin 140 gigawatts');
  });

  it('uses no title attributes — hover is never an affordance', () => {
    const gauge = createGauge(document, options, reading());
    expect(gauge.element.querySelectorAll('[title]').length).toBe(0);
  });
});
