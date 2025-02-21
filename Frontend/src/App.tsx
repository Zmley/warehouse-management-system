import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import PublicRoutes from "./routes/publicRoutes";
import PrivateRoutes from "./routes/privateRoutes";

const App: React.FC = () => {
  return (
    <Router> {/* ✅ 确保 `Router` 包裹 `AuthProvider` */}
      <AuthProvider> 
        <PublicRoutes />
        <PrivateRoutes />
      </AuthProvider>
    </Router>
  );
};

export default App;