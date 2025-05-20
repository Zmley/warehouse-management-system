import React from 'react'
import { Card, CardContent, Typography, Box } from '@mui/material'
import { ProductType } from 'types/product'

interface ProductCardProps {
  product: ProductType
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return (
    <Card
      sx={{
        borderRadius: 4,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        p: 2,
        width: '100%',
        maxWidth: 400
      }}
    >
      <CardContent>
        <Typography variant='h6' fontWeight='bold' gutterBottom>
          Product Info
        </Typography>
        <Box sx={{ mb: 1 }}>
          <Typography variant='body2' color='text.secondary'>
            Product Code
          </Typography>
          <Typography fontWeight='medium'>{product.productCode}</Typography>
        </Box>
        <Box sx={{ mb: 1 }}>
          <Typography variant='body2' color='text.secondary'>
            Bar Code
          </Typography>
          <Typography fontWeight='medium'>{product.barCode}</Typography>
        </Box>
        <Box>
          <Typography variant='body2' color='text.secondary'>
            Box Type
          </Typography>
          <Typography fontWeight='medium'>{product.boxType}</Typography>
        </Box>
      </CardContent>
    </Card>
  )
}

export default ProductCard
