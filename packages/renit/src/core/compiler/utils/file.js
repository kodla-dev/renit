import { pop, push, split } from '../../../libraries/collect/index.js';
import { size } from '../../../libraries/math/index.js';
import { RAW_EMPTY } from '../../define.js';

/**
 * Splits the given file content into lines and indexes.
 * @param {string} file - The file content to be processed.
 * @returns {Object} An object containing two properties:
 *                   - default: An array of lines from the file.
 *                   - index: An array of characters from the file.
 */
export function fileLines(file) {
  return {
    default: split('\n', file),
    index: split(RAW_EMPTY, file),
  };
}

/**
 * Finds the line number corresponding to a given index in the lines array.
 * @param {number} index - The index to find the line for.
 * @param {Array<string>} lines - An array of lines from the file.
 * @returns {number} The line number corresponding to the given index.
 */
export function findLine(index, lines) {
  let total = 0;
  let line = 1;
  for (let i = 0; i < size(lines); i++) {
    if (lines[i] == '\n') {
      line++;
    }
    total += size(lines[i]);
    if (total >= index) return line;
  }
}

/**
 * Extracts the file name from a file path.
 * @param {string} file - The file path.
 * @returns {string} The extracted file name.
 */
export function getFileName(file) {
  return pop(split('/', file));
}

/**
 * Converts a given string to a valid template name by replacing non-word characters with underscores.
 * @param {string} name - The original string to be converted.
 * @returns {string} The converted string with non-word characters replaced by underscores.
 */
export function getTemplateName(name) {
  return name.replace(/\W+/g, '_');
}

/**
 * Removes the file extension from a given file name.
 * @param {string} name - The file name from which the extension needs to be removed.
 * @returns {string} The base name without the file extension.
 */
export function getBaseName(name) {
  return name.replace(/\.\w+$/, '');
}

/**
 * Finds all indexes of a substring within a given string.
 * @param {string} str - The string to search within.
 * @param {string} find - The substring to search for.
 * @returns {number[]} An array of indexes where the substring is found.
 */
export function getIndexes(str, find) {
  const indexes = [];
  const findSize = size(find);
  let from = 0;
  for (;;) {
    const index = str.indexOf(find, from);
    if (index === -1) return indexes;
    push(index, indexes);
    from = index + findSize;
  }
}
