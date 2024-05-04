import { push } from '../../../collect/index.js';
import { isEmpty, isNull } from '../../../is/index.js';
import { size } from '../../../math/index.js';
import { AttributeNode, CommentNode, ElementNode, TextNode } from '../ast.js';
import { RGX_HTML_TAG_ATTRIBUTES, RGX_HTML_TAG_NAME } from '../utils.js';

/**
 * Parses an HTML tag.
 * @param {string} tag - The HTML tag to parse.
 * @param {Object} options - Options object.
 * @returns {Object} - The parsed HTML tag represented as a node.
 */
export function parseHtmlTag(tag, options) {
  // Create a new ElementNode to represent the parsed tag.
  const node = ElementNode();

  // Extract the tag name from the tag using a regular expression.
  const name = tag.match(RGX_HTML_TAG_NAME)[1];

  // If a tag name is found, assign it to the node and determine if it's a void element.
  if (name) {
    node.name = name;
    node.voidElement = options.tags.void.includes(name) || tag.charAt(size(tag) - 2) === '/';

    // If it's a comment node, create a CommentNode with the comment text and return it.
    if (node.name.startsWith('!--')) {
      const endIndex = tag.indexOf('-->');
      return CommentNode(endIndex !== -1 ? tag.slice(4, endIndex) : '');
    }
  }

  // Determine if the tag is a special element like script, style, template, etc.
  const isSpecial = options.tags.special.includes(node.name);

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
    if (tree[1] && !isSpecial) {
      const attr = tree[1].trim();
      let temp = [attr, ''];
      if (attr.indexOf('=') > -1) {
        temp = attr.split('=');
      }
      attribute(temp[0], temp[1], node, options);
      rgxAttr.lastIndex--;
    } else if (tree[2]) {
      attribute(tree[2], tree[3].trim().substring(1, size(tree[3]) - 1), node, options);
    }
  }

  // If it's a special element, extract its raw content and add it as a child node.
  if (isSpecial) {
    const rgxRaw = new RegExp(options.rgx.special);
    const raw = rgxRaw.exec(tag);
    push(TextNode(raw ? raw.groups.raw : ''), node.children);
  }

  // Return the parsed ElementNode.
  return node;
}

/**
 * Sets an attribute on a node with optional affixing.
 * @param {string} name - Attribute name.
 * @param {string} value - Attribute value.
 * @param {Object} node - HTML node.
 * @param {Object} options - Options object.
 */
function attribute(name, value, node, options) {
  // If value is falsy, set it to undefined
  if (!value) value = undefined;

  // If affixing is enabled in options, affix the attribute name
  if (options.attribute.affix) {
    const af = attributeAffix(name, options);
    push(AttributeNode(af.name, value, af.prefix, af.suffix), node.attributes);
  } else {
    // Otherwise, set the attribute name as is
    push(AttributeNode(name, value), node.attributes);
  }
}

/**
 * Checks and affixes an attribute name with a prefix or suffix based on options.
 * @param {string} name - Attribute name.
 * @param {Object} options - Options object.
 * @returns {Object} - Affixed attribute name object.
 */
function attributeAffix(name, options) {
  // If the attribute name doesn't match the pattern, return it as is
  if (!options.rgx.checkAttrAffix.test(name)) return { name };
  const found = [];
  const matches = name.matchAll(options.rgx.attributeAffix);

  // Extract prefix and name from matches
  for (const match of matches) {
    found.push({ prefix: match[1], name: match[2] });
  }

  const first = found[0];

  // If no matches, return the name as is
  if (!first) return { name };

  found.shift();

  // Construct and return the affixed attribute name object
  return {
    prefix: !isEmpty(first.prefix) ? first.prefix : undefined,
    name: first.name,
    suffix: !isEmpty(found) ? found : undefined,
  };
}
