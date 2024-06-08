import { isUndefined } from '../../../libraries/is/index.js';
import { computed, updateTrackers } from './reactive.js';
import { mount } from './utils.js';

/**
 * Creates a reactive component.
 *
 * @param {Function} init - Function to initialize the component.
 * @param {Object} [props] - Optional properties to initialize the component with.
 * @returns {Function} A function to mount the component to a target.
 */
export function component(init, props) {
  const context = {
    $_c: [], // List of computed functions
    $_w: [], // List of watchers
    $p: !isUndefined(props) ? props : {}, // Initial properties

    /**
     * Adds a computed function with its dependencies to the context.
     *
     * @param {Function} computedFn - The computed function to add.
     * @param {...Function} dependencies - The dependencies of the computed function.
     */
    $c(computedFn, ...dependencies) {
      computed(context.$_c, computedFn, dependencies);
    },

    /**
     * Executes the trackers and returns the provided value.
     *
     * @param {any} value - The value to return after executing trackers.
     * @returns {any} The provided value.
     */
    $u(value) {
      updateTrackers(context.$_w, context.$_c);
      return value;
    },
  };

  // Initialize the component context
  init = init.call(context);

  /**
   * Mounts the component to the provided target element.
   *
   * @param {Element} target - The target element to mount the component to.
   */
  return target => {
    mount(target, init);
  };
}
