import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import { connectDB } from "./config/db";


//连接数据库
connectDB();

dotenv.config();
const app = express();

// 中间件
app.use(express.json());
app.use(cors());

// 认证路由
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});