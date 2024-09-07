import { isUndefined } from '../../../libraries/is/index.js';
import { RAW_EMPTY } from '../../define.js';

/**
 * Generates unique style hashes for given names.
 */
export class uniqueStyleHash {
  constructor() {
    /**
     * Set of used hashes to avoid collisions.
     * @type {Set<string>}
     */
    this.used = new Set();

    /**
     * Cache for storing previously generated hashes.
     * @type {Object<string, string>}
     */
    this.cache = {};

    /**
     * Characters used for generating hashes.
     * @type {string}
     */
    this.chars = 'abcdefghjklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_0123456789-';

    /**
     * Characters allowed at the start of a hash.
     * @type {string}
     */
    this.startChars = this.chars.replace('0123456789-', RAW_EMPTY);

    /**
     * Length of the characters set.
     * @type {number}
     */
    this.charsLength = this.chars.length;

    /**
     * Thresholds for hash length based on the number of used hashes.
     * @type {number[]}
     */
    this.thresholds = this.createThresholds();
  }

  /**
   * Calculates the factorial of a number.
   * @param {number} n - The number to calculate the factorial for.
   * @returns {number} - The factorial of the number.
   */
  factor(n) {
    let r = 1;
    for (let i = 1; i <= n; i++) r *= i;
    return r;
  }

  /**
   * Creates thresholds for hash length based on the number of used hashes.
   * @returns {number[]} - Array of thresholds.
   */
  createThresholds() {
    const factor = this.factor;
    const n = this.charsLength;
    const t = [];
    for (let i = 1; i <= 7; i++) t.push(Math.round(factor(n) / (factor(i) * factor(n - i))));
    return t;
  }

  /**
   * Generates a unique hash for the given name.
   * @param {string} name - The name to hash.
   * @returns {string} - The unique hash.
   */
  hash(name) {
    let h = 5381;
    let i = name.length;
    while (i) h = (h * 33) ^ name.charCodeAt(--i);
    const code = h >>> 0;
    let x = Math.abs(code);

    let size = 0;
    while (size < this.thresholds.length && this.used.size >= this.thresholds[size]) {
      size++;
    }

    let result = '';
    for (let i = 0; i <= size; i++) {
      result += this.chars[x % this.charsLength];
      x = Math.floor(x / this.charsLength);
    }

    while (!this.startChars.includes(result[0])) {
      result = this.nextHash(result);
    }

    while (this.used.has(result)) {
      result = this.nextHash(result);
    }

    this.used.add(result);
    return result;
  }

  /**
   * Generates the next hash in sequence if a collision is detected.
   * @param {string} hash - The current hash.
   * @returns {string} - The next hash.
   */
  nextHash(hash) {
    let result = '';
    let carry = true;
    for (let i = 0; i < hash.length; i++) {
      let charIndex = this.chars.indexOf(hash[i]);
      if (charIndex === -1) throw new Error('Invalid character in hash');
      let newIndex = charIndex + (carry ? 1 : 0);
      if (newIndex >= this.charsLength) {
        newIndex -= this.charsLength;
        carry = true;
      } else {
        carry = false;
      }
      result = this.chars[newIndex] + result;
    }
    if (carry) result = this.chars[0] + result;

    while (!this.startChars.includes(result[0])) {
      result = this.nextHash(result);
    }

    return result;
  }

  /**
   * Creates and caches a hash for the given name if not already cached.
   * @param {string} name - The name to create a hash for.
   * @returns {string} - The cached or newly created hash.
   */
  create(name) {
    if (isUndefined(this.cache[name])) {
      this.cache[name] = this.hash(name);
    }
    return this.cache[name];
  }
}
