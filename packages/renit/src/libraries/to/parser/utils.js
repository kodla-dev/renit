import { merge, mergeDeep } from '../../collect/index.js';
import { isEmpty, isNil } from '../../is/index.js';

/**
 * Array containing names of HTML void tags.
 * @type {string[]}
 */
// prettier-multiline-arrays-next-line-pattern: 7
const HTML_VOID_TAGS = [
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img',
  'input', 'link', 'meta', 'source', 'track', 'wbr',
];

/**
 * The name of the HTML <template> tag
 * @type {string}
 */
const HTML_TEMPLATE_TAG = 'template';

/**
 * Array containing names of HTML raw text tags
 * @type {string[]}
 */
const HTML_RAW_TEXT_TAGS = ['script', 'style'];

/**
 * Array containing names of HTML escapable raw text tags
 * @type {string[]}
 */
const HTML_ESCAPABLE_RAW_TEXT_TAGS = ['textarea', 'title'];

/**
 * Array containing names of HTML special tags
 * @type {string[]}
 */
const HTML_SPECIAL_TAGS = [
  HTML_TEMPLATE_TAG,
  ...HTML_RAW_TEXT_TAGS,
  ...HTML_ESCAPABLE_RAW_TEXT_TAGS,
];

/**
 * Regular expression pattern to match the name of an HTML tag.
 * @type {RegExp}
 */
export const RGX_HTML_TAG_NAME = /<\/?([^\s]+?)[/\s>]/;

/**
 * Regular expression pattern to match attributes of an HTML tag.
 * @type {RegExp}
 */
export const RGX_HTML_TAG_ATTRIBUTES = /\s([^'"/\s><]+?)[\s/>]|([^\s=]+)=\s?(".*?"|'.*?')/g;

/**
 * Function to generate options for HTML parsing.
 * @param {Object} options - Options object.
 * @returns {Object} - Merged options object.
 */
export function parseHtmlOptions(options) {
  // Default options
  const opts = {
    tags: {
      void: HTML_VOID_TAGS, // HTML void tags
      special: HTML_SPECIAL_TAGS, // HTML special tags,
      addSpecial: [], // Additional special tags to add
    },
    rgx: {
      tags: undefined, // Regular expression for HTML tags
      special: undefined, // Regular expression for special elements raw content
      attributeAffix: undefined, // Regular expression for attribute affixes
      checkAttrAffix: undefined, // Regular expression to check attribute affixes
    },
    attribute: {
      affix: false, // Flag to determine whether to affix attribute names parse
      affixList: [':', '@', '\\|'], // List of attribute affixes
      addAffix: [], // Additional attribute affixes to add
    },
  };

  // Merge provided options with default options
  options = mergeDeep(opts, options);
  const tags = options.tags;
  const rgx = options.rgx;
  const attr = options.attribute;

  // Merge additional special tags with the special tags list
  if (!isEmpty(tags.addSpecial)) {
    tags.special = merge(tags.addSpecial, tags.special);
  }

  // Merge additional attribute affixes with the affix list
  if (!isEmpty(attr.addAffix)) {
    attr.affixList = merge(attr.addAffix, attr.affixList);
  }

  // If regular expression for HTML tags is not provided, generate it
  if (isNil(rgx.tags)) {
    options.rgx = generateRgxHtml(tags.special, attr.affixList);
  }

  // Return merged options
  return options;
}

/**
 * Function to generate regular expressions for HTML tags and special elements.
 * @param {string[]} tags - Array of HTML tags.
 * @param {string[]} affixList - Array of affix attribute.
 * @returns {Object} - Object containing regular expressions for tags and special elements.
 */
export function generateRgxHtml(tags, affixList) {
  // OR operator
  tags = tags.join('|');

  // Regular expression pattern to match raw content within HTML special elements.
  const rgxTags = `(?:(?:<!--[\\s\\S]*?-->)|(?:<(?<e>${tags})(?:"[^"]*"|'[^']*'|[^'">])*>[^]*?</(\\k<e>)>)|(?:<(?:/|)(?!(${tags}))[a-zA-Z0-9](?:"[^"]*"|'[^']*'|[^'">])*>))`;

  // Regular expression pattern to match raw content within HTML special elements.
  const rgxSpecial = `(?:<(?<e>${tags})(?:"[^"]*"|'[^']*'|[^'">])*>(?<raw>[^]*?)<\\/(\\k<e>)>)`;

  const attributeAffix = `((?:${affixList.join('|')})?)([a-zA-Z0-9_\\-]+)`;
  const checkAttrAffix = `[${affixList.join('')}]`;

  const rgx = e => new RegExp(e, 'g');

  // Return an object containing regular expressions
  return {
    tags: rgx(rgxTags),
    special: rgx(rgxSpecial),
    attributeAffix: rgx(attributeAffix),
    checkAttrAffix: rgx(checkAttrAffix),
  };
}
