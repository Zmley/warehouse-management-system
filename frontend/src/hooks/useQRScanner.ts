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
    console.log("📷 Stopping QR Scanner...");
  
    if (scannerRef.current) {
      scannerRef.current.stop();
      scannerRef.current.destroy();
      scannerRef.current = null;
    }
  
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      console.log(`🛑 Stopping ${stream.getTracks().length} tracks...`);
      stream.getTracks().forEach((track) => {
        track.stop();
        console.log(`🛑 Track ${track.kind} stopped.`);
      });
      videoRef.current.srcObject = null;
    }
  
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    console.log("🚀 Starting QR Scanner...");
    stopScanning(); // ✅ 确保每次都清理之前的 scanner
    await new Promise((resolve) => setTimeout(resolve, 100)); // ✅ 添加 100ms 延迟，确保摄像头完全释放


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
                      console.log(`🚀 API Success: ${response}`);
                      await fetchTaskStatus(); // ✅ 更新任务状态
                      onScanSuccess?.(binID);
                      stopScanning();
                    } else {
            
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