import { join, prepend } from '../../../libraries/collect/index.js';
import { RAW_EMPTY } from '../../define.js';

/**
 * Escapes special HTML characters in a string to their corresponding HTML entities.
 *
 * @param {string} content - The string content to escape.
 * @returns {string} The escaped string with special characters replaced by HTML entities.
 */
export function escape(content) {
  return String(content ?? '').replace(/[&<>"']/g, function (match) {
    // Mapping of special characters to their corresponding HTML entities
    const escapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return escapeMap[match];
  });
}

/**
 * A class to collect and manage styles in an array.
 */
class CollectStyle {
  constructor() {
    this.d = [];
  }
  get $() {
    return join(RAW_EMPTY, this.d);
  }
  set $(val) {
    prepend(val, this.d);
  }
  clear() {
    this.d = [];
  }
}

/**
 * An instance of the CollectStyle class used to manage global styles.
 */
export const collectStyle = new CollectStyle();
