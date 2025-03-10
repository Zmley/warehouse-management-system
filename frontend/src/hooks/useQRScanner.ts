import { useState, useRef, useEffect } from "react";
import QrScanner from "qr-scanner";

const useQRScanner = (onScanSuccess?: (binID: string) => void) => {
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<QrScanner | null>(null);

  /** ✅ 停止摄像头 & 释放资源 */
  const stopScanning = () => {
    console.log("📷 Stopping QR Scanner...");
    if (scannerRef.current) {
      scannerRef.current.stop();
      scannerRef.current.destroy();
      scannerRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  /** ✅ 组件卸载时，确保摄像头关闭 */
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  /** ✅ 开始扫描 */
  const startScanning = async () => {
    console.log("🚀 Starting QR Scanner...");
    stopScanning();
    await new Promise((resolve) => setTimeout(resolve, 100));

    setIsScanning(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        if (!scannerRef.current) {
          scannerRef.current = new QrScanner(
            videoRef.current,
            (result) => {
              if (result.data) {
                console.log("✅ QR Code scanned:", result.data);
                stopScanning();
                const binID = result.data.trim();
                if (binID) {
                  onScanSuccess?.(binID); // 🚀 让外部组件来处理扫码成功的逻辑
                }
              }
            },
            {
              highlightScanRegion: false,
              highlightCodeOutline: false,
            }
          );
        }

        if (scannerRef.current) {
          try {
            await scannerRef.current.start();
          } catch (error) {
            console.error("❌ Scanner failed to start:", error);
          }
        }
      }
    } catch (error) {
      console.error("❌ Unable to access camera:", error);
      alert("Failed to access the camera. Please check permissions or switch browsers.");
    }
  };

  return { videoRef, isScanning, startScanning, stopScanning };
};

export default useQRScanner;