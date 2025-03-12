import Task from "../models/task";
import Inventory from "../models/inventory";
import User from "../models/User" // ✅ 新增 User Model 引用
import Bin from "../models/bin";







export const getCarIdByAccountId = async (accountId: string): Promise<string> => {
    try {
      if (!accountId) {
        console.warn("⚠️ Invalid accountId provided:", accountId);
        return "N/A";
      }
  
      const user = await User.findOne({
        where: { accountID: accountId },
        attributes: ["CarID"], // ✅ 只查询 carID
      });
  
      return user?.CarID || "N/A"; // ✅ 确保返回值不会为空
    } catch (error) {
      console.error(`❌ Error fetching carID for accountId ${accountId}:`, error);
      return "N/A"; // ✅ 发生错误时，返回 "N/A"
    }
  };







  export const getProductsByBinId = async (binID: string): Promise<{ productID: string; quantity: number,inventoryID: string }[]> => {
    try {
      if (!binID) return [];
  
      const productsInBin = await Inventory.findAll({
        where: { binID },
        attributes: ["productID", "quantity" ,"inventoryID"], // ✅ 直接查询 productName
      });
  
      return productsInBin.map((inventory) => ({
        productID: inventory.productID,
        quantity: inventory.quantity,
        inventoryID:inventory.inventoryID,
      }));
    } catch (error) {
      console.error(`❌ Error fetching products for binID ${binID}:`, error);
      return [];
    }
  };


  export const getBinType = async (binID: string): Promise<string | null> => {
    try {
      const bin = await Bin.findOne({
        where: { binID }, // 假设数据库的列名是 binID
        attributes: ["type"], // 只查询 type 字段
      });
  
      if (!bin) {
        console.warn(`⚠️ Bin not found for binID: ${binID}`);
        return null; // 如果 binID 不存在，返回 null
      }
  
      console.log(`✅ Found bin type for binID ${binID}: ${bin.type}`);
      return bin.type;
    } catch (error) {
      console.error("❌ Error fetching bin type:", error);
      return null;
    }
  };


  export const checkExistingInventory = async (binID: string, productID: string): Promise<boolean> => {
    try {
      const existingInventory = await Inventory.findOne({
        where: { binID, productID },
      });
  
      return !!existingInventory; // ✅ 如果找到匹配项，则返回 `true`
    } catch (error) {
      console.error(`❌ Error checking inventory for bin ${binID} and product ${productID}:`, error);
      return false;
    }
  };