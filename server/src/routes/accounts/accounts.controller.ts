import { Request, Response } from 'express'
import {
  InitiateAuthCommand,
  AuthFlowType,
  CognitoIdentityProviderClient,
  SignUpCommand,
  AdminConfirmSignUpCommand
} from '@aws-sdk/client-cognito-identity-provider'
import env from 'config/config'
import Task from 'routes/tasks/task.model'
import Account from 'routes/accounts/accounts.model'
import { cognitoClient } from 'utils/aws'
import { asyncHandler } from 'utils/asyncHandler'
import AppError from 'utils/appError'
import HttpStatusCodes from 'constants/httpStatus'
import logger from 'utils/logger'
import { getCognitoErrorMessage } from './accounts.service'

export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string }

  try {
    const command = new InitiateAuthCommand({
      AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
      ClientId: env.cognitoClientId,
      AuthParameters: { USERNAME: email, PASSWORD: password }
    })

    const authResponse = await cognitoClient.send(command)
    const result = authResponse.AuthenticationResult

    if (!result?.AccessToken || !result.IdToken || !result.RefreshToken) {
      throw new AppError(
        HttpStatusCodes.UNAUTHORIZED,
        'Invalid credentials',
        'INVALID_CREDENTIALS'
      )
    }

    res.json({
      accessToken: result.AccessToken,
      idToken: result.IdToken,
      refreshToken: result.RefreshToken
    })
  } catch (err) {
    logger.error('Login failed:', err)
    const friendly = getCognitoErrorMessage(err)
    throw new AppError(
      HttpStatusCodes.UNAUTHORIZED,
      friendly || 'Login failed',
      'LOGIN_FAILED'
    )
  }
})

export const registerUser = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, password } = req.body as { email: string; password: string }

    try {
      const client = new CognitoIdentityProviderClient({
        region: env.awsRegion
      })

      const { UserSub: accountID } = await client.send(
        new SignUpCommand({
          ClientId: env.cognitoClientId,
          Username: email,
          Password: password,
          UserAttributes: [{ Name: 'email', Value: email }]
        })
      )

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

      res.json({ message: '✅ User registered successfully', accountID, email })
    } catch (err) {
      logger.error('Register user failed:', err)
      const friendly = getCognitoErrorMessage(err)
      throw new AppError(
        HttpStatusCodes.BAD_REQUEST,
        friendly || 'Register user failed',
        'REGISTER_FAILED'
      )
    }
  }
)

export const getUserInfo = asyncHandler(async (req: Request, res: Response) => {
  const account = res.locals.currentAccount

  const currentTask = await Task.findOne({
    where: { accepterID: account.accountID, status: 'IN_PROCESS' }
  })

  res.json({ ...account, currentTask })
})

export const refreshAccessToken = asyncHandler(
  async (req: Request, res: Response) => {
    const { refreshToken } = req.body as { refreshToken?: string }

    if (!refreshToken) {
      throw new AppError(
        HttpStatusCodes.BAD_REQUEST,
        'Missing refreshToken',
        'MISSING_REFRESH_TOKEN'
      )
    }

    try {
      const command = new InitiateAuthCommand({
        AuthFlow: 'REFRESH_TOKEN_AUTH',
        ClientId: env.cognitoClientId,
        AuthParameters: { REFRESH_TOKEN: refreshToken }
      })

      const response = await cognitoClient.send(command)
      const result = response.AuthenticationResult

      if (!result?.AccessToken || !result.IdToken) {
        throw new AppError(
          HttpStatusCodes.UNAUTHORIZED,
          'Refresh token expired or invalid',
          'INVALID_REFRESH_TOKEN'
        )
      }

      res.json({
        accessToken: result.AccessToken,
        idToken: result.IdToken
      })
    } catch (err) {
      logger.error('Failed to refresh token:', err)
      throw new AppError(
        HttpStatusCodes.UNAUTHORIZED,
        'Refresh token expired or invalid',
        'INVALID_REFRESH_TOKEN'
      )
    }
  }
)
