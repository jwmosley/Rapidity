/**
 * Spike 6 harness (spike/06-guidepup-nvda branch only) — does Guidepup drive
 * NVDA on a hosted Windows runner, and how flaky is it across repeated runs?
 *
 * Three assertions per iteration, reported separately because they carry
 * different signal:
 *   text  — NVDA reads plain page text at all (baseline; must pass)
 *   meter — the SVG gauge's role="meter" name/value is announced (spike 1 preview)
 *   live  — a polite live region update is announced (the game's one live region;
 *           must pass)
 * An iteration passes when text and live both pass. The full spoken phrase log
 * is printed either way — ACCESSIBILITY.md treats this tier as signal.
 *
 * Env: SR_BROWSER=firefox|chromium (default firefox — the primary reader pairing),
 *      SR_RUNS=<n> (default 1).
 * The runner needs guidepup's environment: guidepup/setup-action in CI. Do not
 * run `npx @guidepup/setup` casually on a dev machine — it reconfigures NVDA
 * and audio system-wide.
 */
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';

import { nvda } from '@guidepup/guidepup';
import { chromium, firefox } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PAGE = pathToFileURL(path.join(ROOT, 'a11y', 'pages', 'sr-spike-gauge.html')).href;

const BROWSER = process.env.SR_BROWSER === 'chromium' ? 'chromium' : 'firefox';
const RUNS = Math.max(1, Number(process.env.SR_RUNS) || 1);
const NAV_STEPS = 10;
const ITERATION_TIMEOUT_MS = 150_000;

function launcher() {
  if (BROWSER === 'chromium') {
    return chromium.launch({ headless: false, args: ['--force-renderer-accessibility'] });
  }
  return firefox.launch({ headless: false });
}

async function iteration(n) {
  let browser;
  let nvdaStarted = false;
  const checks = { text: false, meter: false, live: false };

  try {
    browser = await launcher();
    const page = await browser.newPage();
    await page.goto(PAGE, { waitUntil: 'load' });
    await page.bringToFront();
    await sleep(2_000);

    await nvda.start();
    nvdaStarted = true;
    await sleep(3_000); // let startup speech drain before clearing
    await nvda.clearSpokenPhraseLog();

    for (let i = 0; i < NAV_STEPS; i++) await nvda.next();
    const navLog = await nvda.spokenPhraseLog();
    const nav = navLog.join(' | ');
    checks.text = /coolant loop two/i.test(nav);
    checks.meter = /radiator margin/i.test(nav) && /72/.test(nav);

    await nvda.clearSpokenPhraseLog();
    await page.click('#vent');
    await sleep(4_000); // polite region: give NVDA time to announce
    const liveLog = await nvda.spokenPhraseLog();
    checks.live = /68/.test(liveLog.join(' | '));

    console.log(`\n--- run ${n} navigation log (${navLog.length} phrases) ---`);
    for (const p of navLog) console.log(`  ${p}`);
    console.log(`--- run ${n} live region log (${liveLog.length} phrases) ---`);
    for (const p of liveLog) console.log(`  ${p}`);
  } finally {
    if (nvdaStarted) await nvda.stop().catch((e) => console.error(`nvda.stop: ${e.message}`));
    if (browser) await browser.close().catch(() => {});
  }
  return checks;
}

const results = [];
for (let n = 1; n <= RUNS; n++) {
  console.log(`\n=== run ${n}/${RUNS} — NVDA + ${BROWSER} ===`);
  try {
    const checks = await Promise.race([
      iteration(n),
      sleep(ITERATION_TIMEOUT_MS).then(() => {
        throw new Error(`timed out after ${ITERATION_TIMEOUT_MS / 1000}s`);
      }),
    ]);
    results.push({ n, ...checks, error: null });
  } catch (error) {
    console.error(`run ${n} errored: ${error.message}`);
    if (/not supported|Failed to detect/i.test(error.message)) {
      console.error('hint: this harness expects guidepup/setup-action (CI) to have prepared NVDA');
    }
    results.push({ n, text: false, meter: false, live: false, error: error.message });
  }
}

console.log('\n=== summary ===');
let failures = 0;
for (const r of results) {
  const passed = r.text && r.live;
  if (!passed) failures += 1;
  const mark = (ok) => (ok ? 'pass' : 'FAIL');
  console.log(
    `run ${r.n}: ${passed ? 'PASS' : 'FAIL'}  ` +
      `(text ${mark(r.text)}, meter ${mark(r.meter)} [informational], live ${mark(r.live)})` +
      (r.error ? `  error: ${r.error}` : ''),
  );
}
console.log(`${results.length - failures}/${results.length} runs passed`);
process.exitCode = failures > 0 ? 1 : 0;
