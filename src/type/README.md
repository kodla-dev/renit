# type

**Our type collection for TypeScript aims to achieve stronger type safety by
using general type functions.**

English • [Türkçe](./README.tr.md)

---

[Usage](#usage) • [Types](#types)

---

## Usage

```js
import { Include } from 'renit/type';
```

## Types

### :small_blue_diamond: Include

Type that checks if type `R` extends type `N`, and returns type `R` if true,
otherwise returns `never`.

```ts
/**
  Include<R, N>
  @template R The type to be checked.
  @template N The type to check against.
*/
```

Sample:

```ts
function isArray<R>(
  value: R
): value is Include<R, unknown[] | Readonly<unknown[]>> {
  return Array.isArray(value);
}

isArray([1, 2, 3]);
//=> array

isArray('Renit');
//=> never
```
