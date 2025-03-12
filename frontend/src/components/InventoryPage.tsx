import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Paper,
  CircularProgress,
  Alert,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { fetchInventory, fetchBinsForUser } from "../api/inventoryApi";
import FilterComponent from "../components/FilterComponent";
import QuantityEditModal from "../components/QuantityEditModal"; // ✅ 引入弹窗组件

interface InventoryItem {
  inventoryID: string;
  productID: string;
  updatedAt: string;
  quantity: number;
  binID: string;
}

const InventoryPage: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([]);
  const [selectedBin, setSelectedBin] = useState<string>("All");
  const [bins, setBins] = useState<{ binID: string; binCode: string }[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ 处理弹窗
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  useEffect(() => {
    const loadBins = async () => {
      try {
        const binData = await fetchBinsForUser();
        if (Array.isArray(binData)) {
          setBins(binData);
        }
      } catch (err) {
        setError("❌ Failed to fetch bins");
      }
    };

    const loadInventory = async () => {
      try {
        const data = await fetchInventory();
        if (data && Array.isArray(data.inventory)) {
          setInventory(data.inventory);
          setFilteredInventory(data.inventory);
        } else {
          setError("❌ Unexpected data format from API");
        }
      } catch (err) {
        setError("❌ Failed to fetch inventory data");
      } finally {
        setLoading(false);
      }
    };

    loadBins();
    loadInventory();
  }, []);

  useEffect(() => {
    let filteredData = inventory;
    if (selectedBin !== "All") {
      filteredData = filteredData.filter((item) => item.binID === selectedBin);
    }
    setFilteredInventory(filteredData);
  }, [selectedBin, inventory]);

  // ✅ 处理 "编辑数量" 逻辑
  const handleOpenModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedItem(null);
  };

  const handleSaveQuantity = (newQuantity: number) => {
    if (!selectedItem) return;
    setInventory((prev) =>
      prev.map((item) => (item.inventoryID === selectedItem.inventoryID ? { ...item, quantity: newQuantity } : item))
    );
    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    setInventory((prev) => prev.filter((item) => item.inventoryID !== id));
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ padding: "20px" }}>
      {/* ✅ 使用 `FilterComponent` */}
      <FilterComponent selectedBin={selectedBin} setSelectedBin={setSelectedBin} bins={bins} onNewProductClick={() => {}} />

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
            {filteredInventory.length > 0 ? (
              filteredInventory.map((item) => (
                <TableRow key={item.inventoryID}>
                  <TableCell>
                    <Typography component="a" href={`/product/${item.productID}`} sx={{ textDecoration: "underline", color: "blue", cursor: "pointer" }}>
                      {item.productID}
                    </Typography>
                  </TableCell>
                  <TableCell>{item.updatedAt}</TableCell>
                  <TableCell>
                    {/* ✅ 点击数量时，弹出模态框 */}
                    <Typography
                      sx={{ cursor: "pointer", color: "blue" }}
                      onClick={() => handleOpenModal(item)}
                    >
                      {item.quantity}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleDelete(item.inventoryID)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No matching products found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ✅ 弹出的编辑数量模态框 */}
      {selectedItem && (
        <QuantityEditModal
          open={modalOpen}
          onClose={handleCloseModal}
          inventoryId={selectedItem.inventoryID} // ✅ 传递 ID 用于 API 调用
          initialQuantity={selectedItem.quantity}
          onQuantityUpdated={handleSaveQuantity} // ✅ 确保前端 UI 也更新
        />
      )}
    </Box>
  );
};

export default InventoryPage;