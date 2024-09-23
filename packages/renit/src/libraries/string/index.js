import { RAW_EMPTY } from '../../core/define.js';
import { pipe } from '../../helpers/index.js';
import { dot, join, map } from '../collect/index.js';
import { isString, isUndefined } from '../is/index.js';

/**
 * Converts the given string to lowercase, optionally using a specified locale.
 *
 * @param {string|undefined} locale - The locale to use for the conversion (optional).
 * @param {string|undefined} collect - The string to convert to lowercase.
 * @returns {string|function} The lowercase string or a function awaiting the string.
 */
export function lower(locale, collect) {
  if (isUndefined(collect)) {
    if (isString(locale)) return lower(void 0, locale);
    return collect => lower(locale, collect);
  }

  if (!isUndefined(locale)) {
    return collect.toLocaleLowerCase(locale);
  } else {
    return collect.toLowerCase();
  }
}

/**
 * Removes punctuation characters from a string.
 *
 * @param {string|undefined} collect - The string from which to remove punctuation.
 * @returns {string|function} The string without punctuation, or a function awaiting the string.
 */
export function removePunct(collect) {
  if (isUndefined(collect)) return collect => removePunct(collect);

  // Regular expression to match punctuation characters
  const punctRgx = /[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-./:;<=>?@[\]^_`{|}~]/g;

  // Replace punctuation characters with an empty string
  return collect.replace(punctRgx, RAW_EMPTY);
}

/**
 * Extracts a substring from a given string or strings within a collection.
 *
 * @param {number} start - The starting index of the substring.
 * @param {number|undefined} end - The ending index of the substring (optional).
 * @param {string|Array|string} collect - The string or collection to extract substrings from.
 * @returns {string|function} The extracted substring or a function awaiting the collection.
 */
export function sub(start = 1, end, collect) {
  if (isUndefined(collect)) {
    if (isString(end)) return sub(start, void 0, end);
    if (isString(start)) return sub(1, void 0, start);
    if (isUndefined(end)) return collect => sub(start, void 0, collect);
    return collect => sub(start, end, collect);
  }

  if (end) return collect.substring(start, end);
  return collect.substring(start);
}

// supplant placeholders
const RGX = /{(.*?)}/g;

/**
 * Replaces placeholders in a string with values from an object or tree.
 *
 * @param {string} str - The string with placeholders (e.g., "{key}").
 * @param {Object} mix - The object containing replacement values.
 * @param {Object} tree - The secondary object for deep value lookup.
 * @returns {string} - The string with placeholders replaced by corresponding values.
 */
export function supplant(str, mix, tree) {
  return str.replace(RGX, (x, key, y) => {
    x = 0;
    y = mix;
    const akey = key.trim().split('.');
    const count = akey.length;
    if (count > 0) {
      var val = dot(tree, key, '');
      if (val) {
        y = val;
      } else {
        while (y && x < count) {
          y = y[akey[x++]];
        }
      }
    }
    return y != null ? y : '';
  });
}

/**
 * Converts the first character of a string to uppercase, considering locale if provided.
 *
 * @param {string|undefined} locale - The locale to use for uppercasing the first character.
 * @param {string|undefined} collect - The string to convert.
 * @returns {string|function} The string with the first character in uppercase, or a function awaiting the string.
 */
export function ucfirst(locale, collect) {
  if (isUndefined(collect)) {
    if (isString(locale)) return ucfirst(void 0, locale);
    return collect => ucfirst(locale, collect);
  }

  return upper(locale, sub(0, 1, collect)) + sub(1, collect);
}

/**
 * Converts the first character of each word in a string to uppercase, considering locale if provided.
 *
 * @param {string|undefined} locale - The locale to use for uppercasing characters.
 * @param {string|undefined} collect - The string to convert.
 * @returns {string|function} The string with each word's first character in uppercase, or a function awaiting the string.
 */
export function ucwords(locale, collect) {
  if (isUndefined(collect)) {
    if (isString(locale)) return ucwords(void 0, locale);
    return collect => ucwords(locale, collect);
  }

  return pipe(
    collect,
    lower(locale),
    words,
    map(letter => ucfirst(locale, letter)),
    join
  );
}

/**
 * Converts the given string to uppercase, optionally using a specified locale.
 *
 * @param {string|undefined} locale - The locale to use for the conversion (optional).
 * @param {string|undefined} collect - The string to convert to uppercase.
 * @returns {string|function} The uppercase string or a function awaiting the string.
 */
export function upper(locale, collect) {
  if (isUndefined(collect)) {
    if (isString(locale)) return upper(void 0, locale);
    return collect => upper(locale, collect);
  }

  if (!isUndefined(locale)) {
    return collect.toLocaleUpperCase(locale);
  } else {
    return collect.toUpperCase();
  }
}

/**
 * Splits a string into an array of words, optionally removing punctuation.
 *
 * @param {number|undefined} punct - A flag indicating whether to remove punctuation (1 to remove, 0 to keep).
 * @param {string|undefined} collect - The string to split into words.
 * @returns {string[]|function} An array of words or a function awaiting the string.
 */
export function words(punct, collect) {
  if (isUndefined(collect)) {
    if (isString(punct)) return words(0, punct);
    return collect => words(punct, collect);
  }

  // Regular expression to match non-space sequences
  const nonSpaceRgx = /\S+/g;

  // If punct is truthy, remove punctuation and match non-space sequences
  if (punct) {
    return removePunct(collect).match(nonSpaceRgx) || [];
  } else {
    // Otherwise, match non-space sequences without removing punctuation
    return collect.match(nonSpaceRgx) || [];
  }
}
