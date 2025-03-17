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
  const { videoRef, isScanning, startScanning, stopScanning } =
    useQRScanner(handleScanSuccess);
  const [isLoading, setIsLoading] = useState(false);
  const { taskData, fetchTaskStatus, selectedProducts, setSelectedProducts } =
    useTransportContext();

  useEffect(() => {
    fetchTaskStatus();
  }, []);

  useEffect(() => {
    if (taskData.productList && selectedProducts.length === 0) {
      setSelectedProducts(
        taskData.productList.map((product) => ({
          productID: product.productID,
          quantity: product.quantity,
          inventoryID: product.inventoryID,
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
      // ✅ 获取选中的货物
      const selectedProductsToUnload = selectedProducts
        .filter((product) => product.selected)
        .map(({ productID, quantity, inventoryID }) => ({
          productID,
          quantity,
          inventoryID,
        }));

      if (selectedProductsToUnload.length === 0) {
        alert("Please select at least one product to unload.");
        setIsLoading(false);
        return;
      }
      const response = await processBinTask(binID, false, selectedProductsToUnload);

      if (response.success) {
        await fetchTaskStatus();
      } else {
        console.error("❌ Failed to process unload:", response.error);
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

  return (
    <Container maxWidth="sm" sx={{ textAlign: "center", padding: "20px" }}>
      {/* ✅ 只在扫描时显示摄像头，并添加 CANCEL 按钮 */}
      {isScanning ? (
        <>
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

          {/* ✅ 取消按钮 */}
          <Box sx={{ mt: 3 }}>
            <Button variant="contained" color="error" fullWidth onClick={stopScanning}>
              CANCEL ❌
            </Button>
          </Box>
        </>
      ) : (
        <>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: "bold" }}>
            📦 Task Detail
          </Typography>

          <Card variant="outlined" sx={{ bgcolor: "#f5f5f5", borderRadius: "12px", padding: 2 }}>
            <CardContent>
              <Typography
                variant="subtitle2"
                sx={{ fontSize: "14px", fontWeight: "bold", color: "#555" }}
              >
                Task ID: {taskData.taskID}
              </Typography>

              {/* ✅ Source Bin、Needed Product & Target Bin */}
              <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", mt: 2 }}>
                {/* ✅ Source Bin */}
                <Box sx={{ textAlign: "center", flex: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontSize: "14px", fontWeight: "bold" }}>
                    Source Bin
                  </Typography>
                  <Typography variant="body1" sx={{ fontSize: "16px", fontWeight: "bold" }}>
                    {taskData.binCode || "--"}
                  </Typography>
                </Box>

                {/* ✅ Needed Product */}
                <Box sx={{ textAlign: "center", flex: 1 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontSize: "14px", fontWeight: "bold", color: "#d32f2f" }}
                  >
                    Needed
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ fontSize: "16px", fontWeight: "bold", color: "#d32f2f" }}
                  >
                    {taskData.pickerNeededProduct || "--"}
                  </Typography>
                </Box>

                {/* ✅ Target Bin */}
                <Box sx={{ textAlign: "center", flex: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontSize: "14px", fontWeight: "bold" }}>
                    Target Bin
                  </Typography>
                  <Typography variant="body1" sx={{ fontSize: "16px", fontWeight: "bold" }}>
                    {taskData.targetCode || "--"}
                  </Typography>
                </Box>
              </Box>

              {/* 📋 Product List */}
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
                        onChange={() =>
                          setSelectedProducts((prev) =>
                            prev.map((p) =>
                              p.productID === product.productID
                                ? { ...p, selected: !p.selected }
                                : p
                            )
                          )
                        }
                      />
                      <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                        {product.productID}
                      </Typography>
                      <TextField
                        type="number"
                        size="small"
                        value={product.quantity}
                        onChange={(e) =>
                          setSelectedProducts((prev) =>
                            prev.map((p) =>
                              p.productID === product.productID
                                ? { ...p, quantity: Math.max(0, Number(e.target.value)) }
                                : p
                            )
                          )
                        }
                        sx={{ width: "80px", textAlign: "center" }}
                        inputProps={{ min: 0 }}
                        disabled={!product.selected}
                      />
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" sx={{ color: "#757575", mt: 1 }}>
                    No products available.
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* ✅ 扫描按钮 */}
          <Box sx={{ mt: 3 }}>
            <Button variant="contained" color="primary" fullWidth onClick={startScanning}>
              SCAN 📷
            </Button>
          </Box>

          {/* ✅ 返回 Dashboard 按钮 */}
          <Button variant="outlined" color="secondary" fullWidth sx={{ mt: 2 }} onClick={() => navigate("/dashboard")}>
            🔙 Back to Dashboard
          </Button>
        </>
      )}
    </Container>
  );
};

export default InProcessTaskPage;