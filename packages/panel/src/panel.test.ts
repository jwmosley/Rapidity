// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createPanel } from './panel.ts';

const build = () => {
  const panel = createPanel(document, { label: 'Thermal' });
  document.body.appendChild(panel.element);
  return panel;
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(0);
});

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('live region discipline (invariant 12)', () => {
  it('has exactly one polite region and one assertive channel', () => {
    const panel = build();
    expect(panel.element.querySelectorAll('[aria-live="polite"]').length).toBe(1);
    expect(panel.element.querySelectorAll('[aria-live="assertive"]').length).toBe(1);
  });

  it('the polite region holds clock and mode only', () => {
    const panel = build();
    panel.setClock('T+ 412d 06:15:22');
    expect(panel.element.querySelector('.panel-status')?.textContent).toBe(
      'T+ 412d 06:15:22 — Document mode.',
    );
  });

  it('never updates a live region faster than 1 Hz', () => {
    const panel = build();
    const status = panel.element.querySelector('.panel-status');
    panel.setClock('T+ 0d 00:00:01');
    expect(status?.textContent).toContain('00:00:01');

    vi.setSystemTime(300);
    panel.setClock('T+ 0d 00:00:02');
    expect(status?.textContent).toContain('00:00:01');

    vi.setSystemTime(600);
    panel.setClock('T+ 0d 00:00:03');
    expect(status?.textContent).toContain('00:00:01');

    vi.advanceTimersByTime(1000);
    // The window reopens with the newest value; the middle one never speaks.
    expect(status?.textContent).toContain('00:00:03');
  });

  it('rate-limits the assertive channel the same way', () => {
    const panel = build();
    const alert = panel.element.querySelector('.panel-alert');
    panel.announceAlert('caution', 'radiator margin low');
    panel.announceAlert('warning', 'radiator margin critical');
    expect(alert?.textContent).toBe('radiator margin low');
    vi.advanceTimersByTime(1000);
    expect(alert?.textContent).toBe('radiator margin critical');
  });
});

describe('application region scope and escape (§4)', () => {
  it('scopes role=application to the instrument region, not the document', () => {
    const panel = build();
    expect(document.documentElement.getAttribute('role')).toBeNull();
    expect(document.body.getAttribute('role')).toBeNull();
    const region = panel.element.querySelector('.panel-region');
    expect(region?.getAttribute('role')).toBe('application');
    expect(region?.getAttribute('aria-label')).toBe('Thermal');
  });

  it('announces mode changes as focus crosses the boundary', () => {
    const panel = build();
    const region = panel.element.querySelector('.panel-region');
    const status = panel.element.querySelector('.panel-status');

    region?.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(status?.textContent).toBe('Panel mode. Letter keys query instruments. Escape leaves.');

    vi.advanceTimersByTime(1000);
    region?.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    expect(status?.textContent).toBe('Document mode.');
  });

  it('Escape moves focus out to the panel title', () => {
    const panel = build();
    const instrument = document.createElement('div');
    instrument.setAttribute('tabindex', '0');
    panel.addInstrument('r', instrument);
    instrument.focus();

    instrument.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
    expect(document.activeElement?.className).toBe('panel-title');
  });
});

describe('query-driven telemetry (§5)', () => {
  it('a letter key focuses its instrument — focus announcement is the response', () => {
    const panel = build();
    const radiator = document.createElement('div');
    radiator.setAttribute('tabindex', '0');
    const speed = document.createElement('div');
    speed.setAttribute('tabindex', '0');
    panel.addInstrument('r', radiator);
    panel.addInstrument('s', speed);

    const region = panel.element.querySelector('.panel-region');
    region?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'r', bubbles: true, cancelable: true }),
    );
    expect(document.activeElement).toBe(radiator);

    region?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'S', bubbles: true, cancelable: true }),
    );
    expect(document.activeElement).toBe(speed);
  });

  it('rejects multi-character and duplicate query keys loudly', () => {
    const panel = build();
    const el = document.createElement('div');
    panel.addInstrument('r', el);
    expect(() => panel.addInstrument('r', document.createElement('div'))).toThrow(/already bound/);
    expect(() => panel.addInstrument('rr', document.createElement('div'))).toThrow(
      /single letter/,
    );
  });
});
