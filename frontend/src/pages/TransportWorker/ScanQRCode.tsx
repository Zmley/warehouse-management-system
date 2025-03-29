import { Container, Typography, Button, Box } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import useQRScanner from '../../hooks/useQRScanner'
import { useEffect, useRef, useState } from 'react'

const ScanTaskPage = () => {
  const navigate = useNavigate()
  const stopButtonRef = useRef<HTMLButtonElement>(null)

  // const { hasProductInCar, getMyCart } = useCart()

  const handleScanSuccess = async (binCode: string) => {
    console.log(`Scanned bin code: ${binCode}`)
  }

  const { videoRef, startScanning, stopScanning } =
    useQRScanner(handleScanSuccess)

  const [hasStarted, setHasStarted] = useState(false)

  useEffect(() => {
    if (!hasStarted) {
      startScanning()
      setHasStarted(true)
    }
  }, [hasStarted, startScanning])

  return (
    <Container
      maxWidth='sm'
      sx={{
        textAlign: 'center',
        padding: '20px',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: '400px',
          height: '250px',
          borderRadius: '10px',
          border: '2px solid #1976d2',
          overflow: 'hidden',
          mx: 'auto'
        }}
      >
        <video
          ref={videoRef}
          style={{ width: '100%', height: '100%' }}
          autoPlay
          playsInline
        />
      </Box>

      <Typography
        variant='body1'
        sx={{ marginTop: 2, fontSize: '14px', color: '#666' }}
      >
        1 Scan the QR code to process the task
      </Typography>

      <Button
        variant='contained'
        color='error'
        fullWidth
        sx={{ marginTop: 3, fontSize: '14px', borderRadius: '10px' }}
        onClick={() => {
          stopButtonRef.current?.click()
          window.location.href = '/' // Navigate to home or another page when canceled
        }}
      >
        ❌ Cancel
      </Button>

      <Button
        ref={stopButtonRef}
        onClick={async () => {
          console.log('🎯 Hidden stop button triggered')
          await stopScanning() // Stop scanning
        }}
        style={{ display: 'none' }}
      >
        Hidden Stop
      </Button>
    </Container>
  )
}

export default ScanTaskPage
