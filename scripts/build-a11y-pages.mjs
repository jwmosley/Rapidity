/**
 * Renders the real panel components into static pages for the Tier 2 gate.
 * The pages are generated fresh on every lint:a11y run (and gitignored), so
 * what axe audits can never drift from what the package ships. Node 24 runs
 * the package's TypeScript directly via type stripping — no build step.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { Window } from 'happy-dom';

import { GAUGE_CSS, createGauge } from '../packages/panel/src/index.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PAGE_DIR = path.join(ROOT, 'a11y', 'pages');

const PAGE_CSS = `
body { font-family: system-ui, sans-serif; margin: 1rem; max-width: 40rem; }
section { margin: 1rem 0; }
`;

const reading = (overrides = {}) => ({
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

const window = new Window();
const document = window.document;

document.documentElement.setAttribute('lang', 'en');
document.head.innerHTML = `
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Rapidity — gauge audit page</title>
  <style>${PAGE_CSS}${GAUGE_CSS}</style>
`;

const states = [
  ['Nominal with band and setpoint', reading()],
  ['Caution', reading({ value: 1.5e11, formatted: '150 GW', quality: 'caution' })],
  ['Stale, no band', reading({ quality: 'stale', band: undefined })],
];

document.body.innerHTML = '<h1>Gauge audit page</h1>';
for (const [title, telemetry] of states) {
  const section = document.createElement('section');
  const heading = document.createElement('h2');
  heading.textContent = title;
  section.appendChild(heading);
  if (telemetry.band === undefined) delete telemetry.band;
  section.appendChild(createGauge(document, { min: 0, max: 2e11 }, telemetry).element);
  document.body.appendChild(section);
}

await mkdir(PAGE_DIR, { recursive: true });
const target = path.join(PAGE_DIR, 'gauge.html');
await writeFile(target, `<!doctype html>\n${document.documentElement.outerHTML}\n`);
console.log(`built ${path.relative(ROOT, target)} (${states.length} gauge states)`);
