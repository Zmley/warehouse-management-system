import React, { useContext } from 'react';
import { AuthContext } from '../context/authContext';
import AdminDashboard from '../pages/AdminDashboard';
import WorkerDashboard from './WokerDashboard';
import { Typography, Container } from '@mui/material';

const RoleBasedDashboard: React.FC = () => {
  const { userProfile, isAuthenticated } = useContext(AuthContext)!;

  if (!isAuthenticated) {
    return (
      <Container sx={{ textAlign: 'center', marginTop: '50px' }}>
        <Typography variant="h5">❌ Not logged in, redirecting...</Typography>
      </Container>
    );
  }

  if (!userProfile) {
    return (
      <Container sx={{ textAlign: 'center', marginTop: '50px' }}>
        <Typography variant="h5">🔄 Loading user profile...</Typography>
      </Container>
    );
  }

  // ✅ 根据用户角色，加载对应的 Dashboard
  return userProfile.role === 'admin' ? <AdminDashboard /> : <WorkerDashboard />;
};

export default RoleBasedDashboard;