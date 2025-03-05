import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Typography, TextField, Button, CircularProgress, Alert } from "@mui/material";
import { fetchInventoryItem, updateInventoryItem } from "../../api/inventoryApi";
import { InventoryItem } from "../../types/inventoryTypes";

const EditInventoryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>(); 
  const navigate = useNavigate();

  const [inventoryItem, setInventoryItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<boolean>(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const item = await fetchInventoryItem(id);
        setInventoryItem(item);
      } catch (err) {
        setError("❌ Failed to fetch item details");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!inventoryItem) return;
    setInventoryItem({ ...inventoryItem, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    if (!inventoryItem) return;
    setUpdating(true);
    setUpdateError(null);
    try {
      await updateInventoryItem(inventoryItem.id, inventoryItem);
      navigate("/inventory"); 
    } catch (err) {
      setUpdateError("❌ Failed to update inventory item");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!inventoryItem) return <Alert severity="error">❌ Item not found</Alert>;

  return (
    <Container maxWidth="sm" sx={{ mt: 5 }}>
      <Typography variant="h4" gutterBottom>
        ✏️ Edit Inventory Item
      </Typography>

      <TextField
        label="Warehouse Code"
        name="warehouse_code"
        value={inventoryItem.warehouse_code}
        onChange={handleChange}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Bin Code"
        name="bin_code"
        value={inventoryItem.bin_code}
        onChange={handleChange}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Product Code"
        name="product_code"
        value={inventoryItem.product_code}
        onChange={handleChange}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Quantity"
        name="quantity"
        type="number"
        value={inventoryItem.quantity}
        onChange={handleChange}
        fullWidth
        margin="normal"
      />
      <TextField
        label="QR Code URL"
        name="bin_qr_code_url"
        value={inventoryItem.bin_qr_code}
        onChange={handleChange}
        fullWidth
        margin="normal"
      />

      {updateError && <Alert severity="error">{updateError}</Alert>}

      <Button
        variant="contained"
        color="primary"
        onClick={handleUpdate}
        disabled={updating}
        sx={{ mt: 2, mr: 2 }}
      >
        {updating ? "Updating..." : "Confirm Update"}
      </Button>
      <Button variant="contained" color="secondary" onClick={() => navigate("/inventory")}>
        Cancel
      </Button>
    </Container>
  );
};

export default EditInventoryPage;