import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import axios from 'axios'
import { jwtVerify, importJWK } from 'jose'
import httpContext from 'express-http-context'
import { awsConfig } from '../configs/awsConfig'
import { getCognitoPublicKeysUrl } from '../utils/awsUtil'


export interface AuthRequest extends Request {
  user?: { sub: string };
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization']
  if (!authHeader) {
    res.status(401).json({ message: '❌ Unauthorized: No Token' })
    return 
  }

  const token = authHeader.split(' ')[1]
  if (!token) {
    res.status(401).json({ message: '❌ Unauthorized: Invalid Token Format' })
    return
  }

  try {
    const decodedHeader: any = jwt.decode(token, { complete: true })
    if (!decodedHeader?.header?.kid) {
      res.status(401).json({ message: '❌ Invalid token format' })
      return
    }

    const kid = decodedHeader.header.kid
    const publicKeysUrl = getCognitoPublicKeysUrl(
      awsConfig.userPoolId,
      awsConfig.region
    )

    const { data } = await axios.get(publicKeysUrl)
    const publicKey = data.keys.find((key: any) => key.kid === kid)

    if (!publicKey) {
      res.status(401).json({ message: '❌ Invalid token: Key not found' })
      return
    }

    const key = await importJWK(publicKey, 'RS256')
    const { payload } = await jwtVerify(token, key)

    if (!payload.sub) {
      res.status(401).json({ message: '❌ Invalid token: Missing user ID' })
      return
    }

    req.user = { sub: payload.sub }
    httpContext.set('accountID', payload.sub)

    console.log('✅ Token verified successfully for user:', payload.sub)

    next() 
  } catch (err) {
    console.error('❌ Invalid Token:', err)
    res.status(403).json({ message: '❌ Forbidden: Invalid Token' })
  }
}
