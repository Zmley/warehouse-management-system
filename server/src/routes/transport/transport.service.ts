import { getAccountById } from '../accounts/accounts.service'
import { createTask,hasActiveTask } from '../../routes/tasks/task.service'
import Inventory from '../../models/inventory'
import AppError from '../../utils/appError'

export const loadCargo = async (binID: string, accountID: string): Promise<{ status: number; message: string }> => {
  const Account = await getAccountById(accountID)
  if (!Account) {
    throw new AppError(404, '❌ User account not found')
  }

  const cartID = Account.cartID
  if (!cartID) {
    throw new AppError(400, '❌ only transport worker can use car')
  }

  const updatedCount = await loadCargoHelper(binID, cartID)
  if (updatedCount === 0) {
    throw new AppError(404, '❌ No matching binID found to update')
  }

  const hasTask = await hasActiveTask(accountID)
  if (!hasTask) {
    await createTask(binID, cartID, accountID)
  }

  return {
    status: 200,
    message: `✅ BinID updated to "${cartID}".`
  }
}

export const loadCargoHelper = async (binID: string, cartID: string) => {
  try {
    const updatedItems = await Inventory.update(
      { binID: cartID },
      { where: { binID } }
    )
    if (!updatedItems[0]) {
      throw new AppError(404, '❌ No inventory updated for the given binID')
    }
    return updatedItems[0]
  } catch (error) {
    console.error('❌ Error in loadCargoHelper:', error)
    throw new AppError(500, '❌ Failed to load cargo due to an internal error.')
  }
}