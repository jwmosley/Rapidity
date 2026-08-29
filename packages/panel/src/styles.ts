/**
 * High-Performance HMI: grey ground, muted normal state, colour reserved for
 * abnormal conditions and never load-bearing (ACCESSIBILITY.md §9). Sized in
 * rem throughout so browser font-size settings scale the whole instrument —
 * the SVG scales as a unit with its container.
 */
export const GAUGE_CSS = `
.gauge {
  --gauge-ink: #333;
  --gauge-track: #c9c9c9;
  --gauge-band: #8f8f8f;
  --gauge-face: #f2f2f2;
  --gauge-alert: #7a5b00;

  position: relative;
  display: inline-block;
  width: 14rem;
  max-width: 100%;
  padding: 0.25rem;
  background: var(--gauge-face);
  border: 1px solid var(--gauge-band);
  border-radius: 0.25rem;
  color: var(--gauge-ink);
}
.gauge:focus-visible {
  outline: 3px solid var(--gauge-ink);
  outline-offset: 2px;
}
.gauge svg { display: block; width: 100%; height: auto; }
.gauge-track { fill: none; stroke: var(--gauge-track); stroke-width: 12; }
.gauge-band { fill: none; stroke: var(--gauge-band); stroke-width: 4; }
.gauge-setpoint { stroke: var(--gauge-ink); stroke-width: 2; }
.gauge-needle {
  stroke: var(--gauge-ink);
  stroke-width: 4;
  transition: transform 200ms ease-out;
}
.gauge-readout { font-size: 24px; fill: var(--gauge-ink); }
.gauge-short-label {
  display: block;
  text-align: center;
  font-size: 0.85rem;
  letter-spacing: 0.08em;
}
.gauge-quality {
  display: block;
  min-height: 1.4rem;
  text-align: center;
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
}

/* Abnormal states change border weight and pattern as well as colour, and the
   quality badge always carries the state as text. */
.gauge[data-quality='caution'] { border: 3px dashed var(--gauge-alert); }
.gauge[data-quality='warning'] { border: 4px double var(--gauge-alert); }
.gauge[data-quality='caution'] .gauge-quality,
.gauge[data-quality='warning'] .gauge-quality { color: var(--gauge-alert); }
.gauge[data-quality='stale'] .gauge-needle,
.gauge[data-quality='invalid'] .gauge-needle { stroke-dasharray: 6 6; }

@media (prefers-reduced-motion: reduce) {
  .gauge-needle { transition: none; }
}
@media (prefers-contrast: more) {
  .gauge { --gauge-track: #999; --gauge-ink: #000; border-color: #000; }
}
`;
