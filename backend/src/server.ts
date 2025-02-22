import dotenv from 'dotenv'
dotenv.config()
import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import inventoryRoutes from "./routes/inventoryRoutes"; // ✅ 引入库存路由
import { connectDB } from "./config/db";


//连接数据库
connectDB();

const app = express();

// 中间件
app.use(express.json());
app.use(cors());

// 认证路由
app.use("/api/auth", authRoutes);
app.use("/api/inventory", inventoryRoutes); // ✅ 注册库存 API

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});