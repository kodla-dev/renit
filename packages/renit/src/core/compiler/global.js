import { push } from '../../libraries/collect/index.js';
import { isEqual } from '../../libraries/is/index.js';

/**
 * Class representing a global state for managing files and styles.
 */
class Global {
  constructor() {
    this.files = [];
    this.styles = [];
    this.current = null;
    this.currentChangeCode = false;
  }

  /**
   * Adds a file and its code to the global state.
   * @param {string} file - The file name.
   * @param {string} code - The code content.
   */
  add(file, code) {
    this.current = this.files.find(f => f.file == file);

    if (this.current) {
      if (!isEqual(code, this.current.code)) {
        this.current.code = code;
        this.currentChangeCode = true;
      }
    } else {
      this.current = { file, code };
      push(this.current, this.files);
      this.currentChangeCode = true;
    }
  }

  /**
   * Sets the result for the current file.
   * @param {Object} result - The result object.
   */
  setResult(result) {
    this.current.result = result;
    this.currentChangeCode = false;
  }

  /**
   * Sets the lines for the current file.
   * @param {Object} lines - The lines object.
   */
  setLines(lines) {
    this.current.lines = lines;
  }

  /**
   * Gets the current file and its state.
   * @returns {Object} The current file and its state.
   */
  getCurrent() {
    return this.current;
  }
}

export const global = new Global();
