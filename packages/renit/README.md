# ![logo](http://kodla.org/renit/symbol.svg?2) Renit &nbsp;[![test](https://github.com/kodla-dev/renit/actions/workflows/test.yaml/badge.svg?branch=main)][TEST]

![You have the code](http://kodla.org/renit/banner.jpg?2 'You have the code')

<p align="center">
  <br/>
  <i>Renit</i> is a small JavaScript framework for developers
  who need a simple toolkit to create web apps.
  <br/><br/>
</p>

<div align="center">

[![docs](https://img.shields.io/badge/docs-renit.dev-blue?logo=hackthebox&color=006DF9&logoColor=00C3FF)][RENIT]
&nbsp;[![npm](https://img.shields.io/npm/v/renit.svg)][PACKAGE]
&nbsp;[![shaking](https://img.shields.io/badge/tree%20shakeable-blue?color=gray&logo=gumtree&logoColor=72ef36)][SIZE]
&nbsp;[![license](https://img.shields.io/npm/l/renit.svg?color=008C16)][LICENSE]

</div>

## Install

Start with a template.

```shell
npm init renit
```

You can also install manually with this command:

```shell
npm install -D renit
```

Use this command to install plugins or add libraries to your project.

```shell
npm install @renit/{package}
```

## Overview

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

Includes the right tools for your projects.

```js
import { pluck } from 'renit/collect';

pluck('name', 'detail.date', [
  { name: 'Albert', detail: { date: 1879 } },
  { name: 'Isaac', detail: { date: 1643 } },
]);

//=> {1879: 'Albert', 1643: 'Isaac'}
```

---

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
