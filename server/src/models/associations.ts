import Product from 'routes/products/product.model'
import Bin from '../routes/bins/bin.model'
import Inventory from '../routes/inventory/inventory.model'

export const setupAssociations = () => {
  Bin.hasMany(Inventory, {
    foreignKey: 'binID',
    sourceKey: 'binID',
    as: 'inventories'
  })

  Product.hasMany(Inventory, {
    foreignKey: 'productCode',
    sourceKey: 'productCode',
    as: 'inventories'
  })

  Inventory.belongsTo(Product, {
    foreignKey: 'productCode',
    targetKey: 'productCode',
    as: 'product'
  })
}
