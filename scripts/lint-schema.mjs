/**
 * Tier 1 accessibility gate. ACCESSIBILITY.md §2.
 *
 * Blocking on every PR, and the highest-leverage gate in the project: enforcing the
 * accessibility contract at the content boundary means no third-party pack can ship
 * an inaccessible instrument. Auditing after the fact costs orders of magnitude more.
 *
 * Usage:  node scripts/lint-schema.mjs [path ...]
 * Exits non-zero on the first content file that fails.
 */
import { readFile, readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import Ajv2020 from 'ajv/dist/2020.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCHEMA_DIR = path.join(ROOT, 'schemas');

/** Filename suffix selects the schema. `foo.telemetry.json` is validated as Telemetry. */
const SUFFIX_TO_SCHEMA = {
  '.telemetry.json': 'telemetry.schema.json',
  '.command.json': 'command.schema.json',
  '.module.json': 'module.schema.json',
};

/** Content roots linted by default. Fixtures are included so the gate is self-testing. */
const DEFAULT_ROOTS = [
  'schemas/fixtures/valid',
  'packages/catalog/content',
  'packages/protocol/content',
  'apps/proofing-flight/content',
];

async function buildValidator() {
  const ajv = new Ajv2020({ allErrors: true, strict: true, allowUnionTypes: true });
  for (const file of ['telemetry.schema.json', 'command.schema.json', 'module.schema.json']) {
    ajv.addSchema(JSON.parse(await readFile(path.join(SCHEMA_DIR, file), 'utf8')));
  }
  return ajv;
}

async function collect(target) {
  const abs = path.resolve(ROOT, target);
  let info;
  try {
    info = await stat(abs);
  } catch {
    return [];
  }
  if (info.isFile()) return abs.endsWith('.json') ? [abs] : [];

  const found = [];
  for (const entry of await readdir(abs, { withFileTypes: true })) {
    found.push(...(await collect(path.join(abs, entry.name))));
  }
  return found;
}

function schemaFor(file) {
  const base = path.basename(file);
  for (const [suffix, schema] of Object.entries(SUFFIX_TO_SCHEMA)) {
    if (base.endsWith(suffix)) return schema;
  }
  return null;
}

/**
 * CLAUDE.md §7 and ARCHITECTURE.md §11. The project name is deliberately absent from
 * every durable identifier so a rename breaks zero saves. JSON Schema's id pattern
 * cannot express this, so it is checked here.
 */
function forbiddenNamespaces(value, trail = '$') {
  const problems = [];
  if (Array.isArray(value)) {
    value.forEach((item, i) => problems.push(...forbiddenNamespaces(item, `${trail}[${i}]`)));
  } else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (key === 'id' && typeof child === 'string' && child.startsWith('rapidity:')) {
        problems.push(`${trail}.id is "${child}" — the first-party namespace is "core:", never "rapidity:"`);
      }
      problems.push(...forbiddenNamespaces(child, `${trail}.${key}`));
    }
  }
  return problems;
}

/** @returns {Promise<{checked: string[], problems: string[]}>} */
export async function lintPaths(targets) {
  const ajv = await buildValidator();
  const checked = [];
  const problems = [];

  for (const target of targets) {
    for (const file of await collect(target)) {
      const rel = path.relative(ROOT, file).split(path.sep).join('/');
      const schemaId = schemaFor(file);
      if (!schemaId) {
        problems.push(`${rel}: no schema for this filename. Expected one of ${Object.keys(SUFFIX_TO_SCHEMA).join(', ')}`);
        continue;
      }

      let document;
      try {
        document = JSON.parse(await readFile(file, 'utf8'));
      } catch (error) {
        problems.push(`${rel}: not parseable as JSON — ${error.message}`);
        continue;
      }

      checked.push(rel);
      const validate = ajv.getSchema(`https://rapidity.dev/schemas/${schemaId}`);
      if (!validate(document)) {
        for (const error of validate.errors ?? []) {
          problems.push(`${rel}: ${error.instancePath || '/'} ${error.message}`);
        }
      }
      problems.push(...forbiddenNamespaces(document).map((p) => `${rel}: ${p}`));
    }
  }

  return { checked, problems };
}

async function main() {
  const targets = process.argv.slice(2);
  const { checked, problems } = await lintPaths(targets.length > 0 ? targets : DEFAULT_ROOTS);

  for (const problem of problems) process.stderr.write(`  FAIL  ${problem}\n`);

  if (problems.length > 0) {
    process.stderr.write(`\nschema lint: ${problems.length} problem(s) across ${checked.length} file(s)\n`);
    process.exitCode = 1;
    return;
  }
  process.stdout.write(`schema lint: ${checked.length} file(s) OK\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
