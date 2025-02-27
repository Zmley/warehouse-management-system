import { Request, Response } from 'express';
import Inventory from '../models/inventory';
import { AuthRequest } from '../middleware/authMiddleware'; 


export const loadCargo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { binID, warehouseID } = req.body;
    const accountId = req.user?.sub; 

    if (!binID || !warehouseID || !accountId) {
      res.status(400).json({ message: "❌ Missing binID, warehouseID, or accountId" });
      return;
    }

    // ✅ 在 `Inventory` 表中更新 `binID="car"` 且 `ownedBy=accountId`
    const updatedItems = await Inventory.update(
      { binID: "car", ownedBy: accountId }, // 🚀 代表这个货物现在在车上，并且属于某个用户
      { where: { binID, warehouseID } }
    );

    if (updatedItems[0] === 0) {
      res.status(404).json({ message: "❌ No matching binID found to update" });
      return;
    }

    res.status(200).json({ message: `✅ BinID updated to "car" and owned by ${accountId} for warehouse ${warehouseID}.` });
  } catch (error) {
    console.error("❌ Error updating bin ownership:", error);
    res.status(500).json({ message: "❌ Internal Server Error" });
  }
};


export const unloadCargo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { unLoadBinID, warehouseID } = req.body; 
    const accountId = req.user?.sub; 

    if (!unLoadBinID || !warehouseID || !accountId) {
      res.status(400).json({ message: "❌ Missing unLoadBinID, warehouseID, or accountId" });
      return;
    }
    const updatedItems = await Inventory.update(
      { 
        binID: unLoadBinID, 
        ownedBy: "warehouse" 
      },
      { 
        where: { binID: "car", ownedBy: accountId, warehouseID } 
      }
    );

    if (updatedItems[0] === 0) {
      res.status(404).json({ message: "❌ No matching binID found to update" });
      return;
    }

    res.status(200).json({ 
      message: `✅ Cargo successfully unloaded into ${unLoadBinID} in warehouse ${warehouseID}.` 
    });
  } catch (error) {
    console.error("❌ Error updating bin ownership:", error);
    res.status(500).json({ message: "❌ Internal Server Error" });
  }
};