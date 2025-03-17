import dotenv from 'dotenv'
dotenv.config()
import { Request, Response } from 'express'
import httpContext from 'express-http-context'
import { CognitoUser, CognitoUserAttribute } from 'amazon-cognito-identity-js'
import {
  InitiateAuthCommand,
  AuthFlowType
} from '@aws-sdk/client-cognito-identity-provider'
import { userPool, cognitoClient } from '../../utils/awsUtil'
import { getCognitoErrorMessage } from '../../utils/errorUtil'
import { getUserByAccountID } from '../../utils/accountUtil'
import account from '../../models/account'

export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body
  console.log('🟢 Received Login Request:', { email })

  try {
    const params = {
      AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
      ClientId: process.env.COGNITO_CLIENT_ID!,
      AuthParameters: { USERNAME: email, PASSWORD: password }
    }

    const command = new InitiateAuthCommand(params)
    const authResponse = await cognitoClient.send(command)

    console.log('✅ Cognito Auth Success:', authResponse.AuthenticationResult)
    res.json({
      accessToken: authResponse.AuthenticationResult?.AccessToken,
      idToken: authResponse.AuthenticationResult?.IdToken,
      refreshToken: authResponse.AuthenticationResult?.RefreshToken
    })
  } catch (error: any) {
    res.status(401).json({ message: getCognitoErrorMessage(error) })
  }
}

export const registerUser = async (req: Request, res: Response) => {
  const { email, password } = req.body
  console.log('🟢 Received Registration Request:', req.body)

  const attributeList = [
    new CognitoUserAttribute({ Name: 'email', Value: email })
  ]

  userPool.signUp(email, password, attributeList, [], async (err, result) => {
    if (err) {
      console.error('❌ Registration Failed:', err)
      return res
        .status(400)
        .json({ message: '❌ Registration failed', error: err.message })
    }

    console.log('✅ Registration Successful:', result)
    const accountID = result?.userSub

    try {
      await account.create({
        accountID: accountID as string,
        email,
        role: 'ADMIN',
        firstName: 'TBD',
        lastName: 'TBD',
        createdAt: new Date()
      })

      console.log('✅ User information saved to database:', {
        accountID,
        email
      })
      res.json({ message: '✅ User registered successfully', accountID, email })
    } catch (dbError: unknown) {
      console.error('❌ User information save to database failed:', dbError)
      res.status(500).json({
        message: '❌ Failed to save user to database',
        error: (dbError as Error).message || 'Unknown error'
      })
    }
  })
}

export const getUserInfo = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const accountID = httpContext.get('accountID')

    if (!accountID) {
      res.status(401).json({ message: '❌ Unauthorized: No User Info' })
      return
    }

    const user = await getUserByAccountID(accountID)
    if (!user) {
      res.status(404).json({ message: '❌ User not found' })
      return
    }

    res.json({ user })
  } catch (error) {
    console.error('❌ Error fetching user info:', error)
    res.status(500).json({ message: '❌ Internal Server Error' })
  }
}
