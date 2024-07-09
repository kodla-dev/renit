import { clone } from '../../../helpers/index.js';
import { each, has, join, map, prepend, push, split } from '../../../libraries/collect/index.js';
import { isArray, isEmpty, isUndefined } from '../../../libraries/is/index.js';
import { size } from '../../../libraries/math/index.js';
import { sub } from '../../../libraries/string/index.js';
import { RAW_COMMA, RAW_EMPTY, RAW_WHITESPACE } from '../../define.js';
import { global } from '../global.js';
import { visitFull } from '../visit.js';
import { AttributePattern, StringAttributePattern } from './constant.js';
import { getIndexes } from './file.js';
import { uniqueStyleHash } from './hash.js';
import { generateId } from './index.js';

/**
 * AST node types used in the parsing process.
 * @type {Object}
 * @property {string} root - The type for the root of the stylesheet.
 * @property {string} selector - The type for a selector node.
 * @property {string} start - The type for a start block node.
 * @property {string} block - The type for a block node.
 * @property {string} end - The type for an end block node.
 */
const AST = {
  root: 'StyleSheet',
  selector: 'Selector',
  atrule: 'Atrule',
  start: 'StartBlock',
  block: 'Block',
  end: 'EndBlock',
};

// Generates unique short class names for styling
const styleHash = new uniqueStyleHash();

/**
 * Generate a unique style hash with specified minimum and maximum lengths.
 * @param {number} min - The minimum length of the hash.
 * @param {number} max - The maximum length of the hash.
 * @returns {string} The generated style hash.
 */
export function generateStyleHash(min, max) {
  styleHash.setMin(min);
  styleHash.setMax(max);
  return styleHash.create(generateId());
}

/**
 * Finds the token index and position in a list of tokens up to a specified limit.
 * @param {Array} tokens - The list of tokens to search through.
 * @param {number} [startIndex=0] - The index to start searching from.
 * @param {number} limit - The position limit to stop searching at.
 * @returns {Array} An array containing the last token index and the last token position.
 */
function findToken(tokens, startIndex = 0, limit) {
  let lastIndex = 0;
  let lastTokenIndex = startIndex;
  for (let i = startIndex, l = size(tokens); i < l; i++) {
    const token = tokens[i];
    const index = token.start;
    if (index >= limit) break;
    lastIndex = token.type === AST.start ? index : index + 1;
    lastTokenIndex = i + 1;
  }
  return [lastIndex, lastTokenIndex];
}

/**
 * Extracts the content of a block from the provided code based on the given AST node.
 * @param {Object} node - The AST node representing the block.
 * @param {string} code - The source code containing the block.
 * @returns {string} The content of the block.
 */
function getBlockContent(node, code) {
  const { children } = node;
  let body = '';
  let start = node.block.start;
  for (let i = 0, l = size(children); i < l; i++) {
    const child = children[i];
    body += code.slice(start, child.start);
    start = child.end + 1;
  }
  body += code.slice(start, node.block.end);
  return compactCss(body);
}

/**
 * Converts the provided CSS code into an Abstract Syntax Tree (AST).
 * @param {string} code The CSS code to convert.
 * @returns {object} The Abstract Syntax Tree (AST) representation of the CSS code.
 */
