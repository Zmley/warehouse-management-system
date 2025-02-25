import { useState } from "react";
import { useNavigate } from "react-router-dom"; // ✅ 用于返回上一页
import { Container, Typography, Button, CircularProgress } from "@mui/material";
import useQRScanner from "../../hooks/useQRScanner";
import { updateBinOwnership } from "../../api/scanApi"; // ✅ 引入更新 bin 所有权的 API

const TransportTask = () => {
  const navigate = useNavigate(); // ✅ 用于返回上一页
  const { videoRef, data, startScanning, stopScanning } = useQRScanner();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ✅ 处理扫描结果并发送到后端
  const handleScanSuccess = async () => {
    if (data && data !== "No result") {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);

      const binID = data; // 扫描的数据作为 binID
      const accountId = "user-account-id"; // 你可以通过从 JWT 中提取或者从其他地方获取 accountId

      try {
        // 调用更新 bin 所有权的 API
        const response = await updateBinOwnership(binID, accountId);
        setSuccessMessage(`Bin ownership updated: ${response.message}`);
      } catch (err: any) {
        setError(`Update failed: ${err.response?.data?.message || err.message}`);
      } finally {
        setIsLoading(false);
        stopScanning(); // ✅ 结束扫描
      }
    }
  };

  return (
    <Container maxWidth="sm" style={{ textAlign: "center", padding: "20px" }}>
      <Typography variant="h5">🚚 Transport Task QR Scanner</Typography>

      {/* ✅ Video element for scanning */}
      <video ref={videoRef} style={{ width: "100%", borderRadius: "10px", marginTop: "10px" }} autoPlay playsInline></video>

      {/* ✅ 按钮区域 */}
      <div style={{ marginTop: "20px", display: "flex", justifyContent: "center", gap: "10px" }}>
        <Button variant="contained" color="primary" onClick={startScanning} disabled={isLoading}>
          Load Cargo
        </Button>

        <Button variant="outlined" color="secondary" onClick={stopScanning} disabled={isLoading}>
          Cancel
        </Button>
      </div>

      {/* ✅ 显示扫描状态 */}
      {isLoading && <CircularProgress style={{ marginTop: "20px" }} />}
      {error && <Typography variant="body1" color="error" style={{ marginTop: "10px" }}>{error}</Typography>}
      {successMessage && <Typography variant="body1" color="primary" style={{ marginTop: "10px" }}>{successMessage}</Typography>}

      {/* ✅ 显示扫描数据并提交 */}
      <Typography variant="body1" style={{ marginTop: "20px" }}>Scanned Data: {data}</Typography>

      {data !== "No result" && (
        <Button variant="contained" color="success" onClick={handleScanSuccess} disabled={isLoading} style={{ marginTop: "10px" }}>
          Submit Scan
        </Button>
      )}

      {/* ✅ 返回上一页按钮 */}
      <Button
        variant="outlined"
        color="inherit"
        onClick={() => navigate(-1)} // ✅ 返回上一页
        style={{ marginTop: "20px", display: "block", width: "100%" }}
      >
        Return to Previous Page
      </Button>
    </Container>
  );
};

export default TransportTask;