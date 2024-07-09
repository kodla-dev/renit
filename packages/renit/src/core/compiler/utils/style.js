import { clone } from '../../../helpers/index.js';
import { join, map, prepend, push, split } from '../../../libraries/collect/index.js';
import { isArray } from '../../../libraries/is/index.js';
import { astToCss, visitFull } from '../../../libraries/to/index.js';
import { RAW_EMPTY, RAW_WHITESPACE } from '../../define.js';
import { global } from '../global.js';
import { AttributePattern, StringAttributePattern } from './constant.js';
import { uniqueStyleHash } from './hash.js';
import { generateId } from './index.js';

// Generates unique short class names for styling
const styleHash = new uniqueStyleHash();

/**
 * Generate a unique style hash with specified minimum and maximum lengths.
 * @param {number} min - The minimum length of the hash.
 * @param {number} max - The maximum length of the hash.
 * @returns {string} The generated style hash.
 */
export function generateStyleHash(min, max) {
  styleHash.setMin(min);
  styleHash.setMax(max);
  return styleHash.create(generateId());
}

/**
 * Prepares the style by processing the given AST (Abstract Syntax Tree) and options.
 * @param {Object} ast - The abstract syntax tree representing CSS.
 * @param {Object} options - Options for processing the AST.
 * @returns {Object} An object containing the processed CSS, modified styles, and global styles.
 */
export function prepareStyle(ast, options) {
  const changedStyles = [];
  let has = {
    this: {
      name: false,
      type: false,
    },
  };

  visitFull(ast, {
    // Processes selector nodes to replace certain parts of the selector with new identifiers.
    Selector(node) {
      node.name = node.name.replace(
        /[#.][^.\s]*|:(g|global|s|static)\((.*?)\)+/g,
        (token, ...args) => {
          const pseudo = args[0];
          const isGlobal = pseudo == 'g' || pseudo == 'global';
          const isStatic = pseudo == 's' || pseudo == 'static';
          token = pseudo ? args[1] : token;

          if (isStatic) return token;

          const first = token[0];
          const name = token.replace(first, RAW_EMPTY);

          let type;
          if (first == '#') type = 'id';
          else if (first == '.') type = 'class';

          let id;
          let collection = isGlobal ? global.styles : changedStyles;

          const findChange = collection.find(change => change.old == name);
          if (findChange) {
            id = findChange.new;
          } else {
            id = genId();
            push({ old: name, new: id }, collection);
          }

          if (name == 'this') {
            has.this.name = id;
            has.this.type = type;
          }

          return (type == 'id' ? '#' : '.') + id;
        }
      );
    },
  });

  /**
   * Function to generate a new unique identifier
   * @returns {string} The generated unique ID.
   */
  function genId() {
    return generateStyleHash(options.css.hash.min, options.css.hash.max);
  }

  return {
    raw: astToCss(ast),
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
export function updateStyleAttribute(value, changedStyles) {
  const attributes = map(
    attribute => {
      attribute = attribute.trim();

      // Find if the attribute matches any global styles to be replaced
      const globalFind = global.styles.find(global => global.old == attribute);
      if (globalFind) attribute = globalFind.new;

      // Find if the attribute matches any changed styles to be replaced
      const changedFind = changedStyles.find(changed => changed.old == attribute);
      if (changedFind) attribute = changedFind.new;
      return attribute;
    },
    split(RAW_WHITESPACE, value)
  );
  return join(RAW_WHITESPACE, attributes);
}
