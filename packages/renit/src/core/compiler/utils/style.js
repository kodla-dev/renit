import { Features, composeVisitors, transform } from 'lightningcss';
import { clone } from '../../../helpers/index.js';
import {
  each,
  filter,
  includes,
  join,
  map,
  prepend,
  push,
  remove,
  split,
} from '../../../libraries/collect/index.js';
import { isArray, isEqual, isString } from '../../../libraries/is/index.js';
import { RAW_EMPTY, RAW_WHITESPACE } from '../../define.js';
import { global } from '../global.js';
import { AttributePattern, StringAttributePattern } from './constant.js';
import { uniqueStyleHash } from './hash.js';
import { generateId } from './index.js';

// Generates unique short class names for styling
const styleHash = new uniqueStyleHash();

/**
 * Generates a style hash based on the provided name, minimum, and maximum values.
 *
 * @param {Object} options - The options object containing name, min, and max values.
 * @param {string} options.name - The name associated with the style.
 * @param {number} options.min - The minimum value to be used in generating the style.
 * @param {number} options.max - The maximum value to be used in generating the style.
 * @returns {string} - The generated style hash.
 */
export function generateStylePattern({ component, name, min, max }) {
  return generateStyleHash(min, max, component.file + component.name + name);
}

/**
 * Generate a unique style hash with specified minimum and maximum lengths.
 * @param {number} min - The minimum length of the hash.
 * @param {number} max - The maximum length of the hash.
 * @returns {string} The generated style hash.
 */
export function generateStyleHash(min, max, name) {
  styleHash.setMin(min);
  styleHash.setMax(max);
  if (!name) name = generateId();
  return styleHash.create(name);
}

/**
 * Creates a CSS Modules visitor that processes and renames CSS selectors.
 *
 * @param {Object} options - The options for CSS processing.
 * @returns {Object} An object with a Selector method for processing CSS selectors.
 */
export const cssModules = options => ({
  Selector(selector) {
    each(node => {
      // Check if the node is of type 'id' or 'class'
      if (node.type == 'id' || node.type == 'class') {
        const type = node.type == 'class' ? 'class' : 'id';
        const hash = type == 'id' ? '#' : '.';
        const oldName = node.name;

        // Find if there's already a global change for the selector
        const findGlobalChange = global.styles.find(
          change => change.old == oldName && change.type == type
        );
        let newName;

        if (findGlobalChange) {
          newName = findGlobalChange.new;
        } else {
          // Generate a new name using the provided pattern
          newName = options.css.pattern({
            name: hash + oldName,
            min: options.css.hash.min,
            max: options.css.hash.max,
            component: options.component,
          });
          push({ type, old: oldName, new: newName }, global.styles);
        }
        node.name = newName;
      }
    }, selector);

    return selector;
  },
});

/**
 * Creates a CSS Variables Modules visitor that processes custom and unparsed CSS declarations.
 *
 * @param {Object} options - The options for CSS processing.
 * @returns {Object} An object with a Declaration method for processing CSS declarations.
 */
export const cssVariablesModules = options => ({
  Declaration(declaration) {
    const key = '--';

    if (declaration.property == 'custom') {
      let value = declaration.value.name;
      if (includes(key, value)) {
        // Generate a new name for the custom property
        const newValue = options.css.pattern({
          name: value,
          min: options.css.hash.min,
          max: options.css.hash.max,
          component: options.component,
        });
        global.variables[value] = key + newValue;
        declaration.value.name = key + newValue;
      }
    }

    if (declaration.property === 'unparsed') {
      each((value, index) => {
        if (value.type == 'var') {
          let name = value.value.name.ident;
          if (includes(key, name)) {
            if (global.variables[name]) {
              // Update the name of the variable if it exists in global variables
              declaration.value.value[index].value.name.ident = global.variables[name];
            }
          }
        }
      }, declaration.value.value);
    }

    return declaration;
  },
});

/**
 * Configuration for custom at-rules used in CSS processing.
 * @type {Object}
 */
