import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Typography, Button, Box } from "@mui/material";
import useQRScanner from "../../hooks/useQRScanner";
import { useTransportContext } from "../../context/transportTaskContext";
import { processBinTask } from "../../api/transportTaskApi";

const ScanTaskPage = () => {
  const navigate = useNavigate();
  const { videoRef, startScanning, stopScanning } = useQRScanner(handleScanSuccess);
  const { fetchTaskStatus } = useTransportContext();

  useEffect(() => {
    fetchTaskStatus();

    navigator.mediaDevices.getUserMedia({ video: true })
      .then(() => {
        console.log("✅ Camera permission granted");
        startScanning();
      })
      .catch(err => {
        console.warn("⚠️ Camera permission denied:", err);
        alert("Please enable camera permissions to use scanning.");
      });

    return () => stopScanning();
  }, []);

  async function handleScanSuccess(binID: string) {
    console.log(`✅ Scanned new bin ID: ${binID}`);

    try {
      const response = await processBinTask(binID, true);

      if (response.success) {
        console.log(`🚀 Task created for bin ${binID}:`, response.data);
        
        stopScanning(); // 明确停止扫描，释放资源后再跳转

        setTimeout(() => {
          navigate("/loading"); // ✅ 跳转到LoadingPage
        }, 500);
      } else {
        console.error("❌ Task creation failed:", response.error);
      }
    } catch (error) {
      console.error("❌ Error processing bin task:", error);
      alert("Error processing bin task. Please try again.");
    }
  }

  return (
    <Container maxWidth="sm" sx={{ textAlign: "center", padding: "20px", height: "100vh", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <Box sx={{ width: "100%", maxWidth: "400px", height: "250px", borderRadius: "10px", border: "2px solid #1976d2", overflow: "hidden", mx: "auto" }}>
        <video ref={videoRef} style={{ width: "100%", height: "100%" }} autoPlay playsInline />
      </Box>

      <Typography variant="body1" sx={{ marginTop: 2, fontSize: "14px", color: "#666" }}>
        Scan the barcode to create a new task
      </Typography>

      <Button
        variant="contained"
        color="error"
        fullWidth
        sx={{ marginTop: 3, fontSize: "14px", borderRadius: "10px" }}
        onClick={() => {
          stopScanning();
          navigate("/dashboard");
          window.location.reload()
        }}
      >
        ❌ Cancel
      </Button>
    </Container>
  );
};

export default ScanTaskPage;