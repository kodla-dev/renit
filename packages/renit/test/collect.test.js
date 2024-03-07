import { describe, expect, it } from 'vitest';
import { apply, each, keys, loop, reduce, values } from '../src/collect.js';
import { pipe } from '../src/helper.js';

describe('keys', () => {
  const data = {
    club: 'Liverpool',
    nickname: 'The Reds',
  };
  const promiseData = Promise.resolve(data);
  const result = ['club', 'nickname'];

  it('keys:object', () => {
    expect(keys(data)).toEqual(result);
    expect(data).toEqual({
      club: 'Liverpool',
      nickname: 'The Reds',
    });
  });

  it('keys:promise:object', async () => {
    expect(await keys(promiseData)).toEqual(result);
  });

  it('keys:create:promise:object', async () => {
    const getKeys = keys();
    expect(await getKeys(promiseData)).toEqual(result);
  });

  it('keys:pipe', () => {
    expect(pipe(data, keys)).toEqual(result);
  });
});

describe('values', () => {
  const data = { name: 'Galileo', last: 'Galilei' };
  const promiseData = Promise.resolve(data);
  const result = ['Galileo', 'Galilei'];

  it('values:object', () => {
    expect(values(data)).toEqual(result);
    expect(data).toEqual({ name: 'Galileo', last: 'Galilei' });
  });

  it('values:promise:object', async () => {
    expect(await values(promiseData)).toEqual(result);
  });

  it('values:create:promise:object', async () => {
    const getValues = values();
    expect(await getValues(promiseData)).toEqual(result);
  });

  it('values:pipe', () => {
    expect(pipe(data, values)).toEqual(result);
  });
});

describe('apply', () => {
  it('apply:array:number', () => {
    const sum = (a, b) => a + b;
    const data = [5, 3];
    const appliedSum = apply(sum, data);
    expect(appliedSum).toBe(8);
    expect(data).toEqual([5, 3]);
  });

  it('apply:array:string', () => {
    const greet = (name, greeting) => `${greeting} ${name}!`;
    const appliedGreet = apply(greet, ['John', 'Hello']);
    expect(appliedGreet).toBe('Hello John!');
  });

  it('apply:promise:array', async () => {
    const sum = (a, b) => a + b;
    const appliedSum = await apply(sum, Promise.resolve([5, 3]));
    expect(appliedSum).toBe(8);
  });

  it('apply:create:array', async () => {
    const sum = (a, b) => a + b;
    const applied = apply(sum);
    const appliedSum1 = applied([5, 3]);
    expect(appliedSum1).toBe(8);
    const appliedSum2 = await applied(Promise.resolve([2, 2]));
    expect(appliedSum2).toBe(4);
  });

  it('apply:object:number', () => {
    const sum = (a, b) => a + b;
    const data = { grape: 3, apple: 5 };
    const appliedSum = apply(sum, data);
    expect(appliedSum).toBe(8);
    expect(data).toEqual({ grape: 3, apple: 5 });
  });

  it('apply:pipe', () => {
    const sum = (a, b) => a + b;
    // prettier-ignore
    const appliedSum = pipe(
      [5, 3],
      apply(sum)
    );
    expect(appliedSum).toBe(8);
  });

  it('apply:promise:pipe', async () => {
    const sum = (a, b) => a + b;
    // prettier-ignore
    const appliedSum = await pipe(
      Promise.resolve([5, 3]),
      apply(sum)
    );
    expect(appliedSum).toBe(8);
  });
});

describe('loop', () => {
  it('loop:default', () => {
    const data = [1, 2, 3];
    let total = 0;
    loop(index => {
      total += data[index];
    }, data);
    expect(total).toEqual(6);
  });

  it('loop:async', async () => {
    const data = [1, 2, 3];
    let total = 0;
    await loop(async index => {
      total += data[index];
    }, data);
    expect(total).toEqual(6);
  });

  it('loop:async:promise', async () => {
    const data = Promise.resolve([1, 2, 3]);
    let total = 0;
    await loop(async index => {
      total++;
    }, data);
    expect(total).toEqual(3);
  });
});

describe('each', () => {
  it('each:array', () => {
    const data = [1, 2, 3, 4];
    each((item, index) => {
      expect(item).toEqual(data[index]);
    }, data);
  });

  it('each:object', () => {
    const data = { name: 'İbn', lastname: 'Sînâ' };
    each((key, value) => {
      expect(data[key]).toEqual(value);
    }, data);
  });

  it('each:promise', async () => {
    const data = Promise.resolve([1, 2]);
    await each(item => {
      if (item == 1) expect(item).toEqual(1);
      if (item == 2) expect(item).toEqual(2);
    }, data);
  });

  it('each:async:promise', async () => {
    const data = Promise.resolve([1, 2]);
    await each(async item => {
      if (item == 1) expect(item).toEqual(1);
      if (item == 2) expect(item).toEqual(2);
    }, data);
  });

  it('each:create', () => {
    let total = 0;
    const addTotal = each(item => (total += item));

    addTotal([1, 2]);
    expect(total).toEqual(3);

    addTotal([3, 4]);
    expect(total).toEqual(10);
  });

  it('each:pipe', () => {
    const data = [1, 2, 3, 4];
    // prettier-ignore
    pipe(
      data,
      each((item, index) => expect(item).toEqual(data[index]))
    );
  });
});

describe('reduce', () => {
  it('reduce:array', () => {
    const sum = (a, b) => a + b;
    const data = [1, 2, 3, 4];
    const result = reduce(sum, data);
    expect(result).toBe(10);
    expect(data).toEqual([1, 2, 3, 4]);
  });

  it('reduce:object', () => {
    const sum = (a, b) => a + b;
    const data = { wood: 150, stone: 50, gold: 10 };
    const result = reduce(sum, data);
    expect(result).toBe(210);
    expect(data).toEqual({ wood: 150, stone: 50, gold: 10 });
  });

  it('reduce:seed', () => {
    const sum = (a, b) => a + b;
    const data = [1, 2, 3, 4];
    const result = reduce(sum, 10, data);
    expect(result).toBe(20);
  });

  it('reduce:pipe', () => {
    const sum = (a, b) => a + b;
    // prettier-ignore
    const result = pipe(
      [1, 2, 3, 4],
      reduce(sum)
    );
    expect(result).toBe(10);
  });

  it('reduce:create', () => {
    const sum = (a, b) => a + b;
    const data = [1, 2, 3, 4];
    const total = reduce(sum);
    const result = total(data);
    expect(result).toBe(10);
  });
});
