import { each, push } from '../../../libraries/collect/index.js';
import { ucfirst } from '../../../libraries/string/index.js';
import { RAW_EMPTY, RAW_WHITESPACE } from '../../define.js';
import { findDependencies, javaScriptToAST } from './script.js';

/**
 * Checks if the provided string contains text within braces.
 * @param {string} input The string to check for braces.
 * @returns {boolean} True if the string contains text within braces, otherwise false.
 */
export function containsBraces(input) {
  return /{([^}]+)}/g.test(input);
}

/**
 * Splits the provided string into parts based on text within braces.
 * @param {string} input The string to split.
 * @returns {Array} An array of strings split by braces.
 */
export function splitBraces(input) {
  return input.split(/({.*?})/g);
}

/**
 * Retrieves the content of braces in the provided string.
 * @param {string} input The string to search for braces.
 * @returns {string|null} The content of braces
 */
export function getContentBraces(input) {
  return /{(.*?)}/g.exec(input)[1];
}

/**
 * Parses a string containing braces into an array of text and braces segments.
 * @param {string} input - The string to parse.
 * @param {string} type - The type of parsing context.
 * @returns {Object} An object containing the parsed value array and a reference flag.
 */
export function parseBraces(input, type) {
  let values = [];
  let reference = false;
  const capitalizedType = ucfirst(type);
  const bracesNodeType = 'Braces' + capitalizedType;
  const textNodeType = 'String' + capitalizedType;

  each(segment => {
    if (containsBraces(segment)) {
      let content = getContentBraces(segment).trim();
      let htmlTag = '@html' + RAW_WHITESPACE;
      let html = false;
      let staticTag = '>';
      let staticText = false;
      let literalsTag = '=';
      let literalsText = false;
      let dynamicTag = '*';
      let dynamicText = false;

      if (content.startsWith(htmlTag)) {
        content = content.replace(htmlTag, RAW_EMPTY);
        segment = segment.replace(htmlTag, RAW_EMPTY);
        html = true;
      }

      if (content.startsWith(staticTag)) {
        content = content.replace(staticTag, RAW_EMPTY);
        segment = segment.replace(staticTag, RAW_EMPTY);
        staticText = true;
      }

      if (content.startsWith(literalsTag)) {
        content = content.replace(literalsTag, RAW_EMPTY);
        segment = segment.replace(literalsTag, RAW_EMPTY);
        literalsText = true;
      }

      if (content.startsWith(dynamicTag)) {
        content = content.replace(dynamicTag, RAW_EMPTY);
        segment = segment.replace(dynamicTag, RAW_EMPTY);
        dynamicText = true;
      }

      const expression = javaScriptToAST(segment).body[0].body[0].expression;
      const dependencies = findDependencies(expression, content);
      push(
        {
          type: bracesNodeType,
          content,
          expression,
          dependencies,
          html,
          literals: literalsText,
          static: staticText,
          dynamic: dynamicText,
        },
        values
      );
      reference = true;
    } else {
      if (segment != RAW_EMPTY) {
        if (segment.trim() == RAW_EMPTY) segment = RAW_WHITESPACE;
        push({ type: textNodeType, content: segment }, values);
      }
    }
  }, splitBraces(input));

  return { values, reference };
}

/**
 * Converts braces to template literal placeholders.
 *
 * @param {string} value - The string in which braces will be replaced.
 * @returns {string} The modified string with '{' replaced by '${'.
 */
export function simpleBracesConvert(value) {
  return value.replaceAll('{', '${');
}