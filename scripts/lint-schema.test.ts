import { describe, expect, it } from 'vitest';

import { lintPaths } from './lint-schema.mjs';

describe('Tier 1 schema lint', () => {
  it('passes the valid fixtures', async () => {
    const { checked, problems } = await lintPaths(['schemas/fixtures/valid']);
    expect(problems).toEqual([]);
    expect(checked.length).toBeGreaterThan(0);
  });

  it('rejects telemetry missing spoken', async () => {
    const { problems } = await lintPaths(['schemas/fixtures/invalid/missing-spoken.telemetry.json']);
    expect(problems.join('\n')).toContain("must have required property 'spoken'");
  });

  it('rejects telemetry missing shortLabel', async () => {
    const { problems } = await lintPaths(['schemas/fixtures/invalid/missing-short-label.telemetry.json']);
    expect(problems.join('\n')).toContain("must have required property 'shortLabel'");
  });

  it('rejects an alert with no defined operator response', async () => {
    const { problems } = await lintPaths(['schemas/fixtures/invalid/alert-without-response.module.json']);
    expect(problems.join('\n')).toContain("must have required property 'response'");
  });

  it('rejects the rapidity: namespace', async () => {
    const { problems } = await lintPaths(['schemas/fixtures/invalid/rapidity-namespace.telemetry.json']);
    expect(problems.join('\n')).toContain('never "rapidity:"');
  });
});
