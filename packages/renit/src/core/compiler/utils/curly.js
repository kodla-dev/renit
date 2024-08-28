import { each, push } from '../../../libraries/collect/index.js';
import { ucfirst } from '../../../libraries/string/index.js';
import { RAW_EMPTY, RAW_WHITESPACE } from '../../define.js';
import { findDependencies, javaScriptToAST } from './script.js';

/**
 * Checks if the provided string contains text within curly braces.
 * @param {string} input The string to check for curly braces.
 * @returns {boolean} True if the string contains text within curly braces, otherwise false.
 */
export function containsCurlyBraces(input) {
  return /{([^}]+)}/g.test(input);
}

/**
 * Splits the provided string into parts based on text within curly braces.
 * @param {string} input The string to split.
 * @returns {Array} An array of strings split by curly braces.
 */
export function splitCurlyBraces(input) {
  return input.split(/({.*?})/g);
}

/**
 * Retrieves the content of curly braces in the provided string.
 * @param {string} input The string to search for curly braces.
 * @returns {string|null} The content of curly braces
 */
export function getContentCurlyBraces(input) {
  return /{(.*?)}/g.exec(input)[1];
}

/**
 * Parses a string containing curly braces into an array of text and curly braces segments.
 * @param {string} input - The string to parse.
 * @param {string} type - The type of parsing context.
 * @returns {Object} An object containing the parsed value array and a reference flag.
 */
export function parseCurlyBraces(input, type) {
  let values = [];
  let reference = false;
  const capitalizedType = ucfirst(type);
  const curlyBracesNodeType = 'CurlyBraces' + capitalizedType;
  const textNodeType = 'String' + capitalizedType;

  each(segment => {
    if (containsCurlyBraces(segment)) {
      let content = getContentCurlyBraces(segment).trim();
      let htmlTag = '@html' + RAW_WHITESPACE;
      let html = false;
      let staticTag = '>';
      let staticText = false;
      let literalsTag = '=';
      let literalsText = false;

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

      const expression = javaScriptToAST(segment).body[0].body[0].expression;
      const dependencies = findDependencies(expression, content);
      push(
        {
          type: curlyBracesNodeType,
          content,
          expression,
          dependencies,
          html,
          literals: literalsText,
          static: staticText,
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
  }, splitCurlyBraces(input));

  return { values, reference };
}
