import { Request, Response, NextFunction } from 'express'
import AppError from 'utils/appError'

const pickerOnly = (req: Request, res: Response, next: NextFunction) => {
  const { role } = res.locals

  if (role !== 'PICKER') {
    return next(new AppError(403, '❌ Only pickers can use this feature!'))
  }

  next()
}

export default pickerOnly
