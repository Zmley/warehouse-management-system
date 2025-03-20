import { Request, Response, NextFunction } from 'express'
import {
  loadCargoHelper,
  unloadCargoHelper,
  hasCargoInCar
} from './transport.service'
import AppError from '../../utils/appError'

export const loadCargo = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { role, cartID } = res.locals
    const { binID } = req.body

    if (role !== 'TRANSPORT_WORKER') {
      return next(new AppError(403, '❌ Only transport workers can use a car'))
    }

    const hasCargo = await hasCargoInCar(cartID)
    if (hasCargo) {
      return next(new AppError(400, '❌ you have cargo in your using car!'))
    }

    const result = await loadCargoHelper(binID, cartID)

    res.status(result.status).json({ message: result.message })
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

    if (updatedCount === 0) {
      return next(new AppError(404, '❌ No matching products found to update'))
    }

    res.status(200).json({
      message: `✅ ${updatedCount} Cargo successfully unloaded into ${unloadBinID}.`,
      updatedProducts: updatedCount
    })
  } catch (error) {
    next(error)
  }
}
