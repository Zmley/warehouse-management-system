import Product from 'routes/products/product.model'
import Bin from 'routes/bins/bin.model'
import Inventory from 'routes/inventory/inventory.model'
import Task from 'routes/tasks/task.model'
import Transfer from 'routes/transfers/transfer.model'
import Warehouse from 'routes/warehouses/warehouse.model'
import Account from 'routes/accounts/accounts.model'

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

  Task.hasMany(Transfer, { foreignKey: 'taskID', as: 'transfers' })

  Account.belongsTo(Warehouse, {
    foreignKey: 'warehouseID',
    as: 'currentWarehouse'
  })

  Warehouse.hasMany(Bin, {
    foreignKey: 'warehouseID',
    as: 'bins'
  })

  Account.belongsTo(Bin, {
    foreignKey: 'cartID',
    as: 'cart'
  })
}

Transfer.belongsTo(Product, {
  as: 'product',
  foreignKey: 'productCode',
  targetKey: 'productCode'
})
