/**
 * The Phase 2 instrument: an SVG dial gauge with meter semantics. ACCESSIBILITY.md
 * governs every choice here — the component itself never announces anything
 * (invariant 12: the page owns the one polite live region; telemetry is
 * query-driven), colour never carries information alone, and the value renders
 * against its normal band so deviation reads before the number does.
 */
import type { Telemetry } from '@rapidity/protocol';

export interface GaugeOptions {
  /** Dial range in the SI unit of the reading it will display. */
  readonly min: number;
  readonly max: number;
}

export interface Gauge {
  readonly element: HTMLElement;
  update(reading: Telemetry): void;
  /** Current screen-reader form, for the page's query system to speak. */
  spoken(): string;
}

// Dial geometry: a 160° arc, needle pivot at (110, 120), matching the layout
// screen-reader-verified in the Phase 0 spikes.
const SWEEP_DEG = 160;
const CX = 110;
const CY = 120;
const RADIUS = 80;

const angleFor = (fraction: number): number => fraction * SWEEP_DEG - SWEEP_DEG / 2;

const point = (angleDeg: number, radius: number): { x: number; y: number } => {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: CX + radius * Math.sin(rad), y: CY - radius * Math.cos(rad) };
};

const arcPath = (fromDeg: number, toDeg: number, radius: number): string => {
  const from = point(fromDeg, radius);
  const to = point(toDeg, radius);
  return `M ${from.x.toFixed(2)} ${from.y.toFixed(2)} A ${radius} ${radius} 0 0 1 ${to.x.toFixed(2)} ${to.y.toFixed(2)}`;
};

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

export const createGauge = (
  documentRef: Document,
  options: GaugeOptions,
  initial: Telemetry,
): Gauge => {
  const root = documentRef.createElement('div');
  root.className = 'gauge';
  root.setAttribute('role', 'meter');
  root.setAttribute('tabindex', '0');
  root.setAttribute('aria-valuemin', String(options.min));
  root.setAttribute('aria-valuemax', String(options.max));

  root.innerHTML = `
    <svg viewBox="0 0 220 140" aria-hidden="true">
      <path class="gauge-track" d="${arcPath(-SWEEP_DEG / 2, SWEEP_DEG / 2, RADIUS)}" />
      <path class="gauge-band" d="" />
      <line class="gauge-setpoint" x1="0" y1="0" x2="0" y2="0" />
      <line class="gauge-needle" x1="${CX}" y1="${CY - 20}" x2="${CX}" y2="${CY - 72}" />
      <text class="gauge-readout" x="${CX}" y="116" text-anchor="middle"></text>
    </svg>
    <span class="gauge-short-label" aria-hidden="true"></span>
    <span class="gauge-quality"></span>
  `;

  const svgOf = <T extends Element>(selector: string): T => {
    const found = root.querySelector(selector);
    if (!found) throw new Error(`gauge template is missing ${selector}`);
    return found as T;
  };

  const band = svgOf<SVGPathElement>('.gauge-band');
  const setpoint = svgOf<SVGLineElement>('.gauge-setpoint');
  const needle = svgOf<SVGLineElement>('.gauge-needle');
  const readout = svgOf<SVGTextElement>('.gauge-readout');
  const shortLabel = svgOf<HTMLSpanElement>('.gauge-short-label');
  const quality = svgOf<HTMLSpanElement>('.gauge-quality');

  const span = options.max - options.min;
  let current = initial;

  const update = (reading: Telemetry): void => {
    current = reading;

    root.setAttribute('aria-label', reading.label);
    // The true SI value goes to assistive tech even when the dial pegs.
    root.setAttribute('aria-valuenow', String(reading.value));
    root.setAttribute('aria-valuetext', reading.formatted);
    root.setAttribute('data-quality', reading.quality);

    const angle = angleFor(clamp01((reading.value - options.min) / span));
    needle.setAttribute('transform', `rotate(${angle.toFixed(3)} ${CX} ${CY})`);
    readout.textContent = reading.formatted;
    shortLabel.textContent = reading.shortLabel;

    // Quality is conveyed by text and border treatment, never colour alone;
    // nominal stays blank because quiet is the normal state.
    quality.textContent = reading.quality === 'nominal' ? '' : reading.quality;

    if (reading.band) {
      const from = angleFor(clamp01((reading.band.min - options.min) / span));
      const to = angleFor(clamp01((reading.band.max - options.min) / span));
      band.setAttribute('d', arcPath(from, to, RADIUS));
      if (reading.band.setpoint !== undefined) {
        const at = angleFor(clamp01((reading.band.setpoint - options.min) / span));
        const inner = point(at, RADIUS - 10);
        const outer = point(at, RADIUS + 10);
        setpoint.setAttribute('x1', inner.x.toFixed(2));
        setpoint.setAttribute('y1', inner.y.toFixed(2));
        setpoint.setAttribute('x2', outer.x.toFixed(2));
        setpoint.setAttribute('y2', outer.y.toFixed(2));
        setpoint.removeAttribute('hidden');
      } else {
        setpoint.setAttribute('hidden', '');
      }
      band.removeAttribute('hidden');
    } else {
      band.setAttribute('hidden', '');
      setpoint.setAttribute('hidden', '');
    }
  };

  update(initial);

  return {
    element: root,
    update,
    spoken: () => current.spoken,
  };
};
