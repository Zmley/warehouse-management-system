import axios from "axios";
import { getAccessToken } from "../utils/storage";

const API_BASE_URL = process.env.SERVER_API_BASE_URL || "http://localhost:5001";

// ✅ 创建全局 Axios 实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ 添加请求拦截器，在所有请求的 headers 里加上 `Authorization`
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;