/**
 * Tier 2 accessibility gate. ACCESSIBILITY.md §2.
 *
 * axe-core plus a 320 CSS px reflow check, blocking on every PR. WCAG 1.4.10 requires
 * reflow at 320 px and that is also the phone layout, so gating reflow means the
 * mobile layout arrives as a byproduct of accessibility work rather than as a port.
 *
 * Usage:  node scripts/lint-a11y.mjs [page.html ...]
 */
import { readdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

import AxeBuilder from '@axe-core/playwright';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PAGE_DIR = path.join(ROOT, 'a11y', 'pages');

const REFLOW_WIDTH = 320;
const REFLOW_HEIGHT = 640;

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function discoverPages() {
  const entries = await readdir(PAGE_DIR, { withFileTypes: true }).catch(() => []);
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.html'))
    .map((entry) => path.join(PAGE_DIR, entry.name))
    .sort();
}

async function auditPage(browser, file) {
  const rel = path.relative(ROOT, file).split(path.sep).join('/');
  const problems = [];

  const context = await browser.newContext({
    viewport: { width: REFLOW_WIDTH, height: REFLOW_HEIGHT },
  });
  const page = await context.newPage();

  try {
    await page.goto(pathToFileURL(file).href, { waitUntil: 'load' });

    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    for (const violation of results.violations) {
      for (const node of violation.nodes) {
        problems.push(`${rel}: [${violation.id}] ${violation.help} — ${node.target.join(' ')}`);
      }
    }

    // WCAG 1.4.10: content reflows to 320 px without two-dimensional scrolling.
    const overflow = await page.evaluate(() => {
      const root = document.documentElement;
      return { scrollWidth: root.scrollWidth, clientWidth: root.clientWidth };
    });
    if (overflow.scrollWidth > overflow.clientWidth + 1) {
      problems.push(
        `${rel}: [reflow] horizontal scrolling at ${REFLOW_WIDTH} px — content is ` +
          `${overflow.scrollWidth} px wide in a ${overflow.clientWidth} px viewport`,
      );
    }
  } finally {
    await context.close();
  }

  return problems;
}

async function main() {
  const explicit = process.argv.slice(2).map((p) => path.resolve(ROOT, p));
  const pages = explicit.length > 0 ? explicit : await discoverPages();

  if (pages.length === 0) {
    process.stdout.write('a11y lint: no pages to audit\n');
    return;
  }

  let browser;
  try {
    browser = await chromium.launch();
  } catch (error) {
    process.stderr.write(
      `a11y lint: could not launch Chromium. Run "pnpm exec playwright install chromium".\n${error.message}\n`,
    );
    process.exitCode = 1;
    return;
  }

  const problems = [];
  try {
    for (const file of pages) problems.push(...(await auditPage(browser, file)));
  } finally {
    await browser.close();
  }

  for (const problem of problems) process.stderr.write(`  FAIL  ${problem}\n`);

  if (problems.length > 0) {
    process.stderr.write(`\na11y lint: ${problems.length} problem(s) across ${pages.length} page(s)\n`);
    process.exitCode = 1;
    return;
  }
  process.stdout.write(`a11y lint: ${pages.length} page(s) OK — axe ${WCAG_TAGS.join('/')} + ${REFLOW_WIDTH} px reflow\n`);
}

await main();
