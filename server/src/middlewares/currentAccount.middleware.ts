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
    // Log incoming request and payload
    console.log('Incoming request to currentAccount middleware')
    console.log('Request payload:', res.locals.payload)

    const { payload } = res.locals

    const accountID = payload.sub
    if (!accountID) {
      console.error('❌ Missing user ID in payload')
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        '❌ Unauthorized: Missing user ID'
      )
    }

    console.log('Account ID extracted from payload:', accountID)

    const account = await Account.findOne({ where: { accountID } })
    if (!account) {
      console.error(`❌ Account not found for accountID: ${accountID}`)
      return res
        .status(httpStatus.UNAUTHORIZED)
        .json({ error: '❌ Unauthorized: Account not found' })
    }

    console.log('Account found:', account)

    res.locals.currentAccount = account.dataValues

    res.locals.accountID = account.accountID
    res.locals.role = account.role
    res.locals.cartID = account.cartID
    res.locals.warehouseID = account.warehouseID

    console.log('currentAccount:', res.locals.currentAccount)
    console.log('accountID:', res.locals.accountID)
    console.log('role:', res.locals.role)
    console.log('cartID:', res.locals.cartID)
    console.log('warehouseID:', res.locals.warehouseID)

    next()
  } catch (error) {
    console.error('Error in currentAccount middleware:', error)
    res.status(httpStatus.UNAUTHORIZED).json({ error: error.message })
  }
}

export default currentAccount
