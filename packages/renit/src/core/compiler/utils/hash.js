import { isUndefined } from '../../../libraries/is/index.js';
import { size } from '../../../libraries/math/index.js';

/**
 * Class representing a unique style hash generator.
 */
export class uniqueStyleHash {
  /**
   * Create a uniqueStyleHash instance.
   */
  constructor() {
    /**
     * Minimum length of the hash.
     * @type {number}
     */
    this.min = 1;

    /**
     * Maximum length of the hash.
     * @type {number}
     */
    this.max = 6;

    /**
     * Array of used hashes.
     * @type {Array}
     */
    this.used = [];

    /**
     * Cache for generated hashes.
     * @type {Object}
     */
    this.cache = {};

    /**
     * Characters used in the hash.
     * @type {string}
     */
    this.chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_';

    /**
     * First characters used in the hash.
     * @type {string}
     */
    this.fchars = 'abcdefghjklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_';
  }

  /**
   * Set the minimum length of the hash.
   * @param {number} min - The minimum length.
   */
  setMin(min) {
    this.min = min;
  }

  /**
   * Set the maximum length of the hash.
   * @param {number} max - The maximum length.
   */
  setMax(max) {
    this.max = max;
  }

  /**
   * Set the used hashes.
   * @param {Array} used - The array of used hashes.
   */
  setUsed(used) {
    this.used = used;
  }

  /**
   * Get the used hashes.
   * @returns {Array} The array of used hashes.
   */
  getUsed() {
    return this.used;
  }

  /**
   * Generate a random unique hash.
   * @returns {string} The generated hash.
   */
  random() {
    let max = this.min;
    let result = '';

    // Loop until a unique hash is generated
    do {
      // Check if the maximum possible hashes are used
      if (size(this.used) >= Math.pow(64, max - 1) * 52 && max >= this.max) {
        return 'Out of range - increase max length';
      }

      // Increase the max length if needed
      if (size(this.used) >= Math.pow(64, max - 1) * 52 && max < this.max) {
        ++max;
      }

      // Generate the first character from fchars
      result += this.fchars[Math.floor(Math.random() * size(this.fchars))];

      // Generate the rest of the characters from chars
      for (let i = max - 1; i > 0; --i) {
        result += this.chars[Math.floor(Math.random() * size(this.chars))];
      }
    } while (this.used.includes(result)); // Ensure the hash is unique

    // Add the generated hash to the used array
    this.used.push(result);

    return result;
  }

  /**
   * Create a hash for the given name.
   * @param {string} name - The name to create a hash for.
   * @returns {string} The generated hash.
   */
  create(name) {
    // Check if the hash is already cached
    if (isUndefined(this.cache[name])) {
      this.cache[name] = this.random();
    }

    return this.cache[name];
  }
}
