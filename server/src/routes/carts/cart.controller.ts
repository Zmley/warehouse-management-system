import { Request, Response, NextFunction } from 'express'
import {
  loadProductByBinCode as loadByBinCode,
  unloadProductListToBinByWoker as unloadToBinByWoker
} from './cart.service'

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

    const result = await unloadToBinByWoker(
      binCode,
      unloadProductList,
      warehouseID
    )

    res.status(200).json({
      success: true,
      message: `✅ ${result} Product(s) successfully unloaded into bin "${binCode}"`,
      updatedProducts: result
    })
  } catch (error) {
    next(error)
  }
}
