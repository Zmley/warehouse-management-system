import React, { useContext, useEffect } from 'react';
import { Container, Typography, Button } from '@mui/material';
import { AuthContext } from '../context/AuthContext';

const roleTitles: { [key: string]: string } = {
  admin: 'Admin Dashboard 🎩',
  picker: 'Picker Dashboard 📦',
  transportWorker: 'Transport Worker Dashboard 🚛'
};

const Dashboard: React.FC = () => {
  const { role, logout, isAuthenticated } = useContext(AuthContext)!;

  useEffect(() => {
    console.log("🔄 组件挂载时 role:", role);
  }, [role]);

  if (!isAuthenticated) {
    return <Typography variant='h5'>❌ Not logged in, redirecting...</Typography>;
  }

  if (!role) {
    return <Typography variant='h5'></Typography>;
  }

  return (
    <Container
      maxWidth='sm'
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}
    >
      <Typography variant='h4' gutterBottom>
        {roleTitles[role] || 'Unknown Role'}
      </Typography>

      <Typography variant='body1' sx={{ marginBottom: 2 }}>
        welcome, your role is  <strong>{role || "unknown"}</strong>
      </Typography>

      <Button variant='contained' color='error' onClick={logout}>
        Logout
      </Button>
    </Container>
  );
};

export default Dashboard;