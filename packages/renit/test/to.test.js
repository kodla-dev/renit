import { describe, expect, it } from 'vitest';
import { pipe } from '../src/helpers/index.js';
import { map } from '../src/libraries/collect/index.js';
import { toArray, toAsync, toJson, toString, toStringify } from '../src/libraries/to/index.js';

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

describe('toAsync', () => {
  it('toAsync:array', async () => {
    let acc = 0;
    for await (const item of toAsync([1, 2, 3, 4, 5])) {
      acc += item;
    }
    expect(acc).toEqual(15);
  });
  it('toAsync:pipe', async () => {
    const result = await pipe(
      [Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)],
      toAsync,
      map(a => a + 10),
      toArray
    );
    expect(result).toEqual([11, 12, 13]);
  });
});

describe('toJson', () => {
  it('toJson:array', () => {
    expect(toJson([1, 2, 3, 'b', 'c'])).toEqual('[1,2,3,"b","c"]');
  });
  it('toJson:object', () => {
    expect(
      toJson({
        id: 384,
        name: 'Rayquaza',
        gender: 'NA',
      })
    ).toEqual('{"id":384,"name":"Rayquaza","gender":"NA"}');
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
