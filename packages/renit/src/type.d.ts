/**
 * Type representing an array or a readonly array.
 *
 * @template R - The type of elements in the array.
 */
export type $array<R = unknown> = R[] | Readonly<R[]>;

/**
 * Type representing either an array or an object literal with keys of type
 * string or number, and values of type R or an array of R.
 *
 * @template R - The type of values in the array or object literal.
 */
export type $collect<R = unknown> = $array<R> | $object<R>;

/**
 * Type representing an object literal with keys of type string or number, and
 * values of type R or an array of R.
 *
 * @template R - The type of values in the object literal.
 */
export type $object<R = unknown> = ObjectLiteral<R>;

/**
 * Represents a type that behaves like an array by having a 'length' property.
 */
export interface ArrayLikeLiteral {
  readonly length: number;
}

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

/**
 * Type representing a class constructor that takes arguments of type R and
 * creates an instance of type N.
 *
 * @template R - The type of arguments the class constructor takes.
 * @template N - The type of the class instance.
 */
export type ClassLiteral<R = any, N = any> = new (...args: R[]) => N;

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
 * Interface representing an object literal with keys of type string or number,
 * and values of type R or an array of R.
 *
 * @template R - The type of values in the object literal.
 */
export interface ObjectLiteral<R> {
  [key: string | number]: R | R[];
}

/**
 * Extract the return type of a function.
 *
 * @template R - The arrow function type.
 */
export type Return<R extends Arrow> = R extends (...args: List) => infer N ? N : never;
