import { clone } from '../../../helpers/index.js';
import { each } from '../../../libraries/collect/index.js';
import { isCollect, isEmpty, isEqual } from '../../../libraries/is/index.js';
import { tick } from './utils.js';

/**
 * Tracks dependencies and invokes a callback when they change.
 *
 * @param {Object} self - The context object that holds the watch list.
 * @param {Function} content - A function that returns the content to be tracked.
 * @param {Function} callback - A callback function to be invoked when the content changes.
 * @param {Array<Function>} trackers - An array of tracker functions to monitor for changes.
 */
export function reactive(self, content, callback, trackers) {
  each(tracker => {
    let collect;
    let value = tracker();

    // Check if the value is a collection and clone it if necessary
    if (isCollect(value)) collect = true;
    if (collect) value = clone(value);

    // Execute the callback with the current content
    callback(content());

    // Push the tracker, value, content, and callback into the watch list
    self.$_w.push({ t: tracker, v: value, c: content, cb: callback });
  }, trackers);
}

/**
 * Executes all computed functions and watch functions in their respective lists.
 *
 * @param {Array} watchList - The list of watch functions to execute.
 * @param {Array} computedList - The list of computed functions to execute.
 */
export function reactiveWatch(watchList, computedList) {
  // Schedule the execution of all computed functions
  tick(() => each(computed => execComputed(computed), computedList));

  // Schedule the execution of all watch functions
  tick(() => each(watch => execWatch(watch), watchList));
}

/**
 * Executes a watch callback if the tracked value has changed.
 *
 * @param {Object} watch - An object representing the watch with properties:
 *   - t: Function that returns the current value to be tracked.
 *   - v: The previous value.
 *   - c: Function that returns the content.
 *   - cb: Callback function to be executed if the value changes.
 */
export function execWatch(watch) {
  let collect;

  // Check if the previous value is a collection
  if (isCollect(watch.v)) collect = true;

  // Get the current value from the tracker function
  let value = watch.t();

  // If the current value is not equal to the previous value, run the callback
  if (!isEqual(watch.v, value)) {
    watch.cb(watch.c());

    // Update the previous value with the current value, cloning if it's a collection
    if (collect) {
      watch.v = clone(value);
    } else {
      watch.v = value;
    }
  }
}

/**
 * Adds a computed function to the computed list, optionally tracking dependencies.
 *
 * @param {Array} computedList - The list of computed functions to update.
 * @param {Function} computed - The computed function to be added.
 * @param {Array} trackers - The list of tracker functions that this computed function depends on.
 */
export function addComputed(computedList, computed, trackers) {
  // Execute the computed function initially
  computed();

  if (isEmpty(trackers)) {
    // If no trackers are provided, add the computed function to the list without dependencies
    computedList.push({ c: computed });
  } else {
    // If trackers are provided, add each tracker and its initial value along with the computed function to the list
    each(tracker => {
      computedList.push({ t: tracker, v: tracker(), c: computed });
    }, trackers);
  }
}

/**
 * Executes a computed callback and updates its value if necessary.
 *
 * @param {Object} computed - An object representing the computed value with properties:
 *   - t: [Optional] Function that returns the current value to be tracked.
 *   - v: The previous value.
 *   - c: Function that performs the computed operation.
 */
export function execComputed(computed) {
  if (computed.t) {
    // Get the current value from the tracker function
    let value = computed.t();

    // If the current value is not equal to the previous value, run the computed function
    if (!isEqual(computed.v, value)) {
      computed.c();
      // Update the previous value with the current value
      computed.v = value;
    }
  } else {
    // If there is no tracker function, just run the computed function
    computed.c();
  }
}
