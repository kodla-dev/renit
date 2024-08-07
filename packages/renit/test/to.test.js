import { describe, expect, it } from 'vitest';
import { pipe } from '../src/helpers/index.js';
import { map } from '../src/libraries/collect/index.js';
import {
  htmlToAst,
  toArray,
  toAsync,
  toJson,
  toString,
  toStringify,
} from '../src/libraries/to/index.js';

describe('toArray', () => {
  it('toArray:array', () => {
    expect(toArray([1, 2, 3, 'b', 'c'])).toEqual([1, 2, 3, 'b', 'c']);
  });

  it('toArray:object', () => {
    expect(
      toArray({
        name: 'Elon Musk',
        companies: ['Tesla', 'Space X', 'SolarCity'],
      })
    ).toEqual(['Elon Musk', ['Tesla', 'Space X', 'SolarCity']]);
  });
});

describe('toAsync', () => {
  it('toAsync:array', async () => {
    let acc = 0;
    for await (const item of toAsync([1, 2, 3, 4, 5])) {
      acc += item;
    }
    expect(acc).toEqual(15);
  });

  it('toAsync:pipe', async () => {
    const result = await pipe(
      [Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)],
      toAsync,
      map(a => a + 10),
      toArray
    );
    expect(result).toEqual([11, 12, 13]);
  });
});

describe('toJson', () => {
  it('toJson:array', () => {
    expect(toJson([1, 2, 3, 'b', 'c'])).toEqual('[1,2,3,"b","c"]');
  });

  it('toJson:object', () => {
    expect(
      toJson({
        id: 384,
        name: 'Rayquaza',
        gender: 'NA',
      })
    ).toEqual('{"id":384,"name":"Rayquaza","gender":"NA"}');
  });
});

describe('toString', () => {
  it('toString:array', () => {
    expect(toString([1, 2, 3, 4, 5])).toEqual('1,2,3,4,5');
  });

  it('toString:object', () => {
    expect(toString({ id: 1 })).toEqual('[object Object]');
  });
});

describe('toStringify', () => {
  it('toStringify:array', () => {
    expect(toStringify([1, 2, 3, 4, 5])).toEqual('1,2,3,4,5');
  });

  it('toStringify:object', () => {
    expect(toStringify({ id: 1 })).toEqual('{"id":1}');
  });
});

