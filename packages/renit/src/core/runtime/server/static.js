import { RAW_EMPTY, RAW_WHITESPACE } from '../../define.js';
import { escape } from './utils.js';

/**
 * Adds an attribute to a server-side rendered string.
 *
 * @param {string} parent - The parent string to append the attribute to.
 * @param {string} name - The name of the attribute.
 * @param {...(string|number|boolean)} args - The values to set for the attribute.
 * @returns {string} The parent string with the attribute appended.
 */
export function ssrAttribute(parent, name, ...args) {
  if (args.length) {
    args = args.filter(Boolean); // Remove falsy values from args
    if (args.length) {
      const space = !parent.endsWith(RAW_WHITESPACE) ? RAW_WHITESPACE : RAW_EMPTY;
      // Append the attribute name and its joined, escaped values
      return parent + space + name + `="` + escape(args.join(RAW_WHITESPACE)) + `"`;
    } else {
      return parent.trim(); // Remove trailing whitespace if no valid args
    }
  } else {
    const space = !parent.endsWith(RAW_WHITESPACE) ? RAW_WHITESPACE : RAW_EMPTY;
    // Append the attribute name without values
    return parent + space + name;
  }
}

/**
 * Binds a value to an attribute in a server-side rendered string.
 *
 * @param {string} parent - The parent string to append the attribute to.
 * @param {string} name - The name of the attribute.
 * @param {Function} get - Function to retrieve the attribute value.
 * @returns {string} The parent string with the bound attribute appended.
 */
export function ssrBindAttribute(parent, name, get) {
  const value = get(); // Retrieve the value for the attribute
  if (value) {
    const space = !parent.endsWith(RAW_WHITESPACE) ? RAW_WHITESPACE : RAW_EMPTY;
    // Append the attribute name and its value
    return parent + space + name + `="` + value + `"`;
  } else {
    return parent.trim(); // Remove trailing whitespace if no value
  }
}
