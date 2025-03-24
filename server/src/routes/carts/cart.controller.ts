import { Request, Response, NextFunction } from 'express'
import {
  loadProductByBinID,
  unloadProductToBinByWoker,
  unloadProductToBin
} from './cart.service'
import { getCurrentInProcessTask, completeTask } from '../tasks/task.service'
import AppError from 'utils/appError'

export const loadProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { cartID } = res.locals
    const { binID } = req.body

    const result = await loadProductByBinID(binID, cartID)

    res.status(result.status).json({ message: result.message })
  } catch (error) {
    next(error)
  }
}

export const unloadProductByWoker = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get the binID and the list of products to unload(each product has inventoryID and quantity that needs to be unloaded)
    const { binID, unloadInventoryList } = req.body

    const result = await unloadProductToBinByWoker(binID, unloadInventoryList)

    res.status(200).json({
      message: `✅ ${result} Product successfully unloaded into ${binID}.`,
      updatedProducts: result
    })
  } catch (error) {
    next(error)
  }
}

export const unloadProductByTask = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { binID } = req.body
    const cartID = res.locals.cartID
    const accountID = res.locals.accountID

    const task = await getCurrentInProcessTask(accountID)

    const { productCode, destinationBinID } = task
    if (binID !== destinationBinID) {
      throw new AppError(
        400,
        '❌ Please unload to the bin assigned in the task'
      )
    }

    const result = await unloadProductToBin({
      binID,
      cartID,
      productCode
    })

    if (result.length === 0) {
      throw new AppError(404, '❌ No matching inventory unload to this bin')
    }

    await completeTask(task.taskID)

    res.status(200).json({
      message: `${result} item(s) successfully unloaded into ${binID}`,
      updatedProducts: result
    })
  } catch (error) {
    next(error)
  }
}
