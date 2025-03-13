import apiClient from "./axiosClient.ts";  


export const checkOngoingTask = async (): Promise<boolean> => {
  try {
    const response = await apiClient.get("/api/tasks/check-ongoing-task");
    return response.data.hasTask; // ✅ 确保 `true` / `false`
  } catch (error) {
    console.error("❌ Error checking ongoing task:", error);
    return false; // ❌ 出错时默认返回 `false`
  }
};

export const processBinTask = async (
  binID: string,
  isLoadingToCar: boolean,
  selectedProducts?: { productID: string; quantity: number; inventoryID: string }[] // ✅ 确保传递 `inventoryID`
) => {
  try {
    const endpoint = isLoadingToCar
      ? "/api/transport/load-cargo"
      : "/api/transport/unload-cargo";

    const payload = isLoadingToCar
      ? { binID, action: "load" } // ✅ Load 任务，不需要产品列表
      : { 
          unLoadBinID: binID, 
          action: "unload", 
          productList: selectedProducts?.map(({ productID, quantity, inventoryID }) => ({
            productID,
            quantity,
            inventoryID, 
          })) || [] 
        }; 

    console.log(`📡 Calling ${endpoint} with payload:`, JSON.stringify(payload, null, 2));

    const response = await apiClient.post(endpoint, payload);

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error("❌ Error in processBinTask:", error.response?.data || error.message);

    return {
      success: false,
      error: error.response?.data || error.message,
    };
  }
};



/**
 * 获取当前用户的任务状态
 * @returns {Promise<{ status: string; currentBinID: string | null }>}
 */
export const getUserTaskStatus = async () => {
  try {
    console.log("📡 Fetching user task status...");
    const response = await apiClient.get("/api/transport/user-task-status");
    console.log("✅ Task status received:", response.data);
    return response.data; // { status: "inProgress" | "completed", currentBinID: "xxx" | null }
  } catch (error: any) {
    console.error("❌ Error fetching task status:", error.response?.data || error.message);
    throw error;
  }
};