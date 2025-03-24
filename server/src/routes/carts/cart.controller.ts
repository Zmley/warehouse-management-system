import { Request, Response, NextFunction } from 'express'
import { loadCargoHelper, unloadCargoHelper } from './cart.service'
import { getBinByID } from '../bins/bin.service'
import { getTaskUnloadInventory } from '../inventory/inventory.service'
import { getCurrentInProcessTask, completeTask } from '../tasks/task.service'
import { checkIfCartHasCargo } from './cart.service'

import AppError from '../../utils/appError'

export const loadCargo = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { cartID } = res.locals
    const { binID } = req.body

    const result = await loadCargoHelper(binID, cartID)

    const loadBin = await getBinByID(binID)
    const binCode = loadBin.binCode

    res.status(result.status).json({ message: result.message, binCode })
  } catch (error) {
    next(error)
  }
}

export const unloadCargo = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { unloadBinID, productList } = req.body

    const updatedCount = await unloadCargoHelper(unloadBinID, productList)

    const unloadBin = await getBinByID(unloadBinID)
    const binCode = unloadBin.binCode

    res.status(200).json({
      message: `✅ ${updatedCount} Cargo successfully unloaded into ${unloadBinID}.`,
      updatedProducts: updatedCount,
      binCode
    })
  } catch (error) {
    next(error)
  }
}

//unload cargo for the picker and admin task,  unload single product by productCode，unload ALL product by productCode == ALL.
export const unloadTaskCargo = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { binID } = req.body
    const cartID = res.locals.cartID
    const accountID = res.locals.accountID

    const task = await getCurrentInProcessTask(accountID)

    if (binID !== task.destinationBinID) {
      return next(
        new AppError(400, '❌ Please unload to the bin assigned in the task')
      )
    }

    const productCode = task.productCode

    const productList = await getTaskUnloadInventory(cartID, productCode)
    const updatedCount = await unloadCargoHelper(binID, productList)

    await completeTask(task.taskID)

    res.status(200).json({
      message: `${updatedCount} item(s) successfully unloaded into ${binID}`,
      updated: updatedCount
    })
  } catch (error) {
    next(error)
  }
}

export const hasCargoInCar = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const cartID = res.locals.cartID

    const result = await checkIfCartHasCargo(cartID)

    res.status(200).json({
      hasCargoInCar: result.hasCargo,
      inventories: result.inventories
    })
  } catch (error) {
    next(error)
  }
}
