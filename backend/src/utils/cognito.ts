import AWS from 'aws-sdk';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';

const cognito = new AWS.CognitoIdentityServiceProvider({
  region: process.env.AWS_REGION,
});

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION!,
});

export { cognito, cognitoClient };