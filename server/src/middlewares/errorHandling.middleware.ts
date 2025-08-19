// src/middlewares/errorHandling.ts
import { Request, Response, NextFunction } from 'express'
import HttpStatusCodes from 'constants/httpStatus'
import AppError from 'utils/appError'
import { isCelebrateError } from 'celebrate'

const errorHandling = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  if (isCelebrateError(err)) {
    const bodyError = err.details.get('body')
    const queryError = err.details.get('query')
    const paramsError = err.details.get('params')
    const first =
      bodyError?.details?.[0] ||
      queryError?.details?.[0] ||
      paramsError?.details?.[0]

    return res.status(HttpStatusCodes.BAD_REQUEST).json({
      success: false,
      errorCode: 'VALIDATION_FAILED',
      details: first
        ? {
            message: first.message,
            path: first.path,
            type: first.type
          }
        : undefined
    })
  }

  if (err instanceof AppError) {
    return res.status(err.httpCode ?? HttpStatusCodes.BAD_REQUEST).json({
      success: false,
      errorCode: err.errorCode ?? 'APP_ERROR'
    })
  }

  console.error('Unhandled error:', err)
  return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
    success: false,
    errorCode: 'INTERNAL_SERVER_ERROR'
  })
}

export default errorHandling
