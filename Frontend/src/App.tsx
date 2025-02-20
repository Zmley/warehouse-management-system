import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginSelection from "./pages/LoginSelection";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import PickerDashboard from "./pages/Picker/PickerDashboard";
import TWDashboard from "./pages/TransportWorker/TWDashboard";



const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginSelection />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/picker" element={<PickerDashboard />} />
        <Route path="/transportWorker" element={<TWDashboard />} />

      </Routes>
    </Router>
  );
};

export default App;