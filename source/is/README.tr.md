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

```ts
/**
  isArray(value)
  @param {R} value - Kontrol edilecek değer.
  @returns {boolean} Değer bir dizi ise true, değilse false.
*/
```

Kullanım örnekleri:

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

---

### :small_blue_diamond: isArrayLike

Belirtilen değerin bir diziye benzeyip benzemediğini kontrol eder.

```ts
/**
  isArrayLike(value)
  @param {R} value - Kontrol edilecek değer.
  @returns {boolean} Değer bir diziye benzer ise true, değilse false.
*/
```

Kullanım örnekleri:

```js
isArrayLike([1, 2, 3]);
//=> true

isArrayLike({ 0: 'apple', 1: 'orange', length: 2 });
//=> true

isArrayLike('fruits');
//=> true

isArrayLike(document.body.children);
//=> true

isArrayLike(null);
//=> false

isArrayLike(() => {});
//=> false
```

> Yukarıdaki örnekte, `isArrayLike` fonksiyonu, verilen değerin bir diziye
> benzeyip benzemediğini kontrol etmek için gerekli koşulları içermektedir. Bu
> koşullar, belirtilen şartları sağlayan değerlerin dizi benzeri kabul
> edilmesini sağlar. Eğer bir değer, bir fonksiyon değilse ve 0'dan büyük veya
> ona eşitse, aynı zamanda `Number.MAX_SAFE_INTEGER`'den küçük veya ona eşit bir
> tamsayı olan bir `value.length`'e sahipse, bu durumda değer bir dizi benzeri
> olarak kabul edilir.

---

### :small_blue_diamond: isAsync

Belirtilen değerin bir asenkron fonksiyon (async function) olup olmadığını
kontrol eder.

```ts
/**
  isAsync(value)
  @param {R} value - Kontrol edilecek değer.
  @returns {boolean} Değer bir asenkron fonksiyon ise true, değilse false.
*/
```

Kullanım örnekleri:

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

> Örneğin, bir fonksiyon `async` anahtar kelimesi ile tanımlanmışsa `true`, aksi
> takdirde `false` döndürür.

---

### :small_blue_diamond: isAsyncIterable

Belirtilen değerin bir yinelenebilir asenkron (async iterable) olup olmadığını
kontrol eder.

```ts
/**
  isAsyncIterable(value)
  @param {R} value - Kontrol edilecek değer.
  @returns {boolean} Değer bir yinelenebilir asenkron ise true, değilse false.
*/
```

Kullanım örnekleri:

```js
isAsyncIterable([1, 2, 3]);
//=> false

isAsyncIterable(Promise.resolve([1, 2, 3]));
//=> false

isAsyncIterable(toAsync([1, 2, 3]));
//=> true
```

> Örneğin, bir dizi `async` iterasyonlarına uygunsa `true`, aksi takdirde
> `false` döndürür.

---

### :small_blue_diamond: isBoolean

Belirtilen değerin tipinin mantıksal veri türü (boolean) olup olmadığını kontrol
eder.

```ts
/**
  isBoolean(value)
  @param {R} value - Kontrol edilecek değer.
  @returns {boolean} Değer bir boolean ise true, değilse false.
*/
```

Kullanım örnekleri:

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

> Örneğin, `true` veya `false` değerleri için `true`, diğer durumlar için
> `false` döndürür.

---

### :small_blue_diamond: isClient

Sistemin çalıştığı ortamın istemci (client) olup olmadığını kontrol eder.

```ts
/**
  isClient()
  @returns {boolean} Kod istemci ortamında çalışıyorsa true, değilse false.
*/
```

Kullanım örneği:

```js
if (isClient()) {
  //=> true | false
  // Tarayıcı tarafında çalışan kod bloğu
} else {
  // Sunucu tarafında çalışan kod bloğu
}
```
