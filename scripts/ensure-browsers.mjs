/**
 * pnpm lint:a11y needs a real layout engine to measure 320 px reflow, so Chromium is
 * part of the toolchain rather than an optional extra. Installed on demand so a clean
 * checkout satisfies the Tier 2 gate with no separate setup step.
 *
 * A failure here is a warning, not an install failure: lint:a11y reports the missing
 * browser with an actionable message of its own.
 */
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';

if (process.env.RAPIDITY_SKIP_BROWSER_INSTALL === '1') {
  process.stdout.write('ensure-browsers: skipped by RAPIDITY_SKIP_BROWSER_INSTALL\n');
  process.exit(0);
}

const require = createRequire(import.meta.url);

let cli;
try {
  const { chromium } = await import('playwright');
  if (existsSync(chromium.executablePath())) {
    process.stdout.write('ensure-browsers: chromium already present\n');
    process.exit(0);
  }
  cli = require.resolve('playwright/cli.js');
} catch {
  process.stdout.write('ensure-browsers: playwright unavailable, nothing to do\n');
  process.exit(0);
}

process.stdout.write('ensure-browsers: installing chromium for the Tier 2 a11y gate\n');
const { status } = spawnSync(process.execPath, [cli, 'install', 'chromium'], { stdio: 'inherit' });

if (status !== 0) {
  process.stdout.write(
    'ensure-browsers: install failed — run "pnpm exec playwright install chromium" before pnpm lint:a11y\n',
  );
}
