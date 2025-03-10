import { Request, Response } from "express";
import Task from "../models/task";
import Bin from "../models/bin";
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
 * 通过 binId 获取 binCode
 * @param binId Bin 表中的 ID
 * @returns binCode 或者 "N/A"（如果未找到）
 */
export const getBinCodeById = async (binId: string): Promise<string> => {
  try {
    const bin = await Bin.findOne({
      where: { binID: binId },
      attributes: ["binCode"],
    });

    return bin ? bin.binCode : "N/A"; // ✅ 如果找不到，返回 "N/A"
  } catch (error) {
    console.error(`❌ Error fetching binCode for binId ${binId}:`, error);
    return "N/A"; // ✅ 发生错误时，返回 "N/A"
  }
};

/**
 * 获取所有 "pending" 状态的任务
 * @route GET /api/task/pending
 */
export const getPendingTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    // ✅ 查找所有 `pending` 任务
    const pendingTasks = await Task.findAll({
      where: { status: "pending" },
      attributes: ["taskID", "status", "sourceBinID", "destinationBinID"],
    });

    if (pendingTasks.length === 0) {
      res.status(200).json({ message: "✅ 没有待处理的任务", tasks: [] });
      return;
    }

    // ✅ 获取 sourceBinCode 和 destinationBinCode
    const formattedTasks = await Promise.all(
      pendingTasks.map(async (task) => ({
        id: task.taskID,
        status: task.status,
        sourceBinCode: await getBinCodeById(task.sourceBinID), // 获取来源仓位 binCode
        destinationBinCode: await getBinCodeById(task.destinationBinID), // 获取目标仓位 binCode
      }))
    );

    res.status(200).json({
      message: `✅ 查询成功，共 ${formattedTasks.length} 条任务`,
      tasks: formattedTasks,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Error fetching pending tasks:", errorMessage);
    res.status(500).json({ message: "❌ Internal Server Error", error: errorMessage });
  }
};