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
 * ✅ 注册用户
 */
export const registerUser = (req: any, res: any) => {
    const { email, password } = req.body;
  
    console.log("🟢 Received Registration Request:", req.body);
  
    const attributeList = [
      new CognitoUserAttribute({ Name: "email", Value: email }),
    ];
  
    userPool.signUp(email, password, attributeList, [], (err, result) => {
      if (err) {
        console.error("❌ Registration Failed:", err);
        return res.status(400).json({ message: "❌ Registration failed", error: err.message });
      }
      console.log("✅ Registration Successful:", result);

      res.json({
        message: "✅ User registered successfully",
        userId: result?.userSub,
        email: email // ✅ 现在返回 email
      });
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
export const loginUser = (req: any, res: any) => {
  const { email, password, newPassword } = req.body;

  console.log("🟢 Received Login Request:", req.body);

  const authenticationDetails = new AuthenticationDetails({
    Username: email,
    Password: password,
  });

  const userData = { Username: email, Pool: userPool };
  const cognitoUser = new CognitoUser(userData);

  cognitoUser.authenticateUser(authenticationDetails, {
    onSuccess: (session) => {
      res.json({
        message: "✅ Login successful",
        accessToken: session.getAccessToken().getJwtToken(),
        idToken: session.getIdToken().getJwtToken(),
        refreshToken: session.getRefreshToken().getToken(),
      });
    },
    onFailure: (err) => {
      console.error("❌ Cognito Login Error:", err);
      res.status(401).json({ message: "❌ Login failed", error: err.message });
    },
    newPasswordRequired: (userAttributes, requiredAttributes) => {
      if (!newPassword) {
        return res.status(400).json({ message: "❌ New password required" });
      }

      cognitoUser.completeNewPasswordChallenge(newPassword, {}, {
        onSuccess: (session) => {
          res.json({
            message: "✅ Password updated successfully",
            accessToken: session.getAccessToken().getJwtToken(),
            idToken: session.getIdToken().getJwtToken(),
            refreshToken: session.getRefreshToken().getToken(),
          });
        },
        onFailure: (err) => {
          console.error("❌ Password update failed:", err);
          res.status(401).json({ message: "❌ Password update failed", error: err.message });
        },
      });
    },
  });
};