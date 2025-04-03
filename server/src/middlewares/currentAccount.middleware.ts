import { Request, Response, NextFunction } from 'express'
import httpStatus from 'http-status'
import Account from 'routes/accounts/accounts.model'
import AppError from 'utils/appError'

const currentAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { payload } = res.locals

    const accountID = payload.sub
    if (!accountID) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        '❌ Unauthorized: Missing user ID'
      )
    }

    const account = await Account.findOne({ where: { accountID } })
    if (!account) {
      return res
        .status(httpStatus.UNAUTHORIZED)
        .json({ error: '❌ Unauthorized: Account not found' })
    }

    console.log('currentAccount:', res.locals.currentAccount)
    console.log('accountID:', res.locals.accountID)
    console.log('role:', res.locals.role)
    console.log('cartID:', res.locals.cartID)
    console.log('warehouseID:', res.locals.warehouseID)

    res.locals.currentAccount = account.dataValues

    res.locals.accountID = account.accountID
    res.locals.role = account.role
    res.locals.cartID = account.cartID
    res.locals.warehouseID = account.warehouseID

    next()
  } catch (error) {
    res.status(httpStatus.UNAUTHORIZED).json({ error: error.message })
  }
}

export default currentAccount
