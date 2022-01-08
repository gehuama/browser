let doc = {
  type: 'document',
  attributes: {},
  children: [
    {
      type: 'element',
      tagName: 'html',
      children: [
        {
          type: 'element',
          tagName: 'head',
          children: [
            {
              type: 'element',
              tagName: 'style',
              children: [
                {
                  type: 'text',
                  text: '\n' +
                    '        #hello {\n' +
                    '            color: red;\n' +
                    '        }\n' +
                    '\n' +
                    '        .world {\n' +
                    '            color: green;\n' +
                    '        }\n' +
                    '    ',
                  tagName: 'text',
                  children: [],
                  attributes: {},
                  computedStyle: { color: 'black' }
                }
              ],
              attributes: {},
              computedStyle: { color: 'black' }
            }
          ],
          attributes: {},
          computedStyle: { color: 'black' }
        },
        {
          type: 'element',
          tagName: 'body',
          children: [
            {
              type: 'element',
              tagName: 'div',
              children: [
                {
                  type: 'text',
                  text: 'hello',
                  tagName: 'text',
                  children: [],
                  attributes: {},
                  computedStyle: { color: 'red' }
                }
              ],
              attributes: { id: 'hello', style: 'background: green;' },
              computedStyle: { color: 'red', background: 'green' }
            },
            {
              type: 'element',
              tagName: 'div',
              children: [
                {
                  type: 'text',
                  text: 'world',
                  tagName: 'text',
                  children: [],
                  attributes: {},
                  computedStyle: { color: 'green' }
                }
              ],
              attributes: { class: 'world', style: 'background: red;' },
              computedStyle: { color: 'green', background: 'red' }
            }
          ],
          attributes: {},
          computedStyle: { color: 'black' }
        }
      ],
      attributes: {},
      computedStyle: { color: 'black' }
    }
  ],
  computedStyle: { color: 'black' }
}