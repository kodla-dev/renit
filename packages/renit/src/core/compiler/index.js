import { mergeDeep } from '../../libraries/collect/index.js';
import { isNil } from '../../libraries/is/index.js';
import { compile } from './compile/index.js';
import defaultOptions from './options.js';
import { transform } from './transform/index.js';

/**
 * Compiles the given code by transforming it into an AST and then compiling the AST.
 *
 * @param {string} code - The code to compile.
 * @param {Object} [options={}] - The options to customize the compilation process.
 * @returns {Object|undefined} - The compiled output.
 */
export function compiler(file, code, options = {}) {
  if (isNil(code)) return;
  options.component = { file };
  options = mergeDeep(options, defaultOptions);

  return compile(transform(code), options);
}
