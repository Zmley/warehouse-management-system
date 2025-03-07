import { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import QrScanner from "qr-scanner";

interface CameraScannerProps {
  onScan: (data: string) => void;
}

const CameraScanner: React.FC<CameraScannerProps> = ({ onScan }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const navigate = useNavigate();

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
      startScanning();
    } catch (error) {
      console.error("Error accessing camera:", error);
    }
  };

  const stopCamera = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current = null;
    }
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const handleScanSuccess = (result: QrScanner.ScanResult) => {
    onScan(result.data);
    console.log("Scanned QR Code:", result.data);
    stopCamera();
  };

  const startScanning = () => {
    if (videoRef.current) {
      qrScannerRef.current = new QrScanner(videoRef.current, handleScanSuccess, {
        returnDetailedScanResult: true,
      });
      qrScannerRef.current.start();
    }
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const handleBack = () => {
    stopCamera();
    navigate("/dashboard");
  };

  return (
    <div style={{ textAlign: "center" }}>
      <video ref={videoRef} style={{ width: "100%", maxWidth: "400px", border: "2px solid black" }} autoPlay playsInline />
      <br />
      <button onClick={handleBack} style={{ marginLeft: "10px" }}>返回 Dashboard</button>
    </div>
  );
};

export default CameraScanner;