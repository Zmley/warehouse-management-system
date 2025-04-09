import { Container, Typography, Button, Box, Fade } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'
import CancelIcon from '@mui/icons-material/Cancel'

import useQRScanner from '../../hooks/useQRScanner'
import { useCartContext } from '../../contexts/cart'
import { useCart } from '../../hooks/useCart'

const Scan = () => {
  const navigate = useNavigate()
  const stopButtonRef = useRef<HTMLButtonElement>(null)
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
      console.error('❌ Error during scan:', err)
    }
  }

  const { videoRef, startScanning, stopScanning } =
    useQRScanner(handleScanSuccess)

  useEffect(() => {
    if (!hasStarted) {
      startScanning()
      setHasStarted(true)
    }

    return () => {
      stopScanning()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
            />
          </Box>

          <Typography
            variant='h5'
            sx={{
              mt: 3,
              fontWeight: 700,
              color: '#1e3a8a'
            }}
          >
            <QrCodeScannerIcon sx={{ mr: 1, fontSize: 30 }} />
            Start Scanning
          </Typography>

          <Typography
            variant='body1'
            sx={{
              mt: 1,
              color: '#555',
              fontSize: '15px'
            }}
          >
            Position the QR code inside the frame to begin processing your task.
          </Typography>

          {error && (
            <Typography
              variant='body2'
              sx={{ mt: 2, color: 'error.main', fontWeight: 600 }}
            >
              {error}
            </Typography>
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
                stopButtonRef.current?.click()
                navigate(-1)
              }}
            >
              Cancel
            </Button>
          </Box>
        </Container>
      </Fade>
    </Box>
  )
}

export default Scan
