import { describe, expect, it } from 'vitest';
import { clone, pipe } from '../src/helper/index.js';

describe('pipe', () => {
  it('pipe:default', () => {
    // prettier-ignore
    const result = pipe(
      [1, 2, 3, 4, 5],
      item => item[1]
    );
    expect(result).toBe(2);
  });

  it('pipe:multiple', () => {
    // prettier-ignore
    const result = pipe(
      [1, 2, 3, 4, 5],
      item => item[1],
      item => item + 4,
      item => item / 2
    );
    expect(result).toBe(3);
  });

  it('pipe:promise', async () => {
    // prettier-ignore
    const result = await pipe(
      Promise.resolve([1, 2, 3, 4, 5]),
      item => item[1]
    );
    expect(result).toBe(2);
  });

  it('pipe:return', async () => {
    // prettier-ignore
    const custom = pipe(
      item => item[1],
      item => item + 4,
      item => item / 2
    );
    const result = custom([1, 2, 3, 4, 5]);
    expect(result).toBe(3);
  });

  it('pipe:fn:async:promise', async () => {
    // prettier-ignore
    const custom = pipe(
      async item => item[1],
      async item => item + 4,
      async item => item / 2
    );

    const result2 = await custom(Promise.resolve([33, 22, 11]));
    expect(result2).toBe(13);
  });
});

describe('clone', () => {
  it('clone:array', () => {
    const data = [1, 2];
    const cloned = clone(data);
    data.push(3);
    cloned.push(4);
    expect(data).toEqual([1, 2, 3]);
    expect(cloned).toEqual([1, 2, 4]);
  });

  it('clone:object', () => {
    const data = { book: 10 };
    const cloned = clone(data);
    data.book = 12;
    cloned.book = 9;
    expect(data).toEqual({ book: 12 });
    expect(cloned).toEqual({ book: 9 });
  });
});
