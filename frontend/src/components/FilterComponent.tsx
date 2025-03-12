import React from "react";
import { Box, Select, MenuItem, Button } from "@mui/material";

interface FilterProps {
  selectedBin: string;
  setSelectedBin: (bin: string) => void;
  bins: { binID: string; binCode: string }[];
  onNewProductClick: () => void; // ✅ 新增按钮点击事件
}

const FilterComponent: React.FC<FilterProps> = ({ selectedBin, setSelectedBin, bins, onNewProductClick }) => {
  return (
    <Box
      sx={{
        marginBottom: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between", // ✅ 让下拉框和按钮分开
        backgroundColor: "#d2e0f0",
        padding: "10px",
        borderRadius: "8px",
      }}
    >
      {/* 📌 BinCode 筛选下拉框 */}
      <Select
        value={selectedBin}
        onChange={(e) => setSelectedBin(e.target.value)}
        size="small"
        sx={{ width: "150px" }}
      >
        <MenuItem value="All">All Bins</MenuItem>
        {bins.map((bin) => (
          <MenuItem key={bin.binID} value={bin.binID}>
            {bin.binCode}
          </MenuItem>
        ))}
      </Select>

      {/* ➕ `+ New Product` 按钮 */}
      <Button variant="contained" color="primary" onClick={onNewProductClick}>
        + New Product
      </Button>
    </Box>
  );
};

export default FilterComponent;