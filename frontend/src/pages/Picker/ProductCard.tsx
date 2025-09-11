import React from 'react'
import { Card, CardContent, Typography, Box, Chip, Stack } from '@mui/material'
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
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        backgroundColor: '#fff',
        width: '100%',
        maxWidth: 520,
        mx: 'auto'
      }}
    >
      <CardContent
        sx={{
          px: 1.25,
          py: 1,
          '&:last-child': { pb: 1 }
        }}
      >
        <Stack
          direction='row'
          alignItems='center'
          spacing={1}
          sx={{ mb: 0.5, minWidth: 0 }}
        >
          <Typography
            variant='subtitle1'
            fontWeight={700}
            noWrap
            sx={{ flex: 1, minWidth: 0 }}
            title={`${t('productCard.productCode')}: ${product.productCode}`}
          >
            {product.productCode}
          </Typography>

          {product.binCode && (
            <Chip
              label={product.binCode}
              size='small'
              color='default'
              variant='outlined'
              sx={{ fontWeight: 600 }}
            />
          )}
        </Stack>

        <Box sx={{ display: 'grid', rowGap: 0.25 }}>
          <Stack direction='row' spacing={0.75}>
            <Typography
              variant='caption'
              color='text.secondary'
              sx={{ width: 86, flexShrink: 0 }}
            >
              {t('productCard.barCode')}
            </Typography>
            <Typography
              variant='body2'
              sx={{ lineHeight: 1.5 }}
              noWrap
              title={product.barCode}
            >
              {product.barCode || '-'}
            </Typography>
          </Stack>

          <Stack direction='row' spacing={0.75}>
            <Typography
              variant='caption'
              color='text.secondary'
              sx={{ width: 86, flexShrink: 0 }}
            >
              {t('productCard.boxType')}
            </Typography>
            <Typography
              variant='body2'
              sx={{ lineHeight: 1.5 }}
              noWrap
              title={product.boxType}
            >
              {product.boxType || '-'}
            </Typography>
          </Stack>

          {product.binCode && (
            <Stack direction='row' spacing={0.75}>
              <Typography
                variant='caption'
                color='text.secondary'
                sx={{ width: 86, flexShrink: 0 }}
              >
                {t('productCard.pickBinCode', 'Pick Up BinCode')}
              </Typography>
              <Typography
                variant='body2'
                sx={{ lineHeight: 1.5 }}
                noWrap
                title={product.binCode}
              >
                {product.binCode}
              </Typography>
            </Stack>
          )}
        </Box>
      </CardContent>
    </Card>
  )
}

export default ProductCard
