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
