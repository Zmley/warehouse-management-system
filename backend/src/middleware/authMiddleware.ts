import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import axios from 'axios'
import jwkToPem from 'jwk-to-pem'
import dotenv from 'dotenv'
dotenv.config()

// 存储公钥 PEM
let pems: { [key: string]: string } = {}

// Cognito 配置
const poolRegion: string = process.env.AWS_REGION || ''
const userPoolId: string = process.env.COGNITO_USER_POOL_ID || ''

// 获取 Cognito 公钥
const getPublicKey = async (kid: string) => {
  const url = `https://cognito-idp.${poolRegion}.amazonaws.com/${userPoolId}/.well-known/jwks.json`
  try {
    const response = await axios.get(url)
    if (response.status !== 200) {
      throw new Error('❌ Failed to fetch JWKs from Cognito')
    }

    const { keys } = response.data
    const key = keys.find((k: any) => k.kid === kid) // 获取匹配的公钥
    if (!key) throw new Error('❌ Public key not found')

    const pem = jwkToPem({ kty: key.kty, n: key.n, e: key.e }) // 转换为 PEM
    pems[kid] = pem // 缓存 PEM 密钥
    return pem
  } catch (error) {
    console.error('❌ Failed to get Cognito public key:', error)
    throw error
  }
}

export interface AuthRequest extends Request {
  user?: any // 存放解析后的用户信息
}

/**
 * ✅ 解析 JWT 并验证
 */
export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization']
  if (!authHeader) {
    return res.status(401).json({ message: '❌ Unauthorized: No Token' })
  }

  const token = authHeader.split(' ')[1] // Bearer <TOKEN>
  if (!token) {
    return res
      .status(401)
      .json({ message: '❌ Unauthorized: Invalid Token Format' })
  }

  try {
    // 解码 JWT 并获取 kid
    const decodedHeader: any = jwt.decode(token, { complete: true })
    if (!decodedHeader || !decodedHeader.header.kid) {
      return res.status(401).json({ message: '❌ Invalid token format' })
    }
    const kid = decodedHeader.header.kid

    // 获取公钥并验证 token
    let pem = pems[kid] // 从缓存中查找 PEM 密钥
    if (!pem) {
      pem = await getPublicKey(kid) // 如果缓存中没有，重新获取
    }

    const decoded = jwt.verify(token, pem, { algorithms: ['RS256'] }) as {
      sub: string
    }
    req.user = decoded // ✅ 存储解析后的用户信息

    // ✅ 这里 `console.log` 让我们确认 token 是正确的
    console.log(`🟢 Token from header is valid: ${token}`)

    next()
  } catch (err) {
    console.error('❌ Invalid Token:', err)
    res.status(403).json({ message: '❌ Forbidden: Invalid Token' })
  }
}
