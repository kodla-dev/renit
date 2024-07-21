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
