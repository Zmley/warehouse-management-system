import { Request, Response } from 'express'
import { AuthRequest } from '../middleware/authMiddleware'
import { createTask, updateTaskStatus } from '../utils/transportTask'
import { loadCargoHelper, unloadCargoHelper } from '../utils/transportTask'
import Inventory from '../models/inventory'
import Task from "../models/task"


export const loadCargo = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { binID, warehouseID } = req.body
    const accountId = req.user?.sub

    if (!binID || !warehouseID || !accountId) {
      res
        .status(400)
        .json({ message: '❌ Missing binID, warehouseID, or accountId' })
      return
    }

    const updatedProducts = await Inventory.findAll({
      where: { binID, warehouseID },
      attributes: ['productID']
    })

    if (!updatedProducts.length) {
      res.status(404).json({ message: '❌ No items found in this bin.' })
      return
    }

    const updatedCount = await loadCargoHelper(binID, warehouseID, accountId)

    if (updatedCount === 0) {
      res.status(404).json({ message: '❌ No matching binID found to update' })
      return
    }

    await createTask(warehouseID, binID, accountId, updatedProducts)

    res
      .status(200)
      .json({
        message: `✅ BinID updated to "car" and owned by ${accountId} for warehouse ${warehouseID}.`
      })
  } catch (error) {
    console.error('❌ Error loading cargo:', error)
    res.status(500).json({ message: '❌ Internal Server Error' })
  }
}

export const unloadCargo = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { unLoadBinID, warehouseID } = req.body
    const accountId = req.user?.sub

    if (!unLoadBinID || !warehouseID || !accountId) {
      res
        .status(400)
        .json({ message: '❌ Missing unLoadBinID, warehouseID, or accountId' })
      return
    }

    const updatedCount = await unloadCargoHelper(
      unLoadBinID,
      warehouseID,
      accountId
    )

    if (updatedCount === 0) {
      res.status(404).json({ message: '❌ No matching binID found to update' })
      return
    }

    const products = await Task.findAll({
      where: {
        assignedUserID: accountId,
        warehouseID: warehouseID,
        status: 'inProgress'
      },
      attributes: ['productID']
    })

    for (const task of products) {
      await updateTaskStatus(
        accountId,
        warehouseID,
        task.productID,
        unLoadBinID
      )
    }

    res.status(200).json({
      message: `✅ Cargo successfully unloaded into ${unLoadBinID} in warehouse ${warehouseID}.`
    })
  } catch (error) {
    console.error('❌ Error unloading cargo:', error)
    res.status(500).json({ message: '❌ Internal Server Error' })
  }
}