export const customAtRules = {
  light: {
    prelude: null,
    body: 'style-block',
  },
  dark: {
    prelude: null,
    body: 'style-block',
  },
  ltr: {
    prelude: null,
    body: 'style-block',
  },
  rtl: {
    prelude: null,
    body: 'style-block',
  },
  screen: {
    prelude: '<custom-ident>',
    body: 'style-block',
  },
  block: {
    prelude: '<custom-ident>',
    body: 'style-block',
  },
  include: {
    prelude: '<custom-ident>',
  },
  includes: {
    prelude: '<custom-ident>',
    body: 'style-block',
  },
};

/**
 * Generates a nesting rule based on an attribute selector.
 * @param {Object} rule - The rule object containing the location and style information.
 * @param {string} key - The attribute name to be used in the selector.
 * @param {string} name - The value to match for the attribute.
 * @returns {Object} The generated nesting rule with attribute-based selectors.
 */
const attrRule = (rule, key, name) => ({
  type: 'nesting',
  value: {
    loc: rule.loc,
    style: {
      loc: rule.loc,
      rules: rule.body.value,
      selectors: [
        [
          {
            type: 'attribute',
            name: key,
            operation: {
              operator: 'equal',
              value: name,
            },
          },
          { type: 'combinator', value: 'descendant' },
          { type: 'nesting' },
        ],
      ],
    },
  },
});

/**
 * Creates a CSS visitor that processes and updates at-rules and variables.
 *
 * @param {Object} options - The options for CSS processing.
 * @returns {Object} An object with Rule and Token methods for processing at-rules and variables.
 */
export const cssAtVariables = options => ({
  Rule: {
    custom: {
      block(rule) {
        global.blocks[rule.prelude.value] = rule.body.value;
        return [];
      },
      include(rule) {
        return global.blocks[rule.prelude.value];
      },
      includes(rule) {
        const value = rule.body.value;
        const blocks = global.blocks[rule.prelude.value];
        map(block => {
          if (block.value.rules[0].value.name == 'content') {
            block.value.declarations = value[0].value.declarations;
            block.value.rules = [];
          }
        }, blocks);
        return blocks;
      },
      light: rule => attrRule(rule, 'data-theme', 'light'),
      dark: rule => attrRule(rule, 'data-theme', 'dark'),
      ltr: rule => attrRule(rule, 'dir', 'ltr'),
      rtl: rule => attrRule(rule, 'rtl'),
      screen(rule) {
        if (isString(rule.prelude.value) && rule.prelude.value in options.css.breakpoints.sizes) {
          let unit = options.css.breakpoints.unit;
          let value = options.css.breakpoints.sizes[rule.prelude.value];
          if (isString(value)) {
            unit = value.replace(/[0-9]/g, '');
            value = Number(value.replace(unit, ''));
          }
          return {
            type: 'media',
            value: {
              rules: rule.body.value,
              loc: rule.loc,
              query: {
                mediaQueries: [
                  {
                    mediaType: 'all',
                    condition: {
                      type: 'feature',
                      value: {
                        type: 'plain',
                        name: 'min-width',
                        value: {
                          type: 'length',
                          value: {
                            type: 'value',
                            value: {
                              unit: unit,
                              value: value,
                            },
                          },
                        },
                      },
                    },
                  },
                ],
              },
            },
          };
        }
      },
    },
    unknown(rule) {
      const pre = rule.prelude[0];
      if (pre.type == 'var') {
        const name = pre.value.name.ident;
        // Update the variable name if it exists in global variables
        if (global.variables[name]) {
          rule.prelude[0].value.name.ident = global.variables[name];
        }
      } else if (pre.type == 'token') {
        if (pre.value.type == 'at-keyword') {
          const name = pre.value.value;
          // Update the at-keyword if it exists in global atVariables
          if (global.atVariables[name]) {
            rule.prelude = global.atVariables[name];
          }
        }
      }

      // Store the rule's name and prelude in global atVariables
      global.atVariables[rule.name] = rule.prelude;
      return [];
    },
  },
  Token: {
    'at-keyword'(token) {
      return global.atVariables[token.value];
    },
  },
});

/**
 * Creates a CSS visitor that processes and converts custom units to the specified unit.
 *
 * @param {Object} options - The options for CSS processing.
 * @returns {Object} An object with a Token method for processing units.
 */
