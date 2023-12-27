import { OBJECT } from 'renit/define';
import { isEqual } from './isEqual';

/**
  Checks if the environment in which the system operates is a client.

  @returns {boolean} Returns true if running in a client-side environment,
  false otherwise.

  @example
  const result = isClient();
  console.log(result); // true (if it's running on the client-side)
 */
export function isClient(): boolean {
  return isEqual(typeof window, OBJECT);
}
