import { describe, expect, it } from 'vitest';
import { lower, sub, upper, words } from '../src/libraries/string/index.js';

describe('lower', () => {
  it('lower:text', () => {
    expect(lower('LOREM')).toEqual('lorem');
  });
});

describe('sub', () => {
  it('sub:text', () => {
    expect(sub('Lorem')).toEqual('orem');
  });

  it('sub:start', () => {
    expect(sub(0, 'Lorem')).toEqual('Lorem');
  });

  it('sub:end', () => {
    expect(sub(0, 1, 'Lorem')).toEqual('L');
  });
});

describe('upper', () => {
  it('upper:text', () => {
    expect(upper('lorem')).toEqual('LOREM');
  });
});

describe('words', () => {
  it('words:true', () => {
    const result = words(true, 'Lorem ipsum\ndolor sit amet, consectetur adipiscing\telit.');
    const expected = [
      'Lorem',
      'ipsum',
      'dolor',
      'sit',
      'amet',
      'consectetur',
      'adipiscing',
      'elit',
    ];
    expect(result).toEqual(expected);
  });

  it('words:false', () => {
    const result = words('Lorem ipsum\ndolor sit amet, consectetur adipiscing\telit.');
    const expected = [
      'Lorem',
      'ipsum',
      'dolor',
      'sit',
      'amet,',
      'consectetur',
      'adipiscing',
      'elit.',
    ];
    expect(result).toEqual(expected);
  });
});
