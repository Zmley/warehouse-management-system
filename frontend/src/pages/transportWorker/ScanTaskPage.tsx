import { useEffect } from "react";
import { Container, Typography, Button, Box } from "@mui/material";
import useQRScanner from "../../hooks/useQRScanner";
import { useTransportContext } from "../../context/transportTaskContext";

const ScanTaskPage = () => {
  const { videoRef, isScanning, startScanning, stopScanning } = useQRScanner(handleScanSuccess);
  const { fetchTaskStatus } = useTransportContext(); // ✅ 任务状态更新

  useEffect(() => {
    fetchTaskStatus(); // ✅ 进入页面时检查当前任务状态
  }, []);

  async function handleScanSuccess(binID: string) {
    console.log(`✅ Scanned new bin ID: ${binID}`);
    await fetchTaskStatus(); // ✅ 扫描成功后刷新任务状态
  }

  return (
    <Container maxWidth="sm" sx={{ textAlign: "center", padding: "20px" }}>
      <Typography variant="h4" gutterBottom>📦 Scan to Start a New Task</Typography>

      <Button
        variant="contained"
        color="primary"
        sx={{ marginBottom: 2 }}
        onClick={startScanning}
        disabled={isScanning}
      >
        {isScanning ? "Scanning..." : "Start Scanning"}
      </Button>

      <Button
        variant="contained"
        color="error"
        sx={{ marginBottom: 2 }}
        onClick={stopScanning}
        disabled={!isScanning}
      >
        Stop Scanning
      </Button>

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
    </Container>
  );
};

export default ScanTaskPage;