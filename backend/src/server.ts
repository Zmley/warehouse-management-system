import dotenv from 'dotenv'
dotenv.config()
import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import inventoryRoutes from "./routes/inventoryRoutes"; // ✅ 引入库存路由
import transportTaskRoutes from "./routes/transportTaskRoutes"; // ✅ 引入库存路由
import { connectDB } from "./config/db";


//连接数据库
connectDB();



const app = express();


app.use(
  cors({
    origin: ["http://localhost:3000", "http://192.168.4.90:3000"], // ✅ 允许手机访问
    credentials: true,
  })
);

// 中间件
app.use(express.json());
app.use(cors());

// 认证路由
app.use("/api/auth", authRoutes);
app.use("/api/inventory", inventoryRoutes); // ✅ 注册库存 API
app.use("/api/transport", transportTaskRoutes); // ✅ 注册 load-cargo 路由

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});