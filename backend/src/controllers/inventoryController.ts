import { Request, Response } from "express";
import Inventory from "../models/inventory";

/**
 * ✅ 获取所有库存数据
 */
export const getInventory = async (req: Request, res: Response) => {
  try {
    const inventory = await Inventory.findAll();
    res.json(inventory);
  } catch (error) {
    console.error("❌ Error fetching inventory:", error);
    res.status(500).json({ message: "❌ Internal Server Error" });
  }
};

/**
 * ✅ 添加库存项
 */
export const addInventoryItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { warehouseId, binId, productId, quantity } = req.body;

    // ✅ 校验请求体
    if (!warehouseId || !binId || !productId || quantity === undefined) {
      res.status(400).json({ message: "❌ Missing required fields" });
      return;
    }

    if (quantity < 0) {
      res.status(400).json({ message: "❌ Quantity cannot be negative" });
      return;
    }

    // ✅ 检查数据库中是否已有该物品
    const existingItem = await Inventory.findOne({
      where: { warehouseId, binId, productId },
    });

    if (existingItem) {
      // ✅ 如果物品已存在，更新数量
      existingItem.quantity += quantity;
      await existingItem.save();

      res.status(200).json({
        message: "✅ Inventory quantity updated successfully",
        item: existingItem,
      });
    } else {
      // ✅ 否则，创建新物品
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

/**
 * ✅ 删除库存项
 */
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

/**
 * ✅ 更新库存项
 */
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

/**
 * ✅ 获取单个库存项
 */
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