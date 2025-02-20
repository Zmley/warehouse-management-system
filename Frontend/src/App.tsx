import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import PrivateRoutes from "./routes/PrivateRoutes";
import PublicRoutes from "./routes/PublicRoutes";


const App: React.FC = () => {
  return (
    <Router>
      <PrivateRoutes />  {/* 受保护的路由 */}
      <PublicRoutes />  {/* 公共的路由 */}

    </Router>
  );
};

export default App;