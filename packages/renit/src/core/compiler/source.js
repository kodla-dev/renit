import { each, join, push } from '../../libraries/collect/index.js';
import { RAW_EMPTY } from '../define.js';

/**
 * Creates a source object to manage and concatenate lines of source code.
 * @returns {Object} - The source object with methods to add lines and convert to a string.
 */
export function createSource() {
  return {
    lines: [],

    /**
     * Adds a single line of source code to the lines array.
     * @param {string} line - The line of code to add.
     */
    add(line) {
      push(line, this.lines);
    },

    /**
     * Adds multiple lines of source code to the lines array.
     * @param {string[]} lines - The array of lines to add.
     */
    adds(lines) {
      each(line => push(line, this.lines), lines);
    },

    /**
     * Converts the lines array into a single concatenated string.
     * @returns {string} - The concatenated source code string.
     */
    toString() {
      return join(RAW_EMPTY, this.lines);
    },
  };
}
