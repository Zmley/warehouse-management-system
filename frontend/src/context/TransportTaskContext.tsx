import { createContext, useContext, useState, ReactNode } from "react";

type TransportStatus = "pending" | "process"; // 只保留两个状态

interface TransportContextProps {
  transportStatus: TransportStatus;
  sourceBinID: string | null;
  warehouseID: string | null;
  startTask: (warehouse: string, bin: string) => void;
  proceedToUnload: () => void;
  resetTask: () => void;
}

const TransportContext = createContext<TransportContextProps | undefined>(undefined);

export const TransportProvider = ({ children }: { children: ReactNode }) => {
  const [transportStatus, setTransportStatus] = useState<TransportStatus>("pending");
  const [sourceBinID, setSourceBinID] = useState<string | null>(null);
  const [warehouseID, setWarehouseID] = useState<string | null>(null);

  // ✅ 开始任务，状态变为 process
  const startTask = (warehouse: string, bin: string) => {
    setWarehouseID(warehouse);
    setSourceBinID(bin);
    setTransportStatus("process");
  };

  // ✅ 继续下一步（卸货时）
  const proceedToUnload = () => {
    setTransportStatus("process"); // 这里不再使用 `inProcess2`
  };

  // ✅ 复位
  const resetTask = () => {
    setWarehouseID(null);
    setSourceBinID(null);
    setTransportStatus("pending");
  };

  return (
    <TransportContext.Provider value={{ transportStatus, sourceBinID, warehouseID, startTask, proceedToUnload, resetTask }}>
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