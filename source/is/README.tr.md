# is

**Değişkenlerin veya sabitlerin tür ve değer kontrolünü gerçekleştirir, sistemin
çalışma ortamıyla desteklenen özellikler hakkında bilgi sağlar.**

[English](./README.md) • Türkçe

---

> **JavaScript Dilindeki Bazı Hatalar** Örneğin;

```js
// This stands since the beginning of JavaScript
typeof null === 'object';
```

_[↪ referans](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof#typeof_null)_

JavaScript'e göre, `null` aslında bir `Object`dir. Ancak, bu kütüphanede, bizim
bakış açımıza daha uygun olacak şekilde bu tür kronik hatalar için düzenlemeler
yapılmıştır.

---

[Kullanım](#kullanım) • [Fonksiyonlar](#fonksiyonlar)

---

## Kullanım

```js
import { isArray } from 'renit/is';
```

## Fonksiyonlar

### :small_blue_diamond: isArray

Belirtilen değerin bir dizi (array) olup olmadığını kontrol eder.

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

> Örneğin, bir dizi verildiğinde `true`, aksi takdirde `false` döndürür.
