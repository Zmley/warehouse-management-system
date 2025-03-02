import Task from "../models/task";
import Inventory from "../models/inventory";

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

export const unloadCargoHelper = async (unLoadBinID: string, carID: string, accountId: string) => {
  try {
    const updatedItems = await Inventory.update(
      { binID: unLoadBinID, ownedBy: "warehouse" }, 
      { where: { binID: carID, ownedBy: "car" } } // ✅ 现在只更新 ownedBy 是 "car" 的货物
    );
    return updatedItems[0]; 
  } catch (error) {
    console.error("❌ Error in unloadCargoHelper:", error);
    throw new Error("❌ Failed to unload cargo.");
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