import { Request, Response } from 'express'
import { AuthRequest } from '../middleware/authMiddleware'
import { createTask, updateTaskStatus } from '../utils/transportTask'
import { loadCargoHelper, unloadCargoHelper } from '../utils/transportTask'
import {  getCarIdByAccountId , getProductsByBinId } from '../utils/task'
import Inventory from '../models/inventory'
import Task from "../models/task"
import User from "../models/User" // ✅ 新增 User Model 引用
import Bin from "../models/bin";
import { Op } from "sequelize";




export const loadCargo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { binID } = req.body
    const accountId = req.user?.sub

    if (!binID || !accountId) {
      res.status(400).json({ message: '❌ Missing binID or accountId' })
      return
    }

    // ✅ 获取用户的 CarID
    const user = await User.findOne({ where: { accountID: accountId } })
    if (!user || !user.CarID) {
      res.status(400).json({ message: '❌ User does not have a CarID assigned' })
      return
    }
    const carID = user.CarID

    const updatedCount = await loadCargoHelper(binID, carID, accountId)

    if (updatedCount === 0) {
      res.status(404).json({ message: '❌ No matching binID found to update' })
      return
    }

    // await createTask(binID, carID, accountId)

    res.status(200).json({
      message: `✅ BinID updated to "${carID}" and owned by "car".`
    })
  } catch (error) {
    console.error('❌ Error loading cargo:', error)
    res.status(500).json({ message: '❌ Internal Server Error' })
  }
}

export const unloadCargo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { unLoadBinID, productList } = req.body;
    const accountId = req.user?.sub;

    if (!unLoadBinID || !accountId) {
      res.status(400).json({ message: "❌ Missing unLoadBinID or accountId" });
      return;
    }

    if (!Array.isArray(productList) || productList.length === 0) {
      res.status(400).json({ message: "❌ Product list is required for unloading" });
      return;
    }

    // ✅ 获取用户的 CarID
    const user = await User.findOne({ where: { accountID: accountId } });
    if (!user || !user.CarID) {
      res.status(400).json({ message: "❌ User does not have a CarID assigned" });
      return;
    }
    const carID = user.CarID;

    // ✅ 处理部分卸货
    const updatedCount = await unloadCargoHelper(unLoadBinID, carID, accountId, productList);

    if (updatedCount === 0) {
      res.status(404).json({ message: "❌ No matching products found to update" });
      return;
    }

    // ✅ 更新任务状态
    await updateTaskStatus(accountId, unLoadBinID);

    res.status(200).json({
      message: `✅ Cargo successfully unloaded into ${unLoadBinID}.`,
      updatedProducts: updatedCount,
    });
  } catch (error) {
    console.error("❌ Error unloading cargo:", error);
    res.status(500).json({ message: "❌ Internal Server Error" });
  }
};
















//test.....................................................................................for transportor to scan pick up area bin 



