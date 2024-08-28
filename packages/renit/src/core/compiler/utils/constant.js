/**
 * A list of standard HTML element names.
 *
 * This array contains the names of all standard HTML elements. It can be used
 * to verify whether a given tag name is a valid HTML element.
 *
 * @type {string[]}
 */
// prettier-multiline-arrays-next-line-pattern: 12 10 12 12 12 11 11 11 11
export const HTMLElements = [
  'a', 'abbr', 'address', 'area', 'article', 'aside', 'audio', 'b', 'base', 'bdi', 'bdo', 'big',
  'blockquote', 'body', 'br', 'button', 'canvas', 'caption', 'cite', 'code', 'col', 'colgroup',
  'data', 'datalist', 'dd', 'del', 'details', 'dfn', 'dialog', 'div', 'dl', 'dt', 'em', 'embed',
  'fieldset', 'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head',
  'header', 'hr', 'html', 'i', 'iframe', 'img', 'input', 'ins', 'kbd', 'keygen', 'label', 'legend',
  'li', 'link', 'main', 'map', 'mark', 'menu', 'menuitem', 'meta', 'meter', 'nav', 'noscript',
  'object', 'ol', 'optgroup', 'option', 'output', 'p', 'param', 'picture', 'pre', 'progress', 'q',
  'rp', 'rt', 'ruby', 's', 'samp', 'script', 'section', 'select', 'small', 'source', 'span',
  'strong', 'style', 'sub', 'summary', 'sup', 'table', 'tbody', 'td', 'textarea', 'tfoot', 'th',
  'thead', 'time', 'title', 'tr', 'track', 'u', 'ul', 'var', 'video', 'wbr',
];

/**
 * A list of standard SVG element names.
 *
 * This array contains the names of all standard SVG elements. It can be used
 * to verify whether a given tag name is a valid SVG element.
 *
 * @type {string[]}
 */
// prettier-multiline-arrays-next-line-pattern: 7 5 8 6 9
export const SVGElements = [
  'circle', 'clipPath', 'defs', 'ellipse', 'feBlend', 'feColorMatrix', 'feComponentTransfer',
  'feComposite', 'feConvolveMatrix', 'feDiffuseLighting', 'feDisplacementMap', 'feDistantLight',
  'feFlood', 'feFuncA', 'feFuncB', 'feFuncG', 'feFuncR', 'feGaussianBlur', 'feImage', 'feMerge',
  'feMergeNode', 'feMorphology', 'feOffset', 'fePointLight', 'feSpecularLighting', 'feSpotLight',
  'feTile', 'feTurbulence', 'g', 'line', 'linearGradient', 'mask', 'path', 'pattern', 'polygon',
  'polyline', 'radialGradient', 'rect', 'stop', 'svg', 'text', 'tspan',
];

/**
 * A list of custom NIT (Non-Standard) element names.
 *
 * This array contains the names of custom elements used in the Renit framework.
 * These elements represent non-standard HTML elements that might be used.
 *
 * @type {string[]}
 */
export const NITElements = ['if', 'elseif', 'else', 'for'];

/**
 * Constant representing the string '$event'.
 * @type {string}
 */
export const $event = '$event';

/**
 * Constant representing the string '$element'.
 * @type {string}
 */
export const $element = '$element';

/**
 * A pattern representing an empty Program node in an AST.
 * @type {Object}
 */
export const ProgramPattern = {
  type: 'Program',
  body: [],
};

/**
 * Pattern for a div element node.
 * @type {Object}
 */
export const ElementDivPattern = {
  type: 'Element',
  name: 'div',
  voidElement: false,
  attributes: [],
  children: [],
};

/**
 * Pattern for an attribute node.
 * @type {Object}
 */
export const AttributePattern = {
  type: 'Attribute',
  prefix: undefined,
  name: '',
  suffix: undefined,
  value: '',
};

/**
 * Pattern for a string attribute node.
 * @type {Object}
 */
export const StringAttributePattern = {
  type: 'StringAttribute',
  content: '',
};

/**
 * Pattern for a raw node.
 * @type {Object}
 */
export const RawPattern = {
  type: 'Raw',
  loc: null,
  value: '',
};
