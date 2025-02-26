import { Request, Response } from 'express';
import Inventory from '../models/inventory';
import { AuthRequest } from '../middleware/authMiddleware'; // 确保导入 AuthRequest 类型


export const loadCargo = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { binID } = req.body;
      const accountId = req.user?.sub; 
  
      if (!binID || !accountId) {
        res.status(400).json({ message: '❌ Missing binID or accountId' });
        return;
      }
  
      const updatedItems = await Inventory.update(
        { 
          binID: 'car', 
          ownedBy: accountId 
        },
        { 
          where: { binID } 
        }
      );
  
      if (updatedItems[0] === 0) {
        res.status(404).json({ message: '❌ No matching binID found to update' });
        return;
      }
  
      res.status(200).json({ message: `✅ Bin ownership updated successfully for binID: ${binID}, now it's in a car controlled by user: ${accountId}` });
    } catch (error) {
      console.error('❌ Error updating bin ownership:', error);
      res.status(500).json({ message: '❌ Internal Server Error' });
    }
  };


export const unloadCargo = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { unLoadBinID } = req.body; 
      const accountId = req.user?.sub; 
  
      if (!unLoadBinID || !accountId) {
        res.status(400).json({ message: '❌ Missing unLoadBinID or accountId' });
        return;
      }
  
      const updatedItems = await Inventory.update(
        { 
          binID: unLoadBinID, 
          ownedBy: 'warehouse' 
        },
        { 
          where: { binID: 'car', ownedBy: accountId } 
        }
      );
  
      if (updatedItems[0] === 0) {
        res.status(404).json({ message: '❌ No matching binID found to update' });
        return;
      }
  
      res.status(200).json({ message: `✅ Bin ownership updated successfully for unLoadBinID: ${unLoadBinID}, now it's in warehouse` });
    } catch (error) {
      console.error('❌ Error updating bin ownership:', error);
      res.status(500).json({ message: '❌ Internal Server Error' });
    }
  };