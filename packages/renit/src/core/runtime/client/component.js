import { isUndefined } from '../../../libraries/is/index.js';
import { reactiveComputed, reactiveWatch } from './reactive.js';
import { mount } from './utils.js';

/**
 * Creates a reactive component with computed properties and watchers.
 *
 * @param {Function} init - The initialization function to set up the component.
 * @param {Object} [props={}] - The initial properties for the component.
 * @returns {Function} A function to mount the component to a target.
 */
export function component(init, props) {
  // The component's internal state
  const self = {
    $_c: [], // List of computed properties
    $_w: [], // List of watchers
    $p: !isUndefined(props) ? props : {}, // Initial properties

    /**
     * Adds a computed property with optional trackers.
     *
     * @param {Function} computed - The computed property function.
     * @param {...Function} trackers - Optional tracker functions for reactivity.
     */
    $c(computed, ...trackers) {
      reactiveComputed(self.$_w, self.$_c, computed, trackers);
    },

    /**
     * Adds a watcher for the specified tracker.
     *
     * @param {Function} tracker - The tracker function to watch.
     */
    $w(tracker) {
      reactiveWatch(self.$_w, self.$_c, tracker);
    },
  };

  // Initialize the component
  init = init.call(self);

  // Return a function to mount the component to a target
  return target => {
    mount(target, init);
  };
}
