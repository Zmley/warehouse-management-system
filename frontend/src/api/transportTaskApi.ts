import apiClient from "./axiosClient.ts";  

export const processBinTask = async (binID: string, isLoadingToCar: boolean) => {
  try {
    const endpoint = isLoadingToCar ? "/api/load-cargo" : "/api/unload-cargo"; 
    console.log(`Calling ${endpoint} with binID: ${binID}`); 
    const response = await apiClient.post(endpoint, { binID });
    return response.data;
  } catch (error: any) {
    console.error("❌ Error in processBinTask:", error.response?.data || error.message);
    throw error;
  }
};