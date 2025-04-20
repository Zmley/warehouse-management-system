import { Request, Response, NextFunction } from 'express'
import AppError from '../utils/appError'

const roleAllow = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { role } = res.locals

    if (!allowedRoles.includes(role)) {
      return next(new AppError(403, '❌ Access denied for your role.'))
    }

    next()
  }
}

export default roleAllow
