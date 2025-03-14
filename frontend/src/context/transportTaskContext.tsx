import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { getUserTaskStatus } from "../api/transportTaskApi";

// ✅ 定义产品信息接口
interface Product {
  productID: string;
  quantity: number;
  inventoryID: string;
  selected: boolean;
}

// ✅ 定义任务数据接口
interface TaskData {
  taskID: string;
  binCode: string;
  targetCode: string;
  productList: Product[];
  pickerNeededProduct?: string;
}

// ✅ 定义 Context 需要提供的状态和方法
interface TransportContextProps {
  transportStatus: "completed" | "inProgress" | null;
  taskData: TaskData;
  fetchTaskStatus: () => Promise<void>;
  clearTaskData: () => void; // ✅ 添加清除数据的方法
  selectedProducts: Product[];
  setSelectedProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

const TransportContext = createContext<TransportContextProps | undefined>(undefined);

export const TransportProvider = ({ children }: { children: ReactNode }) => {
  const [transportStatus, setTransportStatus] = useState<"completed" | "inProgress" | null>(null);

  // ✅ 初始化 `taskData`
  const [taskData, setTaskData] = useState<TaskData>({
    taskID: "",
    binCode: "",
    targetCode: "",
    productList: [],
    pickerNeededProduct: undefined,
  });

  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);

  // ✅ 获取任务状态并更新 `taskData`
  const fetchTaskStatus = useCallback(async () => {
    try {
      const response = await getUserTaskStatus();
      setTransportStatus(response.status);

      const updatedProductList = response.productList?.map((product: Product) => ({
        productID: product.productID,
        quantity: product.quantity,
        inventoryID: product.inventoryID || "",
        selected: true,
      })) || [];

      setTaskData({
        taskID: response.taskID || "",
        binCode: response.binCode || "",
        targetCode: response.targetCode || "",
        productList: updatedProductList,
        pickerNeededProduct: response.pickerNeededProduct || undefined,
      });

      setSelectedProducts(updatedProductList);
      console.log(`🚀 Updated Transport Status: ${response.status}`, response);
    } catch (error) {
      console.error("❌ Failed to fetch task status:", error);
    }
  }, []);

  // ✅ 清除任务数据的方法
  const clearTaskData = () => {
    setTaskData({
      taskID: "",
      binCode: "",
      targetCode: "",
      productList: [],
      pickerNeededProduct: undefined,
    });
    setSelectedProducts([]);
    setTransportStatus(null);
    console.log("🧹 Task data cleared!");
  };

  return (
    <TransportContext.Provider value={{
      transportStatus,
      taskData,
      fetchTaskStatus,
      clearTaskData, // ✅ 提供清空数据的方法
      selectedProducts,
      setSelectedProducts,
    }}>
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