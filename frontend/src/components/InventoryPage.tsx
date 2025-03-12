import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from "@mui/material";
import { fetchInventory } from "../api/inventoryApi";

const InventoryPage: React.FC = () => {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadInventory = async () => {
      try {
        console.log("🔄 Fetching inventory...");
        const data = await fetchInventory();
        setInventory(data);
        console.log("✅ Inventory loaded:", data);
      } catch (err) {
        console.error("❌ Inventory fetch failed:", err);
        setError("Failed to load inventory.");
      } finally {
        setLoading(false);
      }
    };

    loadInventory();
  }, []);

  if (loading) return <CircularProgress sx={{ display: "block", margin: "20px auto" }} />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!inventory.length) return <Typography>No inventory data available.</Typography>;

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        📦 Inventory List
      </Typography>

      <TableContainer component={Paper} sx={{ marginTop: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
              <TableCell><b>Task ID</b></TableCell>
              <TableCell><b>Product ID</b></TableCell>
              <TableCell><b>Source Bin</b></TableCell>
              <TableCell><b>Target Bin</b></TableCell>
              <TableCell><b>Quantity</b></TableCell>
              <TableCell><b>Status</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {inventory.map((item, index) => (
              <TableRow 
                key={index}
                sx={{
                  backgroundColor: item.status === "Picked" ? "#dcdcdc" : "transparent",
                  "&:hover": { backgroundColor: "#e8e8e8" }
                }}
              >
                <TableCell># {item.task_id}</TableCell>
                <TableCell># {item.product_id}</TableCell>
                <TableCell>
                  <b>{item.source_bin}</b>
                </TableCell>
                <TableCell>
                  <b>{item.target_bin}</b>
                </TableCell>
                <TableCell>
                  <b>{item.quantity}</b>
                </TableCell>
                <TableCell>{item.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default InventoryPage;