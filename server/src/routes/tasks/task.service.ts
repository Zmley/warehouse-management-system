import Task from './task.model'
import AppError from '../../utils/appError'

export const hasActiveTask = async (accountID: string): Promise<boolean> => {
  try {
    const activeTask = await Task.findOne({
      where: { accepterID: accountID, status: 'IN_PROCESS' }
    })

    return activeTask !== null
  } catch (error) {
    console.error('Error checking active task:', error)
    throw new AppError(500, 'Error checking active task')
  }
}

export const createTask = async (
  sourceBinID: string,
  destinationBinID: string,
  productList: any,
  accountID: string
) => {
  const existingTask = await checkBinAvailability(sourceBinID)

  if (existingTask) {
    throw new AppError(409, 'Source Bin is in task')
  }

  const task = await Task.create({
    sourceBinID,
    destinationBinID,
    creatorID: accountID,
    productID: JSON.stringify(productList),
    status: 'PENDING'
  })
  return task
}

export const acceptTaskService = async (accountID: string, taskID: string) => {
  const isActive = await hasActiveTask(accountID)
  if (isActive) {
    throw new AppError(409, 'You already have an active task in progress.')
  }

  const task = await Task.findOne({ where: { taskID } })

  if (task.status !== 'PENDING') {
    throw new AppError(400, 'Task is already in progress')
  }

  task.accepterID = accountID
  task.status = 'IN_PROCESS'
  await task.save()

  return task
}

export const checkBinAvailability = async (sourceBinID: string) => {
  const existingTask = await Task.findOne({
    where: { sourceBinID, status: 'IN_PROCESS' }
  })

  return existingTask
}
