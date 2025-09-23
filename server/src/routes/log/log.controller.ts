import { Request, Response } from 'express'
import { asyncHandler } from 'utils/asyncHandler'
import * as logService from './log.service'

export const listBySession = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      accountID,
      workerName,
      keyword,
      start,
      end,
      productCode,
      sourceBinCode,
      destinationBinCode,
      type,
      limit,
      offset
    } = req.query as Record<string, string>

    const parsedLimit =
      typeof limit === 'string' && limit.trim() !== ''
        ? Math.max(0, Number(limit))
        : undefined

    const parsedOffset =
      typeof offset === 'string' && offset.trim() !== ''
        ? Math.max(0, Number(offset))
        : undefined

    const typeNorm =
      type &&
      (type.toUpperCase() === 'INVENTORY' || type.toUpperCase() === 'PICK_UP')
        ? (type.toUpperCase() as 'INVENTORY' | 'PICK_UP')
        : undefined

    const result = await logService.listSessionsEnriched({
      accountID: accountID || undefined,
      workerName: workerName || undefined,
      keyword: keyword || undefined,
      start: start || undefined,
      end: end || undefined,
      productCode: productCode || undefined,
      sourceBinCode: sourceBinCode || undefined,
      destinationBinCode: destinationBinCode || undefined,
      type: typeNorm,
      limit: parsedLimit,
      offset: parsedOffset
    })

    res.status(200).json({ success: true, ...result })
  }
)
