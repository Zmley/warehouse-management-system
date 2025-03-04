import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { getUserTaskStatus } from "../api/transportTaskApi"; // ✅ 调用 API 获取任务状态

type TransportStatus = "completed" | "inProgress" | null;

interface TransportContextProps {
  transportStatus: TransportStatus;
  fetchTaskStatus: () => Promise<void>;
}

const TransportContext = createContext<TransportContextProps | undefined>(undefined);

export const TransportProvider = ({ children }: { children: ReactNode }) => {
  const [transportStatus, setTransportStatus] = useState<TransportStatus>(null);

  // ✅ 获取任务状态
  const fetchTaskStatus = useCallback(async () => {
    try {
      const response = await getUserTaskStatus(); // 调用 API
      setTransportStatus(response.status); // ✅ 确保状态正确更新
      console.log(`🚀 Updated Transport Status: ${response.status}`);
    } catch (error) {
      console.error("❌ Failed to fetch task status:", error);
    }
  }, []);

  return (
    <TransportContext.Provider value={{ transportStatus, fetchTaskStatus }}>
      {children}
    </TransportContext.Provider>
  );
};

export const useTransportContext = () => {
  const context = useContext(TransportContext);
  if (!context) {
    throw new Error("useTransportContext must be used within a TransportProvider");
  }
  return context;
};