import { describe, expect, it } from 'vitest';

import * as self from './index';

describe('@rapidity/units', () => {
  it('resolves as a module', () => {
    expect(self).toBeTypeOf('object');
  });
});
