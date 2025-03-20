import Task from './task.model'
import AppError from '../../utils/appError'
import { hasCargoInCar } from '../transport/transport.service'

export const createTask = async (sourceBinID: string, accountID: string) => {
  try {
    const task = await Task.create({
      sourceBinID,
      destinationBinID: null,
      productID: 'ALL',
      status: 'IN_PROCESS',
      creatorID: accountID,
      accepterID: accountID,
      createdAt: new Date(),
      updatedAt: null
    })
    return task
  } catch (error) {
    throw new Error('❌ Failed to create task')
  }
}

export const hasActiveTask = async (accountID: string): Promise<boolean> => {
  try {
    const activeTask = await Task.findOne({
      where: { accepterID: accountID, status: 'IN_PROCESS' }
    })

    return activeTask !== null
  } catch (error) {
    console.error('❌ Error checking active task:', error)
    throw new AppError(500, '❌ Error checking active task')
  }
}

export const updateTaskStatus = async (
  accepterID: string,
  destinationBinID: string,
  cartID: string
) => {
  try {
    const task = await getCurrentTask(accepterID)

    const hasCargo = await hasCargoInCar(cartID)

    if (!hasCargo) {
      task.status = 'COMPLETED'
    } else {
      console.log(`Cargo still in car ${cartID}, task remains in progress.`)
    }

    task.updatedAt = new Date()
    task.destinationBinID = destinationBinID
    await task.save()

    console.log(`Updated task for user ${accepterID}`)
    return task
  } catch (error) {
    console.error('❌ Error updating task status:', error)
    throw new Error('❌ Failed to update task status')
  }
}

export const getCurrentTask = async (accepterID: string) => {
  try {
    const task = await Task.findOne({
      where: { accepterID, status: 'IN_PROCESS' },
      order: [['createdAt', 'DESC']]
    })

    if (!task) {
      console.warn(`⚠️ No active task found for accepter ${accepterID}`)
      return null
    }

    return task
  } catch (error) {
    console.error('❌ Error fetching current task:', error)
    throw new AppError(500, '❌ Failed to fetch current task')
  }
}
