import { push } from '../../libraries/collect/index.js';
import { isArray, isEqual } from '../../libraries/is/index.js';
import { size } from '../../libraries/math/index.js';
import { RGX_HTML_TAGS } from '../define.js';
import { TextNode } from './ast.js';
import { parseTag } from './parse/tag.js';

/**
 * Parses the given HTML program and returns the abstract syntax tree (AST).
 * @param {string} program The HTML program to parse.
 * @returns {Array} The abstract syntax tree representing the HTML structure.
 */
export function parse(program) {
  // Initialize an empty array to store the AST and a tree to keep track of nested elements.
  const ast = [];
  const tree = [];
  let current;
  let level = -1;

  // Use regular expression to match HTML tags in the program string.
  program.replace(RGX_HTML_TAGS, (tag, index) => {
    // Determine if the tag is an opening tag or a closing tag.
    const isOpen = tag.charAt(1) !== '/';

    // Determine if the tag is a comment.
    const isComment = tag.startsWith('<!--');

    // Calculate the start index of the tag's content.
    const start = index + size(tag);

    // Get the next character after the tag.
    const nextChar = program.charAt(start);

    let parent;

    // If it's a comment, parse it as a tag and handle separately.
    if (isComment) {
      const comment = parseTag(tag);

      // If it's at root level, add the comment directly to the AST.
      if (level < 0) {
        push(comment, ast);
        return ast;
      }

      // Otherwise, add the comment as a child of the current parent.
      parent = tree[level];
      if (parent && parent.children && isArray(parent.children)) {
        parent.children.push(comment);
      }
      return ast;
    }

    // If it's an opening tag, increment the nesting level and parse the tag.
    if (isOpen) {
      level++;
      current = parseTag(tag);

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

const ast = parse(/*html*/ `
  <div>
    <p>text</p>
  </div>
  <!-- comment line -->
  <p>text</p>
  <div>
    <!-- nested comment line -->
    <p attr="value">text</p>
    <!--
      multiple comment line
      multiple comment line
      multiple comment line
    -->
  </div>
`);

console.log(JSON.stringify(ast, null, 2));
