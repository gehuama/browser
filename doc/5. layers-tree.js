let layersTree =[
  {
    type: 'element',
    tagName: 'body',
    children: [
      {
        type: 'element',
        tagName: 'div',
        children: [],
        attributes: { id: 'container', class: 'main' },
        computedStyle: {
          color: 'black',
          width: '100px',
          height: '100px',
          background: 'red'
        },
        layout: {
          top: 0,
          left: 0,
          width: '100px',
          height: '100px',
          color: 'black'
        }
      },
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
            computedStyle: { color: 'blue' },
            layout: {
              top: 100,
              left: 0,
              width: undefined,
              height: undefined,
              color: 'blue'
            }
          }
        ],
        attributes: { id: 'hello', style: 'color:blue' },
        computedStyle: {
          color: 'blue',
          background: 'green',
          width: '100px',
          height: '100px'
        },
        layout: {
          top: 100,
          left: 0,
          width: '100px',
          height: '100px',
          color: 'blue'
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
  },
  {
    type: 'element',
    tagName: 'div',
    children: [
      {
        type: 'text',
        text: '绝对定位',
        tagName: 'text',
        children: [],
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
    ],
    attributes: { id: 'absolute', style: 'position: absolute;' },
    computedStyle: {
      color: 'black',
      background: 'pink',
      width: '50px',
      height: '50px',
      top: '0',
      left: '0',
      position: 'absolute'
    },
    layout: { top: 0, left: 0, width: '50px', height: '50px', color: 'black' }
  }
]