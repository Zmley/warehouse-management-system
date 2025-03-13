import React, { useEffect, useState } from "react";
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
import { useTransportContext } from "../../context/transportTaskContext";

const AcceptedProcessTaskPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const { taskData, fetchTaskStatus, selectedProducts, setSelectedProducts } =
    useTransportContext();

  useEffect(() => {
    fetchTaskStatus(); // ✅ 获取最新任务状态
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

  // ✅ 直接跳转到 ScanTask 页面
  const handleScanClick = () => {
    navigate("/scan-task"); // 🚀 直接跳转到 ScanTask 页面
  };

  if (!taskData.taskID) {
    return (
      <Container sx={{ textAlign: "center", marginTop: "50px" }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ textAlign: "center", padding: "20px" }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: "bold" }}>
        📦 Task Detail
      </Typography>

      <Card
        variant="outlined"
        sx={{ bgcolor: "#f5f5f5", borderRadius: "12px", padding: 2 }}
      >
        <CardContent>
          <Typography
            variant="subtitle2"
            sx={{ fontSize: "14px", fontWeight: "bold", color: "#555" }}
          >
            Task ID: {taskData.taskID}
          </Typography>

          {/* Source Bin & Target Bin */}
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
            <Box>
              <Typography
                variant="subtitle2"
                sx={{ fontSize: "14px", fontWeight: "bold" }}
              >
                Source Bin
              </Typography>
              <Typography
                variant="body1"
                sx={{ fontSize: "16px", fontWeight: "bold" }}
              >
                {taskData.binCode || "--"}
              </Typography>
            </Box>
            <Box>
              <Typography
                variant="subtitle2"
                sx={{ fontSize: "14px", fontWeight: "bold" }}
              >
                Target Bin
              </Typography>
              <Typography
                variant="body1"
                sx={{ fontSize: "16px", fontWeight: "bold" }}
              >
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
                  {/* ✅ 复选框 */}
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

                  {/* ✅ 产品 ID */}
                  <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                    {product.productID}
                  </Typography>

                  {/* ✅ 显示原始数量 */}
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: "bold",
                      color: "#555",
                      minWidth: "50px",
                      textAlign: "center",
                    }}
                  >
                    {product.quantity}
                  </Typography>

                  {/* ✅ 可编辑的数量输入框 */}
                  <TextField
                    type="number"
                    size="small"
                    value={product.quantity}
                    onChange={(e) =>
                      setSelectedProducts((prev) =>
                        prev.map((p) =>
                          p.productID === product.productID
                            ? {
                                ...p,
                                quantity: Math.max(0, Number(e.target.value)),
                              }
                            : p
                        )
                      )
                    }
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
              onClick={handleScanClick} // ✅ 直接跳转
            >
              SCAN 📷
            </Button>
          </Box>
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

export default AcceptedProcessTaskPage;