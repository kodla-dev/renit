import { pop, split } from '../../../libraries/collect/index.js';

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
