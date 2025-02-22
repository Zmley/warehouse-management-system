import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogActions,
} from "@mui/material";
import { InventoryItem } from "../../types/inventoryTypes";

interface InventoryTableProps {
  inventory: InventoryItem[];
  onDeleteSuccess: (id: string) => void;
}

const InventoryTable: React.FC<InventoryTableProps> = ({ inventory, onDeleteSuccess }) => {
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleEdit = (id: string) => {
    navigate(`/inventory/edit/${id}`);
  };

  const handleDeleteConfirm = async () => {
    if (deleteId) {
      await onDeleteSuccess(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <>
      <TableContainer component={Paper} sx={{ mt: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
              <TableCell><strong>Warehouse Code</strong></TableCell>
              <TableCell><strong>Bin Code</strong></TableCell>
              <TableCell><strong>Product Code</strong></TableCell>
              <TableCell><strong>Quantity</strong></TableCell>
              <TableCell><strong>QR Code</strong></TableCell>
              <TableCell><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {inventory.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.warehouse_code}</TableCell>
                <TableCell>{item.bin_code}</TableCell>
                <TableCell>{item.product_code}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>
                  <img src={item.bin_qr_code_url} alt="Bin QR Code" width="50" />
                </TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    sx={{ mr: 1 }}
                    onClick={() => handleEdit(item.id)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    onClick={() => setDeleteId(item.id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ✅ Delete Confirm Dialog */}
      <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)}>
        <DialogTitle>Are you sure you want to delete this item?</DialogTitle>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default InventoryTable;