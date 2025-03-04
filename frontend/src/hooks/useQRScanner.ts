import { useState, useRef, useEffect } from "react";
import QrScanner from "qr-scanner";
import { useTransportContext } from "../context/transportTaskContext";
import { processBinTask } from "../api/transportTaskApi";
import { useNavigate } from "react-router-dom"; // ✅ 添加跳转

const useQRScanner = (onScanSuccess?: (binID: string) => void) => {
  const navigate = useNavigate();
  const { fetchTaskStatus, transportStatus } = useTransportContext();
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<QrScanner | null>(null);

  const stopScanning = () => {
    if (scannerRef.current) {
      console.log("📷 Stopping QR Scanner...");
      scannerRef.current.stop();
      scannerRef.current.destroy();
      scannerRef.current = null;
    }
    setIsScanning(false);

    if (videoRef.current) {
      const stream = videoRef.current.srcObject as MediaStream;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
    }
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    console.log("🚀 Starting QR Scanner...");
    stopScanning(); // ✅ 确保每次都清理之前的 scanner

    setIsScanning(true);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Your browser does not support camera access. Please use Chrome or Safari over HTTPS!");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        if (!scannerRef.current) {
          scannerRef.current = new QrScanner(
            videoRef.current,
            async (result) => {
              if (result.data) {
                console.log("✅ QR Code scanned:", result.data);
                stopScanning();

                const binID = result.data.trim();
                if (binID) {
                  console.log(`✅ Parsed binID: ${binID}`);

                  try {
                    const isLoadingToCar = transportStatus === "completed";
                    const response = await processBinTask(binID, isLoadingToCar);

                    if (response && response.success) {
                      console.log(`🚀 API Success: ${response.message}`);
                      await fetchTaskStatus(); // ✅ 更新任务状态
                      onScanSuccess?.(binID);
                    } else {
                      await fetchTaskStatus(); // ✅ 更新任务状态
                      console.error("❌ Operation failed: Unexpected response from server.");
                    }
                  } catch (err: any) {
                    console.error(`❌ API Error: ${err.response?.data?.message || err.message}`);
                  }
                } else {
                  console.error("❌ Invalid QR format, expected UUID binID");
                }
              }
            },
            {
              highlightScanRegion: false, // ✅ 避免 `highlightScanRegion` 错误
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