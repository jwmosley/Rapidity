/**
 * Renders the real panel components into static pages for the Tier 2 gate.
 * The pages are generated fresh on every lint:a11y run (and gitignored), so
 * what axe audits can never drift from what the package ships. Node runs the
 * package's TypeScript directly via type stripping — no build step.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { Window } from 'happy-dom';

import { GAUGE_CSS, PANEL_CSS, createGauge, createPanel } from '../packages/panel/src/index.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PAGE_DIR = path.join(ROOT, 'a11y', 'pages');

const PAGE_CSS = `
body { font-family: system-ui, sans-serif; margin: 1rem; max-width: 40rem; }
section { margin: 1rem 0; }
`;

const reading = (overrides = {}) => {
  const base = {
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
  };
  if (base.band === undefined) delete base.band;
  return base;
};

const newDocument = (title) => {
  const window = new Window();
  const document = window.document;
  document.documentElement.setAttribute('lang', 'en');
  document.head.innerHTML = `
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>${PAGE_CSS}${GAUGE_CSS}${PANEL_CSS}</style>
  `;
  return document;
};

const writePage = async (name, document) => {
  const target = path.join(PAGE_DIR, name);
  await writeFile(target, `<!doctype html>\n${document.documentElement.outerHTML}\n`);
  return path.relative(ROOT, target);
};

await mkdir(PAGE_DIR, { recursive: true });
const built = [];

// Page 1: the gauge in isolation, across its quality states.
{
  const document = newDocument('Rapidity — gauge audit page');
  document.body.innerHTML = '<h1>Gauge audit page</h1>';
  const states = [
    ['Nominal with band and setpoint', reading()],
    ['Caution', reading({ value: 1.5e11, formatted: '150 GW', quality: 'caution' })],
    ['Stale, no band', reading({ quality: 'stale', band: undefined })],
  ];
  for (const [title, telemetry] of states) {
    const section = document.createElement('section');
    const heading = document.createElement('h2');
    heading.textContent = title;
    section.appendChild(heading);
    section.appendChild(createGauge(document, { min: 0, max: 2e11 }, telemetry).element);
    document.body.appendChild(section);
  }
  built.push(await writePage('gauge.html', document));
}

// Page 2: the composed panel — application region, status and alert channels,
// instruments mounted with query keys.
{
  const document = newDocument('Rapidity — panel audit page');
  document.body.innerHTML = '<h1>Panel audit page</h1><p>Ordinary document territory.</p>';
  const panel = createPanel(document, { label: 'Thermal' });
  panel.addInstrument('r', createGauge(document, { min: 0, max: 2e11 }, reading()).element);
  panel.addInstrument(
    's',
    createGauge(
      document,
      { min: 0, max: 2e11 },
      reading({
        id: 'core:thermal.radiator_load',
        label: 'Radiator Load',
        shortLabel: 'RAD LOAD',
        value: 1.5e11,
        formatted: '150 GW',
        spoken: 'radiator load 150 gigawatts',
        quality: 'caution',
      }),
    ).element,
  );
  panel.setClock('T+ 412d 06:15:22');
  document.body.appendChild(panel.element);
  built.push(await writePage('panel.html', document));
}

console.log(`built ${built.join(', ')}`);
