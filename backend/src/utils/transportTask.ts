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
 * @param unLoadBinID 
 * @param carID 
 * @param accountId 
 * @param productList 
 */
export const unloadCargoHelper = async (
  unLoadBinID: string,
  carID: string,
  accountId: string,
  productList: { inventoryID: string; quantity: number }[]
): Promise<number> => {
  let updatedCount = 0;

  for (const { inventoryID, quantity } of productList) {
    const inventoryItem = await Inventory.findOne({ where: { inventoryID, binID: carID } });

    if (!inventoryItem) {
      console.warn(`⚠️ Inventory item ${inventoryID} not found in car ${carID}`);
      continue;
    }

    const currentQuantity = inventoryItem.quantity;
    const productID = inventoryItem.productID;

    if (currentQuantity < quantity) {
      console.warn(`⚠️ Requested unload quantity (${quantity}) exceeds car stock (${currentQuantity}) for inventory ${inventoryID}`);
      continue;
    }

    const binType = await getBinType(unLoadBinID);
    const ownedBy = binType || "unknown";

    // 检查目标bin是否已有该productID库存
    const targetInventory = await Inventory.findOne({ where: { binID: unLoadBinID, productID } });

    if (targetInventory) {
      // 合并库存到目标bin
      await targetInventory.update({ quantity: targetInventory.quantity + quantity });
    } else {
      // 目标bin没有该product，创建新库存记录
      await Inventory.create({
        binID: unLoadBinID,
        productID,
        quantity,
        ownedBy,
      });
    }

    // 更新原库存数量或删除记录
    if (currentQuantity === quantity) {
      // 完全卸载：删除原记录
      await inventoryItem.destroy();
      console.log(`✅ Fully moved and deleted inventory ${inventoryID} from car ${carID}`);
    } else {
      // 部分卸载：更新数量
      await inventoryItem.update({ quantity: currentQuantity - quantity });
      console.log(`✅ Partially moved inventory ${inventoryID}, reduced quantity by ${quantity} from car ${carID}`);
    }

    updatedCount++;
  }

  return updatedCount;
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