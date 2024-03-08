import { expect, test } from 'vitest';
import { isClient, isLocalStorage } from '../src/is/index.js';

test('isLocalStorage', () => {
  expect(isLocalStorage()).toBe(true);
});

test('isClient', () => {
  expect(isClient()).toBe(true);
});
