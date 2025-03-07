import dotenv from 'dotenv'
dotenv.config()
import AWS from 'aws-sdk'
import { Request, Response } from 'express'
import { AuthRequest } from '../middleware/authMiddleware'
import {
  CognitoUser,
  CognitoUserPool,
  CognitoUserAttribute
} from 'amazon-cognito-identity-js'
import User from '../models/User'
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  AuthFlowType
} from '@aws-sdk/client-cognito-identity-provider'



const cognito = new AWS.CognitoIdentityServiceProvider({
  region: process.env.AWS_REGION
})

const poolData = {
  UserPoolId: process.env.COGNITO_USER_POOL_ID as string,
  ClientId: process.env.COGNITO_CLIENT_ID as string
}
const userPool = new CognitoUserPool(poolData)

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION!
})


export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body
  console.log('🟢 Received Login Request:', { email })

  try {
    const params = {
      AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
      ClientId: process.env.COGNITO_CLIENT_ID!,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password
      }
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
    console.error('❌ Cognito Login Error:', error)

    let errorMessage = '❌ Login failed'
    if (error.name === 'NotAuthorizedException') {
      errorMessage = '❌ Incorrect username or password'
    } else if (error.name === 'UserNotFoundException') {
      errorMessage = '❌ User does not exist'
    } else if (error.name === 'UserNotConfirmedException') {
      errorMessage = '❌ User is not confirmed. Please check your email.'
    } else if (error.name === 'PasswordResetRequiredException') {
      errorMessage = '❌ Password reset is required.'
    }

    res.status(401).json({ message: errorMessage })
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
      await User.create({
        accountID: accountID as string,
        email,
        role: 'admin',
        firstName: 'TBD',
        lastName: 'TBD',
        createdAt: new Date()
      })

      console.log(' user information save to datavase:', { accountID, email })

      res.json({
        message: '✅ User registered successfully',
        accountID,
        email
      })
    } catch (dbError: unknown) {
      console.error('❌ user information save to datavase failed:', dbError)
      res.status(500).json({
        message: '❌ Failed to save user to database',
        error: (dbError as Error).message || 'Unknown error'
      })
    }
  })
}

export const confirmUser = (req: Request, res: Response) => {
  const { email, code } = req.body
  console.log('🟢 Received Confirmation Request:', req.body)

  const cognitoUser = new CognitoUser({ Username: email, Pool: userPool })

  cognitoUser.confirmRegistration(code, true, (err, result) => {
    if (err) {
      console.error('❌ Email Confirmation Failed:', err)
      return res
        .status(400)
        .json({ message: '❌ Email confirmation failed', error: err.message })
    }

    console.log('✅ Email Confirmed:', result)
    res.json({ message: '✅ Email confirmed successfully' })
  })
}

export const getUserInfo = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const accountID = req.user?.sub
    if (!accountID) {
      res.status(401).json({ message: '❌ Unauthorized: No User Info' })
      return
    }

    const user = await User.findOne({
      where: { accountID },
      attributes: ['role', 'firstName', 'lastName', 'email']
    })

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
