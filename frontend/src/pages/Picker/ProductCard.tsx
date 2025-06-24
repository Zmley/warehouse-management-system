import React from 'react'
import { Card, CardContent, Typography, Box, Chip } from '@mui/material'
import { ProductType } from 'types/product'
import { useTranslation } from 'react-i18next'

interface ProductCardProps {
  product: ProductType
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { t } = useTranslation()

  return (
    <Card
      sx={{
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
        p: 1,
        width: '70%',
        maxWidth: 360,
        backgroundColor: '#fff',
        mx: 'auto'
      }}
    >
      <CardContent sx={{ px: 2, py: 1.5 }}>
        {' '}
        <Typography variant='h6' fontWeight='bold' gutterBottom>
          {t('productCard.title')}
        </Typography>
        <Box sx={{ mb: 1.2 }}>
          <Typography variant='body2' color='text.secondary' mb={0.3}>
            {t('productCard.productCode')}
          </Typography>
          <Typography fontWeight={500} fontSize={15}>
            {product.productCode}
          </Typography>
        </Box>
        <Box sx={{ mb: 1.2 }}>
          <Typography variant='body2' color='text.secondary' mb={0.3}>
            {t('productCard.barCode')}
          </Typography>
          <Typography fontWeight={500} fontSize={15}>
            {product.barCode}
          </Typography>
        </Box>
        <Box sx={{ mb: 1.2 }}>
          <Typography variant='body2' color='text.secondary' mb={0.3}>
            {t('productCard.boxType')}
          </Typography>
          <Typography fontWeight={500} fontSize={15}>
            {product.boxType}
          </Typography>
        </Box>
        {product.binCode && (
          <Box sx={{ mt: 1 }}>
            <Typography variant='body2' color='text.secondary' mb={0.3}>
              {t('productCard.pickBinCode', 'Pick Up BinCode')}
            </Typography>
            <Chip label={product.binCode} />
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default ProductCard
