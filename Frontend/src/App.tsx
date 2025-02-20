import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import PublicRoutes from "./routes/publicRoutes";
import PrivateRoutes from "./routes/privateRoutes";

const App: React.FC = () => {
  return (
    <Router>
      <PublicRoutes />  {/* 公共路由 */}
      <PrivateRoutes />  {/* 受保护的路由 */}
    </Router>
  );
};

export default App;