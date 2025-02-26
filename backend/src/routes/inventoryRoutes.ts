import express from "express";
import { getInventory, addInventoryItem, deleteInventoryItem, updateInventoryItem,getInventoryItem } from "../controllers/inventoryController";
import { authenticateToken } from "../middleware/authMiddleware"; 

const router = express.Router();

router.get("/", authenticateToken as any, getInventory);

router.post("/", authenticateToken as any, addInventoryItem);

router.delete("/:id", authenticateToken as any, deleteInventoryItem);

router.put("/:id", authenticateToken as any, updateInventoryItem);

router.get("/:id", authenticateToken as any, getInventoryItem);  

export default router;