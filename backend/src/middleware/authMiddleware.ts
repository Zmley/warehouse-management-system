import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import axios from 'axios'; // To fetch the JWK
import { jwtVerify, importJWK } from 'jose'; // Correct import from jose for jwtVerify and importJWK
import { awsConfig } from '../config/awsConfig'; // Import the awsConfig

export interface AuthRequest extends Request {
  user?: any; // To store decoded user info
}

// Cognito public key URL
const getCognitoPublicKeysUrl = (userPoolId: string, region: string) => {
  return `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;
};

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization']; // Get authorization header
  if (!authHeader) {
    return res.status(401).json({ message: '❌ Unauthorized: No Token' });
  }

  const token = authHeader.split(' ')[1]; // Extract token from Bearer Token
  if (!token) {
    return res.status(401).json({ message: '❌ Unauthorized: Invalid Token Format' });
  }

  try {
    const decodedHeader: any = jwt.decode(token, { complete: true });
    if (!decodedHeader?.header?.kid) {
      return res.status(401).json({ message: '❌ Invalid token format' });
    }

    const kid = decodedHeader.header.kid; // Get the kid (Key ID) from the token header
    const publicKeysUrl = getCognitoPublicKeysUrl(awsConfig.userPoolId, awsConfig.region);

    // Fetch Cognito public keys
    const { data } = await axios.get(publicKeysUrl);
    const publicKey = data.keys.find((key: any) => key.kid === kid); // Find the matching key by kid

    if (!publicKey) {
      return res.status(401).json({ message: '❌ Invalid token: Key not found' });
    }

    // Use importJWK to get the key and verify the JWT
    const key = await importJWK(publicKey, 'RS256');
    const { payload } = await jwtVerify(token, key);

    req.user = { sub: payload.sub }; // Store user ID (sub) in the request

    console.log("✅ Token verified successfully for user:", payload.sub); // Log the user ID

    next(); // Proceed to the next middleware
  } catch (err) {
    console.error('❌ Invalid Token:', err);
    return res.status(403).json({ message: '❌ Forbidden: Invalid Token' });
  }
};