import Task from "../models/task";

/**
 * 创建任务
 * @param assignedUserID 任务分配给的用户ID
 * @param destinationBinList 目标仓库（默认值可为 ""）
 * @returns 创建的任务
 */
export const createTask = async (assignedUserID: string, destinationBinList: string = "") => {
  try {
    const task = await Task.create({
      sourceBinID: "car",
      assignedUserID,
      destinationBinList,
      status: "inProgress",
    });

    return task;
  } catch (error) {
    console.error("❌ Error creating task:", error);
    throw new Error("❌ Failed to create task");
  }
};

/**
 * 更新任务状态
 * @param accountId 用户ID（assignedUserID）
 * @param status 新的状态 ("pending" | "inProgress" | "completed" | "cancel")
 * @returns 更新后的任务
 */
export const updateTaskStatus = async (accountId: string, status: "pending" | "inProgress" | "completed" | "cancel") => {
    try {
      // 根据 `sourceBinID === "car"` 且 `assignedUserID === accountId` 查询任务
      const task = await Task.findOne({
        where: { sourceBinID: "car", assignedUserID: accountId, status: "inProgress" },
        order: [["createdAt", "DESC"]], // 取最新的任务
      });
  
      if (!task) {
        throw new Error("❌ No active task found for this user");
      }
  
      // 更新任务状态
      task.status = status;
      task.completedAt = status === "completed" ? new Date() : null;
      await task.save();
  
      return task;
    } catch (error) {
      console.error("❌ Error updating task status:", error);
      throw new Error("❌ Failed to update task status");
    }
  };