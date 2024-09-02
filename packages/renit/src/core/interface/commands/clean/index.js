import { removeDir } from '../../utils.js';

/**
 * Asynchronously removes the 'build' directory.
 *
 * @returns {Promise<void>} A promise that resolves when the directory is removed.
 */
export default async function (options) {
  removeDir('./build', options.clearScreen); // Remove the 'build' directory
}
