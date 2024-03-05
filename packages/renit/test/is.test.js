import { describe, expect, it } from 'vitest';
import { isArray } from '../src/is.js';
import { data } from './data.js';

let entries = Object.entries(data);

describe('isArray', () => {
  for (let [index, [key, value]] of entries.entries()) {
    it(key, () => {
      let fill = false;
      if (['array', 'arrayNested', 'arrayEmpty'].includes(key)) {
        fill = true;
      }
      expect(isArray(value)).toBe(fill);
    });
  }
});
