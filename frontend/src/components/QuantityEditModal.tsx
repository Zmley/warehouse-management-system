import React, { useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, CircularProgress } from "@mui/material";
import { updateInventoryItem } from "../api/inventoryApi"; // ✅ 引入 API

interface QuantityEditModalProps {
  open: boolean;
  onClose: () => void;
  inventoryId: string;
  initialQuantity: number;
  onQuantityUpdated: (updatedQuantity: number) => void; // ✅ 更新父组件数据
}

const QuantityEditModal: React.FC<QuantityEditModalProps> = ({ open, onClose, inventoryId, initialQuantity, onQuantityUpdated }) => {
  const [newQuantity, setNewQuantity] = useState<number>(initialQuantity);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!inventoryId) {
      setError("❌ Missing inventory ID");
      return;
    }
  
    try {
      setLoading(true);
      console.log(`🟢 Sending API Request: /api/inventory/${inventoryId} with quantity:`, newQuantity);
      await updateInventoryItem(inventoryId, { quantity: newQuantity }); // ✅ 确保 `inventoryId` 传递了
      onQuantityUpdated(newQuantity);
      onClose();
    } catch (err) {
      setError("❌ Failed to update quantity");
      console.error("❌ Error updating inventory:", err);
    } finally {
      setLoading(false);
    }
  };
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>🔄 Update Quantity</DialogTitle>
      <DialogContent>
        <TextField
          type="number"
          value={newQuantity}
          onChange={(e) => setNewQuantity(Number(e.target.value))}
          fullWidth
          sx={{ mt: 2 }}
          error={!!error}
          helperText={error}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary" disabled={loading}>Cancel</Button>
        <Button onClick={handleSave} color="primary" variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuantityEditModal;