const asyncIterable = {
  [Symbol.asyncIterator]: async function* () {
    yield 1;
    yield 2;
    yield 3;
  },
};

class Router {
  constructor() {
    this.routes = {};
  }
}

const router = new Router();

export const data = {
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
  objectNested: { name: 'is', library: { name: 'renit' } },
  objectEmpty: {},
  function: () => {},
  functionAsync: async () => {},
  promise: new Promise(resolve => resolve(false)),
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
  void0: void 0,
};
