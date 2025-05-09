import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Typography, Button, Box, Paper } from '@mui/material'
import useQRScanner from 'hooks/useQRScanner'
import { useBin } from 'hooks/useBin'
import { useProduct } from 'hooks/useProduct'
import { ProductType } from 'types/product'
import ProductCard from './ProductCard'

const isAndroid = /Android/i.test(navigator.userAgent)

const Scan = () => {
  const navigate = useNavigate()
  const [hasInteracted, setHasInteracted] = useState(false)
  const [product, setProduct] = useState<ProductType | null>(null)

  const { fetchBinByCode } = useBin()
  const { fetchProduct } = useProduct()

  const handleScan = async (code: string) => {
    console.log('📦 Scanned:', code)

    if (/^\d{12}$/.test(code)) {
      try {
        const fetchedProduct = await fetchProduct(code)
        if (fetchedProduct) {
          setProduct(fetchedProduct)
        } else {
          alert('❌ Product not found')
        }
      } catch (err) {
        console.error('❌ Failed to fetch product:', err)
        alert('❌ Error fetching product info')
      }
      return
    }

    try {
      const bin = await fetchBinByCode(code)
      navigate('/create-task', { state: { bin } })
    } catch (err: any) {
      console.error('❌ Failed to fetch bin info:', err)
      alert('❌ Invalid bin code')
    }
  }

  const { videoRef, startScanning, stopScanning, isScanning } =
    useQRScanner(handleScan)

  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (!isAndroid && !isScanning) {
      startScanning()
    }

    const currentStream = streamRef.current

    return () => {
      stopScanning()
      currentStream?.getTracks().forEach(track => track.stop())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Box
      sx={{
        height: '100vh',
        backgroundColor: '#f5f7fa',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2
      }}
    >
      <Typography variant='h5' fontWeight='bold' mb={3}>
        Scan a Bin or Product
      </Typography>

      <Paper
        elevation={4}
        sx={{
          width: '90%',
          maxWidth: 400,
          height: 280,
          borderRadius: 4,
          overflow: 'hidden',
          position: 'relative',
          border: '3px solid #1976d2',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}
      >
        <video
          ref={videoRef}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            backgroundColor: '#000'
          }}
          autoPlay
          playsInline
          muted
        />
        <Box
          sx={{
            position: 'absolute',
            top: '10%',
            left: '10%',
            width: '80%',
            height: '80%',
            border: '2px dashed #ffffffaa',
            borderRadius: '12px',
            zIndex: 10
          }}
        />
      </Paper>

      {isAndroid && !isScanning && !hasInteracted && (
        <Button
          variant='outlined'
          sx={{ mt: 2, maxWidth: 400 }}
          fullWidth
          onClick={async () => {
            setHasInteracted(true)
            await startScanning()
          }}
        >
          👉 Android: Tap to Enable Camera
        </Button>
      )}

      {product && (
        <Box mt={4} width='100%' display='flex' justifyContent='center'>
          <ProductCard product={product} />
        </Box>
      )}

      <Button
        variant='contained'
        color='error'
        fullWidth
        sx={{ maxWidth: 400, mt: 3 }}
        onClick={() => {
          stopScanning()
          navigate('/')
        }}
      >
        ❌ Cancel
      </Button>
    </Box>
  )
}

export default Scan
