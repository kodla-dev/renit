import { merge } from '../collect/index.js';
import { isNil, isTruthy } from '../is/index.js';

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
      special: HTML_SPECIAL_TAGS, // HTML special tags
    },
    rgx: {
      tags: undefined, // Regular expression for HTML tags
      special: undefined, // Regular expression for special elements raw content
    },
    renit: false, // Renit option (default: false)
  };

  // Merge provided options with default options
  options = merge(options, opts);

  // If regular expression for HTML tags is not provided, generate it
  if (isNil(options.rgx.tags)) {
    options.rgx = generateRgxHtml(options.tags.special);
  }

  // If 'renit' option is truthy, enable some additional options
  if (isTruthy(options.renit)) {
    // opts.attribute.affix = true;
  }

  // Return merged options
  return options;
}

/**
 * Function to generate regular expressions for HTML tags and special elements.
 * @param {string[]} tags - Array of HTML tags.
 * @returns {Object} - Object containing regular expressions for tags and special elements.
 */
export function generateRgxHtml(tags) {
  // OR operator
  tags = tags.join('|');

  // Regular expression pattern to match raw content within HTML special elements.
  const rgxTags = `(?:(?:<!--[\\s\\S]*?-->)|(?:<(?<e>${tags})(?:"[^"]*"|'[^']*'|[^'">])*>[^]*?</(\\k<e>)>)|(?:<(?:/|)(?!(${tags}))[a-zA-Z0-9](?:"[^"]*"|'[^']*'|[^'">])*>))`;

  // Regular expression pattern to match raw content within HTML special elements.
  const rgxSpecial = `(?:<(?<e>${tags})(?:"[^"]*"|'[^']*'|[^'">])*>(?<raw>[^]*?)<\\/(\\k<e>)>)`;

  // Return an object containing regular expressions
  return {
    tags: new RegExp(rgxTags, 'g'),
    special: new RegExp(rgxSpecial, 'g'),
  };
}
