import express from "express";
import { authenticateToken } from "../middleware/authMiddleware"; // ✅ 解析 JWT Token
import { registerUser, confirmUser, loginUser, getUserInfo } from "../controllers/authController";




const router = express.Router();

// 用户注册
router.post("/register", registerUser);

// 用户登录路由
router.post("/login", loginUser);
router.get("/me", authenticateToken as any, getUserInfo);


export default router;