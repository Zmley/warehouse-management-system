import { Request, Response } from 'express'
import { AuthRequest } from '../middleware/authMiddleware'
import { createTask, updateTaskStatus } from '../utils/transportTask'
import { loadCargoHelper, unloadCargoHelper } from '../utils/transportTask'
import Inventory from '../models/inventory'
import Task from "../models/task"
import User from "../models/User" // ✅ 新增 User Model 引用

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

    await createTask(binID, carID, accountId)

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
    const { unLoadBinID } = req.body
    const accountId = req.user?.sub

    if (!unLoadBinID || !accountId) {
      res.status(400).json({ message: '❌ Missing unLoadBinID or accountId' })
      return
    }

    const user = await User.findOne({ where: { accountID: accountId } })
    if (!user || !user.CarID) {
      res.status(400).json({ message: '❌ User does not have a CarID assigned' })
      return
    }
    const carID = user.CarID

    const updatedCount = await unloadCargoHelper(unLoadBinID, carID, accountId)

    if (updatedCount === 0) {
      res.status(404).json({ message: '❌ No matching binID found to update' })
      return
    }

    await updateTaskStatus(accountId, unLoadBinID)

    res.status(200).json({
      message: `✅ Cargo successfully unloaded into ${unLoadBinID}.`
    })
  } catch (error) {
    console.error('❌ Error unloading cargo:', error)
    res.status(500).json({ message: '❌ Internal Server Error' })
  }
}