# is

**Performs type and value checks for variables or constants, providing
information about features supported by the system environment.**

English • [Türkçe](./README.tr.md)

---

> **Some Errors in the JavaScript Language** For example;

```js
// This stands since the beginning of JavaScript
typeof null === 'object';
```

_[↪ reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof#typeof_null)_

In JavaScript, `null` is actually considered an `Object`. However, adjustments
have been made in this library for such chronic errors to better align with our
perspective.

---

[Usage](#usage) • [Functions](#functions)

---

## Usage

```js
import { isArray } from 'renit/is';
```

## Functions

### :small_blue_diamond: isArray

Checks if the specified value is an array.

```ts
/**
  isArray(value)
  @param {R} value - The value to check.
  @returns {boolean} Returns true if the value is an array, false otherwise.
*/
```

Usage examples:

```js
isArray(['pear', 'grape', 'cherry', 'lemon']);
//=> true

isArray(100);
//=> false

isArray('Super User');
//=> false

isArray({
  club: 'Liverpool',
  players: ['Salah', 'Firmino', 'Núñez']
});
//=> false
```

> For example, returns `true` if an array is given, `false` otherwise.

---

### :small_blue_diamond: isArrayLike

Checks if the specified value resembles an array.

```ts
/**
  isArrayLike(value)
  @param {R} value - The value to check.
  @returns {boolean} Returns true if the value is array-like, false otherwise.
*/
```

Usage examples:

```js
isArrayLike([1, 2, 3]);
//=> true

isArrayLike({ 0: 'apple', 1: 'orange', length: 2 });
//=> true

isArrayLike('fruits');
//=> true

isArrayLike(document.body.children);
// => true

isArrayLike(null);
//=> false

isArrayLike(() => {});
//=> false
```

> In the example above, the `isArrayLike` function contains the necessary
> conditions to check if the given value resembles an array. These conditions
> allow values that meet the specified conditions to be considered array-like.
> If a value is not a function, greater than or equal to 0, and has a
> `value.length` that is less than or equal to `Number.MAX_SAFE_INTEGER`, it is
> considered array-like.

---

## isAsync

Checks if the specified value is an asynchronous function.

```ts
/**
  isAsync(value)
  @param {R} value - The value to check.
  @returns {boolean} Returns true if the value is an asynchronous function, false otherwise.
*/
```

Usage examples:

```js
const handle = () => {
  //...//
};

const asyncHandle = async () => {
  //...//
};

isAsync(handle);
//=> false

isAsync(asyncHandle);
//=> true
```

> For example, returns `true` if a function is defined with the `async` keyword,
> `false` otherwise.

---

### :small_blue_diamond: isAsyncIterable

Checks if the specified value is an asynchronous iterable.

```ts
/**
  isAsync(value)
  @param {R} value - The value to check.
  @returns {boolean} Returns true if the value is an asynchronous iterable, false otherwise.
*/
```

Usage examples:

```js
isAsyncIterable([1, 2, 3]);
//=> false

isAsyncIterable(Promise.resolve([1, 2, 3]));
//=> false

isAsyncIterable(toAsync([1, 2, 3]));
//=> true
```

> For example, returns `true` if an array is suitable for async iterations,
> `false` otherwise.

## isBoolean

Checks if the specified value is of boolean data type.

```ts
/**
  isBoolean(value)
  @param {R} value - The value to check.
  @returns {boolean} Returns true if the value is a boolean, false otherwise.
*/
```

Usage examples:

```js
isBoolean(true);
//=> true

isBoolean(false);
//=> true

isBoolean(['price', 'discount']);
//=> false

isBoolean(null);
//=> false
```

> For example, returns `true` for the values `true` or `false`, `false` for
> other cases.

---

### :small_blue_diamond: isClient

Checks if the environment in which the system operates is a client.

```ts
/**
  isClient()
  @returns {boolean} Returns true if running in a client-side environment,
  false otherwise.
*/
```

Usage example:

```js
if (isClient()) {
  //=> true | false
  // Code block running on the client side
} else {
  // Code block running on the server side
}
```
