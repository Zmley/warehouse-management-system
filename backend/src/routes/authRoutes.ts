import express from "express";
import { loginUser } from "../controllers/authController";

const router = express.Router();

// 用户登录路由
router.post("/login", loginUser);

export default router;