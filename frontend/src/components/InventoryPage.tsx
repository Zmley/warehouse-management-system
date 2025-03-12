import React, { useEffect, useState } from "react";
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, IconButton, Paper, CircularProgress, Alert } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { fetchInventory } from "../api/inventoryApi";

interface InventoryItem {
  id: string;
  productID: string;
  updatedAt: string; 
  quantity: number;
}

const InventoryPage: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchInventory();
        if (data && Array.isArray(data.inventory)) {
          setInventory(data.inventory);
        } else {
          setError("❌ Unexpected data format from API");
        }
      } catch (err) {
        setError("❌ Failed to fetch inventory data");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleQuantityChange = (id: string, newQuantity: number) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const handleDelete = (id: string) => {
    setInventory((prev) => prev.filter((item) => item.id !== id));
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ padding: "20px" }}>
      <Typography variant="h5" sx={{ marginBottom: 2 }}>📦 Inventory List</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Product ID</strong></TableCell>
              <TableCell><strong>Imported Date</strong></TableCell>
              <TableCell><strong>Quantity</strong></TableCell>
              <TableCell><strong>Action</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {inventory.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Typography
                    component="a"
                    href={`/product/${item.productID}`}
                    sx={{ textDecoration: "underline", color: "blue", cursor: "pointer" }}
                  >
                    {item.productID}
                  </Typography>
                </TableCell>
                <TableCell>{item.updatedAt}</TableCell>
                <TableCell>
                  <TextField
                    type="number"
                    size="small"
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(item.id, Number(e.target.value))}
                    sx={{
                      width: "60px",
                      "& input": { textAlign: "center", padding: "4px" },
                    }}
                  />
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleDelete(item.id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default InventoryPage;