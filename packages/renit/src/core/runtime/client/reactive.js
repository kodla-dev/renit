import { clone } from '../../../helpers/index.js';
import { each } from '../../../libraries/collect/index.js';
import { isCollect, isEmpty, isEqual } from '../../../libraries/is/index.js';
import { tick } from './utils.js';

/**
 * Finds an item in the watch list by its tracker value.
 *
 * @param {Array} watchList - The list of items to search through.
 * @param {any} tracker - The tracker value to match.
 * @returns {Object|undefined} The matched item, or undefined if not found.
 */
export function getTracker(watchList, tracker) {
  return watchList.find(i => i.tracker == tracker.toString());
}

/**
 * Sets up reactive tracking on the given content and trackers, invoking a callback when changes are detected.
 *
 * @param {Object} self - The context object containing the watch list `$w`.
 * @param {Function} content - A function returning the content to be tracked.
 * @param {Function} callback - The callback to be invoked when the tracked content changes.
 * @param {Array<Function>} trackers - An array of functions that return values to be tracked.
 */
export function reactive(self, content, callback, trackers) {
  each(tracker => {
    // Get the tracker object from the watch list
    const Tracker = getTracker(self.$_w, tracker);

    if (Tracker) {
      // Initialize collect and value
      let collect;
      let value = tracker();

      // Check if the value is a collection and clone it if necessary
      if (isCollect(value)) collect = true;
      if (collect) value = clone(value);

      // Execute the callback with the current content
      callback(content());

      // Add the tracker to the watch list
      Tracker.watch.push({ t: tracker, v: value, c: content, cb: callback });
    }
  }, trackers);
}

/**
 * Updates the watch list by either running traces for an existing tracker or adding a new tracker.
 *
 * @param {Array} watchList - The list of watch items to update.
 * @param {Array} computedList - The list of computed functions to be executed if no tracker is found.
 * @param {any} tracker - The tracker value to match or add.
 */
export function reactiveWatch(watchList, computedList, tracker) {
  const Tracker = getTracker(watchList, tracker);

  if (Tracker) {
    // Run computed functions for the tracker
    tick(() => each(computed => computed(), Tracker.computed));

    // Run trace functions for the tracker
    tick(() => each(trace => runTrace(trace), Tracker.watch));
  } else {
    // Add a new tracker if it doesn't exist
    watchList.push({ tracker: tracker.toString(), watch: [], computed: [] });
  }

  // Execute all computed functions if the computed list is not empty
  if (!isEmpty(computedList)) {
    each(computed => computed(), computedList);
  }
}

/**
 * Sets up reactive computed properties for the given trackers.
 *
 * @param {Array} watchList - The list of watch items to update.
 * @param {Array} computedList - The list to store computed functions if no trackers are provided.
 * @param {Function} computed - The computed function to be tracked.
 * @param {Array<Function>} trackers - An array of functions that return values to be tracked.
 */
export function reactiveComputed(watchList, computedList, computed, trackers) {
  // Execute the computed function
  computed();

  // If no trackers are provided, add the computed function to the computed list
  if (isEmpty(trackers)) {
    computedList.push(computed);
  } else {
    // Otherwise, for each tracker, find the corresponding Tracker object and add the computed function to it
    each(tracker => {
      // Get the tracker object from the watch list
      const Tracker = getTracker(watchList, tracker);
      if (Tracker) {
        // Add the tracker and computed function to the tracker's computed list
        Tracker.computed.push(computed);
      }
    }, trackers);
  }
}

/**
 * Executes a trace function and calls a callback if the value changes.
 *
 * @param {Object} trace - The trace object containing the properties:
 * @param {Function} trace.t - A function that returns the current value to be traced.
 * @param {Function} trace.c - A callback function to be called if the value changes.
 * @param {any} trace.v - The initial value to compare against.
 * @param {Function} trace.cb - The callback to be called when the value changes.
 */
export function runTrace(trace) {
  let collect;

  // Check if trace.v is a collection
  if (isCollect(trace.v)) collect = true;

  // Execute the trace function to get the current value
  let value = trace.t();

  // Compare the current value with the stored value
  if (!isEqual(trace.v, value)) {
    // If the value has changed, execute the callback function
    trace.cb(trace.c());

    // Update the stored value
    if (collect) {
      trace.v = clone(value);
    } else {
      trace.v = value;
    }
  }
}
