import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Typography, Button, CircularProgress, Box, Card, CardContent } from "@mui/material";
import useQRScanner from "../../hooks/useQRScanner";
import { useTransportContext } from "../../context/transportTaskContext";
import {  processBinTask } from "../../api/transportTaskApi";

const InProcessTaskPage = () => {
  const navigate = useNavigate();
  const { videoRef, isScanning, startScanning, stopScanning } = useQRScanner(handleScanSuccess);
  const [isLoading, setIsLoading] = useState(false);



  const { transportStatus, taskData, fetchTaskStatus } = useTransportContext(); // ✅ 直接使用 Context 数据


  // ✅ 页面加载时获取任务数据
  useEffect(() => {
    fetchTaskStatus(); // ✅ 页面加载时更新数据
  }, [fetchTaskStatus,taskData]);

  // ✅ 扫码后处理 API 请求
  // ✅ 任务完成时自动更新 Context，不需要 setTaskData
async function handleScanSuccess(binID: string) {
    console.log(`✅ Unloading cargo from bin: ${binID}`);
    setIsLoading(true);
  
    try {
      const response = await processBinTask(binID, false);
      if (response.success) {
        await fetchTaskStatus(); // ✅ 让 Context 自动更新 taskData
      }
    } catch (error) {
      console.error("❌ Failed to unload cargo:", error);
    } finally {
      setIsLoading(false);
    }
  }

  // ✅ 如果没有任务数据，显示加载动画
  if (!taskData.taskID) {
    return (
      <Container sx={{ textAlign: "center", marginTop: "50px" }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ textAlign: "center", padding: "20px" }}>
      {/* 任务标题 + 图标 */}
      <Typography variant="h5" gutterBottom sx={{ fontWeight: "bold", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}>
        📦 Task Detail
      </Typography>

      {/* 任务详情卡片 */}
      <Card variant="outlined" sx={{ bgcolor: "#f5f5f5", borderRadius: "12px", padding: 2 }}>
        <CardContent>
          {/* 任务 ID */}
          <Typography variant="subtitle2" sx={{ fontSize: "14px", fontWeight: "bold", color: "#555" }}>
            Task ID: {taskData.taskID}
          </Typography>

          {/* Source Bin & Target Bin */}
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontSize: "14px", fontWeight: "bold" }}>Source Bin</Typography>
              <Typography variant="body1" sx={{ fontSize: "16px", fontWeight: "bold" }}>{taskData.binCode || "--"}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontSize: "14px", fontWeight: "bold" }}>Target Bin</Typography>
              <Typography variant="body1" sx={{ fontSize: "16px", fontWeight: "bold" }}>{taskData.targetCode || "--"}</Typography>
            </Box>
          </Box>

          {/* 任务状态 */}
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", mt: 2 }}>
            <Box
              sx={{
                bgcolor: transportStatus === "inProgress" ? "#A5D6A7" : "#BDBDBD",
                color: "black",
                padding: "6px 12px",
                borderRadius: "20px",
                fontSize: "14px",
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>●</span> {transportStatus === "inProgress" ? "Goods Picked" : "Goods Delivered"}
            </Box>
          </Box>

          {/* ✅ 任务完成提示 */}
          {transportStatus === "completed" && (
            <Typography variant="h6" sx={{ color: "#2e7d32", fontWeight: "bold", mt: 2 }}>
              ✅ Task Completed!
            </Typography>
          )}

          {/* 扫码 & 取消按钮 */}
          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              sx={{ borderRadius: "10px", fontSize: "14px" }}
              onClick={startScanning}
              disabled={isScanning || transportStatus === "completed"} // ✅ 任务完成后禁用按钮
            >
              {isScanning ? "Scanning..." : "SCAN 📷"}
            </Button>

            <Button
              variant="contained"
              color="error"
              fullWidth
              sx={{ borderRadius: "10px", mt: 1, fontSize: "14px", bgcolor: "#D32F2F", color: "white" }}
              onClick={stopScanning}
              disabled={!isScanning}
            >
              CANCEL ❌
            </Button>
          </Box>

          {/* 视频扫码区域 */}
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
        sx={{ borderRadius: "10px", mt: 2, fontSize: "14px", fontWeight: "bold" }}
        onClick={() => navigate("/dashboard")}
      >
        🔙 Back to Dashboard
      </Button>
    </Container>
  );
};

export default InProcessTaskPage;