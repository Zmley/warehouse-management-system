import AWS from "aws-sdk";
import { CognitoUserPool } from "amazon-cognito-identity-js";
import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";


export const cognito = new AWS.CognitoIdentityServiceProvider({
  region: process.env.AWS_REGION,
});

const poolData = {
  UserPoolId: process.env.COGNITO_USER_POOL_ID as string,
  ClientId: process.env.COGNITO_CLIENT_ID as string,
};
export const userPool = new CognitoUserPool(poolData);

export const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION!,
});


export const getCognitoPublicKeysUrl = (userPoolId: string, region: string) => {
    return `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;
  };


