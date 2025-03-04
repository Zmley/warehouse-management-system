import { useEffect, useState } from "react";
import { Container, Typography, Button, CircularProgress, Box, Card, CardContent } from "@mui/material";
import useQRScanner from "../../hooks/useQRScanner";
import { useTransportContext } from "../../context/transportTaskContext";
import { getUserTaskStatus } from "../../api/transportTaskApi";

const InProcessTaskPage = () => {
  const { videoRef, isScanning, startScanning, stopScanning } = useQRScanner(handleScanSuccess);
  const { fetchTaskStatus } = useTransportContext();
  const [isLoading, setIsLoading] = useState(false);
  const [taskData, setTaskData] = useState({
    status: "",
    taskID: "",
    currentBinID: "",
    targetBin: "",
    binCode: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getUserTaskStatus();
        setTaskData(response);
        fetchTaskStatus(); // ✅ 确保 transportStatus 也更新
      } catch (error) {
        console.error("❌ Failed to fetch task details:", error);
      }
    };
    fetchData();
  }, [fetchTaskStatus]);

  async function handleScanSuccess(binID: string) {
    console.log(`✅ Unloading cargo from bin: ${binID}`);
    setIsLoading(true);

    try {
      await fetchTaskStatus();
    } catch (error) {
      console.error("❌ Failed to update task status:", error);
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
              <Typography variant="subtitle2" sx={{ fontSize: "14px", fontWeight: "bold" }}>Source Bin Code</Typography>
              <Typography variant="body1" sx={{ fontSize: "16px", fontWeight: "bold" }}>{taskData.binCode || "--"}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontSize: "14px", fontWeight: "bold" }}>Target Bin</Typography>
              <Typography variant="body1" sx={{ fontSize: "16px", fontWeight: "bold" }}>{taskData.targetBin || "--"}</Typography>
            </Box>
          </Box>

          {/* 任务状态 */}
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", mt: 2 }}>
            <Box
              sx={{
                bgcolor: taskData.status === "inProgress" ? "#A5D6A7" : "#BDBDBD",
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
              <span>●</span> {taskData.status === "inProgress" ? "Goods Picked" : "Goods Delivered"}
            </Box>
          </Box>

          {/* 扫码 & 取消按钮 */}
          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              sx={{ borderRadius: "10px", fontSize: "14px" }}
              onClick={startScanning}
              disabled={isScanning}
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
    </Container>
  );
};

export default InProcessTaskPage;