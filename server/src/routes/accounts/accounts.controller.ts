import { Request, Response } from 'express'
import {
  InitiateAuthCommand,
  AuthFlowType,
  CognitoIdentityProviderClient,
  SignUpCommand,
  AdminConfirmSignUpCommand
} from '@aws-sdk/client-cognito-identity-provider'
import { getCognitoErrorMessage } from './accounts.service'
import env from 'config/config'
import Task from 'routes/tasks/task.model'
import Account from 'routes/accounts/accounts.model'

import { cognitoClient } from 'utils/aws'

// export const cognitoClient = new CognitoIdentityProviderClient({
//   region: process.env.AWS_REGION!
// })
//改pr你在aws.ts文件里也有一个cognitoClient，你看下能不能用同一个

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
