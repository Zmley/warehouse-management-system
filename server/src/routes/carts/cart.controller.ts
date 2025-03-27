import { Request, Response, NextFunction } from 'express'
import {
  loadProductByBinCode,
  unloadProductListToBinByWoker,
  unloadProductToBin
} from './cart.service'
import { getBinByBinID } from '../bins/bin.service'
import { getCurrentInProcessTask, completeTask } from '../tasks/task.service'
import AppError from 'utils/appError'
import Bin from '../bins/bin.model'
import { getInProcessTaskWithBinCodes } from '../tasks/task.service'

export const loadProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { cartID, warehouseID, accountID } = res.locals
    const { binCode } = req.body

    let isAllowed = true

    try {
      const task = await getInProcessTaskWithBinCodes(accountID, warehouseID)

      const sourceBinCode: string[] = task.sourceBinCode || []

      if (!sourceBinCode.includes(binCode)) {
        isAllowed = false
        throw new AppError(
          400,
          `❌ This bin (${binCode}) is not allowed for the current task.`
        )
      }
    } catch (err: any) {
      if (err instanceof AppError && err.httpCode === 404) {
        console.log('⚠️ No active task, continuing with normal load.')
      } else {
        return next(err)
      }
    }

    if (!isAllowed) return

    const result = await loadProductByBinCode(binCode, cartID, warehouseID)

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
    const { binCode, unloadProductList } = req.body
    const { warehouseID, accountID } = res.locals
    let task = null
    try {
      task = await getInProcessTaskWithBinCodes(accountID, warehouseID)
    } catch (err) {
      console.warn('⚠️ No active task, proceeding with normal unload...')
    }
    if (task && task.destinationBinCode?.length > 0) {
      const allowedBinCodes = task.destinationBinCode

      if (!allowedBinCodes.includes(binCode)) {
        return void res.status(400).json({
          message: `❌ You can only unload to your assigned destination bin(s): ${allowedBinCodes.join(
            ', '
          )}`
        })
      }
    }

    const result = await unloadProductListToBinByWoker(
      binCode,
      unloadProductList,
      warehouseID
    )

    if (task) {
      await completeTask(task.taskID)
    }

    return void res.status(200).json({
      message: `${result} product(s) successfully unloaded into bin "${binCode}"`,
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
    const { binCode } = req.body
    const cartID = res.locals.cartID
    const accountID = res.locals.accountID
    const warehouseID = res.locals.warehouseID

    const task = await getCurrentInProcessTask(accountID)
    const { productCode, destinationBinID } = task

    const destinationBin = await Bin.findOne({
      where: {
        warehouseID,
        binCode
      }
    })

    if (destinationBin.binID !== destinationBinID) {
      throw new AppError(
        400,
        '❌ Please unload to the bin assigned in the task'
      )
    }

    const result = await unloadProductToBin({
      cartID,
      productCode,
      binCode,
      warehouseID
    })

    if (result === 0) {
      throw new AppError(404, '❌ No matching inventory to unload to this bin')
    }

    await completeTask(task.taskID)

    res.status(200).json({
      message: `${result} item(s) successfully unloaded into ${binCode}`,
      updatedProducts: result
    })
  } catch (error) {
    next(error)
  }
}

export const getCarCode = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const cartID = res.locals.cartID

    const bin = await getBinByBinID(cartID)

    res.status(200).json({
      binCode: bin.binCode
    })
  } catch (error) {
    next(error)
  }
}
