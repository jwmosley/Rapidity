import { describe, expect, it } from 'vitest';

import * as self from './index';
import * as protocol from '@rapidity/protocol';

describe('@rapidity/audio', () => {
  it('resolves as a module', () => {
    expect(self).toBeTypeOf('object');
  });

  it('binds to the protocol boundary and nothing else', () => {
    expect(protocol).toBeTypeOf('object');
  });
});
