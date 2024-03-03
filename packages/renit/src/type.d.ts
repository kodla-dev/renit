/**
 * Type that checks if type `R` extends type `N`, and returns type `R` if true,
 * otherwise returns `never`.
 *
 * @template R - The type to be checked.
 * @template N - The type to check against.
 */
export type Include<R, N> = R extends N ? R : never;

/**
 * Alias representing a readonly array.
 *
 * @template R - The type of elements in the list.
 */
export type List<R = any> = ReadonlyArray<R>;

/**
 * Alias to create a function.
 *
 * @template R - The type of parameters.
 * @template N - The return type.
 */
export type Arrow<R extends List = any, N extends any = any> = (...args: R) => N;

/**
 * Alias to create a async function.
 *
 * @template R - The type of parameters.
 * @template N - The return type.
 */
export type AsyncArrow<R extends List = any[], N = any> = Arrow<R, Promise<N>>;
