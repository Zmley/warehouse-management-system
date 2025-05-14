import Inventory from 'routes/inventory/inventory.model'
import { Op } from 'sequelize'

export const getExistingInventoryPairs = async (
  binIDs: string[]
): Promise<Set<string>> => {
  const inventories = await Inventory.findAll({
    where: {
      binID: {
        [Op.in]: binIDs
      }
    }
  })

  const pairSet = new Set<string>()
  inventories.forEach(inv => {
    const key = `${inv.binID}-${inv.productCode.trim().toUpperCase()}`
    pairSet.add(key)
  })

  return pairSet
}