describe('htmlToAst', () => {
  it('should parse the h1 element', () => {
    const ast = htmlToAst('<h1>Hello World!</h1>');
    const result = {
      type: 'Document',
      children: [
        {
          type: 'Element',
          name: 'h1',
          voidElement: false,
          attributes: [],
          children: [{ type: 'Text', content: 'Hello World!' }],
        },
      ],
    };
    expect(JSON.stringify(ast)).toEqual(JSON.stringify(result));
  });

  it('should parse nested elements', () => {
    const ast = htmlToAst('<div><h1>Hello World!</h1></div>');
    const result = {
      type: 'Document',
      children: [
        {
          type: 'Element',
          name: 'div',
          voidElement: false,
          attributes: [],
          children: [
            {
              type: 'Element',
              name: 'h1',
              voidElement: false,
              attributes: [],
              children: [{ type: 'Text', content: 'Hello World!' }],
            },
          ],
        },
      ],
    };
    expect(JSON.stringify(ast)).toEqual(JSON.stringify(result));
  });

  it('should recognize void elements', () => {
    const ast = htmlToAst('<div><h1>Hello World!</h1><img src="renit.png" /></div>');
    const result = {
      type: 'Document',
      children: [
        {
          type: 'Element',
          name: 'div',
          voidElement: false,
          attributes: [],
          children: [
            {
              type: 'Element',
              name: 'h1',
              voidElement: false,
              attributes: [],
              children: [{ type: 'Text', content: 'Hello World!' }],
            },
            {
              type: 'Element',
              name: 'img',
              voidElement: true,
              attributes: [{ type: 'Attribute', name: 'src', value: 'renit.png' }],
              children: [],
            },
          ],
        },
      ],
    };
    expect(JSON.stringify(ast)).toEqual(JSON.stringify(result));
  });

  it('should recognize custom void tags', () => {
    const ast = htmlToAst('<div><component title="Hi!" /></div>');
    const result = {
      type: 'Document',
      children: [
        {
          type: 'Element',
          name: 'div',
          voidElement: false,
          attributes: [],
          children: [
            {
              type: 'Element',
              name: 'component',
              voidElement: true,
              attributes: [{ type: 'Attribute', name: 'title', value: 'Hi!' }],
              children: [],
            },
          ],
        },
      ],
    };
    expect(JSON.stringify(ast)).toEqual(JSON.stringify(result));
  });

  it('should parse the attributes of the element', () => {
    const ast = htmlToAst(
      '<a href="/home.html" class="btn mt-2" data-id=5 disabled {value}>HOME</a>'
    );
    const result = {
      type: 'Document',
      children: [
        {
          type: 'Element',
          name: 'a',
          voidElement: false,
          attributes: [
            { type: 'Attribute', name: 'href', value: '/home.html' },
            { type: 'Attribute', name: 'class', value: 'btn mt-2' },
            { type: 'Attribute', name: 'data-id', value: '5' },
            { type: 'Attribute', name: 'disabled' },
            { type: 'Attribute', name: 'value', value: '{value}' },
          ],
          children: [{ type: 'Text', content: 'HOME' }],
        },
      ],
    };
    expect(JSON.stringify(ast)).toEqual(JSON.stringify(result));
  });

  it('should provide affix feature in attribute parsing', () => {
    const ast = htmlToAst(
      '<div @name="form" class:visible={display}><input :value={number} /></div>',
      {
        attribute: { affix: true },
      }
    );
    const result = {
      type: 'Document',
      children: [
        {
          type: 'Element',
          name: 'div',
          voidElement: false,
          attributes: [
            { type: 'Attribute', prefix: '@', name: 'name', value: 'form' },
            {
              type: 'Attribute',
              name: 'class',
              suffix: [{ prefix: ':', name: 'visible' }],
              value: '{display}',
            },
          ],
          children: [
            {
              type: 'Element',
              name: 'input',
              voidElement: true,
              attributes: [{ type: 'Attribute', prefix: ':', name: 'value', value: '{number}' }],
              children: [],
            },
          ],
        },
      ],
    };
    expect(JSON.stringify(ast)).toEqual(JSON.stringify(result));
  });

  it('should allow adding new affixes', () => {
    const ast = htmlToAst('<div !variable=1>OK</div>', {
      attribute: { affix: true, addAffix: ['!'] },
    });
    const result = {
      type: 'Document',
      children: [
        {
          type: 'Element',
          name: 'div',
          voidElement: false,
          attributes: [{ type: 'Attribute', prefix: '!', name: 'variable', value: '1' }],
          children: [{ type: 'Text', content: 'OK' }],
        },
      ],
    };
    expect(JSON.stringify(ast)).toEqual(JSON.stringify(result));
  });

  it('should recognize whitespace', () => {
    const ast = htmlToAst(`
      <div>
        <p> whitespace </p>
      </div>
    `);
    const result = {
      type: 'Document',
      children: [
        {
          type: 'Text',
          content: '\n      ',
        },
        {
          type: 'Element',
          name: 'div',
          voidElement: false,
          attributes: [],
          children: [
            {
              type: 'Text',
              content: '\n        ',
            },
            {
              type: 'Element',
              name: 'p',
              voidElement: false,
              attributes: [],
              children: [
                {
                  type: 'Text',
                  content: ' whitespace ',
                },
              ],
            },
            {
              type: 'Text',
              content: '\n      ',
            },
          ],
        },
        {
          type: 'Text',
          content: '\n    ',
        },
      ],
    };
    expect(JSON.stringify(ast)).toEqual(JSON.stringify(result));
  });

  it('should remove optional whitespace', () => {
    const ast = htmlToAst(
      `
      <div>
        <p>  renit <span> ! </span>  </p>
        <script>
          console.log();
        </script>
      </div>
    `,
      { transform: { whitespace: false, trim: true } }
    );
    const result = {
      type: 'Document',
      children: [
        {
          type: 'Element',
          name: 'div',
          voidElement: false,
          attributes: [],
          children: [
            {
              type: 'Element',
              name: 'p',
              voidElement: false,
              attributes: [],
              children: [
                { type: 'Text', content: 'renit' },
                {
                  type: 'Element',
                  name: 'span',
                  voidElement: false,
                  attributes: [],
                  children: [{ type: 'Text', content: '!' }],
                },
              ],
            },
            {
              type: 'Element',
              name: 'script',
              voidElement: false,
              attributes: [],
              children: [{ type: 'Text', content: 'console.log();' }],
            },
          ],
        },
      ],
    };
    expect(JSON.stringify(ast)).toEqual(JSON.stringify(result));
  });

  it('should not parse special HTML tags', () => {
    const ast = htmlToAst(`
      <div>
        <p>parse</p>
        <script lang="ts">
          console.log("<p>not parse</p>")
        </script>
        <!-- single line comment <p>not parse</p> -->
        <style type="text/css">
          .title {
            content: "<p>not parse</p>"
          }
        </style>
        <!--
          multiple line comment
          <p>not parse</p>
        -->
      </div>
    `);
    const result = {
      type: 'Document',
      children: [
        {
          type: 'Text',
          content: '\n      ',
        },
        {
          type: 'Element',
          name: 'div',
          voidElement: false,
          attributes: [],
          children: [
            {
              type: 'Text',
              content: '\n        ',
            },
            {
              type: 'Element',
              name: 'p',
              voidElement: false,
              attributes: [],
              children: [
                {
                  type: 'Text',
                  content: 'parse',
                },
              ],
            },
            {
              type: 'Text',
              content: '\n        ',
            },
            {
              type: 'Element',
              name: 'script',
              voidElement: false,
              attributes: [
                {
                  type: 'Attribute',
                  name: 'lang',
                  value: 'ts',
                },
              ],
              children: [
                {
                  type: 'Text',
                  content: '\n          console.log("<p>not parse</p>")\n        ',
                },
              ],
            },
            {
              type: 'Comment',
              content: ' single line comment <p>not parse</p> ',
            },
            {
              type: 'Element',
              name: 'style',
              voidElement: false,
              attributes: [
                {
                  type: 'Attribute',
                  name: 'type',
                  value: 'text/css',
                },
              ],
              children: [
                {
                  type: 'Text',
                  content:
                    '\n          .title {\n            content: "<p>not parse</p>"\n          }\n        ',
                },
              ],
            },
            {
              type: 'Comment',
              content: '\n          multiple line comment\n          <p>not parse</p>\n        ',
            },
          ],
        },
        {
          type: 'Text',
          content: '\n    ',
        },
      ],
    };
    expect(JSON.stringify(ast)).toEqual(JSON.stringify(result));
  });

  it('should allow special HTML tags but not parse their content', () => {
    const ast = htmlToAst(
      `
      <div>
        <portal target="document.body">
          <p>not {parse}</p>
        </portal>
      </div>
    `,
      { tags: { addSpecial: ['portal'] } }
    );
    const result = {
      type: 'Document',
      children: [
        { type: 'Text', content: '\n      ' },
        {
          type: 'Element',
          name: 'div',
          voidElement: false,
          attributes: [],
          children: [
            { type: 'Text', content: '\n        ' },
            {
              type: 'Element',
              name: 'portal',
              voidElement: false,
              attributes: [{ type: 'Attribute', name: 'target', value: 'document.body' }],
              children: [{ type: 'Text', content: '\n          <p>not {parse}</p>\n        ' }],
            },
          ],
        },
        { type: 'Text', content: '\n    ' },
      ],
    };
    expect(JSON.stringify(ast)).toEqual(JSON.stringify(result));
  });
  it('should convert content outside tags into text nodes', () => {
    const ast = htmlToAst(`
      <div>div text</div> outside
      text <p>paragraph text</p>
    `);
    const result = {
      type: 'Document',
      children: [
        { type: 'Text', content: '\n      ' },
        {
          type: 'Element',
          name: 'div',
          voidElement: false,
          attributes: [],
          children: [{ type: 'Text', content: 'div text' }],
        },
        { type: 'Text', content: ' outside\n      text ' },
        {
          type: 'Element',
          name: 'p',
          voidElement: false,
          attributes: [],
          children: [{ type: 'Text', content: 'paragraph text' }],
        },
        { type: 'Text', content: '\n    ' },
      ],
    };
    expect(JSON.stringify(ast)).toEqual(JSON.stringify(result));
  });
});
