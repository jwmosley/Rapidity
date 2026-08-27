import { describe, expect, it } from 'vitest';

import * as self from './index';
import * as audio from '@rapidity/audio';
import * as panel from '@rapidity/panel';
import * as sim from '@rapidity/sim';

describe('@rapidity/proofing-flight', () => {
  it('resolves as a module', () => {
    expect(self).toBeTypeOf('object');
  });

  it('composes the sim, panel and audio surfaces', () => {
    expect([sim, panel, audio].every((m) => typeof m === 'object')).toBe(true);
  });
});
