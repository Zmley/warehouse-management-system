import { Request, Response } from "express";
import Task from "../models/task";
import Bin from "../models/bin";
import Inventory from "../models/inventory";
import { AuthRequest } from "../middleware/authMiddleware";
import {  getPickerProduct, getWarehouseID, hasActiveTask } from '../utils/task'


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
    const accountID = req.user?.sub; // ✅ 获取当前用户 ID

    console.log("test////////////////////////////////////////" +accountID);

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


    // ✅ 创建任务，并把 `creatorID` 设为当前 `accountID`
    const task = await Task.create({
      sourceBinID,
      destinationBinID,
      accountID: "TBD",
      creatorID: accountID, // ✅ 设置创建者 ID
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
    // ✅ 处理异常
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Error creating task:", errorMessage);
    res.status(500).json({ message: "❌ Internal Server Error", error: errorMessage });
  }
};





export const createPickerTask = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { destinationBinID } = req.body;
    const accountID = req.user?.sub; // ✅ 获取当前用户 ID

    if (!destinationBinID || !accountID) {
      res.status(400).json({ message: "❌ Missing required fields" });
      return;
    }

    // ✅ 获取当前用户的 warehouseID
    const warehouseID = await getWarehouseID(accountID);
    if (!warehouseID) {
      res.status(400).json({ message: "❌ User does not belong to any warehouse" });
      return;
    }

    // ✅ 检查是否已有相同的任务
    const existingTask = await Task.findOne({
      where: { destinationBinID, status: "pending" },
    });

    if (existingTask) {
      res.status(409).json({ message: "⚠️ A pending task already exists for this destination." });
      return;
    }

    // ✅ 获取 `destinationBinID` 关联的 `productID`
    const productID = await getPickerProduct(destinationBinID);

    if (!productID) {
      res.status(404).json({ message: "❌ No product found in destination bin" });
      return;
    }

    // ✅ 查找 `inventory` 记录，获取 `binID` 和 `quantity`
    const inventories = await Inventory.findAll({
      where: { productID },
      attributes: ["binID", "quantity"],
    });

    const binIDs = inventories.map((inv) => inv.binID);

    // ✅ 在 `bin` 表中筛选 `warehouseID` 匹配的 `binID`，并且 `type = inventory`
    const validBins = await Bin.findAll({
      where: { binID: binIDs, warehouseID, type: "inventory" }, // ✅ 增加 `type` 过滤
      attributes: ["binID", "binCode"],
    });

    if (!validBins.length) {
      res.status(404).json({ message: "❌ No valid bins found in warehouse for this product" });
      return;
    }

    // ✅ 组装 `sourceBin` 信息
    const sourceBins = validBins.map((bin) => {
      const matchingInventory = inventories.find((inv) => inv.binID === bin.binID);
      return {
        binID: bin.binID,
        binCode: bin.binCode,
        quantity: matchingInventory?.quantity || 0,
      };
    });

    // ✅ 创建任务，`accountID` 既是任务负责人也是创建者
    const task = await Task.create({
      sourceBinID: JSON.stringify(sourceBins), // ✅ 存储完整的 `sourceBin` 信息
      destinationBinID,
      accountID: "TBD", // 任务归属者
      creatorID: accountID, // ✅ 设置创建者 ID
      productID, // ✅ 直接存储 `productID`
      status: "pending",
      createdAt: new Date(),
      updatedAt: null,
    });

    res.status(201).json({
      message: `✅ Picker Task created successfully`,
      task,
      sourceBins, // ✅ 直接返回完整的 `sourceBins` 结构
    });
  } catch (error) {
    // ✅ 处理异常
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Error creating picker task:", errorMessage);
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





export const acceptTask = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { taskID } = req.body;
    const accountID = req.user?.sub; // ✅ 获取当前用户 ID

    if (!taskID || !accountID) {
      res.status(400).json({ message: "❌ Missing required fields" });
      return;
    }

    // ✅ 检查用户是否已有任务正在进行
    const isActive = await hasActiveTask(accountID);
    if (isActive) {
      res.status(409).json({ message: "⚠️ You already have an active task in progress." });
      return;
    }

    // ✅ 查找任务
    const task = await Task.findOne({ where: { taskID } });

    if (!task) {
      res.status(404).json({ message: "❌ Task not found" });
      return;
    }

    // ✅ 确保任务仍然是 `pending`，否则不能接受
    if (task.status !== "pending") {
      res.status(400).json({ message: "⚠️ Task is already in progress or completed" });
      return;
    }

    // ✅ 更新任务的 `accountID` 和 `status`
    task.accountID = accountID;
    task.status = "inProgress"; // ✅ 状态变更为 `inProcess`
    await task.save();

    res.status(200).json({
      message: `✅ Task accepted successfully and is now in progress`,
      task,
    });
  } catch (error) {
    // ✅ 处理异常
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Error accepting task:", errorMessage);
    res.status(500).json({ message: "❌ Internal Server Error", error: errorMessage });
  }
};




export const checkOngoingTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const accountID = req.user?.sub; // ✅ 通过 JWT 解析 `accountID`

    if (!accountID) {
      res.status(400).json({ message: "❌ Missing accountID in request" });
      return;
    }

    // ✅ 检查 `task` 表中是否有 `status = "inProgress"` 且 `accountID = 当前用户`
    const ongoingTask = await Task.findOne({
      where: { accountID, status: "inProgress" },
    });

    res.status(200).json({ hasTask: !!ongoingTask }); // ✅ 返回 `true`（有任务）或 `false`（无任务）
  } catch (error) {
    console.error("❌ Error checking ongoing task:", error);
    res.status(500).json({ message: "❌ Internal Server Error" });
  }
};