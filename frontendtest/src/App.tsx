import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { InventoryProvider } from "./context/InventoryContext"; // ✅ 确保包裹 `InventoryManagement`
import PublicRoutes from "./routes/publicRoutes";
import PrivateRoutes from "./routes/privateRoutes";

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider> {/* ✅ 认证 Provider 先包裹 */}
        <InventoryProvider> {/* ✅ 库存 Provider 也包裹 */}
          <PublicRoutes />
          <PrivateRoutes />
        </InventoryProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;