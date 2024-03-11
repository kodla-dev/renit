import { RGX_HTML_TAGS } from '../../../core/define.js';
import { push } from '../../collect/index.js';
import { isArray, isEqual } from '../../is/index.js';
import { size } from '../../math/index.js';
import { TextNode } from '../ast.js';
import { parseHtmlTag } from './html-tag.js';

/**
 * Parses the given HTML program and returns the abstract syntax tree (AST).
 * @param {string} program The HTML program to parse.
 * @returns {Array} The abstract syntax tree representing the HTML structure.
 */
export function parseHtml(program) {
  // Initialize an empty array to store the AST and a tree to keep track of nested elements.
  const ast = [];
  const tree = [];
  let current;
  let level = -1;

  // Use regular expression to match HTML tags in the program string.
  program.replace(RGX_HTML_TAGS, (tag, index) => {
    // Determine if the tag is an opening tag or a closing tag.
    const isOpen = tag.charAt(1) !== '/';

    // Determine if the tag is a special tag like comment, script, style, template, or textarea.
    const isComment = tag.startsWith('<!--');
    const isScript = tag.startsWith('<script');
    const isStyle = tag.startsWith('<style');
    const isTemplate = tag.startsWith('<template');
    const isTextarea = tag.startsWith('<textarea');
    const isSpecial = isComment || isScript || isStyle || isTemplate || isTextarea;

    // Calculate the start index of the tag's content.
    const start = index + size(tag);

    // Get the next character after the tag.
    const nextChar = program.charAt(start);

    let parent;

    // If it's a special tag, parse it as a tag and handle it separately.
    if (isSpecial) {
      const special = parseHtmlTag(tag);

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
      current = parseHtmlTag(tag);

      // If the tag is not a void element and there is content following the tag,
      // parse the content and add it as a child of the current element.
      if (
        !current.voidElement &&
        nextChar &&
        !isEqual(nextChar, '<') &&
        isArray(current.children)
      ) {
        const text = program.slice(start, program.indexOf('<', start));
        push(TextNode(text), current.children);
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
      }
    }
  });

  // Return the AST.
  return ast;
}

// const ast = parseHtml(/*html*/ ``);
// console.log(JSON.stringify(ast, null, 2));
