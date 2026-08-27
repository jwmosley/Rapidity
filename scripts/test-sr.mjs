/**
 * Spike 6 harness (spike/06-guidepup-nvda branch only) — does Guidepup drive
 * NVDA on a hosted Windows runner, and how flaky is it across repeated runs?
 *
 * Lessons already baked in from earlier dispatches:
 *   - NVDA starts ONCE per job. Restarting it per iteration left it silent from
 *     the second start onward (run 33052196238: ten empty phrases in runs 2-3).
 *     Guidepup's own suites use one session per job; so will the Tier 3 suite.
 *   - The button is activated through NVDA (`act()`), not a synthetic Playwright
 *     click, so the live-region check exercises the same path a player uses.
 *
 * Three assertions per iteration, reported separately:
 *   text  — NVDA reads plain page text (baseline; must pass)
 *   meter — the SVG gauge's role="meter" name/value announced (informational;
 *           NVDA speaks it as "progress bar")
 *   live  — the polite live region announces the post-activation value (must pass)
 *
 * Env: SR_BROWSER=firefox|chromium (default firefox — the primary reader pairing),
 *      SR_RUNS=<n> (default 1).
 * The runner needs guidepup's environment: guidepup/setup-action plus
 * `npx @guidepup/setup install` in CI. Do not run those casually on a dev
 * machine — they reconfigure NVDA and audio system-wide.
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
const MAX_NAV_STEPS = 12;
const ITERATION_TIMEOUT_MS = 150_000;

function launcher() {
  if (BROWSER === 'chromium') {
    return chromium.launch({ headless: false, args: ['--force-renderer-accessibility'] });
  }
  return firefox.launch({ headless: false });
}

async function iteration(n) {
  let browser;
  const checks = { text: false, meter: false, live: false };

  try {
    browser = await launcher();
    const page = await browser.newPage();
    await page.goto(PAGE, { waitUntil: 'load' });
    await page.bringToFront();
    await sleep(3_000); // window focus + NVDA picking up the new document
    await nvda.clearSpokenPhraseLog();

    // Walk the document until the browse cursor parks on the vent button.
    let onButton = false;
    const navLog = [];
    for (let i = 0; i < MAX_NAV_STEPS && !onButton; i++) {
      await nvda.next();
      const phrase = await nvda.lastSpokenPhrase();
      navLog.push(phrase);
      onButton = /auxiliary vent/i.test(phrase);
    }
    const nav = navLog.join(' | ');
    checks.text = /coolant loop two/i.test(nav);
    checks.meter = /radiator margin/i.test(nav) && /72/.test(nav);

    // Activate through NVDA itself — the same path a player uses — and listen
    // for the polite live region.
    await nvda.clearSpokenPhraseLog();
    let liveLog = [];
    if (onButton) {
      await nvda.act();
      await sleep(5_000); // polite region: give NVDA time to announce
      liveLog = await nvda.spokenPhraseLog();
      checks.live = /68/.test(liveLog.join(' | '));
    }

    console.log(`\n--- run ${n} navigation log (${navLog.length} phrases) ---`);
    for (const p of navLog) console.log(`  ${p}`);
    console.log(`--- run ${n} activation/live log (${liveLog.length} phrases) ---`);
    for (const p of liveLog) console.log(`  ${p}`);
    if (!onButton) console.log(`  (never reached the button; act() skipped)`);
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
  return checks;
}

console.log(`starting NVDA once for ${RUNS} run(s) — NVDA + ${BROWSER}`);
try {
  await nvda.start();
} catch (error) {
  console.error(`nvda.start failed: ${error.message}`);
  console.error('hint: this harness expects guidepup/setup-action + "npx @guidepup/setup install" (CI)');
  process.exit(1);
}
await sleep(3_000); // let startup speech drain

const results = [];
for (let n = 1; n <= RUNS; n++) {
  console.log(`\n=== run ${n}/${RUNS} ===`);
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
    results.push({ n, text: false, meter: false, live: false, error: error.message });
  }
}

await nvda.stop().catch((e) => console.error(`nvda.stop: ${e.message}`));

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
