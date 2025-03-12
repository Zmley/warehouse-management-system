import { Request, Response } from "express";
import Inventory from "../models/inventory";
import Bin from "../models/bin";
import User from "../models/User";
import { AuthRequest } from '../middleware/authMiddleware'


export const getInventory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const accountID = req.user?.sub;
    if (!accountID) {
      res.status(401).json({ message: "❌ Unauthorized: No User Info" });
      return;
    }

    // 1️⃣ 获取当前用户的 `warehouseID`
    const user = await User.findOne({
      where: { accountID },
      attributes: ["warehouseID"],
    });

    if (!user || !user.warehouseID) {
      res.status(404).json({ message: "❌ User not found or no warehouse assigned" });
      return;
    }

    console.log("🟢 User's warehouseID:", user.warehouseID);

    // 2️⃣ 获取该 `warehouseID` 下的所有 `binID`
    const bins = await Bin.findAll({
      where: { warehouseID: user.warehouseID },
      attributes: ["binID"],
    });

    if (!bins.length) {
      res.status(404).json({ message: "❌ No bins found for this warehouse" });
      return;
    }

    const binIDs = bins.map((bin) => bin.binID);
    console.log("🟢 Retrieved binIDs:", binIDs);

    // 3️⃣ 查询属于这些 `binID` 的 `inventory` 数据
    const inventoryItems = await Inventory.findAll({
      where: { binID: binIDs },
    });

    console.log("🟢 Raw inventory items from database:", inventoryItems);

    // 4️⃣ **提取 `dataValues` 只返回纯数据**
    const formattedInventory = inventoryItems.map((item) => item.get({ plain: true }));

    console.log("🟢 Formatted inventory items:", formattedInventory);

    res.json({ inventory: formattedInventory });
  } catch (error) {
    console.error("❌ Error fetching inventory:", error);
    res.status(500).json({ message: "❌ Internal Server Error" });
  }
};

export const addInventoryItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { warehouseId, binId, productId, quantity } = req.body;

    if (!warehouseId || !binId || !productId || quantity === undefined) {
      res.status(400).json({ message: "❌ Missing required fields" });
      return;
    }

    if (quantity < 0) {
      res.status(400).json({ message: "❌ Quantity cannot be negative" });
      return;
    }

    const existingItem = await Inventory.findOne({
      where: { warehouseId, binId, productId },
    });

    if (existingItem) {
      existingItem.quantity += quantity;
      await existingItem.save();

      res.status(200).json({
        message: "✅ Inventory quantity updated successfully",
        item: existingItem,
      });
    } else {
      const newItem = await Inventory.create({
        warehouseId,
        binId,
        productId,
        quantity,
      });

      res.status(201).json({
        message: "✅ New inventory item added successfully",
        item: newItem,
      });
    }
  } catch (error) {
    console.error("❌ Error adding inventory item:", error);
    res.status(500).json({ message: "❌ Internal Server Error" });
  }
};

export const deleteInventoryItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const item = await Inventory.findByPk(id);
    if (!item) {
      res.status(404).json({ message: "❌ Inventory item not found" });
      return;
    }

    await item.destroy();
    res.status(200).json({ message: "✅ Inventory item deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting inventory item:", error);
    res.status(500).json({ message: "❌ Internal Server Error" });
  }
};


export const updateInventoryItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (quantity !== undefined && quantity < 0) {
      res.status(400).json({ message: "❌ Quantity cannot be negative" });
      return;
    }

    const [updated] = await Inventory.update(req.body, { where: { id } });

    if (updated === 0) {
      res.status(404).json({ message: "❌ Item not found or no changes made" });
      return;
    }

    const updatedItem = await Inventory.findByPk(id);
    res.json(updatedItem);
  } catch (error) {
    console.error("❌ Error updating inventory:", error);
    res.status(500).json({ message: "❌ Internal Server Error" });
  }
};


export const getInventoryItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    console.log(`🔍 Fetching inventory item with ID: ${id}`);

    const item = await Inventory.findByPk(id);
    if (!item) {
      res.status(404).json({ message: "❌ Inventory item not found" });
      return;
    }

    console.log("✅ Inventory item found:", item);
    res.json(item);
  } catch (error) {
    console.error("❌ Error fetching inventory item:", error);
    res.status(500).json({ message: "❌ Internal Server Error" });
  }
};