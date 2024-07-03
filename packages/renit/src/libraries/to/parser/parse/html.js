import { RAW_EMPTY, RAW_WHITESPACE, RGX_WHITESPACE } from '../../../../core/define.js';
import { pipe } from '../../../../helpers/index.js';
import { each, join, last, push, reduce, some, split } from '../../../collect/index.js';
import { isArray, isEmpty, isEqual, isUndefined } from '../../../is/index.js';
import { size } from '../../../math/index.js';
import { words } from '../../../string/index.js';
import { DocumentNode, TextNode } from '../ast.js';
import {
  RGX_HTML_OUTSIDE_TAGS,
  commentEnd,
  commentStart,
  parseHtmlOptions,
  textSelector,
} from '../utils.js';
import { parseHtmlTag } from './html-tag.js';

/**
 * Parses the given HTML program and returns the abstract syntax tree (AST).
 * @param {string} program The HTML program to parse.
 * @returns {Array} The abstract syntax tree representing the HTML structure.
 */
export function htmlToAst(program, options = {}) {
  // Merge the provided options with default options
  options = parseHtmlOptions(options);

  // Add comments to special tags list
  push('!--', options.tags.special);

  // Initialize variables
  const ast = [];
  const tree = [];
  let current;
  let special;
  let level = -1;
  let programSize;
  let node;
  let lines;
  let linesIndex;
  let lineIndexSize;
  let lastLen = 0;

  const needIndex = options.position.index;
  const needLoc = options.position.loc;
  const needPosition = needIndex || needLoc;
  options.need = { position: needPosition, index: needIndex, loc: needLoc };

  let Index;
  let outsideIndex;
  let firstStartIndex;
  let removeOutside = 0;
  let addOutside = 0;
  let indexes = [];
  let indexCounter = 0;

  if (needPosition) {
    programSize = size(program);
  }

  if (needLoc) {
    lines = split('\n', program);
    linesIndex = split(RAW_EMPTY, program);
    lineIndexSize = size(linesIndex);
  }

  /**
   * Creates a location object.
   * @returns {Object} The location object.
   */
  function loc() {
    return { start: { line: 0, column: 0 }, end: { line: 0, column: 0 } };
  }

  /**
   * Determines the line number of a given index.
   * @param {number} index - The index to determine the line number for.
   * @returns {number} The line number.
   */
  function line(index) {
    let total = 0;
    let lineNumber = 1;
    for (let i = 0; i < lineIndexSize; i++) {
      if (linesIndex[i] == '\n') {
        lineNumber++;
      }
      total += size(linesIndex[i]);
      if (total >= index) return lineNumber;
    }
  }

  /**
   * Retrieves the content of a given line number.
   * @param {number} number - The line number.
   * @returns {string} The content of the line.
   */
  function get(number) {
    return lines[number - 1];
  }

  /**
   * Determines the column number of a given line and content.
   * @param {number} line - The line number.
   * @param {string} content - The content.
   * @param {number} type - The type (1 or 2) to adjust the column position.
   * @returns {number} The column number.
   */
  function column(line, content, type) {
    const getLine = get(line);
    const rest = getLine.slice(0, getLine.indexOf(content));
    let column = size(rest);
    if (type == 2) column = column + size(content);
    return column;
  }

  options.fn = { loc, line, column };

  // Replace text outside HTML tags with a specific format
  program = program.replace(RGX_HTML_OUTSIDE_TAGS, (tag, ...args) => {
    lastLen = lastLen + size(tag);
    let text = args[2];
    if (!isUndefined(text)) {
      push({ start: args[3], end: lastLen, text }, indexes);
      if (options.transform.trim) text = text.trim();
      if (!isEmpty(text)) {
        if (!options.transform.whitespace) text = pipe(text, words, join);
        return commentStart + textSelector + text + commentEnd;
      }
    }
    return tag;
  });

  // Use regular expression to match HTML tags in the program string.
  program.replace(options.rgx.tags, (tag, ...args) => {
    const index = args[3];

    // Determine if the tag is an opening tag or a closing tag.
    const isOpen = tag.charAt(1) !== '/';

    // Determine if the tag is a special tag like comment, script, style, template, or textarea.
    const isSpecial = some(specialTag => {
      return tag.startsWith('<' + specialTag);
    }, options.tags.special);

    // Calculate the start index of the tag's content.
    const start = index + size(tag);

    let startIndex;
    let startIndexTag;
    let endIndex;

    if (needPosition) {
      if (isUndefined(outsideIndex)) {
        Index = index;
      } else {
        Index = index - removeOutside + addOutside;
      }

      startIndex = Index;
      startIndexTag = startIndex + size(tag);
      options.index = { start: startIndex, tag: startIndexTag };
      if (isUndefined(firstStartIndex)) firstStartIndex = startIndex;

      if (isSpecial) {
        if (tag.startsWith(commentStart + textSelector)) {
          outsideIndex = indexes[indexCounter];
          removeOutside = removeOutside + size(tag);
          addOutside = addOutside + (outsideIndex.end - outsideIndex.start);
          endIndex = outsideIndex.end;
          indexCounter++;
        } else {
          endIndex = startIndexTag;
        }
      }
      options.index.end = endIndex;
    }

    // Get the next character after the tag.
    const nextChar = program.charAt(start);

    let parent;

    // If it's a special tag, parse it as a tag and handle it separately.
    if (isSpecial) {
      special = parseHtmlTag(tag, options);
      if (!special) return;

      if (needPosition) {
        if (needIndex) {
          special.start = startIndex;
          special.end = endIndex;
        }
        if (needLoc) {
          if (special.type == 'Text') {
            special.loc = loc();
            special.loc.start.line = line(startIndex);
            special.loc.start.column = column(special.loc.start.line, outsideIndex.text);
            special.loc.end.line = line(endIndex);
            special.loc.end.column = column(special.loc.end.line, outsideIndex.text, 2);
          }
        }
      }

      // If it's at root level, add the special tag directly to the AST.
      if (level < 0) {
        push(special, ast);
        return ast;
      }

      // Otherwise, add the special tag as a child of the current parent.
      parent = tree[level];
      if (parent && parent.children && isArray(parent.children)) {
        parent.children.push(special);
      }
      return ast;
    }

    // If it's an opening tag, increment the nesting level and parse the tag.
    if (isOpen) {
      level++;
      current = parseHtmlTag(tag, options);
      if (!current) return;

      if (needPosition) {
        if (needIndex) {
          current.start = startIndex;
          current.end = endIndex;
        }
        if (needLoc) {
          current.loc = loc();
          current.loc.start.line = line(startIndex);
          current.loc.start.column = column(current.loc.start.line, tag);
        }
      }

      // If the tag is not a void element and there is content following the tag,
      // parse the content and add it as a child of the current element.
      if (
        !current.voidElement &&
        nextChar &&
        !isEqual(nextChar, '<') &&
        isArray(current.children)
      ) {
        let text = program.slice(start, program.indexOf('<', start));
        const textSize = size(text);
        if (!options.transform.whitespace) {
          if (!RGX_WHITESPACE.test(text)) {
            if (options.transform.trim) {
              text = text.trim();
            } else {
              text = text.replaceAll('\n', '');
            }
            node = TextNode(text);
            if (needPosition) {
              if (needIndex) {
                node.start = startIndexTag;
                node.end = startIndexTag + textSize;
              }
              if (needLoc) {
                node.loc = loc();
                node.loc.start.line = line(startIndex);
                node.loc.start.column = column(node.loc.start.line, tag, 2);
                node.loc.end.line = line(startIndex + textSize);
              }
            }
            push(node, current.children);
          }
        } else {
          if (!RGX_WHITESPACE.test(text)) {
            if (options.transform.trim) text = text.trim();
          }
          node = TextNode(text);
          if (needPosition) {
            if (needIndex) {
              node.start = startIndexTag;
              node.end = startIndexTag + textSize;
            }
            if (needLoc) {
              node.loc = loc();
              node.loc.start.line = line(startIndex);
              node.loc.start.column = column(node.loc.start.line, tag, 2);
              node.loc.end.line = line(startIndex + textSize);
            }
          }
          push(node, current.children);
        }
      }

      // If it's the root level, add the current element to the AST.
      if (level === 0) push(current, ast);

      // Get the parent element from the tree and add the current element as its child.
      parent = tree[level - 1];
      if (parent && parent.children) push(current, parent.children);

      // Update the current element in the tree.
      tree[level] = current;
    }

    // If it's a closing tag or a void element, decrement the nesting level.
    if (!isOpen || current.voidElement) {
      if (needPosition) {
        if (current.voidElement) {
          if (needIndex) current.end = current.start + size(tag);
        } else {
          if (needIndex) current.end = startIndex + size(tag);
          if (needLoc) {
            current.loc.end.line = line(startIndex);
            current.loc.end.column = column(current.loc.end.line, tag, 2);
            node.loc.end.column = column(node.loc.end.line, tag);
          }
        }
      }

      if (level > -1 && (current.voidElement || isEqual(current.name, tag.slice(2, -1)))) {
        level--;
        current = level === -1 ? ast : tree[level];
      }

      if (nextChar !== '<' && nextChar) {
        parent = level === -1 ? ast : tree[level].children;
        const end = program.indexOf('<', start);
        let content = program.slice(start, end === -1 ? undefined : end);
        let pureContent = content;
        const contentSize = size(pureContent);
        if (end > -1 && level + size(parent) >= 0) {
          if (parent && isArray(parent)) {
            if (options.transform.whitespace) {
              if (!RGX_WHITESPACE.test(content)) {
                if (options.transform.trim) content = content.trim();
              }
              node = TextNode(content);
              if (needPosition) {
                if (needIndex) {
                  node.start = startIndex + size(tag);
                  node.end = startIndex + size(tag) + contentSize;
                }
                if (needLoc) {
                  node.loc = loc();
                  node.loc.start.line = line(startIndex + size(tag));
                  node.loc.start.column = column(node.loc.start.line, pureContent);
                  node.loc.end.line = line(startIndex + size(tag) + contentSize);
                }
              }
              push(node, parent);
            } else {
              if (options.transform.trim) content = content.trim();
              if (!RGX_WHITESPACE.test(content)) {
                content = content.replaceAll('\n', '');
                node = TextNode(content);
                if (needPosition) {
                  if (needIndex) {
                    node.start = startIndex + size(tag);
                    node.end = startIndex + size(tag) + contentSize;
                  }
                  if (needLoc) {
                    node.loc = loc();
                    node.loc.start.line = line(startIndex + size(tag));
                    node.loc.start.column = column(node.loc.start.line, pureContent);
                    node.loc.end.line = line(startIndex + size(tag) + contentSize);
                  }
                }
                push(node, parent);
              }
            }
          }
        }
      }
    }
  });

  // Return the AST.
  node = DocumentNode(ast);
  if (needPosition) {
    if (needIndex) {
      node.start = firstStartIndex;
      node.end = programSize;
    }
    if (needLoc) {
      node.loc = loc();
      node.loc.start.line = line(firstStartIndex);
      node.loc.end.line = line(programSize);
      node.loc.end.column = size(last(lines));
    }
  }
  return node;
}

