import {
  Box,
  Button,
  Typography,
  Paper,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useQRScanner from 'hooks/useQRScanner'
import { useBin } from 'hooks/useBin'
import { useProduct } from 'hooks/useProduct'
import { ProductType } from 'types/product'
import ProductCard from './ProductCard'
import AutocompleteTextField from 'utils/AutocompleteTextField'

const isAndroid = /Android/i.test(navigator.userAgent)

const Scan = () => {
  const navigate = useNavigate()
  const [product, setProduct] = useState<ProductType | null>(null)
  const [mode, setMode] = useState<'scanner' | 'manual'>('scanner')
  const [manualBinCode, setManualBinCode] = useState('')

  const { fetchBinByCode, fetchBinCodes, binCodes } = useBin()
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
    fetchBinCodes()

    if (!isAndroid && mode === 'scanner' && !isScanning) {
      startScanning()
    }

    const interval = setInterval(() => {
      const stream = (videoRef.current as HTMLVideoElement | null)?.srcObject
      if (stream instanceof MediaStream) {
        streamRef.current = stream
        clearInterval(interval)
      }
    }, 300)

    return () => {
      stopScanning()
      streamRef.current?.getTracks().forEach(track => track.stop())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  const handleCancel = async () => {
    stopScanning()
    const stream = (videoRef.current as HTMLVideoElement | null)?.srcObject
    if (stream instanceof MediaStream) {
      stream.getTracks().forEach(track => track.stop())
    }
    navigate('/')
  }

  const handleManualSubmit = async () => {
    if (!manualBinCode.trim()) return alert('❌ Please enter a bin code.')
    await handleScan(manualBinCode.trim())
  }

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
      <Typography variant='h5' fontWeight='bold' mb={2}>
        Scan or Enter a Bin/Product
      </Typography>

      <ToggleButtonGroup
        value={mode}
        exclusive
        onChange={(_, newMode) => {
          if (!newMode) return
          setMode(newMode)
          if (newMode === 'scanner') startScanning()
          else stopScanning()
        }}
        sx={{
          mb: 3,
          borderRadius: '999px',
          backgroundColor: '#e2e8f0',
          boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.05)',
          p: '4px'
        }}
      >
        <ToggleButton
          value='scanner'
          sx={{
            px: 3,
            py: 1,
            borderRadius: '999px',
            fontWeight: 'bold',
            color: mode === 'scanner' ? '#fff' : '#1e293b',
            backgroundColor: mode === 'scanner' ? '#3b82f6' : 'transparent',
            '&:hover': {
              backgroundColor: mode === 'scanner' ? '#2563eb' : '#e2e8f0'
            }
          }}
        >
          📷 Scanner
        </ToggleButton>
        <ToggleButton
          value='manual'
          sx={{
            px: 3,
            py: 1,
            borderRadius: '999px',
            fontWeight: 'bold',
            color: mode === 'manual' ? '#fff' : '#1e293b',
            backgroundColor: mode === 'manual' ? '#3b82f6' : 'transparent',
            '&:hover': {
              backgroundColor: mode === 'manual' ? '#2563eb' : '#e2e8f0'
            }
          }}
        >
          🔠 Manual
        </ToggleButton>
      </ToggleButtonGroup>

      {mode === 'scanner' && (
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
      )}

      {mode === 'manual' && (
        <Box mt={2} width='100%' maxWidth={400}>
          <AutocompleteTextField
            label='Enter Bin Code or Product Code'
            value={manualBinCode}
            onChange={setManualBinCode}
            onSubmit={handleManualSubmit}
            options={binCodes}
          />
          <Button
            variant='contained'
            sx={{ mt: 2 }}
            fullWidth
            onClick={handleManualSubmit}
          >
            Submit
          </Button>
        </Box>
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
        onClick={handleCancel}
      >
        ❌ Cancel
      </Button>
    </Box>
  )
}

export default Scan
