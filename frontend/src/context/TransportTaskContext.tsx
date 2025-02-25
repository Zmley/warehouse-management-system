import { createContext, useContext, useState, ReactNode } from "react";

interface TransportTaskContextProps {
  isInProcess: boolean;
  setIsInProcess: (status: boolean) => void;
}

const TransportTaskContext = createContext<TransportTaskContextProps | undefined>(undefined);

export const TransportTaskProvider = ({ children }: { children: ReactNode }) => {
  const [isInProcess, setIsInProcess] = useState<boolean>(false);

  return (
    <TransportTaskContext.Provider value={{ isInProcess, setIsInProcess }}>
      {children}
    </TransportTaskContext.Provider>
  );
};

export const useTransportTask = () => {
  const context = useContext(TransportTaskContext);
  if (!context) {
    throw new Error("useTransportTask must be used within a TransportTaskProvider");
  }
  return context;
};