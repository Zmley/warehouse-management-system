import Inventory from '../models/inventory';

/**
 * ✅ 批量更新 binID 和 ownedBy 字段
 * @param binIDs 要更新的 binID 数组
 * @param accountId 当前用户的 accountId (上货时使用)
 * @param newBinID (卸货时使用) 新的 binID
 * @param isLoadingToCar 是否为上货操作 (默认 true 为上货)
 * @returns 返回更新结果
 */
export const updateBinOwnership = async (
  binIDs: string[], // 需要更新的 binID 数组
  accountId: string, // 当前用户的 accountId
  newBinID: string = 'car', // 默认上货时 binID 为 'car'
  isLoadingToCar: boolean = true // 是否是上货操作，默认是上货
) => {
  try {
    // 根据是否为上货操作来设置更新的数据
    const updateData = isLoadingToCar
      ? { binID: 'car', ownedBy: accountId } // 上货：将 binID 更新为 'car'，并将 ownedBy 更新为 accountId
      : { binID: newBinID, ownedBy: 'warehouse' }; // 卸货：将 binID 更新为目标 binID，ownedBy 更新为 'warehouse'

    // 执行批量更新操作
    const updatedItems = await Inventory.update(updateData, {
      where: {
        binID: binIDs, // 匹配所有传入的 binID
        ownedBy: accountId // 确保只有当前用户正在操作的记录会被更新
      }
    });

    // 如果没有记录被更新，抛出一个错误
    if (updatedItems[0] === 0) {
      throw new Error('No matching binIDs found to update');
    }

    // 返回更新成功的记录数量
    return updatedItems;
  } catch (error) {
    console.error('❌ Error updating bin ownership:', error);
    throw new Error('Internal Server Error');
  }
};