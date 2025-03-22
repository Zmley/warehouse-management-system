import Inventory from './inventory.model'
import AppError from 'utils/appError'

export const getTaskUnloadInventory = async (
  cartID: string,
  productCode: string
): Promise<{ inventoryID: string; quantity: number }[]> => {
  const inventories = await Inventory.findAll({
    where: {
      binID: cartID,
      ...(productCode !== 'ALL' && { productCode })
    },
    attributes: ['inventoryID', 'quantity']
  })

  if (!inventories.length) {
    throw new AppError(404, '❌ No matching inventory found in the cart')
  }

  return inventories.map(item => ({
    inventoryID: item.inventoryID,
    quantity: item.quantity
  }))
}
