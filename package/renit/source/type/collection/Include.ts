/**
  Type that checks if type `R` extends type `N`, and returns type `R` if true,
  otherwise returns `never`.

  @template T - The type to be checked.
  @template N - The type to check against.
*/
export type Include<R, N> = R extends N ? R : never;
