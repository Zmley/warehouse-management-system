import Task from './task.model'
import AppError from '../../utils/appError'

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
