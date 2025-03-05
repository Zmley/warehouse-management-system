import apiClient from "./axiosClient.ts.js"; // 确保 axiosClient 正确引入

// 更新 bin 所有权的 API 调用
export const updateBinOwnership = async (binID: string, accountId: string) => {
  try {
    // 发送 POST 请求到 /api/update-bin-ownership 路由
    const response = await apiClient.post("/api/update-bin-ownership", { binID, accountId });
    return response.data;
  } catch (error: any) {
    console.error("❌ Error updating bin ownership:", error.response?.data || error.message);
    throw error;
  }
};