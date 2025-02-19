// 文件路径: src/App.tsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginSelection from "./pages/LoginSelection";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* 默认首页加载 LoginSelection 页面 */}
        <Route path="/" element={<LoginSelection />} />
      </Routes>
    </Router>
  );
};

export default App;