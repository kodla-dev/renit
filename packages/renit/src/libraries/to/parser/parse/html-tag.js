import { push } from '../../../collect/index.js';
import { isEmpty, isNull, isUndefined } from '../../../is/index.js';
import { size } from '../../../math/index.js';
import { attributeNode, commentNode, elementNode, textNode } from '../ast.js';
import { RGX_HTML_FIRST_TAG, RGX_HTML_TAG_ATTRIBUTES, RGX_HTML_TAG_NAME } from '../utils.js';

/**
 * Parses an HTML tag.
 * @param {string} tag - The HTML tag to parse.
 * @param {Object} options - Options object.
 * @returns {Object} - The parsed HTML tag represented as a node.
 */
export function parseHtmlTag(tag, options) {
  // Create a new elementNode to represent the parsed tag.
  const node = elementNode();

  // Extract the tag name from the tag using a regular expression.
  const name = tag.match(RGX_HTML_TAG_NAME)[1];

  // If a tag name is found, assign it to the node and determine if it's a void element.
  if (name) {
    node.name = name;
    node.voidElement = options.tags.void.includes(name) || tag.charAt(size(tag) - 2) === '/';

    // If it's a comment node, create a commentNode with the comment text and return it.
    if (node.name.startsWith('!--')) {
      const endIndex = tag.indexOf('-->');
      return commentNode(endIndex !== -1 ? tag.slice(4, endIndex) : '');
    }
  }

  // Determine if the tag is a special element like script, style, template, etc.
  const isSpecial = options.tags.special.includes(node.name);

  // Regular expression to match attributes in the tag.
  const rgxAttr = new RegExp(RGX_HTML_TAG_ATTRIBUTES);
  let tree;
  let tempTag;

  // Extract the opening part of the tag using a regular expression to isolate the first part of the tag.
  if (isSpecial) {
    tempTag = new RegExp(RGX_HTML_FIRST_TAG).exec(tag)[0];
  } else {
    tempTag = tag;
  }

  // Loop through all attribute matches in the tag.
  for (;;) {
    tree = rgxAttr.exec(tempTag);

    // If no more matches are found, exit the loop.
    if (isNull(tree)) break;

    let name = tree[1] || tree[3] || tree[5] || tree[7] || tree[9];
    let value = tree[2] || tree[4] || tree[6] || tree[8];

    // Trim attribute name and value if they exist.
    if (!isUndefined(name)) name = name.trim();
    if (!isUndefined(value)) value = value.trim();

    // If the match is empty, skip to the next match.
    if (!name) continue;

    // If the match contains attribute name and value, parse and add it to the node's attributes.
    attribute(name, value, node, options);
  }

  // If it's a special element, extract its raw content and add it as a child node.
  if (isSpecial) {
    const rgxRaw = new RegExp(options.rgx.special);
    const raw = rgxRaw.exec(tag);
    let text = raw ? raw.groups.raw : '';
    if (options.transform.trim) text = text.trim();
    push(textNode(text), node.children);
  }

  // Return the parsed elementNode.
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
    push(attributeNode(af.name, value, af.prefix, af.suffix), node.attributes);
  } else {
    // Otherwise, set the attribute name as is
    push(attributeNode(name, value), node.attributes);
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
