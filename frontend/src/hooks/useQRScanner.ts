import { useState, useRef, useEffect } from "react";
import QrScanner from "qr-scanner";
import { useTransportContext } from "../context/transportTaskContext";
import { processBinTask } from "../api/transportTaskApi";

const useQRScanner = (onScanSuccess?: (binID: string) => void) => {
  const { fetchTaskStatus } = useTransportContext();
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<QrScanner | null>(null);

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
      stopScanning();
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
                stopScanning();

                const binID = result.data.trim();
                if (binID) {
                  console.log(`✅ Parsed binID: ${binID}`);

                  try {
                    const response = await processBinTask(binID, true);

                    if (response.success) {
                      console.log(`🚀 API Success: ${response.message}`);
                      await fetchTaskStatus(); // ✅ 确保任务状态更新
                      onScanSuccess?.(binID);
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

  return { videoRef, isScanning, startScanning, stopScanning };
};

export default useQRScanner;