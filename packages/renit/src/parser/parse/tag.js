import { push } from '../../collect/index.js';
import { HTML_VOID_ELEMENTS, RGX_HTML_TAG_ATTRIBUTES, RGX_HTML_TAG_NAME } from '../../define.js';
import { isNull } from '../../is/index.js';
import { size } from '../../math/index.js';
import { AttributeNode, CommentNode, ElementNode } from '../ast.js';

/**
 * This function parses an HTML tag and returns an ElementNode representing it.
 * @param {string} tag
 * @returns
 */
export function parseTag(tag) {
  // Create a new ElementNode to represent the parsed tag.
  const node = ElementNode();

  // Extract the tag name from the tag using a regular expression.
  const name = tag.match(RGX_HTML_TAG_NAME)[1];

  // If a tag name is found, assign it to the node and determine if it's a void element.
  if (name) {
    node.name = name;
    node.voidElement = HTML_VOID_ELEMENTS.includes(name) || tag.charAt(size(tag) - 2) === '/';

    // If it's a comment node, create a CommentNode with the comment text and return it.
    if (node.name.startsWith('!--')) {
      const endIndex = tag.indexOf('-->');
      return CommentNode(endIndex !== -1 ? tag.slice(4, endIndex) : '');
    }
  }

  // Regular expression to match attributes in the tag.
  const rgxAttr = new RegExp(RGX_HTML_TAG_ATTRIBUTES);
  let tree;

  // Loop through all attribute matches in the tag.
  for (;;) {
    tree = rgxAttr.exec(tag);

    // If no more matches are found, exit the loop.
    if (isNull(tree)) break;

    // If the match is empty, skip to the next match.
    if (!tree[0].trim()) continue;

    // If the match contains attribute name and value, parse and add it to the node's attributes.
    if (tree[1]) {
      const attr = tree[1].trim();
      let temp = [attr, ''];
      if (attr.indexOf('=') > -1) {
        temp = attr.split('=');
      }
      push(AttributeNode(temp[0], temp[1]), node.attributes);
      rgxAttr.lastIndex--;
    } else if (tree[2]) {
      push(AttributeNode(tree[2], tree[3].trim().substring(1, size(tree[3]) - 1)), node.attributes);
    }
  }

  // Return the parsed ElementNode.
  return node;
}
