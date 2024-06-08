import { clone } from '../../../helpers/index.js';
import { each } from '../../../libraries/collect/index.js';
import { isCollect, isEmpty, isEqual } from '../../../libraries/is/index.js';
import { tick } from './utils.js';

/**
 * Sets up a watch on the given dependencies and triggers the onChange callback when any dependency changes.
 *
 * @param {Object} context - The context to store the watch information.
 * @param {Function} getContent - Function to get the current content.
 * @param {Function} onChange - Callback function to call when any dependency changes.
 * @param {Array<Function>} dependencies - Array of dependency functions to watch.
 */
export function watch(context, getContent, onChange, dependencies) {
  each(dependency => {
    let isCollection;
    let value = dependency();

    // Check if the value is a collection and clone it if necessary
    if (isCollect(value)) isCollection = true;
    if (isCollection) value = clone(value);

    // Execute the callback with the current content
    onChange(getContent());

    // Push the tracker, value, content, and callback into the watch list
    context.$_w.push({ t: dependency, v: value, c: getContent, cb: onChange });
  }, dependencies);
}

/**
 * Adds a computed function to the computed list, with optional dependencies.
 *
 * @param {Array} computedList - The list to store computed functions.
 * @param {Function} computed - The computed function to add.
 * @param {Array} [dependencies] - Optional dependencies for the computed function.
 */
export function computed(computedList, computed, dependencies) {
  // Execute the computed function initially
  computed();

  if (isEmpty(dependencies)) {
    // If there are no dependencies, add the computed function to the list
    computedList.push({ c: computed });
  } else {
    // If there are dependencies, add them along with the computed function to the list
    each(dependency => {
      computedList.push({ t: dependency, v: dependency(), c: computed });
    }, dependencies);
  }
}

/**
 * Executes all computed and watch trackers.
 *
 * @param {Array} watchList - The list of watch trackers to execute.
 * @param {Array} computedList - The list of computed trackers to execute.
 */
export function updateTrackers(watchList, computedList) {
  // Execute all computed trackers
  tick(() => each(computed => executeComputed(computed), computedList));

  // Execute all watch trackers
  tick(() => each(watch => executeWatch(watch), watchList));
}

/**
 * Executes a computed function if its dependencies have changed.
 *
 * @param {Object} computed - The computed object containing:
 *   - {Function} [t] - The dependency tracker function.
 *   - {any} [v] - The last tracked value of the dependency.
 *   - {Function} c - The computed function to execute.
 */
export function executeComputed(computed) {
  if (computed.t) {
    // Track the current value of the dependency
    let currentValue = computed.t();

    // If the current value is different from the last tracked value, execute the computed function
    if (!isEqual(computed.v, currentValue)) {
      computed.c();
      // Update the previous value with the current value
      computed.v = currentValue;
    }
  } else {
    // If there is no dependency tracker, just execute the computed function
    computed.c();
  }
}

/**
 * Executes a watch function if its tracked value has changed.
 *
 * @param {Object} watch - The watch object containing:
 *   - {Function} t - The tracker function to get the current value.
 *   - {any} v - The last tracked value.
 *   - {Function} c - The content function to get the new value.
 *   - {Function} cb - The callback function to execute on change.
 */
export function executeWatch(watch) {
  let isCollection = false;

  // Check if the last tracked value is a collection
  if (isCollect(watch.v)) isCollection = true;

  // Get the current value from the tracker function
  let currentValue = watch.t();

  // If the current value is different from the last tracked value, execute the callback function
  if (!isEqual(watch.v, currentValue)) {
    watch.cb(watch.c());

    // Update the last tracked value
    if (isCollection) {
      watch.v = clone(currentValue);
    } else {
      watch.v = currentValue;
    }
  }
}
