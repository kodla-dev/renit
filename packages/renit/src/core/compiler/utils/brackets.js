import { pipe } from '../../../helpers/index.js';
import { filter, flat, includes, map } from '../../../libraries/collect/index.js';
import { RAW_EMPTY, RAW_WHITESPACE } from '../../define.js';
import { containsBraces, parseBraces } from './braces.js';

/**
 * Checks if the provided string contains text within brackets.
 * @param {string} input The string to check for brackets.
 * @returns {boolean} True if the string contains text within brackets, otherwise false.
 */
export function containsBrackets(input) {
  return /\[([^\]]+)\]/g.test(input);
}

/**
 * Checks if the input string contains specific bracket patterns.
 *
 * @param {string} input - The input string to check.
 * @returns {boolean} True if the input contains '[.', '[:' or '[=', false otherwise.
 */
export function hasBrackets(input) {
  return includes('[.', input) || includes('[:', input) || includes('[=', input);
}

/**
 * Splits the provided string into parts based on text within brackets.
 * @param {string} input The string to split.
 * @returns {Array} An array of strings split by brackets.
 */
export function splitBrackets(input) {
  return input.split(/(\[.*?\])/g);
}

/**
 * Retrieves the content of brackets in the provided string.
 * @param {string} input The string to search for brackets.
 * @returns {string|null} The content of brackets
 */
export function getContentBrackets(input) {
  return /\[(.*?)\]/g.exec(input)[1];
}

/**
 * Parses an input string for specific tags within brackets,
 * identifying if it's a link, translation, or literal.
 *
 * @param {string} input - The input string to parse.
 * @returns {Object} An object containing the parsed value.
 */
export function parseBrackets(input) {
  let value = getContentBrackets(input).trim();

  let linkTag = '.';
  let link = false;

  let translateTag = ':';
  let translate = false;

  let literalsTag = '=';
  let literals = false;

  if (value.startsWith(literalsTag)) {
    value = value.replace(literalsTag, RAW_EMPTY);
    literals = true;
  }

  if (value.startsWith(linkTag)) {
    value = value.replace(linkTag, RAW_EMPTY);
    link = true;
  }

  if (value.startsWith(translateTag)) {
    value = value.replace(translateTag, RAW_EMPTY);
    translate = true;
  }

  return { value, link, translate, literals };
}

/**
 * Parses an array of values, handling different formats such as braces and brackets.
 *
 * @param {Array} values - The array of values to parse.
 * @returns {Array} The parsed values with their types and content.
 */
export function parseMultiple(values) {
  return pipe(
    values,
    splitBrackets,
    map(item => {
      if (hasBrackets(item)) {
        return {
          type: 'BracketsText',
          ...parseBrackets(item),
        };
      }
      if (containsBraces(item)) return parseBraces(item, 'text').values;
      if (item != RAW_EMPTY) {
        if (item.trim() == RAW_EMPTY) item = RAW_WHITESPACE;
        return {
          type: 'StringText',
          content: item,
        };
      }
    }),
    flat,
    filter
  );
}
