// import AWS from "aws-sdk";
// import crypto from "crypto";
// import dotenv from "dotenv";
// import { CognitoUserAttribute } from "amazon-cognito-identity-js";
// import User from "../models/User"; // 引入 User 模型

// dotenv.config();

// export default class Cognito {
//   private config = {
//     apiVersion: "2024-06-03",
//     region: process.env.AWS_REGION,
//   };

//   private secretHash = process.env.SECRET_HASH;
//   private clientId = process.env.CLIENT_ID;

//   private cognitoIdentity;

//   constructor() {
//     this.cognitoIdentity = new AWS.CognitoIdentityServiceProvider(this.config);
//   }

//   /**
//    * ✅ 注册用户 + 存储 PostgreSQL
//    */
//   public async signUpUser(username: string, password: string, userAttr: Array<any>): Promise<any> {
//     const params = {
//       ClientId: this.clientId,
//       Password: password,
//       Username: username,
//       SecretHash: this.hashSecret(username),
//       UserAttributes: userAttr,
//     };

//     try {
//       const data = await this.cognitoIdentity.signUp(params).promise();
//       console.log("✅ Cognito 注册成功:", data);

//       // ✅ 解析 userId (Cognito UserSub)
//       const userId = data.UserSub;
//       const email = username;

//       // ✅ 存入 PostgreSQL 数据库
//       try {
//         await User.create({
//           cognito_id: userId,
//           email: email,
//           created_at: new Date(),
//         });

//         console.log("✅ 用户已存入数据库:", { userId, email });
//       } catch (dbError) {
//         console.error("❌ 存入数据库失败:", dbError);
//       }

//       return data;
//     } catch (error) {
//       console.error("❌ Cognito 注册失败:", error);
//       throw error;
//     }
//   }

//   /**
//    * 🔐 计算 Cognito Secret Hash
//    */
//   private hashSecret(username: string): string {
//     if (!this.secretHash || !this.clientId) {
//       throw new Error("Missing SECRET_HASH or CLIENT_ID in environment variables.");
//     }
//     return crypto
//       .createHmac("SHA256", this.secretHash)
//       .update(username + this.clientId)
//       .digest("base64");
//   }
// }