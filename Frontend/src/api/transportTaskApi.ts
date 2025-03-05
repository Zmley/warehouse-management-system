import apiClient from "./axiosClient.ts";  

export const processBinTask = async (binID: string, isLoadingToCar: boolean) => {
  try {
    const endpoint = isLoadingToCar 
      ? "/api/transport/load-cargo" 
      : "/api/transport/unload-cargo"; 

    const payload = isLoadingToCar
      ? { binID, action: "load" }  // ✅ Load 任务，binID 直接传输
      : { unLoadBinID: binID, action: "unload" };  // ✅ Unload 任务，binID 作为 unLoadBinID

    console.log(`📡 Calling ${endpoint} with payload:`, payload); 

    const response = await apiClient.post(endpoint, payload);

    // ✅ 确保返回的对象里有 `success` 字段
    return {
      success: true,
      data: response.data, // 可能包含 `message` 或其他返回信息
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