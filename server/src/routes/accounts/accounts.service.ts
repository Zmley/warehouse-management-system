import Account from './accounts.model'
import { Op, WhereOptions } from 'sequelize'
import { UserRole } from 'constants/index'
import { WorkerRow } from 'types/account'

export const getAccountById = async (accountID: string) => {
  return await Account.findOne({
    where: { accountID },
    attributes: [
      'role',
      'firstName',
      'lastName',
      'email',
      'cartID',
      'warehouseID'
    ]
  })
}

export const getCognitoErrorMessage = (error): string => {
  console.error('❌ Cognito Error:', error)

  switch (error.name) {
    case 'NotAuthorizedException':
      return '❌ Incorrect username or password'
    case 'UserNotFoundException':
      return '❌ User does not exist'
    case 'UserNotConfirmedException':
      return '❌ User is not confirmed. Please check your email.'
    case 'PasswordResetRequiredException':
      return '❌ Password reset is required.'
    default:
      return '❌ Login failed'
  }
}

export const listTransportWorkers = async (params: {
  q?: string
  limit?: number
}): Promise<WorkerRow[]> => {
  const { q, limit = 50 } = params

  const where: WhereOptions<Account> = {
    role: { [Op.in]: [UserRole.TRANSPORT_WORKER] }
  }

  if (q && q.trim()) {
    const kw = `%${q.trim()}%`
    where[Op.or] = [
      { firstName: { [Op.iLike]: kw } },
      { lastName: { [Op.iLike]: kw } }
    ]
  }

  const rows = await Account.findAll({
    attributes: ['accountID', 'firstName', 'lastName'],
    where,
    limit,
    order: [
      ['lastName', 'ASC'],
      ['firstName', 'ASC']
    ]
  })

  return rows.map(r => ({
    accountID: r.accountID,
    firstName: r.firstName,
    lastName: r.lastName,
    name: `${r.firstName} ${r.lastName}`.trim()
  }))
}

////////////

export const changeWarehouseByAccountID = async (
  accountID: string,
  warehouseID: string
) => {
  const account = await Account.findOne({ where: { accountID } })
  if (!account) {
    throw new Error(`Account not found for ID: ${accountID}`)
  }

  account.warehouseID = warehouseID
  await account.save()

  return account
}
