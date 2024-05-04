import { describe, expect, it } from 'vitest';
import { toArray, toString, toStringify } from '../src/libraries/to/index.js';

describe('toArray', () => {
  it('toArray:array', () => {
    expect(toArray([1, 2, 3, 'b', 'c'])).toEqual([1, 2, 3, 'b', 'c']);
  });
  it('toArray:object', () => {
    expect(
      toArray({
        name: 'Elon Musk',
        companies: ['Tesla', 'Space X', 'SolarCity'],
      })
    ).toEqual(['Elon Musk', ['Tesla', 'Space X', 'SolarCity']]);
  });
});

describe('toString', () => {
  it('toString:array', () => {
    expect(toString([1, 2, 3, 4, 5])).toEqual('1,2,3,4,5');
  });
  it('toString:object', () => {
    expect(toString({ id: 1 })).toEqual('[object Object]');
  });
});

describe('toStringify', () => {
  it('toStringify:array', () => {
    expect(toStringify([1, 2, 3, 4, 5])).toEqual('1,2,3,4,5');
  });
  it('toStringify:object', () => {
    expect(toStringify({ id: 1 })).toEqual('{"id":1}');
  });
});
