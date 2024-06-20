import { RAW_EMPTY, RAW_WHITESPACE, RGX_WHITESPACE } from '../../../../core/define.js';
import { pipe } from '../../../../helpers/index.js';
import { each, join, push, reduce, some } from '../../../collect/index.js';
import { isArray, isEmpty, isEqual, isUndefined } from '../../../is/index.js';
import { size } from '../../../math/index.js';
import { words } from '../../../string/index.js';
import { TextNode } from '../ast.js';
import { RGX_HTML_OUTSIDE_TAGS, parseHtmlOptions } from '../utils.js';
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

  // Initialize an empty array to store the AST and a tree to keep track of nested elements.
  const ast = [];
  const tree = [];
  let current;
  let level = -1;

  // Replace text outside HTML tags with a specific format
  program = program.replace(RGX_HTML_OUTSIDE_TAGS, (tag, ...args) => {
    let text = args[2];
    if (!isUndefined(text)) {
      if (options.transform.trim) text = text.trim();
      if (!isEmpty(text)) {
        if (!options.transform.whitespace) text = pipe(text, words, join);
        return `<!--text:${text}-->`;
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

    // Get the next character after the tag.
    const nextChar = program.charAt(start);

    let parent;

    // If it's a special tag, parse it as a tag and handle it separately.
    if (isSpecial) {
      const special = parseHtmlTag(tag, options);
      if (!special) return;

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

      // If the tag is not a void element and there is content following the tag,
      // parse the content and add it as a child of the current element.
      if (
        !current.voidElement &&
        nextChar &&
        !isEqual(nextChar, '<') &&
        isArray(current.children)
      ) {
        let text = program.slice(start, program.indexOf('<', start));
        if (!options.transform.whitespace) {
          if (!RGX_WHITESPACE.test(text)) {
            if (options.transform.trim) {
              text = text.trim();
            } else {
              text = text.replaceAll('\n', '');
            }
            push(TextNode(text), current.children);
          }
        } else {
          if (!RGX_WHITESPACE.test(text)) {
            if (options.transform.trim) text = text.trim();
          }
          push(TextNode(text), current.children);
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
      if (level > -1 && (current.voidElement || isEqual(current.name, tag.slice(2, -1)))) {
        level--;
        current = level === -1 ? ast : tree[level];
      }
      if (nextChar !== '<' && nextChar) {
        parent = level === -1 ? ast : tree[level].children;
        const end = program.indexOf('<', start);
        let content = program.slice(start, end === -1 ? undefined : end);
        if (end > -1 && level + size(parent) >= 0) {
          if (parent && isArray(parent)) {
            if (options.transform.whitespace) {
              if (!RGX_WHITESPACE.test(content)) {
                if (options.transform.trim) content = content.trim();
              }
              push(TextNode(content), parent);
            } else {
              if (options.transform.trim) content = content.trim();
              if (!RGX_WHITESPACE.test(content)) {
                content = content.replaceAll('\n', '');
                push(TextNode(content), parent);
              }
            }
          }
        }
      }
    }
  });

  // Return the AST.
  return ast;
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
    ast
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
