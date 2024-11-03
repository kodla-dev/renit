# ![logo](http://kodla.org/renit/symbol-min.svg) Renit

[![docs](https://img.shields.io/badge/docs-renit.dev-blue?logo=hackthebox&color=006DF9&logoColor=00C3FF)][RENIT]
&nbsp;[![npm](https://img.shields.io/npm/v/renit.svg)][PACKAGE]
&nbsp;[![test](https://github.com/kodla-dev/renit/actions/workflows/test.yaml/badge.svg?branch=main)][TEST]
&nbsp;[![shaking](https://img.shields.io/badge/tree%20shakeable-blue?color=gray&logo=gumtree&logoColor=72ef36)][SIZE]
&nbsp;[![license](https://img.shields.io/npm/l/renit.svg?color=008C16)][LICENSE]

_Renit_ is a small JavaScript framework for developers who need a simple toolkit to create web apps.

### Easy to start

```bash
npm create renit my-app
cd my-app
npm run dev
# app ➜ http://localhost:5000/
# api ➜ http://localhost:5000/api or http://localhost:5001/
```

### Easy to use

Make simple components.

```html
<div @name="hello">
  <h1>Hello {name}!</h1>
  <script>
    export let name = 'world';
  </script>
</div>

<hello name="everyone" />
```

### Suits your needs

Includes the right tools for your projects.

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
