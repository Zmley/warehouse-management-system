import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from "./context/authContext";
import PublicRoutes from "./routes/Public";
import PrivateRoutes from "./routes/Private";
import { DashboardProvider } from "./context/DashboardContext";




const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider> 
      <DashboardProvider>
          <PublicRoutes />
          <PrivateRoutes />
          </DashboardProvider>
        </AuthProvider>
    </Router>
  );
};

export default App;