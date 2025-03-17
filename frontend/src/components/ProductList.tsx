import { Box, Typography, Checkbox, TextField } from "@mui/material";

const ProductList = ({
  selectedProducts,
  setSelectedProducts,
}: {
  selectedProducts: any[];
  setSelectedProducts: Function;
}) => {
  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: "bold" }}>
        📋 Product List
      </Typography>
      {selectedProducts.length > 0 ? (
        selectedProducts.map((product) => (
          <Box
            key={product.productID}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mt: 2,
              padding: "8px",
              bgcolor: "#e3f2fd",
              borderRadius: "8px",
            }}
          >
            <Checkbox
              checked={product.selected}
              onChange={() =>
                setSelectedProducts((prev) =>
                  prev.map((p) => (p.productID === product.productID ? { ...p, selected: !p.selected } : p))
                )
              }
            />
            <Typography variant="body1" sx={{ fontWeight: "bold" }}>
              {product.productID}
            </Typography>
            <Typography variant="body2" sx={{ fontSize: "14px", fontWeight: "bold", color: "#555" }}>
              Total: {product.quantity}
            </Typography>
            <TextField
              type="number"
              size="small"
              value={product.quantity}
              onChange={(e) =>
                setSelectedProducts((prev) =>
                  prev.map((p) =>
                    p.productID === product.productID
                      ? { ...p, quantity: Math.max(0, Number(e.target.value)) }
                      : p
                  )
                )
              }
              sx={{ width: "80px", textAlign: "center" }}
              inputProps={{ min: 0 }}
              disabled={!product.selected}
            />
          </Box>
        ))
      ) : (
        <Typography variant="body2" sx={{ color: "#757575", mt: 1 }}>
          No products available.
        </Typography>
      )}
    </Box>
  );
};

export default ProductList;