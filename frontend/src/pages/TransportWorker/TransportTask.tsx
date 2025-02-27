import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Typography, Button, CircularProgress } from "@mui/material";
import useQRScanner from "../../hooks/useQRScanner";
import { useTransportContext } from "../../context/transportTaskContext";
import { processBinTask } from "../../api/transportTaskApi";

const TransportTask = () => {
  const navigate = useNavigate();
  const { transportStatus, startTask, proceedToUnload } = useTransportContext();
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

        // ✅ **立即更新 UI**
        if (isLoadingToCar) {
          startTask(warehouseID, binID);
        } else {
          proceedToUnload();
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

  return (
    <Container maxWidth="sm" style={{ textAlign: "center", padding: "20px" }}>
      <Typography variant="h5">🚚 Transport Task</Typography>

      {/* ✅ Load Cargo 按钮（仅在 `pending` 可用） */}
      <Button
        variant="contained"
        color="primary"
        onClick={handleLoadCargo}
        disabled={transportStatus !== "pending"}
      >
        Load Cargo
      </Button>

      {/* ✅ Unload Cargo 按钮（仅在 `inProcess1` 状态下可用） */}
      <Button
        variant="contained"
        color="secondary"
        onClick={handleUnloadCargo}
        disabled={transportStatus !== "inProcess1"}
      >
        Unload Cargo
      </Button>

      {isScanning && <video ref={videoRef} style={{ width: "100%", borderRadius: "10px", marginTop: "10px" }} autoPlay playsInline></video>}

      {isLoading && <CircularProgress style={{ marginTop: "20px" }} />}
      {error && <Typography variant="body1" color="error">{error}</Typography>}
      {successMessage && <Typography variant="body1" color="primary">{successMessage}</Typography>}

      <Button variant="outlined" color="inherit" onClick={() => navigate("/")}>Back to Main</Button>
    </Container>
  );
};

export default TransportTask;