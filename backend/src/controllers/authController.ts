import AWS from "aws-sdk";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { AuthRequest } from "../middleware/authMiddleware"; // ✅ 确保路径正
import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserPool,
  CognitoUserAttribute,
} from "amazon-cognito-identity-js";
import dotenv from "dotenv";
const { User } = require("../models/User"); // ✅ 引入 Sequelize User Model



dotenv.config();

// ✅ 初始化 Cognito 服务
const cognito = new AWS.CognitoIdentityServiceProvider({
    region: process.env.AWS_REGION, // 确保你的 `.env` 有 AWS_REGION
  });

const poolData = {
  UserPoolId: process.env.COGNITO_USER_POOL_ID as string,
  ClientId: process.env.COGNITO_CLIENT_ID as string,
};
const userPool = new CognitoUserPool(poolData);


  // ✅ 计算 Cognito Secret Hash
  const generateSecretHash = (username: string): string => {
    const clientSecret = process.env.COGNITO_CLIENT_SECRET!;
    const clientId = process.env.COGNITO_CLIENT_ID!;
    
    return crypto
      .createHmac("sha256", clientSecret)
      .update(username + clientId)
      .digest("base64");
  };
  
  /**
   * ✅ 用户登录
   */
  /**
 * ✅ 用户登录
 */
export const loginUser = async (req: Request, res: Response) => {
    const { email, password } = req.body;
  
    console.log("🟢 Received Login Request:", { email });
  
    try {
      const params = {
        AuthFlow: "ADMIN_NO_SRP_AUTH",
        ClientId: process.env.COGNITO_CLIENT_ID!,
        UserPoolId: process.env.COGNITO_USER_POOL_ID!,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
          SECRET_HASH: generateSecretHash(email), // ✅ 计算 Secret Hash
        },
      };
  
      const authResponse = await cognito.adminInitiateAuth(params).promise();
  
      console.log("🟢 Cognito Auth Success:", authResponse);
  
      res.json({
        accessToken: authResponse.AuthenticationResult?.AccessToken,
        idToken: authResponse.AuthenticationResult?.IdToken,
        refreshToken: authResponse.AuthenticationResult?.RefreshToken,
      });
    } catch (error: any) {
      console.error("❌ Cognito Login Error:", error);
  
      // ✅ 处理 Cognito 的常见错误
      let errorMessage = "❌ Login failed";
      if (error.code === "NotAuthorizedException") {
        errorMessage = "❌ Incorrect username or password";
      } else if (error.code === "UserNotFoundException") {
        errorMessage = "❌ User does not exist";
      } else if (error.code === "UserNotConfirmedException") {
        errorMessage = "❌ User is not confirmed. Please check your email.";
      } else if (error.code === "PasswordResetRequiredException") {
        errorMessage = "❌ Password reset is required.";
      }
  
      res.status(401).json({ message: errorMessage });
    }
  };

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
 * ✅ 获取当前用户信息 (role)
 */

export const getUserInfo = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // ✅ 1. 从 `req.user` 获取 Cognito ID
        const cognito_id = req.user?.sub;
        if (!cognito_id) {
            res.status(401).json({ message: "❌ Unauthorized: No User Info" });
            return;
        }

        // ✅ 2. 查询数据库获取用户 `role`
        const user = await User.findOne({
            where: { cognito_id },
            attributes: ["role"],
        });

        if (!user) {
            res.status(404).json({ message: "❌ User not found" });
            return;
        }

        // ✅ 3. 返回用户信息
        res.json({ user });
    } catch (error) {
        console.error("❌ Error fetching user info:", error);
        res.status(500).json({ message: "❌ Internal Server Error" });
    }
};