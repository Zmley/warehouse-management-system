export const saveTokens = (data: { accessToken: string; idToken: string; refreshToken: string }) => {
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("idToken", data.idToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    console.log("✅ Tokens stored:", data);
  };
  
  export const getAccessToken = (): string | null => {
    return localStorage.getItem("accessToken");
  };
  
  export const clearTokens = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("idToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    console.log("❌ Tokens removed, user logged out");
  };

export const areTokensValid = (): boolean => {
    return !!(
      localStorage.getItem("accessToken") &&
      localStorage.getItem("idToken") &&
      localStorage.getItem("refreshToken")
    );
  };