import { Features, composeVisitors, transform } from 'lightningcss';
import { clone } from '../../../helpers/index.js';
import {
  each,
  filter,
  join,
  map,
  prepend,
  push,
  remove,
  split,
} from '../../../libraries/collect/index.js';
import { isArray, isEqual } from '../../../libraries/is/index.js';
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

const cssModules = options => ({
  Selector(selector) {
    each(node => {
      if (node.type == 'id' || node.type == 'class') {
        const type = node.type == 'class' ? 'class' : 'id';
        const hash = type == 'id' ? '#' : '.';
        const oldName = node.name;
        const findGlobalChange = global.styles.find(
          change => change.old == oldName && change.type == type
        );
        let newName;

        if (findGlobalChange) {
          newName = findGlobalChange.new;
        } else {
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

export function compilerStyle(css, options) {
  let include;
  if (options.css.colors) include |= Features.Colors;
  if (options.css.nesting) include |= Features.Nesting;

  const visitor = composeVisitors([cssModules(options)]);
  const opts = {
    code: Buffer.from(css),
    minify: false,
    sourceMap: false,
    include,
    visitor,
  };
  let t = transform(opts);
  let code = RAW_EMPTY;
  if (t.code) code = t.code.toString();
  return { code };
}

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

  const customModules = {
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

  const visitor = composeVisitors([customModules]);
  const opts = {
    code: Buffer.from(content),
    minify: true,
    sourceMap: false,
    include,
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
