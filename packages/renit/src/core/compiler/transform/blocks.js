import { each, has, join, push } from '../../../libraries/collect/index.js';
import { isEmpty } from '../../../libraries/is/index.js';
import { size } from '../../../libraries/math/index.js';
import { sub } from '../../../libraries/string/index.js';
import { visit } from '../../../libraries/to/index.js';
import { RAW_EMPTY, RAW_WHITESPACE } from '../../define.js';
import { getContentBraces } from '../utils/braces.js';
import {
  findDependencies,
  forExpressionAnalysis,
  generateJavaScript,
  javaScriptToAST,
} from '../utils/script.js';

/**
 * Processes the AST to determine the type of each node.
 * @param {object} ast - The abstract syntax tree to process.
 */
export function blocks(ast) {
  visit(ast, {
    IfBlock: node => {
      fixBlock(node);
    },
    ElseifBlock: node => {
      fixBlock(node);
    },
    ForBlock: node => {
      fixBlock(node, true);
    },
    SlotBlock: node => {
      if (node.params && node.params.name) node.name = node.params.name;
      else node.name = 'default';
    },
    SlotContent: node => {
      node.name = node.name.replace('slot:', RAW_EMPTY);
      if (!node.name) node.name = 'default';
    },
  });
}

/**
 * Fixes attributes of an HTML node, parsing and manipulating its value.
 *
 * @param {Object} node - The HTML node object to fix attributes for.
 * @param {boolean} [isFor=false] - Indicates if the node is used in a 'for' loop context.
 */
function fixBlock(node, isFor = false) {
  const values = [];
  let value = node.value;

  // If the value is empty, attempt to parse attributes
  if (isEmpty(value)) {
    each(attribute => {
      if (attribute.name == ':') {
        push(attribute.value, values); // Collect attribute values
      } else {
        push(attribute.name, values); // Collect attribute names
      }
    }, node.attributes);

    value = join(RAW_WHITESPACE, values); // Join collected values with whitespace
    if (value.trim().startsWith('{')) value = getContentBraces(value); // Handle special cases
  }
  node.attributes = [];
  if (isEmpty(value)) value = 'true';

  // Handle 'as' keyword transformation in 'for' loop context
  if (isFor && (has('as'), value)) {
    value = value.replace(/\bas\b/g, '&&');
  }

  const expression = javaScriptToAST(value).body[0].expression;

  if (isFor) {
    // Perform analysis specific to 'for' loop context
    const analysis = forExpressionAnalysis(expression);
    value = analysis.value;
    node.dependencies = analysis.dependencies;
    node.as = analysis.as;
    node.index = analysis.index;
    node.key = analysis.key;
  } else {
    // Generate JavaScript code from parsed expression and find dependencies
    value = generateJavaScript(expression).trim();
    if (value.endsWith(';')) value = sub(0, size(value) - 1, value); // Remove trailing semicolon
    node.dependencies = findDependencies(expression);
  }

  node.value = value;
}
