import dotenv from 'dotenv'
dotenv.config()
import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
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

app.use("/api/auth", authRoutes);



const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});