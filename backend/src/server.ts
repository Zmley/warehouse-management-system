import dotenv from 'dotenv'
dotenv.config()
import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import inventoryRoutes from "./routes/inventoryRoutes"; 
import transportTaskRoutes from "./routes/transportTaskRoutes"; 
import { connectDB } from "./config/db";


connectDB();



const app = express();


app.use(
  cors({
    origin: ["http://localhost:3000", "http://192.168.4.90:3000"], 
    credentials: true,
  })
);

app.use(express.json());
app.use(cors());

// 认证路由
app.use("/api/auth", authRoutes);
app.use("/api/inventory", inventoryRoutes); 
app.use("/api/transport", transportTaskRoutes); 

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});