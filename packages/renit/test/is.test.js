import { describe, expect, it, test } from 'vitest';
import {
  isArrayLike,
  isAsync,
  isAsyncIterable,
  isClass,
  isCollect,
  isEqual,
  isIterable,
  isNil,
  isObjects,
  isPrimitive,
  isPromise,
  isRegExp,
  isServer,
  isType,
} from '../src/is/index.js';
import { data } from './data.js';

let entries = Object.entries(data);

describe('isArrayLike', () => {
  for (let [index, [key, value]] of entries.entries()) {
    it(key, () => {
      let fill = false;
      if (
        // prettier-multiline-arrays-next-line-pattern: 4
        [
          'numberString', 'string', 'stringEmpty', 'stringObject',
          'stringObjectEmpty', 'stringObjectNew', 'array', 'arrayNested',
          'arrayEmpty', 'regexString',
        ].includes(key)
      ) {
        fill = true;
      }
      expect(isArrayLike(value)).toBe(fill);
    });
  }
});

describe('isAsync', () => {
  for (let [index, [key, value]] of entries.entries()) {
    it(key, () => {
      let fill = false;
      if (['functionAsync'].includes(key)) {
        fill = true;
      }
      expect(isAsync(value)).toBe(fill);
    });
  }
});

describe('isAsyncIterable', () => {
  for (let [index, [key, value]] of entries.entries()) {
    it(key, () => {
      let fill = false;
      if (['iterableAsync'].includes(key)) {
        fill = true;
      }
      expect(isAsyncIterable(value)).toBe(fill);
    });
  }
});

describe('isClass', () => {
  for (let [index, [key, value]] of entries.entries()) {
    it(key, () => {
      let fill = false;
      if (['class'].includes(key)) {
        fill = true;
      }
      expect(isClass(value)).toBe(fill);
    });
  }
});

describe('isCollect', () => {
  for (let [index, [key, value]] of entries.entries()) {
    it(key, () => {
      let fill = false;
      if (
        // prettier-multiline-arrays-next-line-pattern: 5
        [
          'array', 'arrayNested', 'arrayEmpty', 'object', 'objectNested',
          'objectEmpty', 'iterableAsync', 'objectCreate', 'objectCreateEmpty',
        ].includes(key)
      ) {
        fill = true;
      }
      expect(isCollect(value)).toBe(fill);
    });
  }
});

describe('isEqual', () => {
  for (let [index, [key, value]] of entries.entries()) {
    if (['nan', 'nanNumber', 'nanZero'].includes(key)) return;
    it(key, () => {
      const ent = Object.entries(data);
      expect(isEqual(value, value)).toBe(true);
      expect(isEqual(ent[index], ent[index + 1])).toBe(false);
    });
  }
});

describe('isIterable', () => {
  for (let [index, [key, value]] of entries.entries()) {
    it(key, () => {
      let fill = false;
      if (
        // prettier-multiline-arrays-next-line-pattern: 4 5 5
        [
          'string', 'stringEmpty', 'stringObject', 'stringObjectEmpty',
          'stringObjectNew', 'array', 'arrayNested', 'arrayEmpty', 'map',
          'mapSet', 'set', 'setEmpty', 'regexString', 'numberString',
        ].includes(key)
      ) {
        fill = true;
      }
      expect(isIterable(value)).toBe(fill);
    });
  }
});

describe('isNil', () => {
  for (let [index, [key, value]] of entries.entries()) {
    it(key, () => {
      let fill = false;
      if (['null', 'undefined', 'void0'].includes(key)) {
        fill = true;
      }
      expect(isNil(value)).toBe(fill);
    });
  }
});

describe('isObjects', () => {
  for (let [index, [key, value]] of entries.entries()) {
    it(key, () => {
      let fill = false;
      if (
        // prettier-multiline-arrays-next-line-pattern: 4 4 5 6 5
        [
          'object', 'objectNested', 'objectEmpty', 'iterableAsync',
          'objectCreate', 'objectCreateEmpty', 'numberObjectNew', 'stringObjectNew',
          'array', 'arrayNested', 'arrayEmpty', 'function', 'functionAsync',
          'promise', 'promiseResolve', 'map', 'mapSet', 'set', 'setEmpty',
          'null', 'class', 'classVariable', 'objectCreateNull', 'regex',
          'regexObject', 'error', 'weakMap', 'date',
        ].includes(key)
      ) {
        fill = true;
      }
      expect(isObjects(value)).toBe(fill);
    });
  }
});

