import { RAW_COMMA, RAW_EMPTY } from '../../../../core/define.js';
import { each, has, join, push, split } from '../../../collect/index.js';
import { isEmpty, isUndefined } from '../../../is/index.js';
import { size } from '../../../math/index.js';
import { sub } from '../../../string/index.js';
import { visitFull } from '../visit.js';

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

/**
 * Finds all indexes of a substring within a given string.
 * @param {string} str - The string to search within.
 * @param {string} find - The substring to search for.
 * @returns {number[]} An array of indexes where the substring is found.
 */
function getIndexes(str, find) {
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
  return minifyCss(body);
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
    const name = minifyCss(raw);
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
      push(current, stack);
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
export function astToCss(ast) {
  const cache = new Map();

  const resolve = {
    atrule: (resolved, selector, parents) => {
      each(parent => {
        const temp = selector.replace('@', parent);
        if (has('@', temp)) {
          resolve.atrule(resolved, temp, parents);
        } else {
          push(temp, resolved);
        }
      }, parents);
    },
    ampersand: (resolved, selector, parents) => {
      each(parent => {
        const temp = selector.replace('&', parent);
        if (has('&', temp)) {
          resolve.ampersand(resolved, temp, parents);
        } else {
          push(temp, resolved);
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
function minifyCss(code) {
  code = code.trim().replace(/\s*([:;,])\s*/g, '$1');
  if (code.endsWith(';')) code = sub(0, size(code) - 1, code);
  return code;
}
