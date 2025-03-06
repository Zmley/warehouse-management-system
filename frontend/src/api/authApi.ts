import apiClient from "./axiosClient.ts"; 

export const loginUser = async (email: string, password: string) => {
  const response = await apiClient.post("/api/auth/login", { email, password });
  return response.data;
};

export const fetchUserRole = async () => {
    console.log("loading for the role...");
    const response = await apiClient.get("/api/auth/me");
    console.log(" API return:", response.data); 
    return response.data.user?.role || null;
  };