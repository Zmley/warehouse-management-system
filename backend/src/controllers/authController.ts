import AWS from "aws-sdk";
import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserPool,
  CognitoUserAttribute,
} from "amazon-cognito-identity-js";
import dotenv from "dotenv";
const { User } = require("../models/User"); // ✅ 引入 Sequelize User Model



dotenv.config();

const poolData = {
  UserPoolId: process.env.COGNITO_USER_POOL_ID as string,
  ClientId: process.env.COGNITO_CLIENT_ID as string,
};
const userPool = new CognitoUserPool(poolData);

/**
 * ✅ 注册用户, 第一次注册成功会储存sub email 以及role：TBD 到数据库
 */
export const registerUser = (req: any, res: any) => {
    const { email, password } = req.body;
  
    console.log("🟢 Received Registration Request:", req.body);
  
    const attributeList = [
      new CognitoUserAttribute({ Name: "email", Value: email }),
    ];
  
    userPool.signUp(email, password, attributeList, [], async (err, result) => {
      if (err) {
        console.error("❌ Registration Failed:", err);
        return res.status(400).json({ message: "❌ Registration failed", error: err.message });
      }
      console.log("✅ Registration Successful:", result);
  
      const userId = result?.userSub;
  
      try {
        // ✅ 存储到数据库，并默认 `role` 为 "picker"
        await User.create({
          cognito_id: userId,
          email: email,
          role: "TBD", // 🔥 这里默认 role
          firstName: "TBD",
          lastName: "TBD",
          created_at: new Date(),
        });
  
        console.log("✅ 用户信息已存入数据库:", { userId, email });
  
        res.json({
          message: "✅ User registered successfully",
          userId: userId,
          email: email,
        });
      } catch (dbError: unknown) {
        // ✅ 显式转换 `dbError` 为 `Error`
        const errorMessage = (dbError as Error).message || "Unknown error";
        console.error("❌ 存入数据库失败:", errorMessage);
        res.status(500).json({ message: "❌ Failed to save user to database", error: errorMessage });
      }
    });
  };


/**
 * ✅ 确认用户邮箱（用 Cognito 发送的验证码）
 */
export const confirmUser = (req: any, res: any) => {
  const { email, code } = req.body;

  console.log("🟢 Received Confirmation Request:", req.body);

  const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });

  cognitoUser.confirmRegistration(code, true, (err, result) => {
    if (err) {
      console.error("❌ Email Confirmation Failed:", err);
      return res.status(400).json({ message: "❌ Email confirmation failed", error: err.message });
    }
    console.log("✅ Email Confirmed:", result);
    res.json({ message: "✅ Email confirmed successfully" });
  });
};

/**
 * ✅ 用户登录
 */
export const loginUser = async (req: any, res: any) => {
    const { email, password, role } = req.body; // ✅ 确保前端传递了 role
  
    console.log("🟢 Received Login Request:", req.body);
  
    const authenticationDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });
  
    const userData = { Username: email, Pool: userPool };
    const cognitoUser = new CognitoUser(userData);
  
    await cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: async (session) => {
        try {
          // ✅ 1. 获取 Cognito `sub`（其实是 cognito_id）
          const cognito_id = session.getIdToken().payload.sub;
          console.log(`🟢 Cognito ID (sub): ${cognito_id}`);
  
          // ✅ 2. **用 `cognito_id` 查询 `role`**
          const user = await User.findOne({
            where: { cognito_id }, // ✅ 确保数据库有 `cognito_id` 字段
            attributes: ["role"], // 只获取 `role` 字段
          });
  
          if (!user) {
            console.error("❌ User not found in database");
            return res.status(404).json({ message: "❌ User not found" });
          }
  
          const userRole = user.role; // ✅ 获取数据库中的 `role`
          console.log(`🟢 User Role from DB: ${userRole}, Requested Role: ${role}`);
  
          // ✅ 3. **对比数据库 `role` 和前端传递的 `role`**
          if (userRole !== role) {
            console.error(`❌ Unauthorized access: User role is ${userRole}, but requested ${role}`);
            return res.status(403).json({ message: "❌ Unauthorized: Role mismatch" });
          }
  
          // ✅ 4. **角色匹配，返回 JWT Token**
          res.json({
            message: "✅ Login successful",
            role: userRole, // ✅ 确保返回数据库中的角色
            accessToken: session.getAccessToken().getJwtToken(),
            idToken: session.getIdToken().getJwtToken(),
            refreshToken: session.getRefreshToken().getToken(),
          });
        } catch (error) {
          console.error("❌ Database Error:", error);
          res.status(500).json({ message: "❌ Internal Server Error" });
        }
      },
      onFailure: (err) => {
        console.error("❌ Cognito Login Error:", err);
        res.status(401).json({ message: "❌ Login failed", error: err.message });
      },
    });
  };