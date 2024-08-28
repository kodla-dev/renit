/**
 * The currently active component.
 * @type {any}
 */
export let current;

/**
 * The context of the current component.
 * @type {any}
 */
export let context;

/**
 * Sets the current active component.
 *
 * @param {any} value - The component to set as the current component.
 */
export function setCurrent(value) {
  current = value;
}

/**
 * Sets the context for the current component.
 *
 * @param {any} value - The context to set for the current component.
 */
export function setContext(value) {
  context = value;
}

// Creates a new resolved promise.
const resolved = Promise.resolve();

/**
 * Executes a function asynchronously in the next tick of the event loop.
 * @param {Function} fn - The function to execute.
 * @returns {Promise} - A promise that resolves after the function has been executed.
 */
export function tick(fn) {
  // If a function is provided, wait for the current tick to finish before executing it
  fn && resolved.then(fn);
  // Return a resolved promise, signaling that the function has been scheduled for execution
  return resolved;
}

// Shared object to hold the current change detector and lifecycle callbacks
export const share = {
  cd: null, // The current change detector
  mount: [], // Array of callbacks to execute on mount
  unmount: [], // Array of callbacks to execute on unmount
  destroy: [], // Array of callbacks to execute on destroy
};

/**
 * Registers a callback to be executed when the component is mounted.
 *
 * @param {Function} callback - The callback function to execute on mount.
 */
export function onMount(callback) {
  share.mount.push(callback);
}

/**
 * Registers a callback to be executed when the component is unmounted.
 *
 * @param {Function} callback - The callback function to execute on unmount.
 */
export function unMount(callback) {
  if (callback) {
    share.unmount.push(callback);
  }
}
