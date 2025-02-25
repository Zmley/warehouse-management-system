import dotenv from "dotenv";
dotenv.config();
import AWS from "aws-sdk";
import { Request, Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware"; // ✅ 确保路径正确
import {
  CognitoUser,
  CognitoUserPool,
  CognitoUserAttribute,
} from "amazon-cognito-identity-js";
import User from "../models/User"; // ✅ 采用 ES Module 方式引入

// ✅ 初始化 Cognito 服务
const cognito = new AWS.CognitoIdentityServiceProvider({
  region: process.env.AWS_REGION, // 确保 `.env` 里有 AWS_REGION
});

const poolData = {
  UserPoolId: process.env.COGNITO_USER_POOL_ID as string,
  ClientId: process.env.COGNITO_CLIENT_ID as string,
};
const userPool = new CognitoUserPool(poolData);

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
 * ✅ 注册用户
 */
export const registerUser = async (req: Request, res: Response) => {
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
    const accountID = result?.userSub; // Cognito 返回的唯一 ID

    try {
      // ✅ 存入数据库
      await User.create({
        accountID: accountID as string,
        email,
        role: "admin", // 默认 role
        firstName: "TBD",
        lastName: "TBD",
        createdAt: new Date(),
      });

      console.log("✅ 用户信息已存入数据库:", { accountID, email });

      res.json({
        message: "✅ User registered successfully",
        accountID,
        email,
      });
    } catch (dbError: unknown) {
      console.error("❌ 存入数据库失败:", dbError);
      res.status(500).json({
        message: "❌ Failed to save user to database",
        error: (dbError as Error).message || "Unknown error",
      });
    }
  });
};

/**
 * ✅ 确认用户邮箱（用 Cognito 发送的验证码）
 */
export const confirmUser = (req: Request, res: Response) => {
  const { email, code } = req.body;
  console.log("🟢 Received Confirmation Request:", req.body);

  const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });

  cognitoUser.confirmRegistration(code, true, (err, result) => {
    if (err) {
      console.error("❌ Email Confirmation Failed:", err);
      return res
        .status(400)
        .json({ message: "❌ Email confirmation failed", error: err.message });
    }

    console.log("✅ Email Confirmed:", result);
    res.json({ message: "✅ Email confirmed successfully" });
  });
};

/**
 * ✅ 获取当前用户信息 (role)
 */
/**
 * ✅ 获取当前用户信息 (role)
 */
export const getUserInfo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // ✅ 1. 从 `req.user` 获取 Cognito ID
    const accountID = req.user?.sub; // `sub` 是通过 JWT 中间件存储在 req.user 中的
    if (!accountID) {
      res.status(401).json({ message: "❌ Unauthorized: No User Info" });
      return;
    }

    // ✅ 2. 查询数据库获取用户 `role`
    const user = await User.findOne({
      where: { accountID },
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