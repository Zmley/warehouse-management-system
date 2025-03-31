import Bin from '../routes/bins/bin.model'
import Inventory from '../routes/inventory/inventory.model'

export const setupAssociations = () => {
  Bin.hasMany(Inventory, {
    foreignKey: 'binID',
    sourceKey: 'binID'
  })
}
