import { createContext, useContext, useState, ReactNode, useCallback } from "react";

type TransportStatus = "pending" | "process";

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
  const [, forceUpdate] = useState(0); // 👈 强制更新 UI

  const startTask = (warehouse: string, bin: string) => {
    setWarehouseID(warehouse);
    setSourceBinID(bin);
    setTransportStatus("process");
    forceUpdate((prev) => prev + 1); // 👈 触发 UI 重新渲染
  };

  const proceedToUnload = () => {
    setTransportStatus("process");
    forceUpdate((prev) => prev + 1);
  };

  const resetTask = useCallback(() => {
    setWarehouseID(null);
    setSourceBinID(null);
    setTransportStatus("pending");
    forceUpdate((prev) => prev + 1); // 👈 确保 UI 立刻刷新
  }, []);

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