export const cssUnits = options => ({
  Token: {
    dimension(token) {
      if (token.unit === 'nt') {
        const { multiplier, unit } = options.css.units.nt;
        return {
          raw: `${token.value * multiplier}${unit}`,
        };
      }
    },
  },
});

/**
 * Creates a list of property objects from the given properties data.
 *
 * @param {Object} properties - An object where keys are property names and values contain the property data.
 * @returns {Array} An array of property objects formatted for further processing.
 */
const createProperty = properties => {
  const props = [];

  // Iterate over the properties object and format each property
  each((property, data) => {
    push(
      {
        property: data.t,
        value: {
          propertyId: {
            property: property,
          },
          value: data.v,
        },
      },
      props
    );
  }, properties);
  return props;
};

/**
 * Creates multiple property objects from a given property and type, distributing values
 * across provided property names.
 *
 * @param {Object} prop - The main property object containing the value(s) to distribute.
 * @param {string} type - The type to assign to each created property.
 * @param {...string} props - The property names to create from the given values.
 * @returns {Array} An array of property objects formatted for further processing.
 */
const createMultipleProperty = (prop, type, ...props) => {
  let multiple = false;
  let v = prop.value;

  // Check if the property value contains multiple dimensions
  if (v.length > 1) {
    multiple = true;
  }

  const prp = {};

  // Distribute the property values across the provided property names
  each((name, index) => (prp[name] = { v: multiple ? [v[index * 2]] : v, t: type }), props);
  return createProperty(prp);
};

/**
 * Creates a CSS visitor that processes custom properties.
 *
 * @returns {Object} An object with a Declaration method for processing properties.
 */
export const cssProperties = () => ({
  Declaration: {
    custom: {
      size: prop => createMultipleProperty(prop, 'unparsed', 'width', 'height'),
      mx: prop => createMultipleProperty(prop, 'unparsed', 'margin-left', 'margin-right'),
      my: prop => createMultipleProperty(prop, 'unparsed', 'margin-top', 'margin-bottom'),
      px: prop => createMultipleProperty(prop, 'unparsed', 'padding-left', 'padding-right'),
      py: prop => createMultipleProperty(prop, 'unparsed', 'padding-top', 'padding-bottom'),
    },
  },
});

/**
 * Compiles CSS using the specified options and returns the resulting code.
 *
 * @param {string} css - The CSS code to compile.
 * @param {Object} options - The options for CSS compilation.
 * @returns {Object} The compiled CSS code.
 */
export function compilerStyle(css, options) {
  let include;
  if (options.css.colors) include |= Features.Colors;
  if (options.css.nesting) include |= Features.Nesting;
  if (options.css.mediaQueries) include |= Features.MediaQueries;
  if (options.css.selectors) include |= Features.Selectors;

  // Compose visitors for processing CSS modules and variables
  const visitor = composeVisitors([
    cssModules(options),
    cssVariablesModules(options),
    cssAtVariables(options),
    cssUnits(options),
    cssProperties(options),
  ]);
  const opts = {
    code: Buffer.from(css),
    minify: false,
    sourceMap: false,
    include,
    customAtRules,
    visitor,
  };
  let t = transform(opts);
  let code = RAW_EMPTY;
  if (t.code) code = t.code.toString();
  return { code };
}

/**
 * Prepares CSS content by applying transformations and returning processed styles.
 *
 * @param {string} content - The CSS content to prepare.
 * @param {Object} options - The options for preparing the CSS.
 * @returns {Object} The prepared CSS with raw code, tracked changes, and identified selectors.
 */
