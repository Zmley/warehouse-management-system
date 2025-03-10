import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { getUserTaskStatus } from "../api/transportTaskApi";

type TransportStatus = "completed" | "inProgress" | null;

interface Product {
  productID: string;
  quantity: number;
}

interface TaskData {
  taskID: string;
  binCode: string;
  targetCode: string;
  productList: Product[]; // ✅ 新增 productList
}

interface TransportContextProps {
  transportStatus: TransportStatus;
  taskData: TaskData;
  fetchTaskStatus: () => Promise<void>;
}

const TransportContext = createContext<TransportContextProps | undefined>(undefined);

export const TransportProvider = ({ children }: { children: ReactNode }) => {
  const [transportStatus, setTransportStatus] = useState<TransportStatus>(null);
  const [taskData, setTaskData] = useState<TaskData>({
    taskID: "",
    binCode: "",
    targetCode: "",
    productList: [], // ✅ 初始化 productList
  });

  // ✅ 获取任务状态
  const fetchTaskStatus = useCallback(async () => {
    try {
      const response = await getUserTaskStatus();
      setTransportStatus(response.status);
      setTaskData({
        taskID: response.taskID,
        binCode: response.binCode,
        targetCode: response.targetCode,
        productList: response.productList || [], // ✅ 保存 productList
      });
      console.log(`🚀 Updated Transport Status: ${response.status}`, response);
    } catch (error) {
      console.error("❌ Failed to fetch task status:", error);
    }
  }, []);

  return (
    <TransportContext.Provider value={{ transportStatus, taskData, fetchTaskStatus }}>
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