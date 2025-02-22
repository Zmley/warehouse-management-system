import express from "express";
import { getInventory, addInventoryItem, deleteInventoryItem, updateInventoryItem,getInventoryItem } from "../controllers/inventoryController";
import { authenticateToken } from "../middleware/authMiddleware"; // ✅ 只有管理员可访问

const router = express.Router();

// ✅ 只有 admin 可以查看库存数据
router.get("/", authenticateToken as any, getInventory);

// ✅ 添加库存项
router.post("/", authenticateToken as any, addInventoryItem);

// ✅ 删除库存项
router.delete("/:id", authenticateToken as any, deleteInventoryItem);

// ✅ 更新库存项
router.put("/:id", authenticateToken as any, updateInventoryItem);

// ✅ 获取单个库存项
router.get("/:id", authenticateToken as any, getInventoryItem);  // 👈 新增

export default router;