/**
 * Converts an abstract syntax tree (AST) back to an HTML string representation.
 *
 * @param {Object} ast - The AST structure to be converted.
 * @returns {string} - A string containing the HTML representation.
 */
export function astToHtml(ast) {
  // Use the reduce function to transform the AST structure into an HTML string representation.
  return reduce(
    (htmlString, el) => {
      // Process each element by using the htmlStringify function to generate HTML representation.
      return htmlString + htmlStringify(RAW_EMPTY, el);
    },
    RAW_EMPTY,
    [ast]
  );
}

/**
 * Converts an AST node to its HTML string representation.
 *
 * @param {string} buffer - The current HTML string buffer.
 * @param {Object} ast - The AST node to be converted.
 * @returns {string} - Updated HTML string buffer with AST node's representation.
 */
function htmlStringify(buffer, ast) {
  switch (ast.type) {
    case 'Document':
      return reduce(htmlStringify, RAW_EMPTY, ast.children);
    case 'Text':
      // For text nodes, concatenate the content to the buffer.
      return buffer + ast.content;
    case 'Element':
      // For element nodes, construct the HTML tag with attributes and children.
      buffer +=
        '<' +
        ast.name +
        (ast.attributes ? attributesStringify(ast.attributes) : RAW_EMPTY) +
        (ast.voidElement ? '/>' : '>');
      if (ast.voidElement) {
        return buffer;
      }
      // Recursively stringify children of non-void elements.
      return buffer + reduce(htmlStringify, RAW_EMPTY, ast.children) + '</' + ast.name + '>';
    case 'Comment':
      // For comment nodes, add HTML comment syntax to the buffer.
      buffer += '<!--' + ast.content + '-->';
      return buffer;
    default:
      // Handle unknown node types by returning an empty string.
      return RAW_EMPTY;
  }
}

/**
 * Converts an object of attributes into a string representation suitable for HTML tags.
 *
 * @param {Object} attributes - The attributes object of an element.
 * @returns {string} - String representation of element attributes.
 */
function attributesStringify(attributes) {
  const attrList = [];
  each(attr => {
    // Ensure attribute value is not undefined, default to empty string if undefined.
    if (isUndefined(attr.value)) {
      attr.value = RAW_EMPTY;
    }
    // If attribute has a prefix, concatenate it to the attribute name.
    if (!isUndefined(attr.prefix)) {
      attr.name = attr.prefix + attr.name;
    }
    // If attribute has suffixes, concatenate them to the attribute name.
    if (!isUndefined(attr.suffix)) {
      each(suffix => {
        attr.name += suffix.prefix + suffix.name;
      }, attr.suffix);
    }
    // Format attribute as 'name="value"' and add to attribute list.
    push(attr.name + '="' + attr.value + '"', attrList);
  }, attributes);

  // Return attributes as a space-separated string or empty string if no attributes.
  if (!size(attrList)) {
    return RAW_EMPTY;
  }
  return RAW_WHITESPACE + join(attrList);
}
