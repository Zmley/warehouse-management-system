import apiClient from "./axiosClient.ts";  

export const processBinTask = async (warehouseID: string, binID: string, isLoadingToCar: boolean) => {
  try {
    const endpoint = isLoadingToCar 
      ? "/api/transport/load-cargo" 
      : "/api/transport/unload-cargo"; // ✅ 确保 `transport` 路由正确

    // ✅ **修正参数，Unloading 时使用 `unLoadBinID`**
    const payload = isLoadingToCar
      ? { warehouseID, binID } // ✅ Load Cargo
      : { warehouseID, unLoadBinID: binID }; // ✅ Unload Cargo

    console.log(`📡 Calling ${endpoint} with payload:`, payload); 

    const response = await apiClient.post(endpoint, payload);
    return response.data;
  } catch (error: any) {
    console.error("❌ Error in processBinTask:", error.response?.data || error.message);
    throw error;
  }
};