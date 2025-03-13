import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { getUserTaskStatus } from "../api/transportTaskApi";

// ✅ 定义产品信息接口
interface Product {
  productID: string;
  quantity: number;
  inventoryID: string; // ✅ 添加 inventoryID
  selected: boolean;
}

// ✅ 定义任务数据接口
interface TaskData {
  taskID: string;
  binCode: string;
  targetCode: string;
  productList: Product[]; // ✅ 确保 `productList` 存在
  pickerNeededProduct?: string; // ✅ 新增 pickerNeededProduct
}

// ✅ 定义 Context 需要提供的状态和方法
interface TransportContextProps {
  transportStatus: "completed" | "inProgress" | null;
  taskData: TaskData;
  fetchTaskStatus: () => Promise<void>;
  selectedProducts: Product[];
  setSelectedProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

const TransportContext = createContext<TransportContextProps | undefined>(undefined);

export const TransportProvider = ({ children }: { children: ReactNode }) => {
  const [transportStatus, setTransportStatus] = useState<"completed" | "inProgress" | null>(null);
  
  // ✅ 初始化 `taskData`，确保 `productList` 是空数组
  const [taskData, setTaskData] = useState<TaskData>({
    taskID: "",
    binCode: "",
    targetCode: "",
    productList: [], 
     pickerNeededProduct: undefined, // ✅ 这里加上 pickerNeededProduct
  });

  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);

  // ✅ 获取任务状态，并更新 `taskData` 和 `selectedProducts`
  const fetchTaskStatus = useCallback(async () => {
    try {
      
      const response = await getUserTaskStatus();
      setTransportStatus(response.status);
  
      // ✅ 确保 `productList` 存在并包含 `inventoryID`
      const updatedProductList = response.productList?.map((product: Product) => ({
        productID: product.productID,
        quantity: product.quantity,
        inventoryID: product.inventoryID || "", // ⚠ 这里确保 inventoryID 存在
        selected: true, // ✅ 默认选中
      })) || [];
  
      setTaskData({
        taskID: response.taskID || "",
        binCode: response.binCode || "",
        targetCode: response.targetCode || "",
        productList: updatedProductList,
        pickerNeededProduct: response.pickerNeededProduct || null, // ✅ 赋值 pickerNeededProduct
      });
  
      // ✅ 让 `selectedProducts` **每次都更新**
      setSelectedProducts(updatedProductList);
  
      console.log(`🚀 Updated Transport Status: ${response.status}`, response);
    } catch (error) {
      console.error("❌ Failed to fetch task status:", error);
    }
  }, []);

  return (
    <TransportContext.Provider value={{
      transportStatus,
      taskData,
      fetchTaskStatus,
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