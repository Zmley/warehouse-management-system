import { useState, useRef, useEffect } from "react";
import QrScanner from "qr-scanner";
import { Container, Typography, Button } from "@mui/material";

const QRScanner = () => {
  const [data, setData] = useState("No result");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<QrScanner | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      scannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          setData(result.data);
          console.log("二维码扫描结果：", result.data);
          stopScanning();
        },
        {
          highlightScanRegion: true, // ✅ 高亮扫描区域
          highlightCodeOutline: true, // ✅ 高亮二维码轮廓
        }
      );
    }
  }, []);

  const startScanning = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("您的设备或浏览器不支持摄像头访问，请使用 Chrome 或 Safari 并确保 HTTPS 访问！");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        scannerRef.current?.start();
      }
    } catch (error) {
      console.error("无法访问摄像头: ", error);
      alert("无法访问摄像头，请检查权限或更换浏览器！");
    }
  };

  const stopScanning = () => {
    scannerRef.current?.stop();
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
    }
  };

  return (
    <Container maxWidth="sm" style={{ textAlign: "center", padding: "20px" }}>
      <Typography variant="h5">📸 Scan QR Code</Typography>

      <video ref={videoRef} style={{ width: "100%", borderRadius: "10px", marginTop: "10px" }} autoPlay playsInline></video>

      <Button variant="contained" color="primary" onClick={startScanning} style={{ marginTop: "20px" }}>
        Start Scanning
      </Button>

      <Typography variant="body1" style={{ marginTop: "20px" }}>
        {data}
      </Typography>
    </Container>
  );
};

export default QRScanner;