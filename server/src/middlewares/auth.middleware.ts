import { Request, Response, NextFunction } from 'express'
import { verify, decode, JwtPayload } from 'jsonwebtoken'
import axios from 'axios'
import jwkToPem from 'jwk-to-pem'
import { awsConfig, getCognitoPublicKeysUrl } from 'utils/aws'

const getJwks = async () => {
  let cachedJwks
  let lastFetchTime = 0
  const JWKS_CACHE_TTL = 5 * 60 * 1000

  const now = Date.now()
  if (!cachedJwks || now - lastFetchTime > JWKS_CACHE_TTL) {
    const url = getCognitoPublicKeysUrl(awsConfig.userPoolId, awsConfig.region)
    const { data } = await axios.get(url)
    cachedJwks = data.keys
    lastFetchTime = now
    console.log('✅ JWKS fetched:', cachedJwks)
  }
  return cachedJwks
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization']

  console.log('test:       test if arrive header      check')

  if (!authHeader) {
    console.log('❌ No Authorization Header')
    return res.status(401).json({ message: '❌ Unauthorized: No Token' })
  }

  console.log('test:       test if call        check')

  const token = authHeader.split(' ')[1]
  if (!token) {
    console.log('❌ Invalid Token Format')
    return res
      .status(401)
      .json({ message: '❌ Unauthorized: Invalid Token Format' })
  }

  try {
    const decoded = decode(token, { complete: true })
    console.log('🔑 Decoded Token:', decoded)
    if (!decoded?.header?.kid) {
      console.log('❌ Invalid token format, missing kid')
      return res.status(401).json({ message: '❌ Invalid token format' })
    }

    console.log('test:       test if call        check1')

    const keys = await getJwks()
    console.log('🔑 JWKS Keys:', keys)
    const jwk = keys.find(key => key.kid === decoded.header.kid)
    if (!jwk) {
      console.log('❌ Key not found for the token')
      return res
        .status(401)
        .json({ message: '❌ Invalid token: Key not found' })
    }

    console.log('test:       test if call        check2')

    const pem = jwkToPem(jwk)
    console.log(' PEM:', pem)

    const payload = verify(token, pem, { algorithms: ['RS256'] }) as JwtPayload
    console.log(' Verified Token Payload:', payload)

    if (!payload.sub) {
      console.log('❌ Missing user ID in token')
      return res
        .status(401)
        .json({ message: '❌ Invalid token: Missing user ID' })
      console.log('test:       test if call        check3')
    }

    console.log('test:              check')

    res.locals.payload = payload
    console.log('✅ Token validated successfully')

    next()
  } catch (err) {
    console.error('❌ Invalid Token:', err)
    return res.status(403).json({ message: '❌ Forbidden: Invalid Token' })
  }
}

export default authenticateToken
