import { Request, Response } from 'express';
import Inventory from '../models/inventory';
import { AuthRequest } from '../middleware/authMiddleware'; // 确保导入 AuthRequest 类型


/**
 * ✅ 处理上货请求
 * 更新库存中所有相关的 binID 记录的 ownedBy 字段，并将 binID 变更为 car
 */
export const loadCargo = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { binID } = req.body;
      const accountId = req.user?.sub; // 从 `req.user` 中获取用户的 `sub` 作为 `accountId`
  
      // ✅ 校验参数
      if (!binID || !accountId) {
        res.status(400).json({ message: '❌ Missing binID or accountId' });
        return;
      }
  
      // ✅ 执行更新操作，将所有相关的 binID 更新为 car，并将 ownedBy 更新为 accountId
      const updatedItems = await Inventory.update(
        { 
          binID: 'car', // 将所有匹配的 binID 更新为 car
          ownedBy: accountId // 将 ownedBy 更新为当前的 accountId
        },
        { 
          where: { binID } // 根据传入的 binID 查找所有相关的库存记录
        }
      );
  
      // ✅ 如果没有记录被更新，返回 404 错误
      if (updatedItems[0] === 0) {
        res.status(404).json({ message: '❌ No matching binID found to update' });
        return;
      }
  
      // ✅ 返回成功响应
      res.status(200).json({ message: `✅ Bin ownership updated successfully for binID: ${binID}, now it's in a car controlled by user: ${accountId}` });
    } catch (error) {
      console.error('❌ Error updating bin ownership:', error);
      res.status(500).json({ message: '❌ Internal Server Error' });
    }
  };


/**
 * ✅ 处理卸货请求
 * 将 binID 变回新值，并将 ownedBy 更新为 warehouse
 */
export const unloadCargo = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { unLoadBinID } = req.body; // 接收卸货的 binID
      const accountId = req.user?.sub; // 从 `req.user` 中获取用户的 `sub` 作为 `accountId`
  
      // ✅ 校验参数
      if (!unLoadBinID || !accountId) {
        res.status(400).json({ message: '❌ Missing unLoadBinID or accountId' });
        return;
      }
  
      // ✅ 执行更新操作，将 binID 更新为新值，并将 ownedBy 更新为 warehouse
      const updatedItems = await Inventory.update(
        { 
          binID: unLoadBinID, // 将 binID 更新为新值
          ownedBy: 'warehouse' // 将 ownedBy 更新为 warehouse
        },
        { 
          where: { binID: 'car', ownedBy: accountId } // 仅更新正在车上，且由当前用户操作的记录
        }
      );
  
      // ✅ 如果没有记录被更新，返回 404 错误
      if (updatedItems[0] === 0) {
        res.status(404).json({ message: '❌ No matching binID found to update' });
        return;
      }
  
      // ✅ 返回成功响应
      res.status(200).json({ message: `✅ Bin ownership updated successfully for unLoadBinID: ${unLoadBinID}, now it's in warehouse` });
    } catch (error) {
      console.error('❌ Error updating bin ownership:', error);
      res.status(500).json({ message: '❌ Internal Server Error' });
    }
  };