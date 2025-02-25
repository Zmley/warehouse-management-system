import apiClient from "./axiosClient.ts"; // ✅ 确保 axiosClient 正确引入

// ✅ 扫描 QR 码并处理扫描结果
export const scanQRCode = async (qrCodeValue: string) => {
  try {
    const response = await apiClient.post("/api/scan", { qrCodeValue });
    return response.data;
  } catch (error: any) {
    console.error("❌ Scan API Error:", error.response?.data || error.message);
    throw error;
  }
};