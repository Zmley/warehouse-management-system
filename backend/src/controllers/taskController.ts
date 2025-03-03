import { Request, Response } from "express";
import Task from "../models/task";
import { AuthRequest } from "../middleware/authMiddleware";

/**
 * 创建任务 - 任务状态默认 "pending"
 * @route POST /api/task/create
 */

export const createPendingTask = async (
    req: AuthRequest,
    res: Response
  ): Promise<void> => {
    try {
      const { sourceBinID, destinationBinID } = req.body;
      const accountID = req.user?.sub; // 获取用户 ID
  
      if (!sourceBinID || !destinationBinID || !accountID) {
        res.status(400).json({ message: "❌ Missing required fields" });
        return;
      }
  
      // ✅ 检查是否已有相同的任务
      const existingTask = await Task.findOne({
        where: { sourceBinID, destinationBinID, status: "pending" },
      });
  
      if (existingTask) {
        res.status(409).json({ message: "⚠️ Task already exists with these Bin IDs." });
        return;
      }
  
      // ✅ 创建任务
      const task = await Task.create({
        sourceBinID,
        destinationBinID,
        accountID,
        productID: "ALL",
        status: "pending",
        createdAt: new Date(),
        updatedAt: null,
      });
  
      res.status(201).json({
        message: `✅ Task created successfully`,
        task,
      });
    } catch (error) {
      // ✅ 类型断言为 Error
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("❌ Error creating task:", errorMessage);
      res.status(500).json({ message: "❌ Internal Server Error", error: errorMessage });
    }
  };

/**
 * 获取所有 "pending" 状态的任务
 * @route GET /api/task/pending
 */
export const getPendingTasks = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const pendingTasks = await Task.findAll({
        where: { status: "pending" },
      });
  
      res.status(200).json({
        message: `✅ 查询成功，共 ${pendingTasks.length} 条任务`,
        tasks: pendingTasks,
      });
    } catch (error: unknown) { // 👈 显式声明 error
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("❌ Error fetching pending tasks:", errorMessage);
      res.status(500).json({ message: "❌ Internal Server Error", error: errorMessage });
    }
  };