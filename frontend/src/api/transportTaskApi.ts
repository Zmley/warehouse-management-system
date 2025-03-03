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
    return response.data;
  } catch (error: any) {
    console.error("❌ Error in processBinTask:", error.response?.data || error.message);
    throw error;
  }
};