export function prepareStyle(content, options) {
  const changedStyles = [];
  let has = {
    this: {
      name: false,
      type: false,
    },
  };

  let include;
  if (options.css.colors) include |= Features.Colors;
  if (options.css.nesting) include |= Features.Nesting;
  if (options.css.mediaQueries) include |= Features.MediaQueries;
  if (options.css.selectors) include |= Features.Selectors;

  const customModules = {
    /**
     * Processes selectors to handle global, static, and scoped styles.
     *
     * @param {Object} selector - The selector to process.
     * @returns {Object} The processed selector with updated names.
     */
    Selector(selector) {
      each((node, index) => {
        if (node.type == 'id' || node.type == 'class' || node.type == 'pseudo-class') {
          let isGlobal = false;
          let isStatic = false;

          if (node.type == 'pseudo-class') {
            isGlobal = node.name == 'g' || node.name == 'global';
            isStatic = node.name == 's' || node.name == 'static';
          }

          let type;
          let name;

          if (isStatic) {
            name = RAW_EMPTY;
            type = node.arguments[0].value.value == '.' ? 'class' : 'id';
            node.arguments = filter(remove(0, node.arguments));
            each(argument => (name += argument.value.value), node.arguments);
            selector[index] = { type, name };
            return;
          }

          const oldName = node.name;
          let newName = oldName;

          let collection = isGlobal ? global.styles : changedStyles;
          type = node.type == 'class' ? 'class' : 'id';

          // Find if there's a change in the current scope or globally
          const findChange = changedStyles.find(
            change =>
              change.old == oldName &&
              change.type == type &&
              isEqual(change.component, options.component)
          );
          const findGlobalChange = global.styles.find(
            change => change.old == oldName && change.type == type
          );
          if (findChange || findGlobalChange) {
            newName = findChange.new || findGlobalChange.new;
          } else {
            const hash = type == 'id' ? '#' : '.';
            newName = options.css.pattern({
              name: hash + node.name,
              min: options.css.hash.min,
              max: options.css.hash.max,
              component: options.component,
            });

            push({ type, old: oldName, new: newName, component: options.component }, changedStyles);
          }

          if (oldName == 'this') {
            has.this.name = newName;
            has.this.type = type;
          }

          node.name = newName;
        }
      }, selector);

      return selector;
    },
  };

  // Compose visitors for processing custom modules and variables
  const visitor = composeVisitors([
    customModules,
    cssVariablesModules(options),
    cssAtVariables(options),
    cssUnits(options),
    cssProperties(options),
  ]);
  const opts = {
    code: Buffer.from(content),
    minify: true,
    sourceMap: false,
    include,
    customAtRules,
    visitor,
  };
  let t = transform(opts);
  let code = RAW_EMPTY;
  if (t.code) code = t.code.toString();
  return {
    raw: code,
    has,
    changedStyles,
  };
}

/**
 * Adds the 'this' style attribute to a node based on the provided style.
 * @param {Object} node - The node to which the style attribute will be added.
 * @param {Object} style - The style object containing the 'this' attribute information.
 */
export function addThisStyleAttribute(node, style) {
  const name = style.has.this.name;
  const type = style.has.this.type;

  if (name) {
    let index = node.attributes.findIndex(attribute => attribute.name == type);
    if (index != -1) {
      const attribute = node.attributes[index];
      // If the attribute value is an array, prepend the name
      if (isArray(attribute.value)) {
        const pattern = clone(StringAttributePattern);
        pattern.content = name;
        prepend(pattern, node.attributes[index].value);
      } else {
        // Otherwise, append the name to the existing value
        node.attributes[index].value = attribute.value + RAW_WHITESPACE + name;
      }
    } else {
      // If the attribute does not exist, create a new one
      const pattern = clone(AttributePattern);
      pattern.name = type;
      pattern.value = name;
      if (type == 'id') prepend(pattern, node.attributes);
      else push(pattern, node.attributes);
    }
  }
}

/**
 * Updates the style attribute by replacing old style values with new ones
 * based on global and changed styles.
 *
 * @param {string} value - The original value of the style attribute.
 * @param {Array} changedStyles - An array of objects representing changed styles.
 * @returns {string} The updated style attribute.
 */
export function updateStyleAttribute(value, type, changedStyles, component) {
  const attributes = map(
    attribute => {
      attribute = attribute.trim();

      // Find if the attribute matches any global styles to be replaced
      const globalFind = global.styles.find(
        global => global.old == attribute && global.type == type
      );
      if (globalFind) attribute = globalFind.new;

      // Find if the attribute matches any changed styles to be replaced
      const changedFind = changedStyles.find(
        changed =>
          changed.old == attribute && changed.type == type && isEqual(changed.component, component)
      );
      if (changedFind) attribute = changedFind.new;

      return attribute;
    },
    split(RAW_WHITESPACE, value)
  );
  return join(RAW_WHITESPACE, attributes);
}