export function cssToAST(code) {
  const startIndexes = getIndexes(code, '{');
  const endIndexes = getIndexes(code, '}');
  const selectors = [];
  const starts = [];
  const ends = [];
  let selectorIndex = 0;
  let prevStart = 0;
  let prevEnd = 0;

  each((item, index) => {
    starts[index] = {
      type: AST.start,
      start: startIndexes[index] + 1,
    };
  }, startIndexes);

  each((item, index) => {
    ends[index] = {
      type: AST.end,
      start: endIndexes[index],
    };
  }, endIndexes);

  each(end => {
    const findStart = findToken(starts, prevStart, end);
    const findEnd = findToken(ends, prevEnd, end);

    prevStart = findStart[1];
    prevEnd = findEnd[1];
    let start = findStart[0] >= findEnd[0] ? findStart[0] : findEnd[0];
    let raw = code.slice(start, end);
    let semicolon = start + raw.lastIndexOf(';', end) + 1;
    if (semicolon > start) {
      start = semicolon;
      raw = code.slice(start, end);
    }
    let type = AST.selector;
    const name = compactCss(raw);
    if (name.startsWith('@')) type = AST.atrule;
    selectors[selectorIndex++] = {
      type,
      name,
      raw,
      start,
      end,
    };
  }, startIndexes);

  const tokensBack = [];
  let length = size(selectors);

  for (let i = 0, j = 0; i < length; i++, j += 2) {
    tokensBack[j] = selectors[i];
    tokensBack[j + 1] = starts[i];
  }

  const tokens = [];
  const tokensSize = size(tokensBack);
  const endTokensSize = size(ends);
  length = tokensSize + size(ends);
  let i = tokensSize - 1;
  let j = endTokensSize - 1;

  while (length > 0) {
    tokens[--length] =
      j < 0 || (i >= 0 && tokensBack[i].start > ends[j].start) ? tokensBack[i--] : ends[j--];
  }

  const ast = { type: AST.root, children: [] };
  let current = ast;
  const stack = [];

  each(token => {
    if (token.type == AST.selector || token.type == AST.atrule) {
      const parent = current;
      const node = {
        type: token.type,
        name: token.name,
        block: {
          type: AST.block,
          content: '',
          start: -1,
          end: -1,
        },
        children: [],
        parent: () => parent,
        start: token.start,
        end: -1,
      };

      push(node, current.children);
      stack.push(current);
      current = node;
    } else if (token.type == AST.start) {
      current.block.start = token.start;
    } else if (token.type == AST.end) {
      current.end = token.start + 1;
      current.block.end = token.start;
      current.block.content = getBlockContent(current, code);
      current = stack.pop();
    }
  }, tokens);

  return ast;
}

/**
 * Generates CSS from an Abstract Syntax Tree (AST).
 * @param {object} ast - The Abstract Syntax Tree (AST) representing CSS.
 * @returns {string} The generated CSS as a string.
 */
export function generateCss(ast) {
  const cache = new Map();

  const resolve = {
    atrule: (resolved, selector, parents) => {
      each(parent => {
        const temp = selector.replace('@', parent);
        if (has('@', temp)) {
          resolve.atrule(resolved, temp, parents);
        } else {
          resolved.push(temp);
        }
      }, parents);
    },
    ampersand: (resolved, selector, parents) => {
      each(parent => {
        const temp = selector.replace('&', parent);
        if (has('&', temp)) {
          resolve.ampersand(resolved, temp, parents);
        } else {
          resolved.push(temp);
        }
      }, parents);
    },
    selectors: (selectors, parents) => {
      const resolved = [];
      each(selector => {
        if (has('&', selector)) {
          resolve.ampersand(resolved, selector, parents);
        } else if (has('@', parents[0])) {
          resolve.atrule(resolved, selector, parents);
        } else {
          each((parent, index) => {
            push(`${parents[index]} ${selector}`, resolved);
          }, parents);
        }
      }, selectors);
      return resolved;
    },
  };

  visitFull(ast, node => {
    if (node.type == AST.selector || node.type == AST.atrule) {
      let { name, parent } = node;
      parent = parent();
      let selectors = split(/\s*,\s*/g, name);
      if ('name' in parent) {
        selectors = resolve.selectors(selectors, cache.get(parent) || []);
        node.name = join(RAW_COMMA, selectors);
      }
      cache.set(node, selectors);
    }
  });

  function findParentAtRule(node) {
    if (isUndefined(node.parent)) return false;
    const parent = node.parent();
    if (parent.type == AST.atrule) {
      return true;
    }
    return findParentAtRule(parent);
  }

  const nodes = [];

  visitFull(ast, {
    Selector(node) {
      if (!findParentAtRule(node)) {
        if (!/\S/.test(node.block.content)) return;
        push(node, nodes);
      }
    },
    Atrule(node) {
      push(node, nodes);
    },
  });

  ast.children = nodes;

  function flattenChildren(node) {
    const flattenedChildren = [];

    const traverse = currentNode => {
      each(child => {
        const test = !/\S/.test(child.block.content);
        if (!test) {
          push(child, flattenedChildren);
        }

        if (!isEmpty(child.children)) {
          traverse(child);
        }
      }, currentNode.children);
    };

    traverse(node);
    each(flattened => (flattened.children = []), flattenedChildren);
    return flattenedChildren;
  }

  each(node => {
    if (node.type == AST.atrule) {
      node.children = flattenChildren(node);
    } else {
      node.children = [];
    }
  }, nodes);

  const stringifyNode = node => {
    let semicolon = RAW_EMPTY;
    if (node.type == AST.atrule && !isEmpty(node.block.content)) semicolon = ';';
    return `${node.name}{${node.block.content}${semicolon}${stringifyChildren(node.children)}}`;
  };

  const stringifyChildren = children => {
    let css = '';
    each(item => (css += stringifyNode(item)), children);
    return css;
  };

  return stringifyChildren(ast.children);
}

