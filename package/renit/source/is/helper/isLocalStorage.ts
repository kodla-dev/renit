import { isClient } from './isClient';

/**
  Checks if `localStorage` support is available.

  @returns {boolean} Returns true if localStorage is available, false otherwise.
  
  @example
  const localStorageAvailable = isLocalStorage();
  console.log(localStorageAvailable); // true or false
*/
export function isLocalStorage(): boolean {
  return isClient() && Boolean(window.localStorage);
}