export const scanPickerareaBin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { pickerBinID } = req.body;
    const accountID = req.user?.sub; // ✅ 获取当前用户 ID

    if (!pickerBinID || !accountID) {
      res.status(400).json({ message: "❌ Missing pickerBinID or accountID" });
      return;
    }

    // ✅ 查找用户的 `CarID`
    const user = await User.findOne({ where: { accountID } });
    if (!user || !user.CarID) {
      res.status(400).json({ message: "❌ User does not have a CarID assigned" });
      return;
    }
    const carID = user.CarID;

    // ✅ 查询 `pickerBinID` 允许的 `productID`
    const pickerBin = await Bin.findOne({ where: { binID: pickerBinID }, attributes: ["productID"] });

    if (!pickerBin || !pickerBin.productID) {
      res.status(400).json({ message: "❌ pickerBinID must have a predefined productID." });
      return;
    }

    const requiredProductID = pickerBin.productID;

    // ✅ 查询 `carID` 里是否有该 `productID`
    const productInCar = await Inventory.findOne({
      where: { binID: carID, productID: requiredProductID },
      attributes: ["inventoryID", "quantity", "productID"],
    });

    if (!productInCar) {
      res.status(404).json({
        message: `❌ Car does not contain the required product: ${requiredProductID}`,
        carID,
        requiredProductID,
      });
      return;
    }

    // ✅ 查询 `pickerBinID` 在 `Inventory` 里是否已经存在
    const existingPickerBin = await Inventory.findOne({
      where: { binID: pickerBinID, productID: requiredProductID },
    });

    if (existingPickerBin) {
      // ✅ `pickerBinID` 已有 `productID`，直接加数量
      await existingPickerBin.update({
        quantity: existingPickerBin.quantity + productInCar.quantity,
      });

      // ✅ 删除 `carID` 里的 `row`
      await Inventory.destroy({ where: { inventoryID: productInCar.inventoryID } });

      res.status(200).json({
        message: `✅ Moved ${productInCar.quantity} of ${requiredProductID} to picker bin ${pickerBinID}`,
        updatedQuantity: existingPickerBin.quantity,
      });
    } else {
      // ✅ `pickerBinID` 为空，直接更新 `binID`
      await productInCar.update({ binID: pickerBinID, ownedBy: "pick" });

      res.status(200).json({
        message: `✅ Product ${requiredProductID} moved from car ${carID} to picker bin ${pickerBinID}`,
        movedProductID: requiredProductID,
      });
    }
  } catch (error: any) {
    console.error("❌ Error scanning picker area bin:", error.message);
    res.status(500).json({ message: "❌ Internal Server Error", error: error.message });
  }
};






//test for the get task status -------------------------------------------------------------------------------------------


// ✅ 获取 binID 对应的 BinCode
const getBinCode = async (binInput: string | null): Promise<string | null> => {
  if (!binInput) return null;

  try {
    // ✅ 尝试解析 JSON，如果解析成功，则提取 binCode
    let binIDsArray: { binID: string; binCode: string }[] | null = null;
    
    try {
      binIDsArray = JSON.parse(binInput); // 尝试解析 JSON
    } catch (e) {
      binIDsArray = null; // 解析失败，则视为单个 binID
    }

    if (Array.isArray(binIDsArray)) {
      // ✅ 解析成功，提取 `binCode`
      const binCodes = binIDsArray.map((bin) => bin.binCode).filter(Boolean);
      return binCodes.length ? binCodes.join("/") : null;
    } else {
      // ✅ 解析失败，说明是单个 binID，直接查询数据库
      const bin = await Bin.findOne({ where: { binID: binInput } });
      return bin ? bin.binCode : null;
    }
  } catch (error) {
    console.error(`❌ Error fetching BinCode for input ${binInput}:`, error);
    return null;
  }
};



export const getUserTaskStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const accountId = req.user?.sub; // 获取用户 ID
    if (!accountId) {
      res.status(400).json({ message: "❌ Missing accountId" });
      return;
    }

    // 查询用户的最新任务状态
    const task = await Task.findOne({
      where: { accountID: accountId },
      order: [["updatedAt", "DESC"]], // 获取最新的一条任务记录
    });

    if (!task) {
      res.status(200).json({ status: "completed", currentBinID: null, productList: [] }); // 默认状态为 completed
      return;
    }

    const binCode = await getBinCode(task.sourceBinID);
    const targetCode = await getBinCode(task.destinationBinID);

    // ✅ 获取当前 Bin 的产品列表
    const CarID = await getCarIdByAccountId(accountId);
    const productList = await getProductsByBinId(CarID);

    res.status(200).json({
      status: task.status, // 任务状态（"inProgress" | "completed"）
      currentBinID: task.sourceBinID, // 任务对应的 binID
      taskID: task.taskID, // 任务 ID
      binCode: binCode,
      targetBin: task.destinationBinID,
      targetCode: targetCode,
      carID:CarID,
      productList: productList, // ✅ 额外返回产品列表
      pickerNeededProduct: task.productID || null, // ✅ 任务所需的 `productID`
    });
  } catch (error) {
    console.error("❌ Error fetching user task status:", error);
    res.status(500).json({ message: "❌ Internal Server Error" });
  }
};