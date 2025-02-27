import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Typography, Button, CircularProgress, Card, CardContent, Box } from "@mui/material";
import useQRScanner from "../../hooks/useQRScanner";
import { useTransportContext } from "../../context/transportTaskContext";
import { processBinTask } from "../../api/transportTaskApi";

const TransportTask = () => {
  const navigate = useNavigate();
  const { transportStatus, startTask, proceedToUnload, resetTask } = useTransportContext();
  const { videoRef, isScanning, startScanning } = useQRScanner(handleScanSuccess);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleLoadCargo = async () => {
    setError(null);
    setSuccessMessage(null);
    startScanning();
  };

  const handleUnloadCargo = async () => {
    setError(null);
    setSuccessMessage(null);
    startScanning();
  };

  async function handleScanSuccess(warehouseID: string, binID: string) {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      console.log(`🚀 Scanned warehouseID: ${warehouseID}, binID: ${binID}`);

      const isLoadingToCar = transportStatus === "pending";
      const response = await processBinTask(warehouseID, binID, isLoadingToCar);

      if (response.success) {
        setSuccessMessage(
          isLoadingToCar
            ? `✅ Cargo from ${warehouseID} - ${binID} successfully loaded into the car.`
            : `✅ Cargo from ${warehouseID} - ${binID} successfully unloaded.`
        );

        if (isLoadingToCar) {
          startTask(warehouseID, binID); // ✅ 进入 inProcess1
        } else {
          proceedToUnload(); // ✅ 进入 inProcess2

          // ✅ **如果 `inProcess2` 返回成功，直接刷新页面**
          setTimeout(() => {
            console.log("🔄 Unload success! Refreshing page...");
            window.location.reload(); // **强制刷新 UI**
          }, 500);
        }
      } else {
        setError("❌ Operation failed: Unexpected response from server.");
      }
    } catch (err: any) {
      setError(`❌ Operation failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsLoading(false);
    }
  }

  const handleResetTask = useCallback(() => {
    if (transportStatus === "inProcess2") {
      console.log("🔄 Resetting to pending...");
      resetTask();
    }
  }, [transportStatus, resetTask]);

  useEffect(() => {
    handleResetTask();
  }, [handleResetTask]);

  return (
    <Container maxWidth="sm" sx={{ textAlign: "center", padding: "20px" }}>
      <Typography variant="h4" gutterBottom>
        🚚 Transport Task
      </Typography>

      {/* ✅ 状态指示器 */}
      <Card variant="outlined" sx={{ mb: 2, bgcolor: "#f5f5f5" }}>
        <CardContent>
          <Typography variant="h6" color="primary">
            Current Status: {transportStatus.toUpperCase()}
          </Typography>
        </CardContent>
      </Card>

      {/* ✅ Load Cargo 按钮 */}
      <Button
        variant="contained"
        color="primary"
        sx={{ m: 1, width: "80%" }}
        onClick={handleLoadCargo}
        disabled={transportStatus !== "pending"}
      >
        Load Cargo
      </Button>

      {/* ✅ Unload Cargo 按钮 */}
      <Button
        variant="contained"
        color="secondary"
        sx={{ m: 1, width: "80%" }}
        onClick={handleUnloadCargo}
        disabled={transportStatus === "pending"}
      >
        Unload Cargo
      </Button>

      {/* ✅ 扫描区域 */}
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

      {/* ✅ 状态指示器 */}
      {isLoading && <CircularProgress sx={{ mt: 2 }} />}

      {/* ✅ 成功 / 失败信息 */}
      {error && (
        <Card sx={{ bgcolor: "#ffebee", color: "#d32f2f", mt: 2 }}>
          <CardContent>
            <Typography variant="body1">{error}</Typography>
          </CardContent>
        </Card>
      )}
      {successMessage && (
        <Card sx={{ bgcolor: "#e8f5e9", color: "#2e7d32", mt: 2 }}>
          <CardContent>
            <Typography variant="body1">{successMessage}</Typography>
          </CardContent>
        </Card>
      )}

      {/* ✅ 返回按钮 */}
      <Button
        variant="outlined"
        color="inherit"
        sx={{ mt: 2, width: "80%" }}
        onClick={() => navigate("/")}
      >
        Back to Main
      </Button>
    </Container>
  );
};

export default TransportTask;