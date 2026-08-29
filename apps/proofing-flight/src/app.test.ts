// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { mountApp } from './app.ts';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(0);
});

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = '';
  document.head.innerHTML = '';
});

describe('proofing shell', () => {
  it('mounts a panel with three flight instruments', () => {
    mountApp(document);
    expect(document.querySelectorAll('[role="meter"]').length).toBe(3);
    expect(document.querySelectorAll('[aria-live="polite"]').length).toBe(1);
    expect(document.querySelector('.panel-title')?.textContent).toBe('Flight');
    expect(document.querySelector('.panel-status')?.textContent).toContain('T+ 0d 00:00:00');
  });

  it('advances the instruments as compressed proper time passes', () => {
    mountApp(document);
    const speed = document.querySelectorAll('[role="meter"]')[0];
    const before = speed?.getAttribute('aria-valuenow');
    // Two wall seconds ≈ 46 compressed days; the polite region throttles to
    // 1 Hz, so this also exercises the coalescing path end to end.
    vi.advanceTimersByTime(2000);
    expect(speed?.getAttribute('aria-valuenow')).not.toBe(before);
    expect(document.querySelector('.panel-status')?.textContent).not.toContain('T+ 0d 00:00:00');
  });
});
