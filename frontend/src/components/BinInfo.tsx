import { Box, Typography } from "@mui/material";

const BinInfo = ({ taskData }: { taskData: any }) => {
  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", mt: 2 }}>
      <Box sx={{ textAlign: "center", flex: 1 }}>
        <Typography variant="subtitle2" sx={{ fontSize: "14px", fontWeight: "bold" }}>
          Source Bin
        </Typography>
        <Typography variant="body1" sx={{ fontSize: "16px", fontWeight: "bold" }}>
          {taskData.binCode || "--"}
        </Typography>
      </Box>

      <Box sx={{ textAlign: "center", flex: 1 }}>
        <Typography variant="subtitle2" sx={{ fontSize: "14px", fontWeight: "bold", color: "#d32f2f" }}>
          Needed
        </Typography>
        <Typography variant="body1" sx={{ fontSize: "16px", fontWeight: "bold", color: "#d32f2f" }}>
          {taskData.pickerNeededProduct || "--"}
        </Typography>
      </Box>

      <Box sx={{ textAlign: "center", flex: 1 }}>
        <Typography variant="subtitle2" sx={{ fontSize: "14px", fontWeight: "bold" }}>
          Target Bin
        </Typography>
        <Typography variant="body1" sx={{ fontSize: "16px", fontWeight: "bold" }}>
          {taskData.targetCode || "--"}
        </Typography>
      </Box>
    </Box>
  );
};

export default BinInfo;