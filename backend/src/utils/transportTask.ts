import Task from "../models/task";
import Inventory from "../models/inventory";
import { Bin } from "../models/bin"; // ✅ 确保路径正确
import {  getBinType,checkExistingInventory } from '../utils/task'

export const loadCargoHelper = async (binID: string, carID: string, accountId: string) => {
  try {
    const updatedItems = await Inventory.update(
      { binID: carID, ownedBy: "car" },  // ✅ ownedBy 变成 "car"
      { where: { binID } }
    );
    return updatedItems[0]; 
  } catch (error) {
    console.error("❌ Error in loadCargoHelper:", error);
    throw new Error("❌ Failed to load cargo.");
  }
};


/**
 * ✅ 处理卸货逻辑
 * @param unLoadBinID - 目标存放的 bin ID
 * @param carID - 车辆 ID
 * @param accountId - 用户 ID
 * @param productList - 卸载的产品列表
 */
export const unloadCargoHelper = async (
  unLoadBinID: string,
  carID: string,
  accountId: string,
  productList: { inventoryID: string; quantity: number }[]
): Promise<number> => {
  try {
    let updatedCount = 0;

    for (const { inventoryID, quantity } of productList) {
      const inventoryItem = await Inventory.findOne({
        where: { inventoryID: inventoryID, binID: carID }, // 确保是车上的货物
      });

      if (!inventoryItem) {
        console.warn(`⚠️ Inventory item ${inventoryID} not found in car ${carID}`);
        continue; // 跳过未找到的产品
      }

      const currentQuantity = inventoryItem.quantity;
      const productID = inventoryItem.productID;

      // 🔹 **检查 `binID + productID` 是否已存在**
      const existingInventory = await Inventory.findOne({
        where: { binID: unLoadBinID, productID },
      });

      if (currentQuantity === quantity) {
        // ✅ **完全卸载**
        if (existingInventory) {
          // ✅ `binID` 里已经有这个 `productID` → **直接增加库存**
          await existingInventory.update({ quantity: existingInventory.quantity + quantity });
          console.log(`✅ Fully moved inventory ${inventoryID} to bin ${unLoadBinID} (merged with existing row)`);
        } else {
          // ✅ `binID` **没有这个产品** → **直接修改 `binID`**
          await inventoryItem.update({ binID: unLoadBinID });
          console.log(`✅ Fully moved inventory ${inventoryID} to bin ${unLoadBinID} (new row)`);
        }

        // 🔹 **获取 bin 类型，并更新 `ownedBy`**
        const binType = await getBinType(unLoadBinID);
        await inventoryItem.update({ ownedBy: binType || "unknown" });

      } else if (currentQuantity > quantity) {
        // ✅ **部分卸载**
        if (existingInventory) {
          // ✅ `binID` 里已经有这个 `productID` → **直接增加库存**
          await existingInventory.update({ quantity: existingInventory.quantity + quantity });
          console.log(`✅ Increased quantity of product ${productID} in bin ${unLoadBinID} by ${quantity}`);
        } else {
          // ✅ `binID` **没有这个产品** → **创建新库存记录**
          await Inventory.create({
            binID: unLoadBinID,
            productID,
            quantity,
            ownedBy: await getBinType(unLoadBinID) || "unknown", // 更新 ownedBy
          });
          console.log(`✅ Created new inventory record for product ${productID} in bin ${unLoadBinID}`);
        }

        // ✅ **减少 `carID` 里的库存**
        await inventoryItem.update({ quantity: currentQuantity - quantity });
        console.log(`✅ Decreased inventory ${inventoryID} in car ${carID} by ${quantity}`);
      } else {
        console.warn(`⚠️ Skipped ${inventoryID}: requested unload quantity (${quantity}) exceeds car stock (${currentQuantity})`);
      }

      updatedCount++;
    }

    return updatedCount;
  } catch (error) {
    console.error("❌ Error in unloadCargoHelper:", error);
    return 0;
  }
};

export const createTask = async (sourceBinID: string, carID: string, accountID: string) => {
  try {
    const task = await Task.create({
      sourceBinID,
      destinationBinID: null,
      accountID,
      productID: "ALL",
      status: "inProgress",
      createdAt: new Date(),
      updatedAt: null,
    });
    console.log(`✅ Created task for bin ${sourceBinID}, assigned to ${accountID}`);
    return task;
  } catch (error) {
    console.error("❌ Error creating task:", error);
    throw new Error("❌ Failed to create task");
  }
};

export const updateTaskStatus = async (accountID: string, destinationBinID: string) => {
  try {
    const tasks = await Task.findAll({
      where: { accountID, status: "inProgress" }
    });

    if (!tasks.length) {
      console.warn(`⚠️ No active tasks found for user ${accountID}`);
      return null;
    }

    for (const task of tasks) {
      task.status = "completed";
      task.updatedAt = new Date();
      task.destinationBinID = destinationBinID; 
      await task.save();
    }

    console.log(`✅ Updated ${tasks.length} tasks for user ${accountID}`);
    return tasks;
  } catch (error) {
    console.error("❌ Error updating task status:", error);
    throw new Error("❌ Failed to update task status");
  }
};