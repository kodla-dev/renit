import { each } from '../../../libraries/collect/index.js';
import { isEmpty } from '../../../libraries/is/index.js';
import { htmlToAst } from '../../../libraries/to/index.js';
import { attributes } from './attributes.js';
import { parsers } from './parsers.js';
import { texts } from './texts.js';
import { types } from './types.js';

// List of transformation functions to be applied to the AST.
const transforms = [types, parsers, attributes, texts];

/**
 * Transforms HTML code into an AST and applies a series of transformations to it.
 *
 * @param {string} code - The HTML code to transform.
 * @returns {Object} - The transformed AST.
 */
export function transform(code, system) {
  // Convert the HTML code to an AST with specific options.
  let ast = htmlToAst(code, {
    attribute: { affix: true },
    transform: { whitespace: false, trim: false },
    position: { index: true, loc: false },
  });

  if (!isEmpty(code.trim()) && isEmpty(ast.children)) {
    system.addError('An error occurred while parsing the HTML.');
  }

  // Apply each transformation function to the AST.
  each(transform => transform(ast, system), transforms);

  // Return the transformed AST.
  return ast;
}
