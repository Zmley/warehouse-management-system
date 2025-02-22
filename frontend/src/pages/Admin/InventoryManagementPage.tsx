import React, { useContext } from "react";
import { Container, Typography, CircularProgress, Alert } from "@mui/material";
import { AuthContext } from "../../context/AuthContext";
import InventoryTable from "../../components/admin/InventoryTable";
import useInventory from "../../hooks/useInventory";

const InventoryManagement: React.FC = () => {
  const { role, isAuthenticated } = useContext(AuthContext)!;
  const { inventory, loading, error, removeInventoryItem } = useInventory();

  if (!isAuthenticated) {
    return <Typography variant="h5">❌ Not logged in, redirecting...</Typography>;
  }

  if (role !== "admin") {
    return <Typography variant="h5">⛔ You do not have permission to view this page</Typography>;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 5 }}>
      <Typography variant="h4" gutterBottom>
        📦 Inventory Management (Admin)
      </Typography>

      {loading && <CircularProgress />}
      {error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && (
        <InventoryTable inventory={inventory} onDeleteSuccess={removeInventoryItem} />
      )}
    </Container>
  );
};

export default InventoryManagement;