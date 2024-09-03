import { each } from '../../../libraries/collect/index.js';
import { htmlToAst } from '../../../libraries/to/index.js';
import { attributes } from './attributes.js';
import { blocks } from './blocks.js';
import { parsers } from './parsers.js';
import { texts } from './texts.js';
import { types } from './types.js';

// List of transformation functions to be applied to the AST.
const transforms = [types, parsers, blocks, attributes, texts];

/**
 * Transforms HTML code into an AST and applies a series of transformations to it.
 *
 * @param {string} code - The HTML code to transform.
 * @returns {Object} - The transformed AST.
 */
export function transform(code, options) {
  // Convert the HTML code to an AST with specific options.
  let ast = htmlToAst(code, {
    attribute: { affix: true },
    transform: { whitespace: true, trim: false },
    position: { index: false, loc: false },
  });

  // Apply each transformation function to the AST.
  each(transform => transform(ast, options), transforms);

  // Return the transformed AST.
  return ast;
}
