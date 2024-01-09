import { UNDEFINED } from 'renit/define';
import { isEqual } from './isEqual';

/**
  Checks if the code is running in a server-side environment.

  @returns {boolean} Returns true if running in a server-side environment,
  false otherwise.
  
  @example
  const onServer = isServer();
  console.log(onServer); // true or false
 */
export function isServer(): boolean {
  return isEqual(typeof window, UNDEFINED);
}
