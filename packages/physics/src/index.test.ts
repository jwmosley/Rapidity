import { describe, expect, it } from 'vitest';

import * as self from './index';
import * as units from '@rapidity/units';

describe('@rapidity/physics', () => {
  it('resolves as a module', () => {
    expect(self).toBeTypeOf('object');
  });

  it('resolves its declared dependency', () => {
    expect(units).toBeTypeOf('object');
  });
});
