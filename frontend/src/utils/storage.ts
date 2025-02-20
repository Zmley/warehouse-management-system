// 文件路径: src/utils/storage.ts

/**
 * ✅ 存储用户 Token
 */
export const saveTokens = (data: { accessToken: string; idToken: string; refreshToken: string }) => {
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("idToken", data.idToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    console.log("✅ Tokens stored:", data);
  };
  
  /**
   * ✅ 获取用户 Token
   */
  export const getAccessToken = (): string | null => {
    return localStorage.getItem("accessToken");
  };
  
  /**
   * ✅ 清除 Token
   */
  export const clearTokens = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("idToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    console.log("❌ Tokens removed, user logged out");
  };