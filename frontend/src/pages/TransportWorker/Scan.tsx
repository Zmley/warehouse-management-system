import {
  Container,
  Typography,
  Button,
  Box,
  Fade,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import CancelIcon from '@mui/icons-material/Cancel'

import useQRScanner from 'hooks/useQRScanner'
import { useCartContext } from 'contexts/cart'
import { useCart } from 'hooks/useCart'
import AutocompleteTextField from 'utils/AutocompleteTextField'
import { useBin } from 'hooks/useBin'
import { ProductType } from 'types/product'
import { useProduct } from 'hooks/useProduct'
import AddToCartInline from 'pages/AddToCartInline'

const isAndroid = /Android/i.test(navigator.userAgent)

const Scan = () => {
  const navigate = useNavigate()
  const [hasScanned, setHasScanned] = useState(false)
  const [mode, setMode] = useState<'scanner' | 'manual'>('scanner')

  const { isCartEmpty } = useCartContext()
  const { loadCart, unloadCart, error } = useCart()
  const { binCodes, fetchBinCodes } = useBin()
  const { fetchProduct } = useProduct()

  const [scannedProduct, setScannedProduct] = useState<ProductType | null>(null)
  const [isLoadingProduct, setIsLoadingProduct] = useState(false)

  const { videoRef, startScanning, stopScanning } =
    useQRScanner(handleScanSuccess)

  async function handleScanSuccess(binCode: string) {
    if (hasScanned) return

    if (/^\d{12}$/.test(binCode)) {
      setHasScanned(true)
      setIsLoadingProduct(true)
      try {
        const product = await fetchProduct(binCode)
        if (product) {
          await stopScanning()
          setScannedProduct(product)
        } else {
          alert('❌ Product not found')
          setHasScanned(false)
        }
      } catch (err) {
        alert('❌ Error fetching product')
        console.error(err)
        setHasScanned(false)
      } finally {
        setIsLoadingProduct(false)
      }
      return
    }

    try {
      if (isCartEmpty) {
        await loadCart({ binCode })
      } else {
        await unloadCart(binCode)
      }
    } catch (err) {
      console.error('❌ Error handling scan:', err)
      alert('❌ Operation failed. Please try again.')
    }
  }

  useEffect(() => {
    fetchBinCodes()

    if (!isAndroid) {
      if (mode === 'scanner') {
        startScanning()
      } else {
        stopScanning()
      }
    }

    return () => {
      stopScanning()
    }
  }, [mode])

  const [manualBinCode, setManualBinCode] = useState('')
  const availableBinCodes = [...binCodes]

  const handleManualSubmit = async () => {
    if (!manualBinCode.trim()) return alert('❌ Please enter a bin code.')
    await handleScanSuccess(manualBinCode)
  }

  return (
    <Box
      sx={{
        height: '100vh',
        width: '100%',
        background: 'linear-gradient(135deg, #e3f2fd, #bbdefb)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <Fade in timeout={800}>
        <Box>
          <Container
            maxWidth='sm'
            sx={{
              textAlign: 'center',
              backgroundColor: 'rgba(255,255,255,0.8)',
              backdropFilter: 'blur(12px)',
              borderRadius: '20px',
              p: 4,
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
            }}
          >
            <ToggleButtonGroup
              value={mode}
              exclusive
              onChange={(_, newMode) => {
                if (!newMode) return
                if (newMode === 'scanner') {
                  startScanning()
                } else {
                  stopScanning()
                }
                setMode(newMode)
              }}
              sx={{
                mt: 4,
                mb: 5, // ✅ 与下方内容保持距离
                borderRadius: '999px',
                backgroundColor: '#e2e8f0', // 淡灰蓝背景
                boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.05)',
                width: 'fit-content',
                mx: 'auto',
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
                  backgroundColor:
                    mode === 'scanner' ? '#3b82f6' : 'transparent',
                  '&:hover': {
                    backgroundColor: mode === 'scanner' ? '#2563eb' : '#e2e8f0'
                  },
                  transition: 'all 0.2s ease'
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
                  backgroundColor:
                    mode === 'manual' ? '#3b82f6' : 'transparent',
                  '&:hover': {
                    backgroundColor: mode === 'manual' ? '#2563eb' : '#e2e8f0'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                🔠 Manual
              </ToggleButton>
            </ToggleButtonGroup>
            {mode === 'scanner' && (
              <Box
                sx={{
                  width: '100%',
                  maxWidth: '400px',
                  height: '260px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  mx: 'auto',
                  border: '5px solid #1976d2',
                  boxShadow: '0 4px 20px rgba(25, 118, 210, 0.3)'
                }}
              >
                <video
                  ref={videoRef}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  autoPlay
                  playsInline
                  muted
                />
              </Box>
            )}

            {/* <Typography
              variant='h5'
              sx={{ mt: 3, fontWeight: 700, color: '#1e3a8a' }}
            >
              <QrCodeScannerIcon sx={{ mr: 1, fontSize: 30 }} />
              {mode === 'scanner' ? 'Scanner Mode' : 'Manual Entry Mode'}
            </Typography>

            <Button variant='outlined' sx={{ mt: 2 }} onClick={toggleMode}>
              {mode === 'scanner'
                ? '🔠 Switch to Manual Entry'
                : '📷 Switch to Scanner'}
            </Button> */}

            {/* <ToggleButtonGroup
              value={mode}
              exclusive
              onChange={(_, newMode) => {
                if (!newMode) return
                if (newMode === 'scanner') {
                  startScanning()
                } else {
                  stopScanning()
                }
                setMode(newMode)
              }}
              sx={{
                mt: 3,
                borderRadius: '999px',
                backgroundColor: '#f1f5f9',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              <ToggleButton value='scanner' sx={{ px: 3, py: 1 }}>
                📷 Scanner
              </ToggleButton>
              <ToggleButton value='manual' sx={{ px: 3, py: 1 }}>
                🔠 Manual
              </ToggleButton>
            </ToggleButtonGroup> */}

            {mode === 'manual' && (
              <Box sx={{ mt: 3 }}>
                <AutocompleteTextField
                  label='Enter Bin Code'
                  value={manualBinCode}
                  onChange={setManualBinCode}
                  onSubmit={handleManualSubmit}
                  options={availableBinCodes}
                  sx={{ maxWidth: '360px', mx: 'auto' }}
                />
                <Button
                  variant='contained'
                  sx={{ mt: 2 }}
                  onClick={handleManualSubmit}
                >
                  Submit
                </Button>
              </Box>
            )}

            {scannedProduct && (
              <Box sx={{ mt: 4 }}>
                <AddToCartInline
                  product={scannedProduct}
                  onSuccess={() => {
                    navigate('/my-task')
                  }}
                />
              </Box>
            )}

            <Box sx={{ mt: 4 }}>
              <Button
                variant='contained'
                color='error'
                startIcon={<CancelIcon />}
                sx={{
                  fontSize: '15px',
                  borderRadius: '12px',
                  px: 4,
                  py: 1.4,
                  boxShadow: '0 4px 14px rgba(211,47,47,0.3)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: '#c62828',
                    boxShadow: '0 6px 20px rgba(211,47,47,0.4)'
                  }
                }}
                onClick={() => {
                  stopScanning()
                  navigate(-1)
                }}
              >
                Cancel
              </Button>

              {error && (
                <Typography color='error' sx={{ mt: 2, fontWeight: 500 }}>
                  {error}
                </Typography>
              )}
            </Box>
          </Container>

          {isLoadingProduct && (
            <Typography color='primary' sx={{ mt: 3, textAlign: 'center' }}>
              Loading product info...
            </Typography>
          )}
        </Box>
      </Fade>
    </Box>
  )
}

export default Scan
