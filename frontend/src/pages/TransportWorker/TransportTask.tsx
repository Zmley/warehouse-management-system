import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Typography, Button, CircularProgress, Card, CardContent, Box } from "@mui/material";
import { useTransportContext } from "../../context/transportTaskContext";
import useQRScanner from "../../hooks/useQRScanner";
import { processBinTask } from "../../api/transportTaskApi";

const TransportTask = () => {
  const navigate = useNavigate();
  const { transportStatus, startTask, resetTask } = useTransportContext();
  const { videoRef, isScanning, startScanning } = useQRScanner(handleScanSuccess);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    console.log(`🔄 UI Updated: Current Status = ${transportStatus}`);
  }, [transportStatus]);

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

  async function handleScanSuccess(binID: string) {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      console.log(`🚀 Scanned binID: ${binID}`);

      const isLoadingToCar = transportStatus === "pending"; 

      const response = await processBinTask(binID, isLoadingToCar);

      if (response.success) {
        setSuccessMessage(
          isLoadingToCar
            ? `✅ Cargo from bin ${binID} successfully loaded into the car.`
            : `✅ Cargo from bin ${binID} successfully unloaded.`
        );

        if (isLoadingToCar) {
          startTask(binID);
        } else {
          console.log("🔄 Unload success! Resetting task...");
          resetTask();
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
    <Container maxWidth="sm" sx={{ textAlign: "center", padding: "20px" }}>
      <Typography variant="h4" gutterBottom>🚚 Transport Task</Typography>

      <Card variant="outlined" sx={{ mb: 2, bgcolor: "#f5f5f5" }}>
        <CardContent>
          <Typography variant="h6" color="primary">
            Current Status: {transportStatus.toUpperCase()}
          </Typography>
        </CardContent>
      </Card>

      <Button
        variant="contained"
        color="primary"
        sx={{ m: 1, width: "80%" }}
        onClick={handleLoadCargo}
        disabled={transportStatus !== "pending"}
      >
        Load Cargo
      </Button>

      <Button
        variant="contained"
        color="secondary"
        sx={{ m: 1, width: "80%" }}
        onClick={handleUnloadCargo}
        disabled={transportStatus !== "process"}
      >
        Unload Cargo
      </Button>

      {isScanning && (
        <Box sx={{
          width: "100%", maxWidth: "400px", height: "250px", borderRadius: "10px",
          border: "2px solid #1976d2", overflow: "hidden", mx: "auto", mt: 2,
        }}>
          <video ref={videoRef} style={{ width: "100%", height: "100%" }} autoPlay playsInline />
        </Box>
      )}

      {isLoading && <CircularProgress sx={{ mt: 2 }} />}
      {error && <Card sx={{ bgcolor: "#ffebee", color: "#d32f2f", mt: 2 }}><CardContent><Typography>{error}</Typography></CardContent></Card>}
      {successMessage && <Card sx={{ bgcolor: "#e8f5e9", color: "#2e7d32", mt: 2 }}><CardContent><Typography>{successMessage}</Typography></CardContent></Card>}

      <Button variant="outlined" color="inherit" sx={{ mt: 2, width: "80%" }} onClick={() => navigate("/")}>Back to Main</Button>
    </Container>
  );
};

export default TransportTask;