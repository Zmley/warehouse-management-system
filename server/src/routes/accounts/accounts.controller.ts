import { Request, Response } from 'express'
import {
  InitiateAuthCommand,
  AuthFlowType,
  CognitoIdentityProviderClient,
  SignUpCommand,
  AdminConfirmSignUpCommand
} from '@aws-sdk/client-cognito-identity-provider'
import {
  getCognitoErrorMessage,
  listTransportWorkers
} from './accounts.service'
import env from 'config/config'
import Task from 'routes/tasks/task.model'
import Account from 'routes/accounts/accounts.model'
import { cognitoClient } from 'utils/aws'

export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body

  try {
    const params = {
      AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
      ClientId: env.cognitoClientId,
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
  const { email, password } = req.body

  const client = new CognitoIdentityProviderClient({ region: 'us-east-2' })

  const command = new SignUpCommand({
    ClientId: env.cognitoClientId,
    Username: email,
    Password: password,
    UserAttributes: [
      {
        Name: 'email',
        Value: email
      }
    ]
  })

  const { UserSub: accountID } = await client.send(command)

  await client.send(
    new AdminConfirmSignUpCommand({
      UserPoolId: env.cognitoUserPoolId,
      Username: email
    })
  )
  await Account.create({
    accountID: accountID as string,
    email,
    role: 'ADMIN',
    firstName: 'TBD',
    lastName: 'TBD',
    createdAt: new Date(),
    updatedAt: new Date()
  })

  console.log('✅ User information saved to database:', {
    accountID,
    email
  })
  res.json({ message: '✅ User registered successfully', accountID, email })
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
        status: 'IN_PROCESS'
      }
    })
    res.json({ ...account, currentTask })
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
