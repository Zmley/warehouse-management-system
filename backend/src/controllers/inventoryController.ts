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
      const { warehouse_code, bin_code, product_code, quantity, bin_qr_code } = req.body;
  
      // ✅ 校验请求体
      if (!warehouse_code || !bin_code || !product_code || quantity === undefined || !bin_qr_code) {
        res.status(400).json({ message: "❌ Missing required fields" });
        return;
      }
  
      // ✅ 检查数据库中是否已经有该物品
      const existingItem = await Inventory.findOne({
        where: { warehouse_code, bin_code, product_code },
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
          warehouse_code,
          bin_code,
          product_code,
          quantity,
          bin_qr_code,
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
      const [updated] = await Inventory.update(req.body, { where: { id } });
  
      if (updated) {
        const updatedItem = await Inventory.findByPk(id);
        res.json(updatedItem);
        return;
      }
  
      res.status(404).json({ message: "❌ Item not found" });
    } catch (error) {
      console.error("❌ Error updating inventory:", error);
      res.status(500).json({ message: "❌ Internal Server Error" });
    }
  };

/**
 * ✅ 获取单个库存项
 */
export const getInventoryItem = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
  
    try {
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