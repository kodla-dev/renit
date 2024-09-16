import { removeDir } from '../../utils.js';

/**
 * Asynchronously removes the 'build' directory.
 *
 * @returns {Promise<void>} A promise that resolves when the directory is removed.
 */
export default async function () {
  removeDir('build', true); // Remove the 'build' directory
}
