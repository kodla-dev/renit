import { expect, test } from 'vitest';
import { isLocalStorage } from '../src/is.js';

test('isLocalStorage', () => {
  expect(isLocalStorage()).toBe(true);
});
