import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from "./context/authContext";
import { InventoryProvider } from "./context/InventoryContext"; // ✅ 确保包裹 `InventoryManagement`
import PublicRoutes from "./routes/publicRoutes";
import PrivateRoutes from "./routes/privateRoutes";
import { TransportTaskProvider } from "./context/transportTaskContext"; // ✅ 导入 TransportTaskProvider


const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider> {/* ✅ 认证 Provider 先包裹 */}
        <InventoryProvider> {/* ✅ 库存 Provider 也包裹 */}
        <TransportTaskProvider> {/* ✅ TransportTask Provider */}
          <PublicRoutes />
          <PrivateRoutes />
          </TransportTaskProvider>
        </InventoryProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;