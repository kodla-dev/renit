import { merge } from '../../libraries/collect/index.js';
import { isNil } from '../../libraries/is/index.js';

/**
 * Compiles the given code by transforming it into an AST and then compiling the AST.
 *
 * @param {string} code - The code to compile.
 * @param {Object} [options={}] - The options to customize the compilation process.
 * @returns {Object|undefined} - The compiled output.
 */
export function compiler(file, code, options = {}) {
  if (isNil(code)) return;

  const opts = {
    css: {
      compile: 'injected',
      hash: {
        min: 1,
        max: 6,
      },
    },
    cache: {
      memory: true,
    },
  };
  merge(opts, options);
}
