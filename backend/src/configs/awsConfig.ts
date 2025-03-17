import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider'
import dotenv from 'dotenv'

dotenv.config()

export const awsConfig = {
  region: process.env.AWS_REGION!,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  userPoolId: process.env.COGNITO_USER_POOL_ID!,
  clientId: process.env.COGNITO_CLIENT_ID!
}

export const cognitoClient = new CognitoIdentityProviderClient({
  region: awsConfig.region,
  credentials: {
    accessKeyId: awsConfig.accessKeyId,
    secretAccessKey: awsConfig.secretAccessKey
  }
})

console.log('✅ AWS Cognito Client Initialized Successfully!')
