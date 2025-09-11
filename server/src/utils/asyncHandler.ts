import { Request, Response, NextFunction, RequestHandler } from 'express'

type AsyncHandler<T = void> = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<T>

export const asyncHandler =
  <T>(fn: AsyncHandler<T>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
