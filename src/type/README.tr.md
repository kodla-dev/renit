# type

**TypeScript için tip koleksiyonumuz, genel tip işlevlerini kullanarak daha
sağlam bir tip güvenliği elde etmeyi amaçlar.**

[English](./README.md) • Türkçe

---

[Kullanım](#kullanım) • [Tipler](#tipler)

---

## Kullanım

```js
import { Include } from 'renit/type';
```

## Tipler

### :small_blue_diamond: Include

`R` tipi, `N` tipine türemişse `R` tipini, aksi takdirde `never` tipini döndüren
bir tür.

```ts
/**
  Include<R, N>
  @template R Kontrol edilecek tip.
  @template N İçerip içermediği kontrol edilen tip.
*/
```

Örnek:

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
