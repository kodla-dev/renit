/**
  Define Hub
  --------------------------------------------------------------------------------------------------
  Central repository for constant values used in general.
  --------------------------------------------------------------------------------------------------
*/

/**
 * Represents the maximum safe integer.
 * @type {number}
 */
export const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER || Math.pow(2, 53) - 1;

/**
 * Used to indicate asynchronous behavior.
 * @type {string}
 */
export const RAW_ASYNC = 'async';

/**
 * Represents async functions.
 * @type {string}
 */
export const RAW_ASYNC_FUNCTION = 'AsyncFunction';

/**
 * Represents boolean values.
 * @type {string}
 */
export const RAW_BOOLEAN = 'boolean';

/**
 * Represents the "class" expression in object-oriented programming.
 * @type {string}
 */
export const RAW_CLASS = 'class';

/**
 * The name of the class attribute used in DOM manipulation.
 */
export const RAW_CLASS_NAME = 'className';

/**
 * Represents the function expression.
 * @type {string}
 */
export const RAW_FUNCTION = 'function';

/**
 * Represents the "Map" data structure.
 * @type {string}
 */
export const RAW_MAP = 'map';

/**
 * Represents a non-numeric value.
 * @type {string}
 */
export const RAW_NAN = 'NaN';

/**
 * Represents the null value.
 * @type {string}
 */
export const RAW_NULL = 'null';

/**
 * Represents numerical values.
 * @type {string}
 */
export const RAW_NUMBER = 'number';

/**
 * Represents objects.
 * @type {string}
 */
export const RAW_OBJECT = 'object';

/**
 * Represents asynchronous operations.
 * @type {string}
 */
export const RAW_PROMISE = 'promise';

/**
 * Represents the data structure for storing unique values.
 * @type {string}
 */
export const RAW_SET = 'set';

/**
 * Represents text values.
 * @type {string}
 */
export const RAW_STRING = 'string';

/**
 * The name of the style attribute used in DOM manipulation.
 * @type {string}
 */
export const RAW_STYLE = 'style';

/**
 * Represents unique values.
 * @type {string}
 */
export const RAW_SYMBOL = 'symbol';

/**
 * Represents the undefined value.
 * @type {string}
 */
export const RAW_UNDEFINED = 'undefined';

/**
 * Regular expression pattern to match HTML tags.
 * @type {RegExp}
 */
export const RGX_HTML_TAGS =
  /(?:(?:<!--[\s\S]*?-->)|(?:<(?<e>script|style|template|textarea)(?:"[^"]*"|'[^']*'|[^'">])*>[^]*?<\/(\k<e>)>)|(?:<(?:\/|)(?!(script|style|template|textarea))[a-zA-Z0-9](?:"[^"]*"|'[^']*'|[^'">])*>))/g;

/**
 * Regular expression pattern to match raw content within HTML special elements.
 * @type {RegExp}
 */
export const RGX_HTML_SPECIAL_ELEMENTS_RAW =
  /(?:<(?<e>script|style|template|textarea)(?:"[^"]*"|'[^']*'|[^'">])*>(?<raw>[^]*?)<\/(\k<e>)>)/g;

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
 * Array containing names of HTML void elements.
 * @type {string[]}
 */
// prettier-multiline-arrays-next-line-pattern: 12
export const HTML_VOID_ELEMENTS = [
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source',
  'track', 'wbr',
];

/**
 * Array containing names of HTML special elements.
 * @type {string[]}
 */
export const HTML_SPECIAL_ELEMENTS = ['script', 'style', 'template', 'textarea'];
