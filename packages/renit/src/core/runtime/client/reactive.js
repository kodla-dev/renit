import { isArray } from '../../../libraries/is/index.js';
import { current } from './component.js';
import { share } from './share.js';
import { compareArray, error, removeItem, tick } from './utils.js';

/**
 * Represents a change detector that tracks dependencies and updates.
 *
 * @constructor
 * @param {ChangeDetector|null} parent - The parent change detector, if any.
 */
function ChangeDetector(parent) {
  this.parent = parent; // Set the parent change detector
  this.children = []; // Initialize an array to store child change detectors
  this.watch = []; // Initialize an array to store watch objects
  this.computed = []; // Initialize an array to store computed properties
}

/**
 * Creates a new ChangeDetector instance.
 *
 * @param {ChangeDetector|null} parent - The parent change detector, if any.
 * @returns {ChangeDetector} A new ChangeDetector instance.
 */
export function newCD(parent) {
  return new ChangeDetector(parent);
}

/**
 * Adds a child ChangeDetector to the parent ChangeDetector.
 *
 * @param {ChangeDetector} parent - The parent ChangeDetector.
 * @param {ChangeDetector} cd - The child ChangeDetector to be added.
 */
export function addCD(parent, cd) {
  if (cd) {
    cd.parent = parent;
    parent.children.push(cd);
  }
}

/**
 * Removes a ChangeDetector from its parent's children.
 *
 * @param {ChangeDetector} cd - The ChangeDetector to be removed.
 */
export function removeCD(cd) {
  removeItem(cd.parent.children, cd);
}

/**
 * Creates a Computed object to manage computed functions and their dependencies.
 *
 * @param {Function} computed - The computed function to manage.
 * @param {Function} [dependency] - Function to get the current value of the dependency.
 * @param {Any} [value] - The current value of the dependency.
 */
function Computed(computed, dependency, value) {
  this.c = computed; // Computed function
  this.t = dependency; // Dependency function
  this.v = value; // Current value of the dependency
}

/**
 * Defines a computed function and its dependencies, adding it to the current ChangeDetector's computed list.
 *
 * @param {Function} computed - The computed function to add.
 * @param {...Function} dependencies - Optional dependencies for the computed function.
 */
export function computed(computed, ...dependencies) {
  const dependenciesLen = dependencies.length;

  if (!dependenciesLen) {
    // If no dependencies are provided, add the computed function with no dependencies
    share.cd.computed.push(new Computed(computed));
  } else {
    // Add the computed function with each provided dependency
    for (let i = 0; i < dependenciesLen; ++i) {
      const dependency = dependencies[i];
      share.cd.computed.push(new Computed(computed, dependency, dependency()));
    }
  }

  computed(); // Execute the computed function initially to set its initial value
}

/**
 * Creates a Watch object to monitor changes in dependencies and trigger a callback function.
 *
 * @param {Function} getContent - Function to get the current content.
 * @param {Function} onChange - Callback function to call when the dependency changes.
 * @param {Function} dependency - Function to get the current value of the dependency.
 */
function Watch(getContent, onChange, dependency) {
  this.c = getContent; // Current content function
  this.cb = onChange; // Callback function
  this.t = dependency; // Dependency function
  this.v = NaN; // Initial value of the dependency
}

/**
 * Sets up watches on specified dependencies and adds them to the current ChangeDetector's watch list.
 *
 * @param {Function} getContent - Function to get the current content.
 * @param {Function} onChange - Callback function to call when any dependency changes.
 * @param {Object} [option] - Optional configuration object to be assigned to each watch.
 * @param {Array<Function>} [dependencies] - Array of dependency functions to watch.
 */
export function watch(getContent, onChange, option, dependencies) {
  // If no dependencies are provided, use the getContent function as the only dependency
  if (!dependencies || !dependencies.length) {
    dependencies = [getContent];
  }

  // Add a new Watch object for each dependency
  for (let i = 0, n = dependencies.length; i < n; i++) {
    const watch = new Watch(getContent, onChange, dependencies[i]);
    option && Object.assign(watch, option);
    share.cd.watch.push(watch);
  }
}

/**
 * Watches changes in an array and triggers a callback if the array changes.
 *
 * @param {Object} watch - The watch object containing value and callback.
 * @param {Array|any} lists - The array or value to watch.
 */
export function watchArray(watch, lists) {
  // Compare the current value (watch.v) with the new array or value (lists)
  if (!compareArray(watch.v, lists)) return 0;

  // If lists is an array, clone it; otherwise, assign the value
  if (isArray(lists)) watch.v = lists.slice();
  else watch.v = lists;

  // Trigger the callback with the new value
  watch.cb(watch.v);
}

/**
 * Initializes a new ChangeDetector (CD) for the current component and sets up the update function.
 *
 * @returns {Function} The update function that can be used to trigger change detection.
 */
export function update() {
  // Create a new ChangeDetector and set it as the current one
  const cd = (current.cd = share.cd = newCD());
  cd.component = current;

  let planned; // Flag to check if an update is already planned
  let flag = [0]; // Flag array to track changes

  /**
   * The update function to trigger change detection.
   *
   * @param {*} value - The value to be returned after triggering the update.
   * @returns {*} The passed value.
   */
  const update = value => {
    flag[0]++;
    if (planned) return value;
    planned = true; // If an update is already planned, return the value

    // Schedule a tick to execute the tracker
    tick(() => {
      try {
        tracker(cd, flag); // Run the tracker to detect changes
      } finally {
        planned = false;
      }
    });
    return value; // Return the passed value
  };

  current.update = update;
  current.apply = update;

  update(); // Trigger the initial update
  return update; // Return the update function
}

/**
 * Tracks changes in the ChangeDetector (CD) tree starting from the given context.
 *
 * @param {ChangeDetector} cd - The root ChangeDetector context to start tracking changes from.
 * @param {Array<number>} flag - A flag array to track changes.
 */
function tracker(cd, flag) {
  let loop = 10; // Maximum number of iterations to prevent infinite loops
  let changes; // Counter for detected changes

  while (loop-- >= 0) {
    changes = 0;
    const queue = [cd]; // Queue to process ChangeDetectors

    // Process each ChangeDetector in the queue
    while (queue.length) {
      const cd = queue.shift(); // Dequeue the ChangeDetector

      // Process computed functions
      const computedLength = cd.computed.length;
      for (let i = 0; i < computedLength; i++) {
        const computed = cd.computed[i];
        if (computed.t) {
          // Track the current value of the dependency
          const value = computed.t();
          // If the value has changed, execute the computed function
          if (computed.v != value) {
            computed.c(); // Execute the computed function
            computed.v = value; // Update the tracked value
          }
        } else {
          computed.c(); // Execute the computed function without tracking
        }
      }

      // Process watch functions
      const watchLength = cd.watch.length;
      for (let i = 0; i < watchLength; i++) {
        const watch = cd.watch[i];
        const value = watch.t();
        // If the tracked value has changed, execute the callback
        if (watch.v !== value) {
          flag[0] = 0;
          if (watch.ch) {
            watch.ch(watch, value); // Execute the custom handler if defined
          } else {
            watch.cb((watch.v = watch.c())); // Execute the callback with the new value
          }
          changes += flag[0];
        }
      }

      // Enqueue children for processing
      const childrenLength = cd.children.length;
      for (let i = 0; i < childrenLength; i++) {
        queue.push(cd.children[i]);
      }
    }

    if (!changes) break; // If no changes detected, exit the loop
  }

  // Log an error if maximum iterations reached
  if (loop < 0) {
    error('Infinity changes:', cd.watch);
  }
}
