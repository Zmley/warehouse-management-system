import HttpStatusCodes from 'constants/httpStatus'

export default class AppError extends Error {
  public readonly httpCode: HttpStatusCodes
  public readonly isOperational: boolean
  public readonly errorCode?: string

  constructor(
    httpCode: HttpStatusCodes,
    message: string,
    errorCode?: string,
    isOperational: boolean = true
  ) {
    super(message)
    this.name = 'AppError'
    Object.setPrototypeOf(this, new.target.prototype)

    this.httpCode = httpCode
    this.errorCode = errorCode
    this.isOperational = isOperational

    Error.captureStackTrace?.(this, AppError)
  }
}
