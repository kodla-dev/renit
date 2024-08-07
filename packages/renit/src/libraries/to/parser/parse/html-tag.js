import { RAW_EMPTY, RAW_WHITESPACE } from '../../../../core/define.js';
import { includes, push } from '../../../collect/index.js';
import { isEmpty, isNull, isUndefined } from '../../../is/index.js';
import { size } from '../../../math/index.js';
import { AttributeNode, CommentNode, ElementNode, TextNode } from '../ast.js';
import {
  RGX_HTML_FIRST_TAG,
  RGX_HTML_TAG_ATTRIBUTES,
  RGX_HTML_TAG_NAME,
  commentEnd,
  textSelector,
} from '../utils.js';

/**
 * Parses an HTML tag.
 *
 * This function takes an HTML tag as a string and an options object, then parses the tag
 * to create a node representation of the tag. It handles void elements, special tags
 * (like comments and certain HTML elements), and attributes.
 *
 * @param {string} tag - The HTML tag to parse.
 * @param {Object} options - Options object.
 * @returns {Object} - The parsed HTML tag represented as a node.
 */
export function parseHtmlTag(tag, options) {
  // Create a new ElementNode to represent the parsed tag.
  let node = ElementNode();

  // Extract the tag name from the tag using a regular expression.
  const name = tag.match(RGX_HTML_TAG_NAME)[1];

  // If a tag name is found, assign it to the node and determine if it's a void element.
  if (name) {
    node.name = name;
    node.voidElement = options.tags.void.includes(name) || tag.charAt(size(tag) - 2) === '/';

    // Check if the tag is a comment.
    if (node.name.startsWith('!--')) {
      const endIndex = tag.indexOf(commentEnd);
      let value = endIndex !== -1 ? tag.slice(4, endIndex) : RAW_EMPTY;

      // Trim the comment value if the trim option is enabled.
      if (options.transform.trim) value = value.trim();

      // Handle special text nodes in comments.
      if (value.startsWith(textSelector)) {
        value = value.replace(textSelector, RAW_EMPTY);
        if (value != RAW_EMPTY) {
          return TextNode(value);
        }
        return false;
      }

      node = CommentNode(value);

      if (options.need.position && options.need.loc) {
        const { start, end } = options.index;
        const { loc, line, column } = options.fn;
        const Loc = loc();
        Loc.start.line = line(start);
        Loc.start.column = column(Loc.start.line, '<!--');
        Loc.end.line = line(end);
        Loc.end.column = column(Loc.end.line, '-->', 2);
        node.loc = Loc;
      }

      // Return a CommentNode for regular comments.
      return node;
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

    // If the match is empty, skip to the next match.
    if (!name) continue;

    // Trim attribute name and value if they exist.
    if (!isUndefined(name)) name = name.trim();
    if (!isUndefined(value)) value = value.trim();

    // Handle attributes with template syntax.
    if (includes('{', name)) {
      value = name;
      name = /{(.*?)}/g.exec(name)[1];
    }

    const select = tree[0];

    // If the attribute value contains '=' or '{', wrap it in curly braces
    if (includes('={', select)) {
      value = '{' + value + '}';
    }

    // If the match contains attribute name and value, parse and add it to the node's attributes.
    attribute(name, value, node, select, tempTag, options);
  }

  // If it's a special element, extract its raw content and add it as a child node.
  if (isSpecial) {
    const rgxRaw = new RegExp(options.rgx.special);
    const raw = rgxRaw.exec(tag);
    let text = raw ? raw.groups.raw : '';
    if (options.transform.trim) text = text.trim();
    const content = TextNode(text);
    if (options.need.position) {
      const startIndex = options.index.start + size(tempTag);
      const rawSize = size(raw.groups.raw);

      if (options.need.index) {
        content.start = startIndex;
        content.end = startIndex + rawSize;
      }

      if (options.need.loc) {
        const { start, end } = options.index;
        const { loc, line, column } = options.fn;
        let Loc = loc();
        Loc.start.line = line(start);
        Loc.start.column = column(Loc.start.line, tempTag);
        Loc.end.line = line(end);
        Loc.end.column = column(Loc.end.line, '</' + name + '>', 2);
        node.loc = Loc;

        Loc = loc();
        Loc.start.line = line(startIndex);
        Loc.start.column = column(Loc.start.line, tempTag, 2);
        Loc.end.line = line(startIndex + rawSize);
        Loc.end.column = column(Loc.end.line, '</' + name + '>');
        content.loc = Loc;
      }
    }
    push(content, node.children);
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
function attribute(name, value, node, select, tag, options) {
  // If value is falsy, set it to undefined
  if (!value) value = undefined;

  // If affixing is enabled in options, affix the attribute name
  if (options.attribute.affix) {
    const af = attributeAffix(name, options);
    const attribute = AttributeNode(af.name, value, af.prefix, af.suffix);
    push(attribute, node.attributes);
  } else {
    // Otherwise, set the attribute name as is
    const attribute = AttributeNode(name, value);
    if (options.need.position) {
      const { start } = options.index;
      const section = size(tag.slice(0, tag.indexOf(select)));
      let selectIndex = start + section;
      let startIndex = selectIndex;
      const selectSize = size(select);
      if (select.startsWith(RAW_WHITESPACE)) startIndex++;

      if (options.need.index) {
        attribute.start = startIndex;
        attribute.end = selectIndex + selectSize;
      }
      if (options.need.loc) {
        const { loc, line, column } = options.fn;
        const Loc = loc();
        Loc.start.line = line(startIndex);
        Loc.start.column = column(Loc.start.line, select);
        Loc.end.line = line(selectIndex + selectSize);
        Loc.end.column = column(Loc.end.line, select, 2);
        attribute.loc = Loc;
      }
    }
    push(attribute, node.attributes);
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
