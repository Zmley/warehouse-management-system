import React from "react";
import { Box, TextField, InputAdornment, IconButton, Typography } from "@mui/material";
import { Search, Menu } from "@mui/icons-material";

const Topbar: React.FC = () => {
  return (
    <Box
      sx={{
        height: "60px",
        backgroundColor: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 20px",
        boxShadow: "0px 2px 4px rgba(0,0,0,0.1)",
      }}
    >
      {/* 标题 */}
      <Typography variant="h6" sx={{ fontWeight: "bold", color: "#333" }}>
        Welcome Name!
      </Typography>

      {/* 搜索框 */}
      <TextField
        variant="outlined"
        placeholder="Search"
        size="small"
        sx={{
          width: "250px",
          borderRadius: "20px",
          backgroundColor: "#f5f5f5",
          "& .MuiOutlinedInput-root": {
            borderRadius: "20px",
          },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
        }}
      />

      {/* 菜单按钮 */}
      <IconButton>
        <Menu sx={{ fontSize: "28px", color: "#333" }} />
      </IconButton>
    </Box>
  );
};

export default Topbar;