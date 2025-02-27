import { createContext, useContext, useState, ReactNode } from "react";

type TransportStatus = "pending" | "inProcess1" | "inProcess2";

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

  // ✅ 确保更新状态后，组件会重新渲染
  const startTask = (warehouse: string, bin: string) => {
    setWarehouseID(warehouse);
    setSourceBinID(bin);
    setTransportStatus("inProcess1");
  };

  const proceedToUnload = () => {
    setTransportStatus("inProcess2");
  };

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