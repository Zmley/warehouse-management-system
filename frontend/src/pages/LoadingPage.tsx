import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import { useTransportContext } from '../context/transportTaskContext'


const LoadingPage = () => {
  const navigate = useNavigate();

  

  useEffect(() => {
    const timer = setTimeout(() => {
        // fetchTaskStatus();
      navigate("/in-process-task");
      window.location.reload()
    }, ); // 延时 500ms 后跳转

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <Box sx={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <CircularProgress />
    </Box>
  );
};

export default LoadingPage;