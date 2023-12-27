/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unnecessary-type-constraint */

import { List } from './List';

/**
  Alias to create a function.

  @template R - The type of parameters.
  @template N - The return type.
*/
export type Arrow<R extends List = any, N extends any = any> = (
  ...args: R
) => N;
