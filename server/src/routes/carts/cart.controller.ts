import { Request, Response } from 'express'
import { getBinByBinCode } from 'routes/bins/bin.service'
import { updateTaskByTaskID } from 'routes/tasks/task.service'
import { TaskStatus } from 'constants/index'
import * as cartService from './cart.service'
import * as taskService from 'routes/tasks/task.service'
import { asyncHandler } from 'utils/asyncHandler'

export const load = asyncHandler(async (req: Request, res: Response) => {
  const { cartID, accountID } = res.locals
  const { binCode, selectedItems, productList } = req.body

  if (productList) {
    const result = await cartService.loadByProductList(
      productList,
      cartID,
      accountID
    )
    res.status(200).json({
      success: true,
      message: result.messages.join('\n')
    })
    return
  }

  if (binCode) {
    await cartService.loadByBinCode(binCode, cartID, selectedItems, accountID)

    const activeTask = await taskService.hasActiveTask(accountID)
    if (activeTask?.status === TaskStatus.IN_PROCESS) {
      const bin = await getBinByBinCode(binCode)
      if (bin?.binID) {
        await taskService.updateTaskSourceBin(activeTask.taskID, bin.binID)
      }
    }

    res.status(200).json({
      success: true
    })
    return
  }
})

export const unload = asyncHandler(async (req: Request, res: Response) => {
  const { binCode, unloadProductList } = req.body
  const { warehouseID, accountID } = res.locals

  const task = await taskService.getTaskByAccountID(accountID, warehouseID)

  if (task) {
    const result = await cartService.unloadByBinCode(
      binCode,
      unloadProductList,
      accountID
    )

    let matchedQuantity: number | undefined
    if (unloadProductList.length === 1)
      matchedQuantity = unloadProductList[0].quantity

    await updateTaskByTaskID({
      taskID: task.taskID,
      quantity: matchedQuantity,
      status: TaskStatus.COMPLETED
    })

    res.status(200).json({
      success: true,
      updatedProducts: result.updatedCount
    })
  } else {
    const result = await cartService.unloadByBinCode(
      binCode,
      unloadProductList,
      accountID
    )
    res.status(200).json({
      success: true,
      updatedProducts: result.updatedCount
    })
  }
})
