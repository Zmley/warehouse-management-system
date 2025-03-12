import express from "express";
import { getInventory, addInventoryItem, deleteInventoryItem, updateInventoryItem,getInventoryItem,getBinsForUser } from "../controllers/inventoryController";
import { authenticateToken } from "../middleware/authMiddleware"; 

const router = express.Router();

router.get("/bins-for-user", authenticateToken as any, getBinsForUser);


router.get("/", authenticateToken as any, getInventory);

router.post("/", authenticateToken as any, addInventoryItem);

router.delete("/:id", authenticateToken as any, deleteInventoryItem);

router.put("/:inventoryID", authenticateToken as any, updateInventoryItem);

router.get("/:id", authenticateToken as any, getInventoryItem);  

export default router;