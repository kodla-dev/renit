/**
  Define Hub
  --------------------------------------------------------------------------------------------------
  Central repository for constant values used in general.
  --------------------------------------------------------------------------------------------------
*/

/**
 * The selector used to reference element nodes in the DOM.
 * @constant {string}
 */
export const DOM_ELEMENT_SELECTOR = '<!e>';

/**
 * The selector used to reference text nodes in the DOM.
 * @constant {string}
 */
export const DOM_TEXT_SELECTOR = '<!t>';

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
 * Constant representing the string 'checked'
 * @type {string}
 */
export const RAW_CHECKED = 'checked';

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
 * Constant representing the string 'click'
 * @type {string}
 */
export const RAW_CLICK = 'click';

/**
 * Represents a raw comma character ','.
 * @type {string}
 */
export const RAW_COMMA = ',';

/**
 * Constant representing a raw empty string
 * @type {string}
 */
export const RAW_EMPTY = '';

/**
 * Represents the function expression.
 * @type {string}
 */
export const RAW_FUNCTION = 'function';

/**
 * Constant representing the string 'input'
 * @type {string}
 */
export const RAW_INPUT = 'input';

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
 * Constant representing the string 'template'
 * @type {string}
 */
export const RAW_TEMPLATE = 'template';

/**
 * Constant representing the string 'textContent'
 * @type {string}
 */
export const RAW_TEXTCONTENT = 'textContent';

/**
 * Represents the undefined value.
 * @type {string}
 */
export const RAW_UNDEFINED = 'undefined';

/**
 * Constant representing the string 'value'
 * @type {string}
 */
export const RAW_VALUE = 'value';

/**
 * Constant representing a raw space character.
 * @type {string}
 */
export const RAW_WHITESPACE = ' ';

/**
 * Regular expression to match non-whitespace
 * @type {RegExp}
 */
export const RGX_NON_WHITESPACE = /\S+/g;

/**
 * Regular expression to match whitespace
 * @type {RegExp}
 */
export const RGX_WHITESPACE = /^\s*$/;
