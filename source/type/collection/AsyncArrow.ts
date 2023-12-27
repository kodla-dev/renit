/* eslint-disable @typescript-eslint/no-explicit-any */

import { Arrow } from './Arrow';
import { List } from './List';

/**
  Alias to create a async function.

  @template R - The type of parameters.
  @template N - The return type.
*/
export type AsyncArrow<T extends List = any[], N = any> = Arrow<T, Promise<N>>;
