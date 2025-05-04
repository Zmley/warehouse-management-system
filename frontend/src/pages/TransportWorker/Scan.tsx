import { Container, Typography, Button, Box, Fade } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'
import CancelIcon from '@mui/icons-material/Cancel'

import useQRScanner from 'hooks/useQRScanner'
import { useCartContext } from 'contexts/cart'
import { useCart } from 'hooks/useCart'

const isAndroid = /Android/i.test(navigator.userAgent)

const Scan = () => {
  const navigate = useNavigate()
  const [hasStarted, setHasStarted] = useState(false)

  const { isCartEmpty } = useCartContext()
  const { loadCart, unloadCart, error } = useCart()

  const handleScanSuccess = async (binCode: string) => {
    console.log(`Scanned bin code: ${binCode}`)
    try {
      if (isCartEmpty) {
        await loadCart(binCode)
      } else {
        await unloadCart(binCode)
      }
    } catch (err) {
      console.error('❌ Error handling scan:', err)
      alert('❌ Operation failed. Please try again.')
    }
  }

  const { videoRef, startScanning, stopScanning } =
    useQRScanner(handleScanSuccess)

  useEffect(() => {
    if (!isAndroid && !hasStarted) {
      startScanning()
      setHasStarted(true)
    }

    return () => {
      stopScanning()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleAndroidStart = async () => {
    try {
      await startScanning()
      setHasStarted(true)
    } catch (e) {
      alert('❌ Camera failed to start. Please check permissions.')
      console.error(e)
    }
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
          {/* 视频区域 */}
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

          {/* 标题 */}
          <Typography
            variant='h5'
            sx={{ mt: 3, fontWeight: 700, color: '#1e3a8a' }}
          >
            <QrCodeScannerIcon sx={{ mr: 1, fontSize: 30 }} />
            Start Scanning
          </Typography>

          <Typography
            variant='body1'
            sx={{ mt: 1, color: '#555', fontSize: '15px' }}
          >
            Position the QR code inside the frame to begin processing your task.
          </Typography>

          {isAndroid && !hasStarted && (
            <Button
              variant='outlined'
              sx={{ mt: 3, mb: 1 }}
              onClick={handleAndroidStart}
            >
              👉 Android: Tap to Enable Camera
            </Button>
          )}

          {/* 取消按钮 */}
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

            {/* 错误信息 */}
            {error && (
              <Typography color='error' sx={{ mt: 2, fontWeight: 500 }}>
                {error}
              </Typography>
            )}
          </Box>
        </Container>
      </Fade>
    </Box>
  )
}

export default Scan
