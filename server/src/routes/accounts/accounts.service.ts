import Account from './accounts.model'
import { Op, WhereOptions } from 'sequelize'
import { UserRole } from 'constants/index'
import { WorkerRow } from 'types/account'
import Warehouse from 'routes/warehouses/warehouse.model'
import Bin from 'routes/bins/bin.model'
import {
  AdminConfirmSignUpCommand,
  AdminDeleteUserCommand,
  SignUpCommand
} from '@aws-sdk/client-cognito-identity-provider'
import { awsConfig, cognitoClient } from 'utils/aws'
import { createCart } from 'routes/bins/bin.service'

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
    case 'InvalidPasswordException':
      return '❌ Password does not meet the required criteria.'
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

export const getAllAccountsService = async () => {
  const accounts = await Account.findAll({
    include: [
      {
        model: Warehouse,
        as: 'currentWarehouse',
        attributes: ['warehouseID', 'warehouseCode']
      },

      {
        model: Bin,
        as: 'cart',
        attributes: ['binID', 'binCode']
      }
    ],
    order: [['createdAt', 'DESC']]
  })

  return accounts
}

export const deleteAccountByAccountID = async (accountID: string) => {
  const account = await Account.findOne({ where: { accountID } })
  if (!account) return false

  const email = account.email
  const cartID = account.cartID

  try {
    const deleteCmd = new AdminDeleteUserCommand({
      UserPoolId: awsConfig.userPoolId,
      Username: email
    })
    await cognitoClient.send(deleteCmd)
  } catch (err) {
    console.error('❌ Failed to delete Cognito user:', err)
  }

  if (cartID) {
    try {
      await Bin.destroy({
        where: { binID: cartID }
      })
      console.log(`🗑️ Deleted Cart Bin: ${cartID}`)
    } catch (err) {
      console.error('❌ Failed to delete Cart Bin:', err)
    }
  }

  const deleted = await Account.destroy({
    where: { accountID }
  })

  return deleted > 0
}

export const registerAccount = async (payload: {
  email: string
  password: string
  role: UserRole
  firstName: string
  lastName: string
  warehouseID: string
}) => {
  const { email, password, role, firstName, lastName, warehouseID } = payload

  const signUpCommand = new SignUpCommand({
    ClientId: awsConfig.clientId,
    Username: email,
    Password: password,
    UserAttributes: [{ Name: 'email', Value: email }]
  })

  const signUpResponse = await cognitoClient.send(signUpCommand)
  const accountID = signUpResponse.UserSub

  const confirmCommand = new AdminConfirmSignUpCommand({
    UserPoolId: awsConfig.userPoolId,
    Username: email
  })

  await cognitoClient.send(confirmCommand)

  let cartID: string | null = null

  if (role === UserRole.TRANSPORT_WORKER) {
    cartID = await createCart(firstName, lastName, warehouseID)
  }

  await Account.create({
    accountID,
    email,
    role,
    firstName,
    lastName,
    warehouseID,
    cartID
  })

  return {
    accountID,
    email
  }
}
