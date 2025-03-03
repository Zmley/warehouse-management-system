import { createContext, useContext, useState, ReactNode, useCallback } from "react";

type TransportStatus = "pending" | "process";

interface TransportContextProps {
  transportStatus: TransportStatus;
  sourceBinID: string | null;
  startTask: (bin: string) => void;
  proceedToUnload: () => void;
  resetTask: () => void;
}

const TransportContext = createContext<TransportContextProps | undefined>(undefined);

export const TransportProvider = ({ children }: { children: ReactNode }) => {
  const [transportStatus, setTransportStatus] = useState<TransportStatus>("pending");
  const [sourceBinID, setSourceBinID] = useState<string | null>(null);
  const [, forceUpdate] = useState(0); 

  const startTask = (bin: string) => {
    setSourceBinID(bin);
    setTransportStatus("process");
    forceUpdate((prev) => prev + 1);
  };

  const proceedToUnload = () => {
    setTransportStatus("process");
    forceUpdate((prev) => prev + 1);
  };

  const resetTask = useCallback(() => {
    setSourceBinID(null);
    setTransportStatus("pending");
    forceUpdate((prev) => prev + 1);
  }, []);

  return (
    <TransportContext.Provider value={{ transportStatus, sourceBinID, startTask, proceedToUnload, resetTask }}>
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