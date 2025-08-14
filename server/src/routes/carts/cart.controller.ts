import { Request, Response, NextFunction } from 'express'
import * as cartService from './cart.service'
import * as taskService from 'routes/tasks/task.service'
import { getBinByBinCode } from 'routes/bins/bin.service'
import AppError from 'utils/appError'
import { SourceBinItem } from 'types/bin'
import { updateTaskByTaskID } from 'routes/tasks/task.service'

export const load = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { cartID, accountID, warehouseID } = res.locals
    const { binCode, selectedItems, productList } = req.body

    if (productList && Array.isArray(productList)) {
      let resultMessage = ''

      for (const item of productList) {
        const res = await cartService.loadByProductCode(
          item.productCode,
          item.quantity,
          cartID
        )
        resultMessage += res.message + '\n'
      }

      res.status(200).json({
        success: true,
        message: resultMessage.trim()
      })
      return
    }

    if (binCode) {
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

      const result = await cartService.loadByBinCode(
        binCode,
        cartID,
        accountID,
        warehouseID,
        selectedItems
      )

      const activeTask = await taskService.hasActiveTask(accountID)
      if (activeTask?.status === 'IN_PROCESS') {
        const bin = await getBinByBinCode(binCode)
        if (bin?.binID) {
          await taskService.updateTaskSourceBin(activeTask.taskID, bin.binID)
        }
      }

      res.status(200).json({
        success: true,
        message: result.message
      })
      return
    }

    throw new AppError(
      400,
      '❌ Invalid request: must include productList or binCode.'
    )
  } catch (error) {
    next(error)
  }
}

// export const unload = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   try {
//     const { binCode, unloadProductList } = req.body
//     const { warehouseID, accountID } = res.locals

//     const task = await taskService.getTaskByAccountID(accountID, warehouseID)

//     if (task) {
//       if (
//         task.destinationBinCode !== binCode &&
//         task.sourceBinCode !== binCode
//       ) {
//         res.status(400).json({
//           success: false,
//           message: `❌ You can only unload to your assigned destinatione: ${task.destinationBinCode} or source: ${task.sourceBinCode}`
//         })
//         return
//       }

//       const result = await cartService.unloadByBinCode(
//         binCode,
//         unloadProductList
//       )

//       let matchedQuantity: number | undefined

//       if (unloadProductList.length === 1) {
//         matchedQuantity = unloadProductList[0].quantity
//       }

//       await updateTaskByTaskID({
//         taskID: task.taskID,
//         quantity: matchedQuantity,
//         status: 'COMPLETED'
//       })

//       res.status(200).json({
//         success: true,
//         message: `✅ ${result} Product(s) successfully unloaded into bin "${binCode}" and task completed.`,
//         updatedProducts: result
//       })
//     } else {
//       const result = await cartService.unloadByBinCode(
//         binCode,
//         unloadProductList
//       )

//       res.status(200).json({
//         success: true,
//         message: `✅ ${result} Product(s) successfully unloaded into bin "${binCode}".`,
//         updatedProducts: result
//       })
//     }
//   } catch (error) {
//     next(error)
//   }
// }

// controller.ts
export const unload = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { binCode, unloadProductList } = req.body as {
      binCode: string
      unloadProductList: {
        inventoryID: string
        quantity: number
        merge?: boolean
        /** 当 merge=true 时可指定合并到 bin 内的哪一条记录 */
        targetInventoryID?: string
      }[]
    }
    const { warehouseID, accountID } = res.locals

    const task = await taskService.getTaskByAccountID(accountID, warehouseID)

    if (task) {
      if (
        task.destinationBinCode !== binCode &&
        task.sourceBinCode !== binCode
      ) {
        res.status(400).json({
          success: false,
          message: `❌ You can only unload to your assigned destination: ${task.destinationBinCode} or source: ${task.sourceBinCode}`
        })
        return
      }

      const result = await cartService.unloadByBinCode(
        binCode,
        unloadProductList
      )

      let matchedQuantity: number | undefined
      if (unloadProductList.length === 1)
        matchedQuantity = unloadProductList[0].quantity

      await updateTaskByTaskID({
        taskID: task.taskID,
        quantity: matchedQuantity,
        status: 'COMPLETED'
      })

      res.status(200).json({
        success: true,
        message: `✅ ${result.updatedCount} product(s) successfully unloaded into bin "${binCode}" and task completed.`,
        updatedProducts: result.updatedCount
      })
    } else {
      const result = await cartService.unloadByBinCode(
        binCode,
        unloadProductList
      )
      res.status(200).json({
        success: true,
        message: `✅ ${result.updatedCount} product(s) successfully unloaded into bin "${binCode}".`,
        updatedProducts: result.updatedCount
      })
    }
  } catch (error) {
    next(error)
  }
}
