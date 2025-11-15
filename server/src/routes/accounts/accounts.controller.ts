import { Request, Response } from 'express'
import {
  InitiateAuthCommand,
  AuthFlowType
} from '@aws-sdk/client-cognito-identity-provider'
import {
  changeWarehouseByAccountID,
  deleteAccountByAccountID,
  getAllAccountsService,
  getCognitoErrorMessage,
  listTransportWorkers,
  registerAccount
} from './accounts.service'
import env from 'config/config'
import Task from 'routes/tasks/task.model'
import { awsConfig, cognitoClient } from 'utils/aws'
import Warehouse from 'routes/warehouses/warehouse.model'
import { TaskStatus } from 'constants/index'

export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body

  try {
    const params = {
      AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
      ClientId: awsConfig.clientId,
      AuthParameters: { USERNAME: email, PASSWORD: password }
    }

    const command = new InitiateAuthCommand(params)
    const authResponse = await cognitoClient.send(command)

    res.json({
      accessToken: authResponse.AuthenticationResult?.AccessToken,
      idToken: authResponse.AuthenticationResult?.IdToken,
      refreshToken: authResponse.AuthenticationResult?.RefreshToken
    })
  } catch (error) {
    res.status(400).json({ message: getCognitoErrorMessage(error) })
  }
}

export const registerUser = async (req: Request, res: Response) => {
  try {
    const result = await registerAccount(req.body)

    res.json({
      message: 'User registered successfully',
      accountID: result.accountID,
      email: result.email
    })
  } catch (error) {
    console.error('❌ registerUser error:', error)

    if (error.name === 'UsernameExistsException') {
      return res
        .status(400)
        .json({ message: 'User already exists', code: 'USERNAME_EXISTS' })
    }

    if (error.$metadata) {
      return res.status(400).json({
        message: getCognitoErrorMessage(error),
        code: error.name
      })
    }

    return res.status(500).json({
      message: 'Failed to register user',
      code: 'INTERNAL_ERROR'
    })
  }
}

export const getUserInfo = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const account = res.locals.currentAccount

    const currentTask = await Task.findOne({
      where: {
        accepterID: account.accountID,
        status: TaskStatus.IN_PROCESS
      }
    })

    const warehouseCode = (
      await Warehouse.findOne({
        where: { warehouseID: account.warehouseID },
        attributes: ['warehouseCode']
      })
    )?.warehouseCode

    res.json({ ...account, currentTask, warehouseCode })
  } catch (error) {
    console.error('❌ Error fetching user info:', error)
    res.status(500).json({ message: '❌ Internal Server Error' })
  }
}

export const refreshAccessToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.body

  if (!refreshToken) {
    return res.status(400).json({ message: 'Missing refreshToken' })
  }

  try {
    const command = new InitiateAuthCommand({
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      ClientId: env.cognitoClientId,
      AuthParameters: {
        REFRESH_TOKEN: refreshToken
      }
    })

    const response = await cognitoClient.send(command)

    res.json({
      accessToken: response.AuthenticationResult?.AccessToken,
      idToken: response.AuthenticationResult?.IdToken
    })
  } catch (error) {
    console.error('❌ Failed to refresh token:', error)
    res.status(401).json({ message: 'Refresh token expired or invalid' })
  }
}

export async function fetchWorkerNames(req: Request, res: Response) {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q : undefined
    const limit = Number.isFinite(Number(req.query.limit))
      ? Math.max(1, Math.min(200, Number(req.query.limit)))
      : 50

    const workers = await listTransportWorkers({ q, limit })
    res.json({ success: true, workers })
  } catch (err) {
    console.error('[fetchWorkerNames] failed:', err)
    res
      .status(500)
      .json({ success: false, error: 'Failed to fetch worker names' })
  }
}

export const changeWarehouse = async (req: Request, res: Response) => {
  try {
    const { warehouseID } = req.body

    if (!warehouseID) {
      return res.status(400).json({
        success: false,
        message: 'Missing warehouseID'
      })
    }

    const accountID = res.locals.currentAccount.accountID

    const updatedAccount = await changeWarehouseByAccountID(
      accountID,
      warehouseID
    )

    res.json({
      success: true,
      message: 'Warehouse changed successfully',
      account: {
        accountID: updatedAccount.accountID,
        warehouseID: updatedAccount.warehouseID
      }
    })
  } catch (err) {
    console.error('❌ Error changing warehouse:', err)
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to change warehouse'
    })
  }
}

export const getAllAccounts = async (req: Request, res: Response) => {
  try {
    const accounts = await getAllAccountsService()

    return res.json({
      success: true,
      accounts
    })
  } catch (error) {
    console.error('❌ getAllAccounts error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to load accounts'
    })
  }
}

export const deleteAccount = async (req: Request, res: Response) => {
  const { accountID } = req.params

  if (!accountID) {
    return res.status(400).json({ message: 'accountID is required' })
  }

  try {
    const deleted = await deleteAccountByAccountID(accountID)

    if (!deleted) {
      return res.status(404).json({ message: 'Account not found' })
    }

    return res.json({
      message: 'Account deleted successfully',
      accountID
    })
  } catch (err) {
    console.error('❌ deleteAccountByAccountID error:', err)
    return res.status(500).json({
      message: 'Failed to delete account',
      error: err.message
    })
  }
}
