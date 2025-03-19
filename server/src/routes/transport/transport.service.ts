import { createTask } from '../tasks/task.service'
import Inventory from '../inventory/inventory.model'
import AppError from '../../utils/appError'

export const loadCargoHelper = async (
  binID: string,
  accountID: string,
  cartID: string
): Promise<{ status: number; message: string }> => {
  try {
    const updatedItems = await Inventory.update(
      { binID: cartID },
      { where: { binID } }
    )

    if (!updatedItems[0]) {
      throw new AppError(404, '❌ No inventory updated for the given binID')
    }

    await createTask(binID, accountID)

    return {
      status: 200,
      message: `✅ BinID updated to "${cartID}".`
    }
  } catch (error) {
    console.error('❌ Error loading cargo:', error)
    throw new AppError(500, '❌ Failed to load cargo due to an internal error.')
  }
}
