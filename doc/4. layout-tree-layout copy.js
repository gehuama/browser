let layoutTree ={
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
          computedStyle: { color: 'red' },
          layout: {
            top: 0,
            left: 0,
            width: undefined,
            height: undefined,
            color: 'red'
          }
        }
      ],
      attributes: { id: 'hello', style: 'background: green;' },
      computedStyle: {
        color: 'red',
        width: '100px',
        height: '100px',
        background: 'green'
      },
      layout: {
        top: 0,
        left: 0,
        width: '100px',
        height: '100px',
        color: 'red'
      }
    }
  ],
  attributes: {},
  computedStyle: { color: 'black' },
  layout: {
    top: 0,
    left: 0,
    width: undefined,
    height: undefined,
    color: 'black'
  }
}