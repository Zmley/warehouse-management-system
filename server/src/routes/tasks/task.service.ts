import Task from './task.model'
import AppError from '../../utils/appError'

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
