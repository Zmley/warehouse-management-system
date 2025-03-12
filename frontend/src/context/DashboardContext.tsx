import React, { createContext, useContext, useState, ReactNode } from "react";

// 定义页面类型
type PageType = "dashboard" | "inventory" | "tasks" | "products" | "users";

// 创建 Context
interface DashboardContextType {
  currentPage: PageType;
  setCurrentPage: (page: PageType) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

// 提供 Context
export const DashboardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState<PageType>("dashboard");

  return (
    <DashboardContext.Provider value={{ currentPage, setCurrentPage }}>
      {children}
    </DashboardContext.Provider>
  );
};

// 自定义 Hook 供组件使用
export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
};