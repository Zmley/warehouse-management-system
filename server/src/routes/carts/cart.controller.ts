import { Request, Response, NextFunction } from 'express'
import { loadByBinCode, unloadByBinCode } from './cart.service'
import { completeTask, getTaskByAccountID } from 'routes/tasks/task.service'

export const load = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { cartID, warehouseID } = res.locals
    const { binCode } = req.body

    const result = await loadByBinCode(binCode, cartID, warehouseID)

    res.status(result.status).json({ success: true, message: result.message })
  } catch (error) {
    next(error)
  }
}

export const unload = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { binCode, unloadProductList } = req.body
    const { warehouseID } = res.locals

    const task = await getTaskByAccountID(res.locals.accountID, warehouseID)

    if (task && task.status === 'IN_PROCESS') {
      if (task.destinationBinCode !== binCode) {
        res.status(400).json({
          success: false,
          message: `❌ You can only unload to your assigned destination bin: ${task.destinationBinCode}`
        })
        return
      }

      const result = await unloadByBinCode(
        binCode,
        unloadProductList,
        warehouseID
      )

      const taskCompletionResult = await completeTask(task.taskID)

      if (!taskCompletionResult) {
        res.status(500).json({
          success: false,
          message: '❌ Failed to complete the task.'
        })
        return
      }

      res.status(200).json({
        success: true,
        message: `✅ ${result} Product(s) successfully unloaded into bin "${binCode}" and task completed.`,
        updatedProducts: result
      })
    } else {
      const result = await unloadByBinCode(
        binCode,
        unloadProductList,
        warehouseID
      )

      res.status(200).json({
        success: true,
        message: `✅ ${result} Product(s) successfully unloaded into bin "${binCode}".`,
        updatedProducts: result
      })
    }
  } catch (error) {
    next(error)
  }
}
