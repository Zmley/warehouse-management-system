import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import axios from 'axios'
import { jwtVerify, importJWK } from 'jose'
import httpContext from 'express-http-context'
import { awsConfig } from '../configs/awsConfig'
import { getCognitoPublicKeysUrl } from '../utils/awsUtil'

export interface AuthRequest extends Request {
  user?: { sub: string }
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization']
  if (!authHeader) {
    return res.status(401).json({ message: '❌ Unauthorized: No Token' })
  }

  const token = authHeader.split(' ')[1]
  if (!token) {
    return res
      .status(401)
      .json({ message: '❌ Unauthorized: Invalid Token Format' })
  }

  try {
    const decodedHeader: any = jwt.decode(token, { complete: true })
    if (!decodedHeader?.header?.kid) {
      return res.status(401).json({ message: '❌ Invalid token format' })
    }

    const kid = decodedHeader.header.kid
    const publicKeysUrl = getCognitoPublicKeysUrl(
      awsConfig.userPoolId,
      awsConfig.region
    )

    const { data } = await axios.get(publicKeysUrl)
    const publicKey = data.keys.find((key: any) => key.kid === kid)

    if (!publicKey) {
      return res
        .status(401)
        .json({ message: '❌ Invalid token: Key not found' })
    }

    const key = await importJWK(publicKey, 'RS256')
    const { payload } = await jwtVerify(token, key)

    if (!payload.sub) {
      return res
        .status(401)
        .json({ message: '❌ Invalid token: Missing user ID' })
    }

    req.user = { sub: payload.sub }

    httpContext.set('accountID', payload.sub)

    console.log('✅ Token verified successfully for user:', payload.sub)

    next()
  } catch (err) {
    console.error('❌ Invalid Token:', err)
    return res.status(403).json({ message: '❌ Forbidden: Invalid Token' })
  }
}
