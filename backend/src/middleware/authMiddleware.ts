// middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { getPublicKey } from '../utils/cognito' // ✅ 从 utils/cognito.ts 导入

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
    return res.status(401).json({ message: '❌ Unauthorized: Invalid Token Format' })
  }

  try {
    // ✅ 解析 JWT 并获取 `kid`
    const decodedHeader: any = jwt.decode(token, { complete: true })
    if (!decodedHeader?.header?.kid) {
      return res.status(401).json({ message: '❌ Invalid token format' })
    }
    const kid = decodedHeader.header.kid

    // ✅ 获取公钥并验证 Token
    const pem = await getPublicKey(kid) // 🔥 现在使用 utils/cognito.ts 里的方法
    const decoded = jwt.verify(token, pem, { algorithms: ['RS256'] }) as { sub: string }

    req.user = { sub: decoded.sub } // ✅ 只存 `sub`，避免存入敏感信息
    console.log("test: pass 中间件")
    next() // ✅ 继续执行下一个中间件
  } catch (err) {
    console.error('❌ Invalid Token:', err)
    return res.status(403).json({ message: '❌ Forbidden: Invalid Token' })
  }
}