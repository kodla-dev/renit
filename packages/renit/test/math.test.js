import { describe, expect, it } from 'vitest';
import { add, avg, size, sum } from '../src/libraries/math/index.js';

describe('add', () => {
  it('add:number', () => {
    expect(add(1, 2)).toEqual(3);
  });

  it('add:string', () => {
    expect(add('Hello, ', 'world!')).toEqual('Hello, world!');
  });

  it('add:array', () => {
    expect(add(5, [1, 2, 3])).toEqual([6, 7, 8]);
  });

  it('add:object', () => {
    expect(add(5, { a: 1, b: 2, c: 3 })).toEqual({ a: 6, b: 7, c: 8 });
  });
});

describe('avg', () => {
  it('avg:array', () => {
    expect(avg([1, 2, 3, 4])).toEqual(2.5);
  });

  it('avg:object', () => {
    expect(
      avg('pages', [
        { name: 'Les Miserables', pages: 176 },
        { name: 'My Left Foot', pages: 1096 },
      ])
    ).toEqual(636);
  });

  it('avg:function', () => {
    expect(
      avg(
        book => book.pages,
        [
          { name: 'Les Miserables', pages: 176 },
          { name: 'My Left Foot', pages: 1096 },
        ]
      )
    ).toEqual(636);
  });
});

describe('size', () => {
  it('size:array', () => {
    expect(size([1, 2, 3])).toEqual(3);
  });

  it('size:string', () => {
    expect(size('Newton')).toEqual(6);
  });

  it('size:object', () => {
    expect(size({ name: 'Isaac', lastname: 'Newton' })).toEqual(2);
  });

  it('size:map', () => {
    const map = new Map();
    map.set('a', 1);
    map.set('b', 2);
    map.set('c', 3);
    expect(size(map)).toEqual(3);
  });

  it('size:set', () => {
    expect(size(new Set([1, 2, 3]))).toEqual(3);
  });
});

describe('sum', () => {
  it('sum:array', () => {
    expect(sum([1, 2, 3, 4])).toEqual(10);
  });

  it('sum:object', () => {
    expect(
      sum('pages', [
        { name: 'Les Miserables', pages: 176 },
        { name: 'My Left Foot', pages: 1096 },
      ])
    ).toEqual(1272);
  });

  it('sum:object:nested', () => {
    expect(
      sum('pages.number', [
        { name: 'Les Miserables', pages: { number: 176 } },
        { name: 'My Left Foot', pages: { number: 1096 } },
      ])
    ).toEqual(1272);
  });

  it('sum:function', () => {
    expect(
      sum(
        auth => auth.users.length,
        [
          { type: 'Admin', users: ['Jayden', 'Vanessa'] },
          { type: 'Super', users: ['Noah', 'Brad', 'Kathryn'] },
          { type: 'Editor', users: ['Cindy', 'Larry', 'Nelson', 'Brandie'] },
        ]
      )
    ).toEqual(9);
  });
});
