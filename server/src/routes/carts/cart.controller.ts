import { Request, Response, NextFunction } from 'express'
import {
  loadByBinCode,
  loadByProductCode,
  unloadByBinCode
} from './cart.service'
import * as taskService from 'routes/tasks/task.service'

import { hasActiveTask, updateTaskSourceBin } from 'routes/tasks/task.service'
import { getBinByBinCode } from 'routes/bins/bin.service'
import AppError from 'utils/appError'

export const load = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { cartID, accountID, warehouseID } = res.locals
    const { binCode, productCode, quantity } = req.body

    let result

    if (productCode && typeof quantity === 'number') {
      result = await loadByProductCode(
        productCode,
        quantity,
        cartID
        // accountID,
        // warehouseID
      )
    } else if (binCode) {
      result = await loadByBinCode(binCode, cartID, accountID, warehouseID)

      const activeTask = await hasActiveTask(accountID)

      if (activeTask && activeTask.status === 'IN_PROCESS') {
        const bin = await getBinByBinCode(binCode)

        if (bin?.binID) {
          await updateTaskSourceBin(activeTask.taskID, bin.binID)
        }
      }
    } else {
      throw new AppError(
        400,
        '❌ Invalid parameters: either binCode or productCode + quantity must be provided.'
      )
    }

    res.status(200).json({
      success: true,
      message: result.message
    })
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
    const { warehouseID, accountID } = res.locals

    const task = await taskService.getTaskByAccountID(accountID, warehouseID)

    if (task && task.status === 'IN_PROCESS') {
      if (task.destinationBinCode !== binCode) {
        res.status(400).json({
          success: false,
          message: `❌ You can only unload to your assigned destination bin: ${task.destinationBinCode}`
        })
        return
      }

      const result = await unloadByBinCode(binCode, unloadProductList)

      const taskCompletionResult = await taskService.completeTask(task.taskID)

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
      const result = await unloadByBinCode(binCode, unloadProductList)

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
