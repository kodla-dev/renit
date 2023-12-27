/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-unnecessary-type-constraint */

/**
  Represents a type that behaves like an array by having a 'length' property.
*/
interface ArrayLikeLiteral {
  readonly length: number;
}

/**
  Alias to create a function.

  @template R - The type of parameters.
  @template N - The return type.
*/
type Arrow<R extends List = any, N extends any = any> = (...args: R) => N;

/**
  Alias to create a async function.

  @template R - The type of parameters.
  @template N - The return type.
*/
type AsyncArrow<T extends List = any[], N = any> = Arrow<T, Promise<N>>;

/**
  Type that checks if type `R` extends type `N`, and returns type `R` if true,
  otherwise returns `never`.

  @template T - The type to be checked.
  @template N - The type to check against.
*/
type Include<R, N> = R extends N ? R : never;

/**
  Alias representing a readonly array.
  @template R - The type of elements in the list.
*/
type List<R = any> = ReadonlyArray<R>;
