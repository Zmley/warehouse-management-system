import React, { useState, useEffect } from 'react'
import { Box, Button, Container, Typography, Fade, Paper } from '@mui/material'
import CancelIcon from '@mui/icons-material/Cancel'
import { useNavigate } from 'react-router-dom'
import useQRScanner from 'hooks/useQRScanner'
import { useProduct } from 'hooks/useProduct'
import AddToCartInline from 'pages/TransportWorker/AddToCartInline'
import { ProductType } from 'types/product'
import { useTranslation } from 'react-i18next'

const ScanProductQRCode = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [hasScanned, setHasScanned] = useState(false)
  const [scannedProduct, setScannedProduct] = useState<ProductType | null>(null)
  const [isLoadingProduct, setIsLoadingProduct] = useState(false)
  const { fetchProduct } = useProduct()

  const { videoRef, startScanning, stopScanning } =
    useQRScanner(handleScanSuccess)

  async function handleScanSuccess(barcode: string) {
    if (hasScanned || !/^\d{12}$/.test(barcode)) return
    setHasScanned(true)
    setIsLoadingProduct(true)
    try {
      const product = await fetchProduct(barcode)
      if (product) {
        stopScanning()
        const stream = (videoRef.current as HTMLVideoElement | null)?.srcObject
        if (stream && stream instanceof MediaStream) {
          stream.getTracks().forEach(track => track.stop())
        }
        setScannedProduct(product)
      } else {
        alert(t('scan.productNotFound'))
        setHasScanned(false)
      }
    } catch (err) {
      alert(t('scan.fetchError'))
      setHasScanned(false)
    } finally {
      setIsLoadingProduct(false)
    }
  }

  useEffect(() => {
    startScanning()
    return () => {
      stopScanning()
      const stream = (videoRef.current as HTMLVideoElement | null)?.srcObject
      if (stream && stream instanceof MediaStream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  return (
    <Box
      sx={{
        height: '100vh',
        backgroundColor: '#f9f9f9',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        px: 2
      }}
    >
      <Fade in timeout={600}>
        <Paper
          elevation={6}
          sx={{
            p: 3,
            borderRadius: 4,
            width: '100%',
            maxWidth: 420,
            backgroundColor: '#fff'
          }}
        >
          <Typography
            variant='h5'
            fontWeight='bold'
            align='center'
            gutterBottom
          >
            {t('scan.scanProduct')}
          </Typography>

          <Box position='relative' width='100%' height='240px' mt={1.5}>
            <video
              ref={videoRef}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: 12,
                border: '2px solid #ddd'
              }}
            />

            {/* 外层虚线框 */}
            <Box
              sx={{
                position: 'absolute',
                top: '15%',
                left: '10%',
                width: '80%',
                height: '70%',
                border: '2px dashed #1976d2',
                borderRadius: 2,
                zIndex: 10,
                pointerEvents: 'none'
              }}
            />

            {/* 中间扫描线 */}
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '10%',
                width: '80%',
                height: '2px',
                background:
                  'linear-gradient(to right, #1976d2, #42a5f5, #1976d2)',
                boxShadow: '0 0 10px rgba(25, 118, 210, 0.8)',
                transform: 'translateY(-1px)',
                zIndex: 11,
                pointerEvents: 'none'
              }}
            />

            {/* 提示语 */}
            <Typography
              align='center'
              sx={{
                position: 'absolute',
                bottom: -28,
                width: '100%',
                fontSize: 14,
                color: '#333',
                fontWeight: 'bold'
              }}
            >
              {t('scan.alignPrompt')}
            </Typography>
          </Box>

          {isLoadingProduct && (
            <Typography color='primary' mt={2} align='center'>
              {t('scan.loadingProduct')}
            </Typography>
          )}

          {scannedProduct && (
            <Box mt={4}>
              <AddToCartInline
                product={scannedProduct}
                onSuccess={() => navigate(-1)}
              />
            </Box>
          )}

          <Button
            startIcon={<CancelIcon />}
            variant='outlined'
            color='error'
            fullWidth
            sx={{
              mt: 4,
              borderRadius: 2,
              fontWeight: 'bold',
              fontSize: 15,
              py: 1.2,
              borderWidth: 2,
              '&:hover': {
                backgroundColor: '#ffe5e5',
                borderColor: '#d32f2f'
              }
            }}
            onClick={() => navigate(-1)}
          >
            {t('scan.cancel')}
          </Button>
        </Paper>
      </Fade>
    </Box>
  )
}

export default ScanProductQRCode
