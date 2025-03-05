import apiClient from "./axiosClient.ts.js"; 

export const fetchInventory = async () => {
  try {
    const response = await apiClient.get("/api/inventory");
    console.log("🟢 fetch database data successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌:fetch database data failed", error);
    throw error;
  }
};

export const addInventoryItem = async (item: {
  warehouse_code: string;
  bin_code: string;
  product_code: string;
  quantity: number;
  bin_qr_code: string;
}) => {
  try {
    const response = await apiClient.post("/api/inventory", item);
    console.log("successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("add inventory failed:", error);
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


