import { useState, useRef, useEffect } from "react";
import QrScanner from "qr-scanner";
import { useTransportTask } from "../context/transportTaskContext"; 

const useQRScanner = () => {
  const { setIsInProcess } = useTransportTask(); 
  const [data, setData] = useState<string>("No result");
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<QrScanner | null>(null);

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    setData("No result");
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
            (result) => {
              if (result.data) {
                setData(result.data);
                console.log("✅ QR Code scanned:", result.data);
                stopScanning();
                setIsInProcess(true); // ✅ 设置 Context，表示开始运输
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

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.stop();
      scannerRef.current.destroy();
      scannerRef.current = null;
    }
    setIsScanning(false);

    if (videoRef.current) {
      const canvasElements = videoRef.current.parentElement?.querySelectorAll("canvas");
      canvasElements?.forEach((canvas) => canvas.remove());
    }

    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  return { videoRef, data, isScanning, startScanning, stopScanning };
};

export default useQRScanner;