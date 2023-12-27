import { describe, it, expect } from 'vitest';
import { isArray } from 'renit/is';

const asyncIterable = {
  [Symbol.asyncIterator]: async function* () {
    yield 1;
    yield 2;
    yield 3;
  }
};

class Router {
  constructor() {
    this.routes = {};
  }
}

const router = new Router();

const data = {
  numberZero: 0,
  number: 1,
  numberObject: Number(1),
  numberObjectEmpty: Number(0),
  numberObjectNew: new Number(0),
  numberNegative: -1,
  numberString: '5',
  numberOdd: 1,
  numberEven: 2,
  float: 34.5,
  string: 'ABC',
  stringEmpty: '',
  stringObject: String('foo'),
  stringObjectEmpty: String(''),
  stringObjectNew: new String(''),
  boolean: true || false,
  booleanObject: Boolean(1),
  array: [1, 2, 3],
  arrayNested: [1, 2, 3, [4, 5]],
  arrayEmpty: [],
  object: { name: 'is' },
  objectNested: { name: 'is', library: { name: 'kodla' } },
  objectEmpty: {},
  function: () => {},
  functionAsync: async () => {},
  promise: new Promise(() => {}),
  promiseResolve: Promise.resolve([1, 2, 3]),
  map: new Map(),
  mapSet: new Map().set('foo', 'bar'),
  set: new Set([1, 2, 3]),
  setEmpty: new Set(),
  iterableAsync: asyncIterable,
  true: true,
  false: false,
  null: null,
  undefined: undefined,
  class: Router,
  classVariable: router,
  objectCreate: Object.create({ name: 'bar' }),
  objectCreateNull: Object.create(null),
  objectCreateEmpty: Object.create({}),
  regex: /s+/g,
  regexObject: new RegExp('s+', 'g'),
  regexString: '/s+/g',
  symbol: Symbol('foo'),
  symbolEmpty: Symbol(),
  symbolFor: Symbol.for('foo'),
  symbolIterator: Symbol.iterator,
  error: new Error(),
  mathPi: Math.PI,
  nan: NaN,
  nanNumber: Number.NaN,
  nanZero: 0 / 0,
  maxValue: Number.MAX_VALUE,
  maxSafeInteger: Number.MAX_SAFE_INTEGER,
  infinity: Infinity,
  weakMap: new WeakMap(),
  date: new Date(),
  dateGetTime: new Date().getTime(),
  void0: void 0
};

const fns = [
  {
    name: 'isArray',
    function: isArray,
    true: ['array', 'arrayEmpty', 'arrayNested']
  }
];

let entries = Object.entries(data);

fns.forEach((fn) => {
  describe(fn.name, () => {
    if (fn.toBeTypeOf) {
      it(fn.name, () => {
        expect(fn.function()).toBeTypeOf(fn.toBeTypeOf);
      });
    } else {
      for (let [index, [key, value]] of entries.entries()) {
        it(key, () => {
          if (fn.equal) {
            const ent = Object.entries(data);
            expect(fn.function(value, value)).toBe(true);
            expect(fn.function(ent[index], ent[index + 1])).toBe(false);
          } else if (fn.key) {
            if (fn.true.includes(key)) {
              expect(fn.function('name', value)).toBe(true);
            } else {
              expect(fn.function('name', value)).toBe(false);
            }
          } else if (fn.type) {
            expect(fn.function(value)).toEqual(typeHelper(key));
          } else {
            let fill = false;
            if (fn.true.includes(key)) {
              fill = true;
            }

            if (fn.disable) {
              if (!fn.disable.includes(key)) {
                expect(fn.function(value)).toBe(fill);
              }
            } else {
              expect(fn.function(value)).toBe(fill);
            }
          }
        });
      }
    }
  });
});

function typeHelper(key) {
  if (
    [
      'numberZero',
      'number',
      'numberObject',
      'numberObjectEmpty',
      'numberObjectNew',
      'numberNegative',
      'float',
      'mathPi',
      'maxValue',
      'infinity',
      'dateGetTime',
      'maxSafeInteger',
      'numberOdd',
      'numberEven'
    ].includes(key)
  ) {
    return 'number';
  } else if (
    [
      'string',
      'stringEmpty',
      'stringObject',
      'stringObjectEmpty',
      'stringObjectNew',
      'regexString',
      'numberString'
    ].includes(key)
  ) {
    return 'string';
  } else if (['boolean', 'booleanObject', 'true', 'false'].includes(key)) {
    return 'boolean';
  } else if (['array', 'arrayNested', 'arrayEmpty'].includes(key)) {
    return 'array';
  } else if (
    [
      'object',
      'objectNested',
      'objectEmpty',
      'iterableAsync',
      'classVariable',
      'objectCreate',
      'objectCreateNull',
      'objectCreateEmpty'
    ].includes(key)
  ) {
    return 'object';
  } else if (['function'].includes(key)) {
    return 'function';
  } else if (['functionAsync'].includes(key)) {
    return 'async';
  } else if (['promise', 'promiseResolve'].includes(key)) {
    return 'promise';
  } else if (['map', 'mapSet'].includes(key)) {
    return 'map';
  } else if (['set', 'setEmpty'].includes(key)) {
    return 'set';
  } else if (['null'].includes(key)) {
    return 'null';
  } else if (['undefined', 'void0'].includes(key)) {
    return 'undefined';
  } else if (['class'].includes(key)) {
    return 'class';
  } else if (['regex', 'regexObject'].includes(key)) {
    return 'regExp';
  } else if (
    ['symbol', 'symbolEmpty', 'symbolFor', 'symbolIterator'].includes(key)
  ) {
    return 'symbol';
  } else if (['error'].includes(key)) {
    return 'error';
  } else if (['nan', 'nanNumber', 'nanZero'].includes(key)) {
    return 'NaN';
  } else if (['weakMap'].includes(key)) {
    return 'weakMap';
  } else if (['date'].includes(key)) {
    return 'date';
  }
}
