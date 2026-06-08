import { describe, expect, it } from 'vitest';

describe('test setup', () => {
  it('provides browser shims for component tests', () => {
    expect(window.matchMedia('(min-width: 1px)').matches).toBe(false);
    expect(window.ResizeObserver).toBeDefined();
  });
});
