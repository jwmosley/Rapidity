import { describe, expect, it } from 'vitest';

import * as self from './index';
import * as physics from '@rapidity/physics';
import * as protocol from '@rapidity/protocol';

describe('@rapidity/sim', () => {
  it('resolves as a module', () => {
    expect(self).toBeTypeOf('object');
  });

  it('resolves its declared dependencies', () => {
    expect(physics).toBeTypeOf('object');
    expect(protocol).toBeTypeOf('object');
  });
});