describe('isPrimitive', () => {
  for (let [index, [key, value]] of entries.entries()) {
    it(key, () => {
      let fill = false;
      if (
        // prettier-multiline-arrays-next-line-pattern: 4 4 5 6 5 6
        [
          'numberZero', 'number', 'numberObject', 'numberObjectEmpty',
          'numberNegative', 'numberString', 'numberOdd', 'numberEven',
          'float', 'string', 'stringEmpty', 'stringObject', 'stringObjectEmpty',
          'boolean', 'booleanObject', 'true', 'false', 'null', 'undefined',
          'regexString', 'symbol', 'symbolEmpty', 'symbolFor', 'symbolIterator',
          'mathPi', 'nan', 'nanNumber', 'nanZero', 'maxValue', 'maxSafeInteger',
          'infinity', 'dateGetTime', 'void0',
        ].includes(key)
      ) {
        fill = true;
      }
      expect(isPrimitive(value)).toBe(fill);
    });
  }
});

describe('isPromise', () => {
  for (let [index, [key, value]] of entries.entries()) {
    it(key, () => {
      let fill = false;
      if (['promise', 'promiseResolve'].includes(key)) {
        fill = true;
      }
      expect(isPromise(value)).toBe(fill);
    });
  }
});

describe('isRegExp', () => {
  for (let [index, [key, value]] of entries.entries()) {
    it(key, () => {
      let fill = false;
      if (['regex', 'regexObject'].includes(key)) {
        fill = true;
      }
      expect(isRegExp(value)).toBe(fill);
    });
  }
});

test('isServer', () => {
  expect(isServer()).toBe(true);
});

describe('isType', () => {
  for (let [index, [key, value]] of entries.entries()) {
    it(key, () => {
      expect(isType(value)).toEqual(typeHelper(key));
    });
  }
});

function typeHelper(key) {
  // prettier-multiline-arrays-set-line-pattern: 4
  if (
    [
      'numberZero', 'number', 'numberObject', 'numberObjectEmpty',
      'numberObjectNew', 'numberNegative', 'float', 'mathPi',
      'maxValue', 'infinity', 'dateGetTime', 'maxSafeInteger',
      'numberOdd', 'numberEven',
    ].includes(key)
  ) {
    return 'number';
  } else if (
    [
      'string', 'stringEmpty', 'stringObject', 'stringObjectEmpty',
      'stringObjectNew', 'regexString', 'numberString',
    ].includes(key)
  ) {
    return 'string';
  } else if (
    [
      'boolean', 'booleanObject', 'true', 'false',
    ].includes(key)
  ) {
    return 'boolean';
  } else if (
    [
      'array', 'arrayNested', 'arrayEmpty',
    ].includes(key)
  ) {
    return 'array';
  } else if (
    [
      'object', 'objectNested', 'objectEmpty', 'iterableAsync',
      'classVariable', 'objectCreate', 'objectCreateNull', 'objectCreateEmpty',
    ].includes(key)
  ) {
    return 'object';
  } else if (
    [
      'function',
    ].includes(key)
  ) {
    return 'function';
  } else if (
    [
      'functionAsync',
    ].includes(key)
  ) {
    return 'async';
  } else if (
    [
      'promise', 'promiseResolve',
    ].includes(key)
  ) {
    return 'promise';
  } else if (
    [
      'map', 'mapSet',
    ].includes(key)
  ) {
    return 'map';
  } else if (
    [
      'set', 'setEmpty',
    ].includes(key)
  ) {
    return 'set';
  } else if (
    [
      'null',
    ].includes(key)
  ) {
    return 'null';
  } else if (
    [
      'undefined', 'void0',
    ].includes(key)
  ) {
    return 'undefined';
  } else if (
    [
      'class',
    ].includes(key)
  ) {
    return 'class';
  } else if (
    [
      'regex', 'regexObject',
    ].includes(key)
  ) {
    return 'regExp';
  } else if (
    [
      'symbol', 'symbolEmpty', 'symbolFor', 'symbolIterator',
    ].includes(key)
  ) {
    return 'symbol';
  } else if (
    [
      'error',
    ].includes(key)
  ) {
    return 'error';
  } else if (
    [
      'nan', 'nanNumber', 'nanZero',
    ].includes(key)
  ) {
    return 'NaN';
  } else if (
    [
      'weakMap',
    ].includes(key)
  ) {
    return 'weakMap';
  } else if (
    [
      'date',
    ].includes(key)
  ) {
    return 'date';
  }
}
