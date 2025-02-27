import Task from "../models/task";
import Inventory from "../models/inventory";

/**
 * @param binID 源 Bin ID
 * @param warehouseID 仓库 ID
 * @param accountId 用户 ID
 */
export const loadCargoHelper = async (binID: string, warehouseID: string, accountId: string) => {
  try {
    const updatedItems = await Inventory.update(
      { binID: "car", ownedBy: accountId }, 
      { where: { binID, warehouseID } }
    );

    return updatedItems[0]; // 返回受影响的行数
  } catch (error) {
    console.error("❌ Error in loadCargoHelper:", error);
    throw new Error("❌ Failed to load cargo.");
  }
};

/**
 * @param unLoadBinID 目标 Bin ID
 * @param warehouseID 仓库 ID
 * @param accountId 用户 ID
 */
export const unloadCargoHelper = async (unLoadBinID: string, warehouseID: string, accountId: string) => {
  try {
    const updatedItems = await Inventory.update(
      { binID: unLoadBinID, ownedBy: "warehouse" }, 
      { where: { binID: "car", ownedBy: accountId, warehouseID } }
    );

    return updatedItems[0]; 
  } catch (error) {
    console.error("❌ Error in unloadCargoHelper:", error);
    throw new Error("❌ Failed to unload cargo.");
  }
};



/**
 * 创建任务
 * @param warehouseID 
 * @param sourceBinID 
 * @param assignedUserID 
 * @param updatedProducts 
 */
export const createTask = async (
  warehouseID: string,
  sourceBinID: string,
  assignedUserID: string,
  updatedProducts: { productID: string }[]
) => {
  try {
    if (!updatedProducts.length) {
      console.warn("⚠️ No products found for task creation.");
      return [];
    }

    const tasks = updatedProducts.map((product) => ({
      warehouseID,
      productID: product.productID,
      sourceBinID, 
      destinationBin: null, 
      assignedUserID,
      status: "inProgress",
      createdAt: new Date(),
      updatedAt: null,
    }));

    const createdTasks = await Task.bulkCreate(tasks);
    console.log(`✅ Created ${tasks.length} task records.`);
    return createdTasks;
  } catch (error) {
    console.error("❌ Error creating task:", error);
    throw new Error("❌ Failed to create task");
  }
};

/**
 * 更新任务状态
 * @param accountID 用户 ID（assignedUserID）
 * @param warehouseID 仓库 ID
 * @param productID 需要更新的产品 ID
 * @param destinationBin 目标 Bin ID（卸载时更新）
 */
export const updateTaskStatus = async (
    accountID: string,
    warehouseID: string,
    productID: string,
    destinationBin: string
  ) => {
    try {
      const tasks = await Task.findAll({
        where: { 
          assignedUserID: accountID,
          warehouseID: warehouseID,
          productID: productID,
          status: "inProgress"
        }
      });
  
      if (!tasks.length) {
        console.warn(`⚠️ No active tasks found for user ${accountID} in warehouse ${warehouseID} for product ${productID}.`);
        return null;
      }
  
      for (const task of tasks) {
        task.status = "completed";
        task.updatedAt = new Date();
        task.destinationBin = destinationBin; 
        await task.save();
      }
  
      console.log(`✅ Updated ${tasks.length} tasks for user ${accountID} and product ${productID}`);
      return tasks;
    } catch (error) {
      console.error("❌ Error updating task status:", error);
      throw new Error("❌ Failed to update task status");
    }
  };