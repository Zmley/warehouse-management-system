import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTransportContext } from "../../context/transportTaskContext";
import ScanTaskPage from "./ScanTaskPage"; // ✅ 扫码界面
import InProcessTaskPage from "./InProcessTaskPage"; // ✅ 任务进行中界面
import { CircularProgress, Container } from "@mui/material";

const TransportTask = () => {
  const { transportStatus, fetchTaskStatus } = useTransportContext();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTaskStatus(); // ✅ 组件挂载时自动获取任务状态
  }, []);

  if (!transportStatus) {
    return (
      <Container sx={{ textAlign: "center", marginTop: "50px" }}>
        <CircularProgress />
      </Container>
    );
  }

  return transportStatus === "completed" ? <ScanTaskPage /> : <InProcessTaskPage />;
};

export default TransportTask;