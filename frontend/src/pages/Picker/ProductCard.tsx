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
        {/* 顶部：主信息一行（尽量少占高） */}
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

          {/* binCode 行内展示，节省高度 */}
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

        {/* 次要信息：压缩为三行，小字、紧凑行距 */}
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

          {/* 如果需要把 binCode 再列出来（除顶部 Chip 外），可保留此行；不需要可删掉 */}
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
