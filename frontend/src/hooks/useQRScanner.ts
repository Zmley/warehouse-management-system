import { useState, useRef, useEffect } from "react";
import QrScanner from "qr-scanner";
import { useTransportContext } from "../context/transportTaskContext";
import { processBinTask } from "../api/transportTaskApi";

const useQRScanner = (onScanSuccess?: (warehouseID: string, binID: string) => void) => {
  const { startTask, proceedToUnload, transportStatus } = useTransportContext();
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<QrScanner | null>(null);

  // ✅ **定义 stopScanning 方法**
  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.stop();
      scannerRef.current.destroy();
      scannerRef.current = null;
    }
    setIsScanning(false);

    if (videoRef.current) {
      const tracks = (videoRef.current.srcObject as MediaStream)?.getTracks();
      tracks?.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    return () => {
      stopScanning(); // ✅ **确保离开页面时清理摄像头**
    };
  }, []);

  const startScanning = async () => {
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
                stopScanning(); // ✅ **扫描成功后停止摄像头**

                const [warehouseID, binID] = result.data.split("+");
                if (warehouseID && binID) {
                  console.log(`✅ Parsed warehouseID: ${warehouseID}, binID: ${binID}`);

                  try {
                    // ✅ 立即更新状态，防止按钮状态错误
                    if (transportStatus === "pending") {
                      startTask(warehouseID, binID);
                    }

                    const response = await processBinTask(warehouseID, binID, transportStatus === "pending");

                    if (response.success) {
                      console.log(`🚀 API Success: ${response.message}`);

                      if (transportStatus === "inProcess1") {
                        proceedToUnload(); // ✅ 进入 `inProcess2`
                      }

                      onScanSuccess?.(warehouseID, binID);
                    } else {
                      console.error("❌ Operation failed: Unexpected response from server.");
                    }
                  } catch (err: any) {
                    console.error(`❌ API Error: ${err.response?.data?.message || err.message}`);
                  }
                } else {
                  console.error("❌ Invalid QR format, expected 'WH-001+BIN-2'");
                }
              }
            },
            {
              highlightScanRegion: false,
              highlightCodeOutline: false,
            }
          );
        }

        await scannerRef.current.start();
      }
    } catch (error) {
      console.error("❌ Unable to access camera:", error);
      alert("Failed to access the camera. Please check permissions or switch browsers.");
    }
  };

  return { videoRef, isScanning, startScanning, stopScanning }; // ✅ **返回 stopScanning**
};

export default useQRScanner;