/**
 * The proofing shell: one panel, three flight instruments, real physics.
 * Sol → Alpha Centauri at 1 g, proper time compressed so the whole flight
 * plays out in about a minute.
 */
import { createGauge, createPanel, GAUGE_CSS, PANEL_CSS, type Gauge } from '@rapidity/panel';
import { flipAndBurnSegments } from '@rapidity/physics';
import { C, G0, LIGHT_YEAR, metres, properTime } from '@rapidity/units';

import { createProofingHost } from './host.ts';
import { DISTANCE_ID, EARTH_CLOCK_ID, SPEED_ID, formatCrewClock } from './telemetry.ts';

const DESTINATION_LY = 4.37;
const COMPRESSION = 2_000_000;

const INSTRUMENTS = [
  { id: SPEED_ID, key: 's', min: 0, max: C as number },
  { id: EARTH_CLOCK_ID, key: 'e', min: 1, max: 4 },
  { id: DISTANCE_ID, key: 'd', min: 0, max: DESTINATION_LY * LIGHT_YEAR },
] as const;

export const mountApp = (documentRef: Document): void => {
  const style = documentRef.createElement('style');
  style.textContent = GAUGE_CSS + PANEL_CSS;
  documentRef.head.appendChild(style);

  const heading = documentRef.createElement('h1');
  heading.textContent = 'Proofing Flight — Sol to Alpha Centauri';
  documentRef.body.appendChild(heading);

  const intro = documentRef.createElement('p');
  intro.textContent =
    'One hull, 1 g flip-and-burn, proper time compressed two-million-fold. ' +
    'Letter keys inside the panel query instruments; Escape leaves.';
  documentRef.body.appendChild(intro);

  const host = createProofingHost({
    plan: flipAndBurnSegments(metres(DESTINATION_LY * LIGHT_YEAR), G0),
    compression: COMPRESSION,
  });

  const panel = createPanel(documentRef, { label: 'Flight' });
  const first = host.evaluateAt(properTime(0));

  const gauges = new Map<string, Gauge>();
  for (const config of INSTRUMENTS) {
    const initial = first.telemetry.find((entry) => entry.id === config.id);
    if (!initial) throw new Error(`frame is missing ${config.id}`);
    const gauge = createGauge(documentRef, { min: config.min, max: config.max }, initial);
    gauges.set(config.id, gauge);
    panel.addInstrument(config.key, gauge.element);
  }

  host.subscribe((frame) => {
    for (const entry of frame.telemetry) gauges.get(entry.id)?.update(entry);
    panel.setClock(formatCrewClock(frame.tau));
  });

  panel.setClock(formatCrewClock(first.tau));
  documentRef.body.appendChild(panel.element);
};
