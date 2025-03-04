import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Typography, Button, Box } from "@mui/material";
import useQRScanner from "../../hooks/useQRScanner";
import { useTransportContext } from "../../context/transportTaskContext";

const ScanTaskPage = () => {
  const navigate = useNavigate();
  const { videoRef, isScanning, startScanning, stopScanning } = useQRScanner(handleScanSuccess);
  const { fetchTaskStatus } = useTransportContext();

  useEffect(() => {
    fetchTaskStatus(); // ✅ 进入页面时检查任务状态

    // ✅ 预请求摄像头权限，避免进入页面才弹窗
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(() => {
        console.log("✅ Camera permission granted");
        startScanning(); // ✅ 确保摄像头自动启动
      })
      .catch(err => {
        console.warn("⚠️ Camera permission denied:", err);
        alert("Please enable camera permissions to use scanning.");
      });

    return () => stopScanning(); // ✅ 组件卸载时自动关闭摄像头
  }, []);

  async function handleScanSuccess(binID: string) {
    console.log(`✅ Scanned new bin ID: ${binID}`);

    // ✅ 任务创建成功后，检查任务状态
    await fetchTaskStatus();

    // ✅ 任务成功后跳转到 InProcessTaskPage
    setTimeout(() => {
      navigate("/in-process-task");
    }, 500);
  }

  return (
    <Container maxWidth="sm" sx={{ textAlign: "center", padding: "20px", height: "100vh", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      {/* 视频扫描区域 */}
      <Box
        sx={{
          width: "100%",
          maxWidth: "400px",
          height: "250px",
          borderRadius: "10px",
          border: "2px solid #1976d2",
          overflow: "hidden",
          mx: "auto",
        }}
      >
        <video ref={videoRef} style={{ width: "100%", height: "100%" }} autoPlay playsInline />
      </Box>

      {/* 提示文本 */}
      <Typography variant="body1" sx={{ marginTop: 2, fontSize: "14px", color: "#666" }}>
        Scan the barcode to create a new task
      </Typography>

      {/* 取消按钮 */}
      <Button
        variant="contained"
        color="error"
        fullWidth
        sx={{ marginTop: 3, fontSize: "14px", borderRadius: "10px" }}
        onClick={() => {
          stopScanning();
          navigate("/dashboard"); // ✅ 返回 Dashboard
        }}
      >
        ❌ Cancel
      </Button>
    </Container>
  );
};

export default ScanTaskPage;