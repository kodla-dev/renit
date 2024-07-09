import { push } from '../../libraries/collect/index.js';
import { global } from './global.js';
import { fileLines, findLine } from './utils/file.js';

/**
 * Class representing a system for managing code files and results.
 */
export class System {
  constructor(options) {
    this.options = options;
    this.errors = [];
  }

  /**
   * Sets the file and code for the system.
   * @param {string} file - The file name.
   * @param {string} code - The code content.
   */
  set(file, code) {
    global.add(file, code);

    if (this.isChangeCode()) {
      const lines = fileLines(code);
      global.setLines(lines);
    }
  }

  /**
   * Sets the result of the system's processing.
   * @param {Object} result - The result object.
   */
  setResult(result) {
    global.setResult(result);
  }

  /**
   * Adds an error to the system.
   * @param {string} message - The error message.
   * @param {number} [start] - The start position for locating the error.
   */
  addError(message, start) {
    let line;
    let highlight;

    if (start) {
      line = findLine(start, global.current.lines.index);
      highlight = global.current.lines.default[line - 1].trim();
    }

    push({ message, line, highlight }, this.errors);
  }

  /**
   * Gets the result and errors of the system's processing.
   * @returns {Object} An object containing the result and errors.
   */
  getResult() {
    const { errors } = this;
    return { result: global.current.result, errors };
  }

  /**
   * Checks if the code has changed.
   * @returns {boolean} True if the code has changed, false otherwise.
   */
  isChangeCode() {
    if (!this.options.cache.memory) return true;
    return global.currentChangeCode;
  }
}
