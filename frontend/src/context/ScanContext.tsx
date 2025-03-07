import { createContext, useContext, useRef, useState, useEffect } from "react";

interface ScanContextType {
  videoRef: React.RefObject<HTMLVideoElement>;
  startScanning: () => void;
  stopScanning: () => void;
}

const ScanContext = createContext<ScanContextType | undefined>(undefined);

export const ScanProvider = ({ children }: { children: React.ReactNode }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startScanning = async () => {
    if (stream) return; // ✅ 避免重复调用

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play().catch((err) => console.error("Autoplay error:", err)); // ✅ 处理 play() 异常
      }
      setStream(mediaStream);
    } catch (error) {
      console.error("Camera error:", error);
    }
  };

  const stopScanning = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop()); // ✅ 关闭摄像头流
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null; // ✅ 释放 video 资源
    }
  };

  useEffect(() => {
    return () => stopScanning(); // ✅ 组件卸载时自动关闭摄像头
  }, []);

  return (
    <ScanContext.Provider
      value={{
        videoRef: videoRef as React.RefObject<HTMLVideoElement>, // ✅ 修正类型
        startScanning,
        stopScanning,
      }}
    >
      {children}
    </ScanContext.Provider>
  );
};

export const useScanContext = () => {
  const context = useContext(ScanContext);
  if (!context) {
    throw new Error("useScanContext must be used within a ScanProvider");
  }
  return context;
};
