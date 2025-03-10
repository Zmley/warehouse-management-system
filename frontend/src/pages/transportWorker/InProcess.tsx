import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Button,
  CircularProgress,
  Box,
  Card,
  CardContent,
  TextField,
  Checkbox,
} from "@mui/material";
import useQRScanner from "../../hooks/useQRScanner";
import { useTransportContext } from "../../context/transportTaskContext";
import { processBinTask } from "../../api/transportTaskApi";

const InProcessTaskPage = () => {
  const navigate = useNavigate();
  const { videoRef, isScanning, startScanning, stopScanning } = useQRScanner(handleScanSuccess);
  const [isLoading, setIsLoading] = useState(false);
  const { transportStatus, taskData, fetchTaskStatus } = useTransportContext();

  // ✅ 管理 productList，存储选中状态
  const [selectedProducts, setSelectedProducts] = useState<
    { productID: string; quantity: number; selected: boolean }[]
  >([]);

  useEffect(() => {
    console.log("Fetching task status on mount...");
    fetchTaskStatus();
  }, []);

  useEffect(() => {
    if (taskData.productList) {
      setSelectedProducts(
        taskData.productList.map((product) => ({
          productID: product.productID,
          quantity: product.quantity, // 默认选中全部
          selected: true, // ✅ 默认选中
        }))
      );
    }
  }, [taskData.productList]);

  async function handleScanSuccess(binID: string) {
    console.log(`✅ Scanned bin: ${binID}`);
    stopScanning();
    setIsLoading(true);

    try {
      const response = await processBinTask(binID, false);
      if (response.success) {
        await fetchTaskStatus();
        window.location.reload();
      }
    } catch (error) {
      console.error("❌ Failed to unload cargo:", error);
    } finally {
      setIsLoading(false);
    }
  }

  if (!taskData.taskID) {
    return (
      <Container sx={{ textAlign: "center", marginTop: "50px" }}>
        <CircularProgress />
      </Container>
    );
  }

  // ✅ 切换 Checkbox 选中状态
  const handleCheckboxChange = (productID: string) => {
    setSelectedProducts((prev) =>
      prev.map((product) =>
        product.productID === productID ? { ...product, selected: !product.selected } : product
      )
    );
  };

  // ✅ 更新数量
  const handleQuantityChange = (productID: string, newQuantity: number) => {
    setSelectedProducts((prev) =>
      prev.map((product) =>
        product.productID === productID ? { ...product, quantity: Math.max(0, newQuantity) } : product
      )
    );
  };

  return (
    <Container maxWidth="sm" sx={{ textAlign: "center", padding: "20px" }}>
      <Typography
        variant="h5"
        gutterBottom
        sx={{
          fontWeight: "bold",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "8px",
        }}
      >
        📦 Task Detail
      </Typography>

      <Card variant="outlined" sx={{ bgcolor: "#f5f5f5", borderRadius: "12px", padding: 2 }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ fontSize: "14px", fontWeight: "bold", color: "#555" }}>
            Task ID: {taskData.taskID}
          </Typography>

          {/* Source Bin & Target Bin */}
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontSize: "14px", fontWeight: "bold" }}>
                Source Bin
              </Typography>
              <Typography variant="body1" sx={{ fontSize: "16px", fontWeight: "bold" }}>
                {taskData.binCode || "--"}
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontSize: "14px", fontWeight: "bold" }}>
                Target Bin
              </Typography>
              <Typography variant="body1" sx={{ fontSize: "16px", fontWeight: "bold" }}>
                {taskData.targetCode || "--"}
              </Typography>
            </Box>
          </Box>

          {/* 产品列表 */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              📋 Product List
            </Typography>
            {selectedProducts.length > 0 ? (
              selectedProducts.map((product) => (
                <Box
                  key={product.productID}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mt: 2,
                    padding: "8px",
                    bgcolor: "#e3f2fd",
                    borderRadius: "8px",
                  }}
                >
                  <Checkbox
                    checked={product.selected}
                    onChange={() => handleCheckboxChange(product.productID)}
                  />
                  <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                    {product.productID}
                  </Typography>
                  <TextField
                    type="number"
                    size="small"
                    value={product.quantity}
                    onChange={(e) => handleQuantityChange(product.productID, Math.max(0, Number(e.target.value)))}
                    sx={{ width: "80px", textAlign: "center" }}
                    inputProps={{ min: 0 }}
                    disabled={!product.selected} // ✅ 未选中时禁用输入框
                  />
                </Box>
              ))
            ) : (
              <Typography variant="body2" sx={{ color: "#757575", mt: 1 }}>
                No products available.
              </Typography>
            )}
          </Box>

          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              sx={{ borderRadius: "10px", fontSize: "14px" }}
              onClick={startScanning}
              disabled={isScanning || transportStatus === "completed"}
            >
              {isScanning ? "Scanning..." : "SCAN 📷"}
            </Button>

            <Button
              variant="contained"
              color="error"
              fullWidth
              sx={{
                borderRadius: "10px",
                mt: 1,
                fontSize: "14px",
                bgcolor: "#D32F2F",
                color: "white",
              }}
              onClick={stopScanning}
              disabled={!isScanning}
            >
              CANCEL ❌
            </Button>
          </Box>

          {isScanning && (
            <Box
              sx={{
                width: "100%",
                maxWidth: "400px",
                height: "250px",
                borderRadius: "10px",
                border: "2px solid #1976d2",
                overflow: "hidden",
                mx: "auto",
                mt: 2,
              }}
            >
              <video ref={videoRef} style={{ width: "100%", height: "100%" }} autoPlay playsInline />
            </Box>
          )}

          {isLoading && <CircularProgress sx={{ mt: 2 }} />}
        </CardContent>
      </Card>

      {/* ✅ 返回 Dashboard 按钮 */}
      <Button
        variant="outlined"
        color="secondary"
        fullWidth
        sx={{
          borderRadius: "10px",
          mt: 2,
          fontSize: "14px",
          fontWeight: "bold",
        }}
        onClick={() => navigate("/dashboard")}
      >
        🔙 Back to Dashboard
      </Button>
    </Container>
  );
};

export default InProcessTaskPage;