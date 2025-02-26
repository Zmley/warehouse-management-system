import React, { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { Container, Typography, CircularProgress, Alert, Button, Box } from '@mui/material'
import { AuthContext } from '../../context/authContext'
import InventoryTable from '../../components/admin/InventoryTable'
import useInventory from '../../hooks/useInventory'

const InventoryManagement: React.FC = () => {
  const { role, isAuthenticated } = useContext(AuthContext)!
  const { inventory, loading, error, removeInventoryItem, addNewItem } = useInventory()
  const navigate = useNavigate()

  if (!isAuthenticated) {
    return <Typography variant='h5'>❌ Not logged in, redirecting...</Typography>
  }

  if (role !== 'admin') {
    return <Typography variant='h5'>⛔ You do not have permission to view this page</Typography>
  }

  return (
    <Container maxWidth='lg' sx={{ mt: 5, p: 3, bgcolor: '#fafafa', borderRadius: '10px' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant='h4' fontWeight="bold" color="primary">
          📦 Inventory Management (Admin)
        </Typography>
        <Box display="flex" gap={2}>
          <Button 
            variant="contained" 
            color="secondary" 
            onClick={() => navigate('/dashboard')}
          >
            ⬅️ Back to Dashboard
          </Button>
        </Box>
      </Box>

      {loading && <CircularProgress sx={{ display: 'block', mx: 'auto', my: 3 }} />}
      {error && <Alert severity='error' sx={{ my: 2 }}>{error}</Alert>}

      {!loading && !error && (
        <InventoryTable
          inventory={inventory}
          onDeleteSuccess={removeInventoryItem}
          onAddSuccess={addNewItem}
        />
      )}
    </Container>
  )
}

export default InventoryManagement