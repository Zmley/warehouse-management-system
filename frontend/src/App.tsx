import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from "./context/authContext";
import PublicRoutes from "./routes/Public";
import PrivateRoutes from "./routes/Private";



const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider> 
          <PublicRoutes />
          <PrivateRoutes />
        </AuthProvider>
    </Router>
  );
};

export default App;