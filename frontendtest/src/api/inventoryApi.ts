import apiClient from "./axiosClient.ts.js"; // ✅ 复用全局 API 客户端

/**
 * ✅ 获取所有库存数据
 */
export const fetchInventory = async () => {
  try {
    const response = await apiClient.get("/api/inventory");
    console.log("🟢 获取库存数据成功:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ 获取库存数据失败:", error);
    throw error;
  }
};

/**
 * ✅ 添加新的库存数据
 */
export const addInventoryItem = async (item: {
  warehouse_code: string;
  bin_code: string;
  product_code: string;
  quantity: number;
  bin_qr_code: string;
}) => {
  try {
    const response = await apiClient.post("/api/inventory", item);
    console.log("🟢 添加库存成功:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ 添加库存失败:", error);
    throw error;
  }
};

/**
 * ✅ 更新库存数据
 */
export const updateInventoryItem = async (id: string, updatedData: Partial<any>) => {
  try {
    const response = await apiClient.put(`/api/inventory/${id}`, updatedData);
    console.log("🟢 更新库存成功:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ 更新库存失败:", error);
    throw error;
  }
};

/**
 * ✅ 删除库存数据
 */
export const deleteInventoryItem = async (id: string) => {
  try {
    await apiClient.delete(`/api/inventory/${id}`);
    console.log(`🟢 删除库存成功: ${id}`);
  } catch (error) {
    console.error(`❌ 删除库存失败: ${id}`, error);
    throw error;
  }
};

/**
 * ✅ 获取单个库存项
 */
export const fetchInventoryItem = async (id: string) => {
    try {
      console.log(`🔍 Fetching inventory item with ID: ${id}`);
      
      const response = await apiClient.get(`/api/inventory/${id}`);
      
      console.log("✅ Inventory item received:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Failed to fetch inventory item:", error);
      throw error;
    }
  };


