import { Request, Response, NextFunction } from 'express'
import * as cartService from './cart.service'
import * as taskService from 'routes/tasks/task.service'
import { getBinByBinCode } from 'routes/bins/bin.service'
import AppError from 'utils/appError'
import { SourceBinItem } from 'types/bin'

export const load = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { cartID, accountID, warehouseID } = res.locals
    const { binCode, productCode, quantity } = req.body

    let result

    if (productCode) {
      result = await cartService.loadByProductCode(
        productCode,
        quantity,
        cartID
      )
    } else if (binCode) {
      const currentTask = await taskService.getTaskByAccountID(
        accountID,
        warehouseID
      )

      if (currentTask) {
        const sourceBinCodes = currentTask.sourceBins.map(
          (item: SourceBinItem) => item.bin?.binCode
        )

        if (!sourceBinCodes.includes(binCode)) {
          throw new AppError(
            403,
            `❌ You can only load from assigned bins: ${sourceBinCodes.join(
              ', '
            )}`
          )
        }
      }

      result = await cartService.loadByBinCode(
        binCode,
        cartID,
        accountID,
        warehouseID
      )

      const activeTask = await taskService.hasActiveTask(accountID)
      if (activeTask?.status === 'IN_PROCESS') {
        const bin = await getBinByBinCode(binCode)
        if (bin?.binID) {
          await taskService.updateTaskSourceBin(activeTask.taskID, bin.binID)
        }
      }
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
        //改pr 为啥这里不是return   res.status(400).json({
        //   success: false,
        //   message: `❌ You can only unload to your assigned destination bin: ${task.destinationBinCode}`
        // })
      }

      const result = await cartService.unloadByBinCode(
        binCode,
        unloadProductList
      )

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
      const result = await cartService.unloadByBinCode(
        binCode,
        unloadProductList
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
