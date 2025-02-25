import { useState } from "react";
import { QrReader } from "react-qr-reader";
import { Container, Typography, Button } from "@mui/material";

const QRScanner = () => {
  const [data, setData] = useState("No result");
  const [scan, setScan] = useState(false);

  const handleStartScan = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("您的设备或浏览器不支持摄像头访问，请使用 Chrome 或 Safari 并确保 HTTPS 访问！");
      return;
    }

    try {
      // ✅ 关键：先请求摄像头权限，强制弹出权限请求窗口
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });

      // ✅ 只有用户同意后，才开始扫描
      setScan(true);

      // ✅ 停止摄像头流，避免不必要的摄像头占用
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error("用户拒绝了摄像头权限或设备不支持", error);
      alert("无法访问摄像头，请检查权限设置或更换浏览器！");
    }
  };

  return (
    <Container maxWidth="sm" style={{ textAlign: "center", padding: "20px" }}>
      <Typography variant="h5">📸 Scan QR Code</Typography>

      {scan ? (
        <QrReader
          constraints={{ facingMode: { ideal: "environment" } }}
          containerStyle={{ width: "100%", height: "auto" }}
          scanDelay={300}
          onResult={(result, error) => {
            if (result) {
              setData(result.getText());
              setScan(false);
            }
            if (error) {
              console.error("扫描失败: ", error);
            }
          }}
        />
      ) : (
        <Button variant="contained" color="primary" onClick={handleStartScan}>
          Start Scanning
        </Button>
      )}

      <Typography variant="body1" style={{ marginTop: "20px" }}>
        {data}
      </Typography>
    </Container>
  );
};

export default QRScanner;