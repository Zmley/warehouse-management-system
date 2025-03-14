import { Request, Response, NextFunction } from 'express'

import httpStatus from 'http-status'
import AppError from 'utils/appError'

const currentUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    next()
  } catch (error) {
    res.status(httpStatus.UNAUTHORIZED).json({ error: error.message })
    throw new AppError(httpStatus.UNAUTHORIZED, error)
  }
}

export default currentUser
