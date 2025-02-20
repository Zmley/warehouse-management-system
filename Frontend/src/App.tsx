import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginSelection from "./pages/LoginSelection";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginSelection />} />
      </Routes>
    </Router>
  );
};

export default App;