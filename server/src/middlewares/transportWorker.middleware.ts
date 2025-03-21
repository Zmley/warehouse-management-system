import { Request, Response, NextFunction } from 'express'
import AppError from 'utils/appError'

const transportWorkerOnly = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { role } = res.locals

  if (role !== 'TRANSPORT_WORKER') {
    return next(
      new AppError(403, '❌ Only transport workers can use this feature!')
    )
  }

  next()
}

export default transportWorkerOnly
