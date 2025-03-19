import React, { useContext, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthContext } from '../contexts/auth';
import LoginPage from '../pages/Login';
import Dashboard from '../pages/userDashboard/Dashboard';

const PublicRoute: React.FC = () => {
  const { isAuthenticated, getMe } = useContext(AuthContext)!;

  useEffect(() => {
    if (isAuthenticated) {
      getMe();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Dashboard /> : <LoginPage />} />
    </Routes>
  );
};

export default PublicRoute;