/**
 * Removes unnecessary whitespace around CSS code, making it more compact.
 * @param {string} code - The CSS code to compact.
 * @returns {string} The compacted CSS code.
 */
export function compactCss(code) {
  code = code.trim().replace(/\s*([:;,])\s*/g, '$1');
  if (code.endsWith(';')) code = sub(0, size(code) - 1, code);
  return code;
}

/**
 * Prepares the style by processing the given AST (Abstract Syntax Tree) and options.
 * @param {Object} ast - The abstract syntax tree representing CSS.
 * @param {Object} options - Options for processing the AST.
 * @returns {Object} An object containing the processed CSS, modified styles, and global styles.
 */
export function prepareStyle(ast, options) {
  const changedStyles = [];
  let has = {
    this: {
      name: false,
      type: false,
    },
  };

  visitFull(ast, {
    // Processes selector nodes to replace certain parts of the selector with new identifiers.
    Selector(node) {
      node.name = node.name.replace(
        /[#.][^.\s]*|:(g|global|s|static)\((.*?)\)+/g,
        (token, ...args) => {
          const pseudo = args[0];
          const isGlobal = pseudo == 'g' || pseudo == 'global';
          const isStatic = pseudo == 's' || pseudo == 'static';
          token = pseudo ? args[1] : token;

          if (isStatic) return token;

          const first = token[0];
          const name = token.replace(first, RAW_EMPTY);

          let type;
          if (first == '#') type = 'id';
          else if (first == '.') type = 'class';

          let id;
          let collection = isGlobal ? global.styles : changedStyles;

          const findChange = collection.find(change => change.old == name);
          if (findChange) {
            id = findChange.new;
          } else {
            id = genId();
            push({ old: name, new: id }, collection);
          }

          if (name == 'this') {
            has.this.name = id;
            has.this.type = type;
          }

          return (type == 'id' ? '#' : '.') + id;
        }
      );
    },
  });

  /**
   * Function to generate a new unique identifier
   * @returns {string} The generated unique ID.
   */
  function genId() {
    return generateStyleHash(options.css.hash.min, options.css.hash.max);
  }

  return {
    raw: generateCss(ast),
    has,
    changedStyles,
  };
}

/**
 * Adds the 'this' style attribute to a node based on the provided style.
 * @param {Object} node - The node to which the style attribute will be added.
 * @param {Object} style - The style object containing the 'this' attribute information.
 */
export function addThisStyleAttribute(node, style) {
  const name = style.has.this.name;
  const type = style.has.this.type;

  if (name) {
    let index = node.attributes.findIndex(attribute => attribute.name == type);
    if (index != -1) {
      const attribute = node.attributes[index];
      // If the attribute value is an array, prepend the name
      if (isArray(attribute.value)) {
        const pattern = clone(StringAttributePattern);
        pattern.content = name;
        prepend(pattern, node.attributes[index].value);
      } else {
        // Otherwise, append the name to the existing value
        node.attributes[index].value = attribute.value + RAW_WHITESPACE + name;
      }
    } else {
      // If the attribute does not exist, create a new one
      const pattern = clone(AttributePattern);
      pattern.name = type;
      pattern.value = name;
      if (type == 'id') prepend(pattern, node.attributes);
      else push(pattern, node.attributes);
    }
  }
}

/**
 * Updates the style attribute by replacing old style values with new ones
 * based on global and changed styles.
 *
 * @param {string} value - The original value of the style attribute.
 * @param {Array} changedStyles - An array of objects representing changed styles.
 * @returns {string} The updated style attribute.
 */
export function updateStyleAttribute(value, changedStyles) {
  const attributes = map(
    attribute => {
      attribute = attribute.trim();

      // Find if the attribute matches any global styles to be replaced
      const globalFind = global.styles.find(global => global.old == attribute);
      if (globalFind) attribute = globalFind.new;

      // Find if the attribute matches any changed styles to be replaced
      const changedFind = changedStyles.find(changed => changed.old == attribute);
      if (changedFind) attribute = changedFind.new;
      return attribute;
    },
    split(RAW_WHITESPACE, value)
  );
  return join(RAW_WHITESPACE, attributes);
}
