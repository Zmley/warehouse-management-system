// // utils/cognito.ts
// import dotenv from 'dotenv'
// dotenv.config()
// import AWS from 'aws-sdk'
// import axios from 'axios'
// import jwkToPem from 'jwk-to-pem'
// import crypto from 'crypto'

// // ✅ 初始化 Cognito 服务
// const cognito = new AWS.CognitoIdentityServiceProvider({
//   region: process.env.AWS_REGION!
// })

// // ✅ 存储公钥 PEM（全局缓存）
// const pems: { [key: string]: string } = {};

// // ✅ Cognito 配置
// const poolRegion = process.env.AWS_REGION!
// const userPoolId = process.env.COGNITO_USER_POOL_ID!
// const clientId = process.env.COGNITO_CLIENT_ID!
// const clientSecret = process.env.COGNITO_CLIENT_SECRET!

// /**
//  * ✅ 获取 Cognito 公钥 (缓存机制)
//  */
// export const getPublicKey = async (kid: string): Promise<string> => {
//   if (pems[kid]) {
//     return pems[kid] // ✅ 直接从缓存返回
//   }

//   const url = `https://cognito-idp.${poolRegion}.amazonaws.com/${userPoolId}/.well-known/jwks.json`
//   try {
//     const response = await axios.get(url)
//     if (response.status !== 200) {
//       throw new Error('❌ Failed to fetch JWKs from Cognito')
//     }

//     const { keys } = response.data
//     const key = keys.find((k: any) => k.kid === kid) // 获取匹配的公钥
//     if (!key) throw new Error('❌ Public key not found')

//     const pem = jwkToPem({ kty: key.kty, n: key.n, e: key.e }) // 转换为 PEM
//     pems[kid] = pem // ✅ 缓存 PEM 密钥
//     return pem
//   } catch (error) {
//     console.error('❌ Failed to get Cognito public key:', error)
//     throw error
//   }
// }

// /**
//  * ✅ 计算 Cognito Secret Hash
//  */
// // export const generateSecretHash = (username: string): string => {
// //   return crypto
// //     .createHmac('sha256', clientSecret)
// //     .update(username + clientId)
// //     .digest('base64')
// // }


// export { cognito, clientId, userPoolId }