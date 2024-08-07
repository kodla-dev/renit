# ![logo](http://kodla.org/renit/symbol-min.svg) Renit · <sub><sup>The small framework with powerful features</sup></sub>

[![docs](https://img.shields.io/badge/docs-renit.dev-blue?logo=hackthebox&color=006DF9&logoColor=00C3FF)][RENIT]
&nbsp;[![npm](https://img.shields.io/npm/v/renit.svg)][PACKAGE]
&nbsp;[![test](https://github.com/kodla-dev/renit/actions/workflows/test.yaml/badge.svg?branch=main)][TEST]
&nbsp;[![shaking](https://img.shields.io/badge/tree%20shakeable-blue?color=gray&logo=gumtree&logoColor=72ef36)][SIZE]
&nbsp;[![license](https://img.shields.io/npm/l/renit.svg?color=008C16)][LICENSE]

_Renit_ is a powerful JavaScript framework with a very small footprint, built for developers who need a simple and elegant toolkit to create full-featured web applications.

### Easy to use

Create the simplest components in the world.

```html
<div @name="hello">
  <h1>Hello {name}!</h1>
  <script>
    export let name = 'world';
  </script>
</div>

<hello name="everyone" />
```

### Tailored for needs

_Renit_ typically encompasses packages that might be needed in every project.

```js
import { pluck } from 'renit/collect';

pluck('name', 'detail.date', [
  { name: 'Albert', detail: { date: 1879 } },
  { name: 'Isaac', detail: { date: 1643 } },
]);

//=> {1879: 'Albert', 1643: 'Isaac'}
```

## Documentation

Documentation lives on [renit.dev][RENIT].

---

<details>
<summary>Roadmap</summary>

You may view our [roadmap][ROADMAP] if you'd like to see what we're currently working on.

</details>

<details>
<summary>Release Notes</summary>

All notable changes to this project will be documented in the [changelog][CHANGELOG].

</details>

<details>
<summary>License</summary>

[MIT][LICENSE]

</details>

---

Thanks for reading!

🎉

[RENIT]: https://renit.dev
[TEST]: https://github.com/kodla-dev/renit/actions/workflows/test.yaml
[PACKAGE]: https://www.npmjs.com/package/renit
[SIZE]: https://bundlephobia.com/package/renit
[ROADMAP]: https://renit.dev/#!/intro/roadmap
[CHANGELOG]: https://renit.dev/#!/intro/changelog
[LICENSE]: https://github.com/kodla-dev/renit/blob/main/LICENSE
