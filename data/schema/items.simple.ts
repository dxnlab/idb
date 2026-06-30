export default {
  items: {
    key: 'id'
    autoIncrement: true,
    index: {
      title: 'title',
      product: {
        key: 'product',
        multi: true,
      },
      color: {
        key: 'color',
        multi: true,
      },
      size: {
        key: 'size',
        multi: true,
      },
      sku: {
        key: ['product', 'color', 'size'],
        unique: true,
      }
    }
  }
}